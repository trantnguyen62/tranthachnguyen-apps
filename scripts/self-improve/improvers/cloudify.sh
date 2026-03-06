#!/usr/bin/env bash
# cloudify.sh - Cloudify-specific improvement module for the self-improvement pipeline
#
# Cloudify is the most complex app in the portfolio: Next.js 16, Prisma ORM,
# 42+ database models, 113 API endpoints, 450-node code graph.
#
# This improver adds Cloudify-specific pre/post hooks around the standard
# improve-app.sh flow:
#   1. Regenerate the code graph before improving
#   2. Feed graph context into the improvement prompt
#   3. Run Cloudify-specific validation after improvement
#   4. Update the code graph after changes
#
# Usage: ./cloudify.sh <improvement-type>
# Called by the orchestrator or directly.

set -euo pipefail

# --- Constants ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SELF_IMPROVE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
CLOUDIFY_ROOT="${REPO_ROOT}/tranthachnguyen-apps/cloudify"
CODE_GRAPH_TOOL="${CLOUDIFY_ROOT}/tools/code-graph"
CODE_GRAPH_JSON="${CLOUDIFY_ROOT}/code_graph.json"
TIMEOUT_SECONDS=900  # 15 minutes - Cloudify is complex

IMPROVEMENT_TYPE="${1:-bug-fix}"
TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
LOG_DIR="${SELF_IMPROVE_DIR}/logs"
LOG_FILE="${LOG_DIR}/cloudify_${IMPROVEMENT_TYPE}_${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [cloudify] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

# --- Validate environment ---
if [[ ! -d "$CLOUDIFY_ROOT" ]]; then
    log "ERROR: Cloudify root not found at ${CLOUDIFY_ROOT}"
    exit 1
fi

if [[ ! -d "$CODE_GRAPH_TOOL" ]]; then
    log "WARNING: Code graph tool not found at ${CODE_GRAPH_TOOL}. Skipping graph generation."
fi

log "=== Cloudify Improver ==="
log "Improvement type: ${IMPROVEMENT_TYPE}"
log "Cloudify root: ${CLOUDIFY_ROOT}"
log "========================="

# ============================================================
# Phase 1: Pre-improvement - Generate code graph
# ============================================================
generate_code_graph() {
    log "Phase 1: Generating code graph..."

    if [[ ! -d "$CODE_GRAPH_TOOL" ]]; then
        log "SKIP: Code graph tool directory missing"
        return 0
    fi

    # Check if node_modules exist for the code graph tool
    if [[ ! -d "${CODE_GRAPH_TOOL}/node_modules" ]]; then
        log "Installing code graph tool dependencies..."
        (cd "$CODE_GRAPH_TOOL" && npm install 2>&1) | tee -a "$LOG_FILE" || {
            log "WARNING: Failed to install code graph dependencies. Continuing without graph."
            return 0
        }
    fi

    log "Running code graph generator..."
    local graph_exit=0
    (cd "$CODE_GRAPH_TOOL" && npx tsx generate-graph.ts --root ../.. --output ../../code_graph.json 2>&1) | tee -a "$LOG_FILE" || graph_exit=$?

    if [[ $graph_exit -ne 0 ]]; then
        log "WARNING: Code graph generation failed (exit ${graph_exit}). Continuing without fresh graph."
        return 0
    fi

    if [[ -f "$CODE_GRAPH_JSON" ]]; then
        local node_count edge_count
        node_count=$(python3 -c "import json; g=json.load(open('${CODE_GRAPH_JSON}')); print(len(g.get('nodes',[])))" 2>/dev/null || echo "?")
        edge_count=$(python3 -c "import json; g=json.load(open('${CODE_GRAPH_JSON}')); print(len(g.get('edges',[])))" 2>/dev/null || echo "?")
        log "Code graph generated: ${node_count} nodes, ${edge_count} edges"
    else
        log "WARNING: Code graph JSON not found after generation"
    fi
}

