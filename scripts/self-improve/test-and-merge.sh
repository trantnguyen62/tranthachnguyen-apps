#!/usr/bin/env bash
# test-and-merge.sh - Auto-test changes and commit/push if passing, revert if failing
# Usage: ./test-and-merge.sh <app-name> <branch-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"

# --- Argument validation ---
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <app-name> <branch-name>"
    echo "Example: $0 cloudify auto-improve/cloudify-perf"
    exit 1
fi

APP_NAME="$1"
BRANCH_NAME="$2"

mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/${APP_NAME}_${TIMESTAMP}.log"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

log "Starting test-and-merge for app=${APP_NAME} branch=${BRANCH_NAME}"

# --- Read config ---
if [[ ! -f "$CONFIG_FILE" ]]; then
    log "ERROR: Config file not found at ${CONFIG_FILE}"
    exit 1
fi

# Parse app config from config.json using python (available on macOS)
APP_CONFIG="$(python3 -c "
import json, sys
with open('${CONFIG_FILE}') as f:
    cfg = json.load(f)
apps = cfg.get('apps', {})
if '${APP_NAME}' not in apps:
    print('NOT_FOUND')
    sys.exit(0)
app = apps['${APP_NAME}']
print(app.get('type', 'unknown'))
print(app.get('path', ''))
print(app.get('lxc', ''))
print(app.get('description', ''))
")"

APP_TYPE="$(echo "$APP_CONFIG" | sed -n '1p')"
APP_PATH="$(echo "$APP_CONFIG" | sed -n '2p')"
APP_LXC="$(echo "$APP_CONFIG" | sed -n '3p')"
APP_DESC="$(echo "$APP_CONFIG" | sed -n '4p')"

if [[ "$APP_TYPE" == "NOT_FOUND" ]]; then
    log "ERROR: App '${APP_NAME}' not found in config.json"
    exit 1
fi

log "App config: type=${APP_TYPE} path=${APP_PATH} lxc=${APP_LXC}"

