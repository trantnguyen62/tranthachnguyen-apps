#!/usr/bin/env bash
# improve-app.sh - Per-app improvement script for the self-improvement pipeline
# Usage: ./improve-app.sh <app-name> <improvement-type>
#
# Called by the orchestrator to run a single improvement on a single app.
# Reads config.json for app details, runs Claude Code, verifies the build,
# and reverts on failure.

set -euo pipefail

# --- Constants ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
TIMEOUT_SECONDS=600  # 10 minutes max per improvement
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# --- Args ---
APP_NAME="${1:-}"
IMPROVEMENT_TYPE="${2:-}"

if [[ -z "$APP_NAME" || -z "$IMPROVEMENT_TYPE" ]]; then
  echo "ERROR: Usage: $0 <app-name> <improvement-type>"
  exit 1
fi

echo "=== improve-app.sh ==="
echo "App: ${APP_NAME}"
echo "Type: ${IMPROVEMENT_TYPE}"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================"

# --- Read config ---
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "ERROR: config.json not found at ${CONFIG_FILE}"
  exit 1
fi

# Extract app config using python (available on macOS)
APP_CONFIG=$(python3 -c "
import json, sys
with open('${CONFIG_FILE}') as f:
    config = json.load(f)
apps = config.get('apps', {})
app = apps.get('${APP_NAME}')
if not app:
    print('NOT_FOUND')
    sys.exit(0)
print(app.get('path', ''))
print(app.get('type', 'nextjs'))
print(app.get('framework', 'nextjs'))
print(app.get('build_cmd', ''))
print(app.get('enabled', True))
")

# Parse config lines
APP_PATH=$(echo "$APP_CONFIG" | sed -n '1p')
APP_TYPE=$(echo "$APP_CONFIG" | sed -n '2p')
APP_FRAMEWORK=$(echo "$APP_CONFIG" | sed -n '3p')
BUILD_CMD=$(echo "$APP_CONFIG" | sed -n '4p')
ENABLED=$(echo "$APP_CONFIG" | sed -n '5p')

if [[ "$APP_PATH" == "NOT_FOUND" || -z "$APP_PATH" ]]; then
  echo "ERROR: App '${APP_NAME}' not found in config.json"
  exit 1
fi

if [[ "$ENABLED" == "False" ]]; then
  echo "SKIP: App '${APP_NAME}' is disabled in config"
  exit 0
fi

# Resolve app directory (relative paths are relative to repo root)
if [[ "$APP_PATH" == /* ]]; then
  APP_DIR="$APP_PATH"
else
  APP_DIR="${REPO_ROOT}/${APP_PATH}"
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: App directory does not exist: ${APP_DIR}"
  exit 1
fi

echo "App dir: ${APP_DIR}"
echo "Framework: ${APP_FRAMEWORK}"
echo "Build cmd: ${BUILD_CMD:-auto-detect}"

# --- Build improvement prompt ---
declare -A PROMPTS
PROMPTS=(
  [bug-fix]="Find and fix bugs, TypeScript errors, runtime errors in this app. Check for null pointer issues, incorrect types, unhandled promise rejections, and logic errors. Fix any issues you find."
  [ui-ux]="Improve UI/UX - responsive design, accessibility (WCAG 2.1 AA), animations, hover states, loading states, error states, and overall visual polish. Make meaningful improvements."
  [performance]="Optimize performance - bundle size, load time, rendering efficiency. Look for unnecessary re-renders, large dependencies that can be replaced, unoptimized images, missing lazy loading, and inefficient data fetching."
  [seo]="Improve SEO - meta tags, structured data (JSON-LD), sitemap, Open Graph tags, Twitter cards, canonical URLs, and semantic HTML. Add or fix what is missing."
  [content]="Improve content quality - copy, descriptions, placeholder data. Replace any lorem ipsum or placeholder text with realistic, engaging content appropriate for the app."
  [code-quality]="Refactor code - remove dead code, improve patterns, reduce duplication, improve naming, simplify complex logic. Keep changes safe and non-breaking."
  [security]="Fix security issues - XSS, CSRF, injection, insecure dependencies, exposed secrets, missing input validation, insecure headers. Focus on OWASP top 10."
  [tests]="Add missing tests - unit tests, integration tests. Focus on critical paths and untested business logic. Use the testing framework already in the project."
  [features]="Add a small useful feature appropriate for this type of app. The feature should be self-contained, well-implemented, and add clear value to users."
  [docs]="Improve documentation - README, inline comments for complex logic, JSDoc for public APIs. Only add comments where the code is not self-explanatory."
  [dependencies]="Update outdated dependencies safely. Check for security vulnerabilities with npm audit. Only update minor/patch versions unless a major update is clearly safe."
  [infrastructure]="Optimize Dockerfile, build config, CI config. Improve build speed, reduce image size, add caching layers, optimize for production."
)

if [[ -z "${PROMPTS[$IMPROVEMENT_TYPE]+x}" ]]; then
  echo "ERROR: Unknown improvement type: ${IMPROVEMENT_TYPE}"
  echo "Valid types: ${!PROMPTS[*]}"
  exit 1
fi

BASE_PROMPT="${PROMPTS[$IMPROVEMENT_TYPE]}"

# Construct the full prompt with app context
PROMPT="You are improving the '${APP_NAME}' app (${APP_FRAMEWORK} ${APP_TYPE}).
App directory: ${APP_DIR}

Task: ${BASE_PROMPT}

Rules:
- Only modify files within this app directory
- Do not break existing functionality
- Make targeted, meaningful improvements (not superficial changes)
- If you cannot find anything to improve for this category, say so and exit
- Keep changes minimal and focused on the improvement type"

echo ""
echo "--- Prompt ---"
echo "$PROMPT"
echo "--- End Prompt ---"
echo ""

# --- Save pre-improvement state ---
cd "$APP_DIR"

# Check if we're in a git repo
if git rev-parse --is-inside-work-tree &>/dev/null; then
  GIT_AVAILABLE=true
  PRE_HASH=$(git rev-parse HEAD 2>/dev/null || echo "none")
  # Stash any existing changes so we have a clean baseline
  git stash --include-untracked -q 2>/dev/null || true
  STASHED=true
  echo "Git available. Pre-improvement commit: ${PRE_HASH}"
else
  GIT_AVAILABLE=false
  STASHED=false
  echo "WARNING: Not in a git repo. Cannot revert on failure."
fi

# --- Run Claude Code with timeout ---
echo ""
echo "Running Claude Code improvement (timeout: ${TIMEOUT_SECONDS}s)..."
echo "Start: $(date '+%H:%M:%S')"

CLAUDE_OUTPUT=""
CLAUDE_EXIT=0

# Use timeout command (gtimeout on macOS if available, otherwise use perl)
TIMEOUT_CMD=""
if command -v gtimeout &>/dev/null; then
  TIMEOUT_CMD="gtimeout ${TIMEOUT_SECONDS}"
elif command -v timeout &>/dev/null; then
  TIMEOUT_CMD="timeout ${TIMEOUT_SECONDS}"
fi

if [[ -n "$TIMEOUT_CMD" ]]; then
  CLAUDE_OUTPUT=$($TIMEOUT_CMD claude --print --dangerously-skip-permissions -p "$PROMPT" --output-format json 2>&1) || CLAUDE_EXIT=$?
else
  # Fallback: use background process with kill
  claude --print --dangerously-skip-permissions -p "$PROMPT" --output-format json > /tmp/improve-${APP_NAME}-$$.out 2>&1 &
  CLAUDE_PID=$!

  # Wait with timeout
  ELAPSED=0
  while kill -0 "$CLAUDE_PID" 2>/dev/null; do
    if (( ELAPSED >= TIMEOUT_SECONDS )); then
      echo "TIMEOUT: Claude Code exceeded ${TIMEOUT_SECONDS}s limit. Killing."
      kill -9 "$CLAUDE_PID" 2>/dev/null || true
      wait "$CLAUDE_PID" 2>/dev/null || true
      CLAUDE_EXIT=124
      break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
  done

  if (( CLAUDE_EXIT != 124 )); then
    wait "$CLAUDE_PID" 2>/dev/null
    CLAUDE_EXIT=$?
  fi

  CLAUDE_OUTPUT=$(cat /tmp/improve-${APP_NAME}-$$.out 2>/dev/null || echo "")
  rm -f /tmp/improve-${APP_NAME}-$$.out
fi

echo "End: $(date '+%H:%M:%S')"
echo "Claude exit code: ${CLAUDE_EXIT}"

if (( CLAUDE_EXIT == 124 )); then
  echo "TIMEOUT: Improvement timed out after ${TIMEOUT_SECONDS}s"
  if [[ "$GIT_AVAILABLE" == true ]]; then
    echo "Reverting changes..."
    git checkout -- . 2>/dev/null || true
    git clean -fd 2>/dev/null || true
    if [[ "$STASHED" == true ]]; then
      git stash pop -q 2>/dev/null || true
    fi
  fi
  exit 1
fi

if (( CLAUDE_EXIT != 0 )); then
  echo "FAIL: Claude Code exited with code ${CLAUDE_EXIT}"
  echo "Output (last 50 lines):"
  echo "$CLAUDE_OUTPUT" | tail -50
  if [[ "$GIT_AVAILABLE" == true ]]; then
    echo "Reverting changes..."
    git checkout -- . 2>/dev/null || true
    git clean -fd 2>/dev/null || true
    if [[ "$STASHED" == true ]]; then
      git stash pop -q 2>/dev/null || true
    fi
  fi
  exit 1
fi

echo ""
echo "Claude Code completed successfully."
echo "Output (last 30 lines):"
echo "$CLAUDE_OUTPUT" | tail -30
echo ""

# --- Check if any files changed ---
if [[ "$GIT_AVAILABLE" == true ]]; then
  CHANGED_FILES=$(git diff --name-only 2>/dev/null || echo "")
  UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null || echo "")

  if [[ -z "$CHANGED_FILES" && -z "$UNTRACKED_FILES" ]]; then
    echo "NO CHANGES: Claude Code made no modifications."
    if [[ "$STASHED" == true ]]; then
      git stash pop -q 2>/dev/null || true
    fi
    exit 0
  fi

  echo "Changed files:"
  echo "$CHANGED_FILES"
  if [[ -n "$UNTRACKED_FILES" ]]; then
    echo "New files:"
    echo "$UNTRACKED_FILES"
  fi
fi

# --- Verify build (if applicable) ---
# Determine build command
if [[ -z "$BUILD_CMD" ]]; then
  # Auto-detect build command
  if [[ -f "${APP_DIR}/package.json" ]]; then
    HAS_BUILD=$(python3 -c "
import json
with open('${APP_DIR}/package.json') as f:
    pkg = json.load(f)
scripts = pkg.get('scripts', {})
if 'build' in scripts:
    print('npm run build')
elif 'typecheck' in scripts:
    print('npm run typecheck')
else:
    print('')
" 2>/dev/null || echo "")
    BUILD_CMD="$HAS_BUILD"
  fi
fi

if [[ -n "$BUILD_CMD" ]]; then
  echo ""
  echo "--- Verifying build: ${BUILD_CMD} ---"

  # Install deps if needed
  if [[ -f "${APP_DIR}/package.json" && ! -d "${APP_DIR}/node_modules" ]]; then
    echo "Installing dependencies first..."
    if [[ -f "${APP_DIR}/bun.lockb" ]]; then
      (cd "$APP_DIR" && bun install --frozen-lockfile 2>&1) || true
    elif [[ -f "${APP_DIR}/pnpm-lock.yaml" ]]; then
      (cd "$APP_DIR" && pnpm install --frozen-lockfile 2>&1) || true
    elif [[ -f "${APP_DIR}/yarn.lock" ]]; then
      (cd "$APP_DIR" && yarn install --frozen-lockfile 2>&1) || true
    else
      (cd "$APP_DIR" && npm ci 2>&1 || npm install 2>&1) || true
    fi
  fi

  BUILD_OUTPUT=""
  BUILD_EXIT=0
  BUILD_OUTPUT=$(cd "$APP_DIR" && eval "$BUILD_CMD" 2>&1) || BUILD_EXIT=$?

  if (( BUILD_EXIT != 0 )); then
    echo "BUILD FAILED (exit code: ${BUILD_EXIT})"
    echo "Build output (last 30 lines):"
    echo "$BUILD_OUTPUT" | tail -30
    echo ""

    if [[ "$GIT_AVAILABLE" == true ]]; then
      echo "Reverting all changes due to build failure..."
      git checkout -- . 2>/dev/null || true
      git clean -fd 2>/dev/null || true
      if [[ "$STASHED" == true ]]; then
        git stash pop -q 2>/dev/null || true
      fi
    fi
    echo "RESULT: FAIL (build broken)"
    exit 1
  else
    echo "Build passed."
  fi
else
  echo "No build step detected. Skipping build verification."
fi

# --- Success: restore stashed changes on top ---
if [[ "$GIT_AVAILABLE" == true && "$STASHED" == true ]]; then
  # The improvement changes are in the working tree. Pop stash to merge back
  # any pre-existing changes (may conflict - that's ok, orchestrator handles it)
  git stash pop -q 2>/dev/null || true
fi

echo ""
echo "RESULT: SUCCESS"
echo "App '${APP_NAME}' improved with '${IMPROVEMENT_TYPE}'"
exit 0