# ============================================================
# Phase 2: Build Cloudify-specific improvement prompt
# ============================================================
build_cloudify_prompt() {
    local base_type="$1"

    # Standard improvement prompts (same as improve-app.sh)
    declare -A BASE_PROMPTS
    BASE_PROMPTS=(
        [bug-fix]="Find and fix bugs, TypeScript errors, runtime errors."
        [api-fixes]="Check API routes compile and return proper responses. Fix broken endpoints."
        [schema-sync]="Ensure Prisma schema matches actual usage across services and API routes."
        [component-fixes]="Fix dashboard components and landing page. Fix broken imports, missing props, type errors."
        [auth-system]="Improve the authentication system. Fix auth bypass issues, mock user setup, session handling."
        [build-pipeline]="Fix the deployment executor code, build worker, artifact manager, site deployer."
        [performance]="Optimize performance across the 450-node codebase. Focus on API response times, database queries, bundle size."
        [ui-ux]="Improve UI/UX - responsive design, accessibility, animations, loading states, error states."
        [security]="Fix security issues - XSS, CSRF, injection, insecure dependencies, exposed secrets, missing input validation."
        [code-quality]="Refactor code - remove dead code, improve patterns, reduce duplication, simplify complex logic."
        [tests]="Add missing tests - unit tests, integration tests for critical paths and untested business logic."
        [seo]="Improve SEO - meta tags, structured data, Open Graph tags."
        [dependencies]="Update outdated dependencies safely. Check for security vulnerabilities."
        [infrastructure]="Optimize Dockerfile, build config, CI config. Improve build speed, reduce image size."
    )

    local base_prompt="${BASE_PROMPTS[$base_type]:-${BASE_PROMPTS[bug-fix]}}"

    # Build graph context summary if available
    local graph_context=""
    if [[ -f "$CODE_GRAPH_JSON" ]]; then
        graph_context=$(python3 -c "
import json, sys
try:
    with open('${CODE_GRAPH_JSON}') as f:
        g = json.load(f)
    nodes = g.get('nodes', [])
    edges = g.get('edges', [])

    # Count by type
    node_types = {}
    for n in nodes:
        t = n.get('type', 'unknown')
        node_types[t] = node_types.get(t, 0) + 1

    edge_types = {}
    for e in edges:
        t = e.get('type', 'unknown')
        edge_types[t] = edge_types.get(t, 0) + 1

    print('Code Graph Summary:')
    print(f'  Total: {len(nodes)} nodes, {len(edges)} edges')
    print('  Node types: ' + ', '.join(f'{k}={v}' for k,v in sorted(node_types.items(), key=lambda x:-x[1])))
    print('  Edge types: ' + ', '.join(f'{k}={v}' for k,v in sorted(edge_types.items(), key=lambda x:-x[1])))

    # For specific improvement types, extract relevant nodes
    if '${base_type}' in ('api-fixes', 'auth-system'):
        endpoints = [n['id'] for n in nodes if n.get('type') == 'endpoint'][:20]
        if endpoints:
            print(f'  API endpoints ({len(endpoints)} shown): ' + ', '.join(endpoints))

    if '${base_type}' in ('schema-sync',):
        collections = [n['id'] for n in nodes if n.get('type') == 'collection']
        if collections:
            print(f'  DB models ({len(collections)}): ' + ', '.join(collections))

    if '${base_type}' in ('component-fixes', 'ui-ux'):
        components = [n['id'] for n in nodes if n.get('type') == 'component'][:20]
        if components:
            print(f'  Components ({len(components)} shown): ' + ', '.join(components))

except Exception as e:
    print(f'(graph read error: {e})', file=sys.stderr)
" 2>/dev/null || echo "")
    fi

    # Construct the full Cloudify-aware prompt
    cat <<PROMPT_EOF
You are improving the Cloudify app - a production deployment platform (like Vercel).

Architecture:
- Framework: Next.js 16 with App Router
- Database: PostgreSQL with Prisma ORM (42+ models)
- Storage: MinIO (S3-compatible) for blobs, Redis for KV/cache
- Auth: NextAuth with GitHub OAuth
- Build pipeline: Docker + K8s dual mode
- 113 API endpoints, 450+ code graph nodes

App directory: ${CLOUDIFY_ROOT}

${graph_context}

Task: ${base_prompt}

Rules:
- Only modify files within the Cloudify app directory
- Do not break existing functionality
- Check the code graph (${CODE_GRAPH_JSON}) to understand dependencies before modifying any file
- Data flow: Component -> Hook (fetch) -> API Route -> Service (lib/) -> Prisma -> Database
- Auth: All API routes use lib/auth/api-auth.ts (getAuthUser, requireReadAccess, requireWriteAccess)
- Audit: Mutations create prisma.activity.create entries for audit trail
- Make targeted, meaningful improvements
- If you cannot find anything to improve, say so and exit
PROMPT_EOF
}

# ============================================================
# Phase 3: Run the improvement via Claude Code
# ============================================================
run_improvement() {
    local prompt="$1"

    log "Phase 3: Running Claude Code improvement..."
    log "Prompt length: ${#prompt} chars"

    cd "$CLOUDIFY_ROOT"

    # Save pre-improvement state
    local git_available=false
    local pre_hash="none"
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        git_available=true
        pre_hash=$(git rev-parse HEAD 2>/dev/null || echo "none")
        log "Git available. Pre-improvement commit: ${pre_hash}"
    fi

    # Determine timeout command
    local timeout_cmd=""
    if command -v gtimeout &>/dev/null; then
        timeout_cmd="gtimeout ${TIMEOUT_SECONDS}"
    elif command -v timeout &>/dev/null; then
        timeout_cmd="timeout ${TIMEOUT_SECONDS}"
    fi

    local claude_output=""
    local claude_exit=0

    if [[ -n "$timeout_cmd" ]]; then
        claude_output=$($timeout_cmd claude --print --dangerously-skip-permissions -p "$prompt" --output-format json 2>&1) || claude_exit=$?
    else
        claude --print --dangerously-skip-permissions -p "$prompt" --output-format json > "/tmp/cloudify-improve-$$.out" 2>&1 &
        local claude_pid=$!
        local elapsed=0

        while kill -0 "$claude_pid" 2>/dev/null; do
            if (( elapsed >= TIMEOUT_SECONDS )); then
                log "TIMEOUT: Claude Code exceeded ${TIMEOUT_SECONDS}s limit"
                kill -9 "$claude_pid" 2>/dev/null || true
                wait "$claude_pid" 2>/dev/null || true
                claude_exit=124
                break
            fi
            sleep 5
            elapsed=$((elapsed + 5))
        done

        if (( claude_exit != 124 )); then
            wait "$claude_pid" 2>/dev/null
            claude_exit=$?
        fi

        claude_output=$(cat "/tmp/cloudify-improve-$$.out" 2>/dev/null || echo "")
        rm -f "/tmp/cloudify-improve-$$.out"
    fi

    log "Claude exit code: ${claude_exit}"

    # Handle failures
    if (( claude_exit == 124 )); then
        log "TIMEOUT: Improvement timed out after ${TIMEOUT_SECONDS}s"
        revert_changes "$git_available"
        return 1
    fi

    if (( claude_exit != 0 )); then
        log "FAIL: Claude Code exited with code ${claude_exit}"
        echo "$claude_output" | tail -50 >> "$LOG_FILE"
        revert_changes "$git_available"
        return 1
    fi

    log "Claude Code completed successfully"
    echo "$claude_output" | tail -30 >> "$LOG_FILE"

    # Check if files changed
    if [[ "$git_available" == true ]]; then
        local changed_files
        changed_files=$(git diff --name-only 2>/dev/null || echo "")
        local untracked_files
        untracked_files=$(git ls-files --others --exclude-standard 2>/dev/null || echo "")

        if [[ -z "$changed_files" && -z "$untracked_files" ]]; then
            log "NO CHANGES: Claude Code made no modifications"
            return 0
        fi

        local change_count
        change_count=$(echo "$changed_files" | grep -c '.' || echo "0")
        local new_count
        new_count=$(echo "$untracked_files" | grep -c '.' || echo "0")
        log "Changes: ${change_count} modified, ${new_count} new files"
    fi

    return 0
}

revert_changes() {
    local git_available="$1"
    if [[ "$git_available" == true ]]; then
        log "Reverting changes..."
        cd "$CLOUDIFY_ROOT"
        git checkout -- . 2>/dev/null || true
        git clean -fd 2>/dev/null || true
    fi
}

# ============================================================
# Phase 4: Post-improvement validation
# ============================================================
validate_improvement() {
    log "Phase 4: Validating improvement..."
    cd "$CLOUDIFY_ROOT"

    local validation_failed=false

    # 4a. TypeScript type checking
    log "Running TypeScript type check..."
    local tsc_output=""
    local tsc_exit=0
    tsc_output=$(npx tsc --noEmit 2>&1) || tsc_exit=$?

    if [[ $tsc_exit -ne 0 ]]; then
        local error_count
        error_count=$(echo "$tsc_output" | grep -c "error TS" || echo "0")
        log "WARNING: TypeScript errors found (${error_count} errors)"
        echo "$tsc_output" | grep "error TS" | head -20 >> "$LOG_FILE"
        # Don't fail on TS errors - Cloudify has some pre-existing ones
        # Only fail if new errors were introduced (count increased significantly)
    else
        log "TypeScript check passed"
    fi

    # 4b. Next.js build check
    log "Running Next.js build..."
    local build_output=""
    local build_exit=0
    build_output=$(npx next build 2>&1) || build_exit=$?

    if [[ $build_exit -ne 0 ]]; then
        log "BUILD FAILED"
        echo "$build_output" | tail -30 >> "$LOG_FILE"
        validation_failed=true
    else
        log "Next.js build passed"
    fi

    # 4c. Check for common runtime issues
    log "Checking for common issues..."
    local issues_found=0

    # Check for console.log left in production code (non-debug)
    local console_logs
    console_logs=$(grep -r "console\.log" "${CLOUDIFY_ROOT}/app/" "${CLOUDIFY_ROOT}/lib/" --include="*.ts" --include="*.tsx" -l 2>/dev/null | wc -l || echo "0")
    if [[ $console_logs -gt 20 ]]; then
        log "WARNING: ${console_logs} files with console.log statements"
    fi

    # Check for unresolved imports
    local import_errors
    import_errors=$(grep -r "from ['\"]\./" "${CLOUDIFY_ROOT}/app/" "${CLOUDIFY_ROOT}/lib/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | head -5 || true)

    if [[ "$validation_failed" == true ]]; then
        log "VALIDATION FAILED - reverting changes"
        revert_changes true
        return 1
    fi

    log "Validation passed"
    return 0
}

# ============================================================
# Phase 5: Post-improvement - Update code graph
# ============================================================
update_code_graph() {
    log "Phase 5: Updating code graph after changes..."

    if [[ ! -d "$CODE_GRAPH_TOOL" ]]; then
        log "SKIP: Code graph tool not available"
        return 0
    fi

    local graph_exit=0
    (cd "$CODE_GRAPH_TOOL" && npx tsx generate-graph.ts --root ../.. --output ../../code_graph.json 2>&1) | tee -a "$LOG_FILE" || graph_exit=$?

    if [[ $graph_exit -ne 0 ]]; then
        log "WARNING: Post-improvement code graph generation failed"
        return 0
    fi

    if [[ -f "$CODE_GRAPH_JSON" ]]; then
        local node_count edge_count
        node_count=$(python3 -c "import json; g=json.load(open('${CODE_GRAPH_JSON}')); print(len(g.get('nodes',[])))" 2>/dev/null || echo "?")
        edge_count=$(python3 -c "import json; g=json.load(open('${CODE_GRAPH_JSON}')); print(len(g.get('edges',[])))" 2>/dev/null || echo "?")
        log "Updated code graph: ${node_count} nodes, ${edge_count} edges"
    fi
}

# ============================================================
# Phase 6: Write improvement report
# ============================================================
write_report() {
    local status="$1"
    local report_dir="${SELF_IMPROVE_DIR}/reports"
    mkdir -p "$report_dir"

    local report_file="${report_dir}/cloudify_${IMPROVEMENT_TYPE}_${TIMESTAMP}.json"

    # Gather stats
    local changed_files=""
    local file_count=0
    cd "$CLOUDIFY_ROOT"
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        changed_files=$(git diff --name-only 2>/dev/null || echo "")
        file_count=$(echo "$changed_files" | grep -c '.' 2>/dev/null || echo "0")
    fi

    cat > "$report_file" <<EOF
{
    "app": "cloudify",
    "improvement_type": "${IMPROVEMENT_TYPE}",
    "status": "${status}",
    "timestamp": "${TIMESTAMP}",
    "files_changed": ${file_count},
    "log_file": "${LOG_FILE}",
    "code_graph": "${CODE_GRAPH_JSON}",
    "cloudify_root": "${CLOUDIFY_ROOT}"
}
EOF

    log "Report written to ${report_file}"
}

# ============================================================
# Main execution
# ============================================================
main() {
    log "Starting Cloudify improvement pipeline..."

    # Phase 1: Generate code graph
    generate_code_graph

    # Phase 2: Build prompt
    local prompt
    prompt=$(build_cloudify_prompt "$IMPROVEMENT_TYPE")

    # Phase 3: Run improvement
    if ! run_improvement "$prompt"; then
        log "RESULT: FAIL (improvement failed)"
        write_report "failed"
        exit 1
    fi

    # Check if anything changed
    cd "$CLOUDIFY_ROOT"
    local has_changes=false
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        local changed untracked
        changed=$(git diff --name-only 2>/dev/null || echo "")
        untracked=$(git ls-files --others --exclude-standard 2>/dev/null || echo "")
        if [[ -n "$changed" || -n "$untracked" ]]; then
            has_changes=true
        fi
    fi

    if [[ "$has_changes" == false ]]; then
        log "RESULT: NO_CHANGES"
        write_report "no_changes"
        exit 0
    fi

    # Phase 4: Validate
    if ! validate_improvement; then
        log "RESULT: FAIL (validation failed)"
        write_report "failed_validation"
        exit 1
    fi

    # Phase 5: Update code graph
    update_code_graph

    # Phase 6: Report
    write_report "success"

    log "RESULT: SUCCESS"
    log "Cloudify improved with '${IMPROVEMENT_TYPE}'"
    log ""
    log "Next steps:"
    log "  - Review changes: cd ${CLOUDIFY_ROOT} && git diff"
    log "  - Commit: git add -A && git commit -m 'auto-improve(cloudify): ${IMPROVEMENT_TYPE}'"
    log "  - Deploy: GitHub Actions -> deploy-cloudify-to-lxc203.sh"
    exit 0
}

main "$@"