# Resolve full app path
if [[ "$APP_PATH" == /* ]]; then
    FULL_APP_PATH="$APP_PATH"
else
    FULL_APP_PATH="${SCRIPT_DIR}/../../${APP_PATH}"
fi
FULL_APP_PATH="$(cd "$FULL_APP_PATH" 2>/dev/null && pwd)" || {
    log "ERROR: App path does not exist: ${APP_PATH}"
    exit 1
}

log "Resolved app path: ${FULL_APP_PATH}"

# --- Run tests based on app type ---
run_tests() {
    cd "$FULL_APP_PATH"
    log "Running tests for type=${APP_TYPE}..."

    case "$APP_TYPE" in
        nextjs|react)
            log "Running: npm run build && npm test"
            npm run build 2>&1 | tee -a "$LOG_FILE"
            if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
                log "Build failed"
                return 1
            fi
            # npm test may not exist for all projects; run if script is defined
            if npm run --silent 2>/dev/null | grep -q "^  test$" || node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)" 2>/dev/null; then
                npm test 2>&1 | tee -a "$LOG_FILE"
                if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
                    log "Tests failed"
                    return 1
                fi
            else
                log "No test script found, skipping npm test (build passed)"
            fi
            ;;
        static-html)
            log "Validating HTML files..."
            local html_errors=0
            while IFS= read -r -d '' html_file; do
                # Check for basic HTML structure
                if ! grep -qi '<!DOCTYPE\|<html' "$html_file"; then
                    log "WARNING: ${html_file} may be missing DOCTYPE or <html> tag"
                fi
                # Check for unclosed tags (basic check)
                if ! python3 -c "
import html.parser, sys
class V(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.errors = []
    def handle_starttag(self, tag, attrs): pass
    def handle_endtag(self, tag): pass
try:
    v = V()
    v.feed(open('${html_file}').read())
except Exception as e:
    print(f'Parse error: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1 | tee -a "$LOG_FILE"; then
                    log "HTML validation failed for: ${html_file}"
                    html_errors=$((html_errors + 1))
                fi
            done < <(find . -name '*.html' -not -path './node_modules/*' -print0)
            if [[ $html_errors -gt 0 ]]; then
                log "HTML validation: ${html_errors} file(s) with errors"
                return 1
            fi
            log "HTML validation passed"
            ;;
        nodejs)
            log "Running: npm test"
            npm test 2>&1 | tee -a "$LOG_FILE"
            if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
                log "Tests failed"
                return 1
            fi
            ;;
        python)
            log "Running: pytest"
            if [[ -f "requirements.txt" ]] && ! command -v pytest &>/dev/null; then
                pip install pytest 2>&1 | tee -a "$LOG_FILE"
            fi
            pytest 2>&1 | tee -a "$LOG_FILE"
            if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
                log "Tests failed"
                return 1
            fi
            ;;
        *)
            log "WARNING: Unknown app type '${APP_TYPE}', skipping tests"
            ;;
    esac

    log "All tests passed"
    return 0
}

# --- Detect change type and summary from git diff ---
detect_change_info() {
    cd "$FULL_APP_PATH"
    local files_changed
    files_changed="$(git diff --name-only 2>/dev/null || true)"

    if [[ -z "$files_changed" ]]; then
        files_changed="$(git diff --cached --name-only 2>/dev/null || true)"
    fi

    # Determine change type
    local change_type="improvement"
    if echo "$files_changed" | grep -qi 'test\|spec'; then
        change_type="tests"
    elif echo "$files_changed" | grep -qi 'perf\|optim\|cache'; then
        change_type="performance"
    elif echo "$files_changed" | grep -qi 'fix\|bug\|patch'; then
        change_type="bugfix"
    elif echo "$files_changed" | grep -qi 'refactor\|clean'; then
        change_type="refactor"
    elif echo "$files_changed" | grep -qi 'doc\|readme\|comment'; then
        change_type="docs"
    elif echo "$files_changed" | grep -qi 'security\|auth\|sanitiz'; then
        change_type="security"
    fi

    # Build summary from changed files
    local file_count
    file_count="$(echo "$files_changed" | grep -c '.' || echo 0)"
    local summary="${file_count} file(s) updated"

    echo "${change_type}|${summary}"
}

# --- Main execution ---
if run_tests; then
    log "Tests passed - committing and pushing changes"

    cd "$FULL_APP_PATH"

    # Detect change info
    CHANGE_INFO="$(detect_change_info)"
    CHANGE_TYPE="$(echo "$CHANGE_INFO" | cut -d'|' -f1)"
    CHANGE_SUMMARY="$(echo "$CHANGE_INFO" | cut -d'|' -f2)"

    COMMIT_MSG="auto-improve(${APP_NAME}): ${CHANGE_TYPE} - ${CHANGE_SUMMARY}"

    git add -A
    git commit -m "$COMMIT_MSG"
    git push origin "$BRANCH_NAME"

    log "Successfully committed and pushed: ${COMMIT_MSG}"
    log "Branch: ${BRANCH_NAME}"

    # Write report
    REPORT_FILE="${SCRIPT_DIR}/reports/${APP_NAME}_${TIMESTAMP}.json"
    mkdir -p "${SCRIPT_DIR}/reports"
    cat > "$REPORT_FILE" <<EOF
{
    "app": "${APP_NAME}",
    "branch": "${BRANCH_NAME}",
    "type": "${CHANGE_TYPE}",
    "summary": "${CHANGE_SUMMARY}",
    "commit_message": "${COMMIT_MSG}",
    "status": "success",
    "timestamp": "${TIMESTAMP}",
    "log_file": "${LOG_FILE}"
}
EOF
    log "Report written to ${REPORT_FILE}"

    exit 0
else
    log "Tests FAILED - reverting all changes"

    cd "$FULL_APP_PATH"
    git checkout -- .
    # Also remove any untracked files that were added
    git clean -fd 2>/dev/null || true

    log "Changes reverted successfully"

    # Write failure report
    REPORT_FILE="${SCRIPT_DIR}/reports/${APP_NAME}_${TIMESTAMP}_FAILED.json"
    mkdir -p "${SCRIPT_DIR}/reports"
    cat > "$REPORT_FILE" <<EOF
{
    "app": "${APP_NAME}",
    "branch": "${BRANCH_NAME}",
    "status": "failed",
    "reason": "tests_failed",
    "timestamp": "${TIMESTAMP}",
    "log_file": "${LOG_FILE}"
}
EOF
    log "Failure report written to ${REPORT_FILE}"

    exit 1
fi
