#!/usr/bin/env bash
# =============================================================================
# Self-Improvement Orchestrator
# Master script for 24/7 AI-powered codebase improvement pipeline
#
# Usage:
#   ./orchestrator.sh              # Run one cycle (for LaunchAgent / cron)
#   ./orchestrator.sh --loop       # Run continuous loop
#   ./orchestrator.sh --status     # Print current state summary
#   ./orchestrator.sh --reset      # Reset state file
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WORKSPACE="/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
SCRIPTS_DIR="$WORKSPACE/scripts/self-improve"
LOG_DIR="$SCRIPTS_DIR/logs"
REPORTS_DIR="$SCRIPTS_DIR/reports"
STATE_FILE="$SCRIPTS_DIR/state.json"
CONFIG_FILE="$SCRIPTS_DIR/config.json"
LOCK_FILE="$SCRIPTS_DIR/.orchestrator.lock"

MAX_RUNTIME_SECONDS=600  # 10 minutes per improvement
LOOP_INTERVAL=1800       # 30 minutes between cycles in --loop mode
COOLDOWN_CYCLES=2        # Skip app for N cycles after failure

# 12 improvement types rotated through
IMPROVEMENT_TYPES=(
  "error-handling"
  "performance"
  "security"
  "testing"
  "documentation"
  "accessibility"
  "code-quality"
  "type-safety"
  "logging"
  "dependency-update"
  "seo"
  "ux-polish"
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/${TODAY}.log"

mkdir -p "$LOG_DIR" "$REPORTS_DIR"

log() {
  local level="$1"; shift
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local msg="[$timestamp] [$level] $*"
  echo "$msg" >> "$LOG_FILE"
  if [[ "$level" == "ERROR" ]]; then
    echo "$msg" >&2
  else
    echo "$msg"
  fi
}

log_info()  { log "INFO"  "$@"; }
log_warn()  { log "WARN"  "$@"; }
log_error() { log "ERROR" "$@"; }

# ---------------------------------------------------------------------------
# Lock management (prevent concurrent runs)
# ---------------------------------------------------------------------------
acquire_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local lock_pid
    lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
      log_warn "Another orchestrator is running (PID $lock_pid). Exiting."
      exit 0
    else
      log_warn "Stale lock file found (PID $lock_pid). Removing."
      rm -f "$LOCK_FILE"
    fi
  fi
  echo $$ > "$LOCK_FILE"
  trap 'rm -f "$LOCK_FILE"' EXIT INT TERM HUP
}

# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------
init_state() {
  if [[ ! -f "$STATE_FILE" ]]; then
    cat > "$STATE_FILE" << 'INIT_STATE'
{
  "total_cycles": 0,
  "total_successes": 0,
  "total_failures": 0,
  "total_skips": 0,
  "app_index": 0,
  "type_index": 0,
  "last_run": null,
  "apps": {}
}
INIT_STATE
    log_info "Initialized new state file: $STATE_FILE"
  fi
}

read_state_field() {
  local field="$1"
  python3 -c "
import json, sys
with open('$STATE_FILE') as f:
    state = json.load(f)
keys = '$field'.split('.')
val = state
for k in keys:
    if isinstance(val, dict):
        val = val.get(k, '')
    else:
        val = ''
        break
print(val if val is not None else '')
" 2>/dev/null || echo ""
}

update_state() {
  local py_code="$1"
  python3 -c "
import json
with open('$STATE_FILE', 'r') as f:
    state = json.load(f)
$py_code
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Config management
# ---------------------------------------------------------------------------
init_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log_info "Generating config.json by scanning workspace..."
    python3 << 'PYCONFIG'
import json, os

workspace = "/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
skip_dirs = {
    "scripts", "infra", "terraform", "docs", ".git", "node_modules",
    "docker-compose.yml", "docker-compose.yml.bak",
    "docker-compose.images.yml", "docker-compose.lxc202.yml",
    "docker-compose.standalone.yml"
}

apps = []
for entry in sorted(os.listdir(workspace)):
    full = os.path.join(workspace, entry)
    if not os.path.isdir(full):
        continue
    if entry.startswith(".") or entry in skip_dirs:
        continue
    # Check if it looks like a project (has package.json, Cargo.toml, etc.)
    markers = ["package.json", "Cargo.toml", "go.mod", "pyproject.toml",
               "requirements.txt", "Makefile", "Dockerfile", "next.config.js",
               "next.config.mjs", "next.config.ts"]
    is_app = any(os.path.exists(os.path.join(full, m)) for m in markers)
    if is_app:
        apps.append({
            "name": entry,
            "enabled": True,
            "priority": 1
        })

config = {
    "apps": apps,
    "max_runtime_seconds": 600,
    "cooldown_cycles": 2,
    "loop_interval": 1800
}

with open(os.path.join(workspace, "scripts/self-improve/config.json"), "w") as f:
    json.dump(config, f, indent=2)

print(f"Generated config.json with {len(apps)} apps")
PYCONFIG
  fi
}

get_app_list() {
  python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
for app in config['apps']:
    if app.get('enabled', True):
        print(app['name'])
" 2>/dev/null
}

get_app_count() {
  get_app_list | wc -l | tr -d ' '
}

# ---------------------------------------------------------------------------
# App selection (round-robin with cooldown)
# ---------------------------------------------------------------------------
pick_next_app() {
  local apps=()
  while IFS= read -r app; do
    apps+=("$app")
  done < <(get_app_list)

  local app_count=${#apps[@]}
  if [[ $app_count -eq 0 ]]; then
    log_error "No enabled apps found in config."
    return 1
  fi

  local app_index
  app_index=$(read_state_field "app_index")
  app_index=${app_index:-0}

  # Try each app starting from current index, skip those on cooldown
  local attempts=0
  while [[ $attempts -lt $app_count ]]; do
    local idx=$(( app_index % app_count ))
    local candidate="${apps[$idx]}"

    # Check cooldown
    local fail_cycle
    fail_cycle=$(read_state_field "apps.${candidate}.last_fail_cycle")
    local current_cycle
    current_cycle=$(read_state_field "total_cycles")

    if [[ -n "$fail_cycle" && -n "$current_cycle" ]]; then
      local cycles_since_fail=$(( current_cycle - fail_cycle ))
      if [[ $cycles_since_fail -lt $COOLDOWN_CYCLES ]]; then
        log_info "Skipping $candidate (cooldown: $cycles_since_fail/$COOLDOWN_CYCLES cycles since failure)"
        app_index=$(( app_index + 1 ))
        attempts=$(( attempts + 1 ))
        continue
      fi
    fi

    # Found a valid app
    local next_index=$(( app_index + 1 ))
    update_state "state['app_index'] = $next_index"
    echo "$candidate"
    return 0
  done

  # All apps on cooldown - force the next one anyway
  local idx=$(( app_index % app_count ))
  local forced="${apps[$idx]}"
  local next_index=$(( app_index + 1 ))
  update_state "state['app_index'] = $next_index"
  log_warn "All apps on cooldown. Forcing: $forced"
  echo "$forced"
}

# ---------------------------------------------------------------------------
# Improvement type selection (round-robin)
# ---------------------------------------------------------------------------
pick_next_type() {
  local type_index
  type_index=$(read_state_field "type_index")
  type_index=${type_index:-0}

  local type_count=${#IMPROVEMENT_TYPES[@]}
  local idx=$(( type_index % type_count ))
  local selected="${IMPROVEMENT_TYPES[$idx]}"

  local next_index=$(( type_index + 1 ))
  update_state "state['type_index'] = $next_index"
  echo "$selected"
}

# ---------------------------------------------------------------------------
# Run improvement
# ---------------------------------------------------------------------------
run_improvement() {
  local app="$1"
  local improvement_type="$2"
  local timestamp
  timestamp=$(date +%Y%m%d-%H%M%S)
  local branch_name="auto-improve/${app}/${improvement_type}-${timestamp}"
  local app_dir="$WORKSPACE/$app"

  log_info "=========================================="
  log_info "Starting improvement: app=$app type=$improvement_type"
  log_info "Branch: $branch_name"
  log_info "=========================================="

  if [[ ! -d "$app_dir" ]]; then
    log_error "App directory not found: $app_dir"
    return 1
  fi

  # Check if improve-app.sh exists
  local improve_script="$SCRIPTS_DIR/improve-app.sh"
  if [[ ! -x "$improve_script" ]]; then
    log_warn "improve-app.sh not found or not executable. Using built-in AI analysis."
    run_builtin_improvement "$app" "$improvement_type" "$branch_name"
    return $?
  fi

  # Run the improvement script with timeout
  local start_time
  start_time=$(date +%s)
  local exit_code=0

  if timeout "$MAX_RUNTIME_SECONDS" "$improve_script" "$app" "$improvement_type" >> "$LOG_FILE" 2>&1; then
    exit_code=0
  else
    exit_code=$?
    if [[ $exit_code -eq 124 ]]; then
      log_error "Improvement timed out after ${MAX_RUNTIME_SECONDS}s"
    fi
  fi

  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - start_time ))
  log_info "Improvement finished in ${duration}s with exit code $exit_code"

  return $exit_code
}

# ---------------------------------------------------------------------------
# Built-in improvement (when improve-app.sh is not available)
# Uses Claude Code CLI to analyze and suggest improvements
# ---------------------------------------------------------------------------
run_builtin_improvement() {
  local app="$1"
  local improvement_type="$2"
  local branch_name="$3"
  local app_dir="$WORKSPACE/$app"

  # Build the prompt based on improvement type
  local prompt
  case "$improvement_type" in
    error-handling)
      prompt="Analyze this project and find places where error handling is missing or insufficient. Look for unhandled promise rejections, missing try-catch blocks, silent failures, and API calls without error handling. Suggest specific, minimal fixes. Only output concrete code changes needed."
      ;;
    performance)
      prompt="Analyze this project for performance issues. Look for unnecessary re-renders, missing memoization, unoptimized database queries, missing indexes, large bundle imports, and N+1 query patterns. Suggest specific, minimal fixes."
      ;;
    security)
      prompt="Analyze this project for security vulnerabilities. Check for XSS risks, SQL injection, missing input validation, exposed secrets, insecure headers, CSRF issues, and unsafe dependencies. Suggest specific, minimal fixes."
      ;;
    testing)
      prompt="Analyze this project and identify the most critical untested code paths. Suggest specific test cases that would add the most value. Focus on edge cases, error paths, and business logic. Only suggest tests for existing functionality."
      ;;
    documentation)
      prompt="Analyze this project and find functions, APIs, or modules that lack adequate documentation. Focus on public APIs, complex algorithms, and configuration. Suggest specific, minimal JSDoc/docstring additions."
      ;;
    accessibility)
      prompt="Analyze this project's UI components for accessibility issues. Check for missing ARIA labels, insufficient color contrast, keyboard navigation gaps, missing alt text, and form label associations. Suggest specific fixes."
      ;;
    code-quality)
      prompt="Analyze this project for code quality issues. Look for dead code, duplicated logic, overly complex functions, inconsistent naming, and missing type annotations. Suggest specific, minimal refactoring changes."
      ;;
    type-safety)
      prompt="Analyze this project for type safety issues. Look for 'any' types, missing type definitions, unsafe type assertions, and places where TypeScript types could prevent bugs. Suggest specific fixes."
      ;;
    logging)
      prompt="Analyze this project for logging improvements. Look for operations that should be logged (auth, payments, errors), missing structured logging, and log levels that should be adjusted. Suggest specific additions."
      ;;
    dependency-update)
      prompt="Check this project's package.json for outdated or deprecated dependencies. Identify security advisories and suggest safe version bumps. Focus on patch and minor version updates only."
      ;;
    seo)
      prompt="Analyze this project for SEO improvements. Check for missing meta tags, structured data, sitemap, robots.txt, Open Graph tags, and page title/description issues. Suggest specific fixes."
      ;;
    ux-polish)
      prompt="Analyze this project's UI for UX improvements. Look for missing loading states, error feedback, empty states, inconsistent spacing, and mobile responsiveness issues. Suggest specific, minimal fixes."
      ;;
    *)
      prompt="Analyze this project and suggest one small, impactful improvement. Be specific and minimal."
      ;;
  esac

  local report_file="$REPORTS_DIR/${app}_${improvement_type}_${TODAY}.json"

  log_info "Running Claude Code analysis for $app ($improvement_type)..."

  # Use Claude Code CLI to analyze the project
  local analysis=""
  if command -v claude &>/dev/null; then
    analysis=$(timeout "$MAX_RUNTIME_SECONDS" claude --print --output-format json \
      -p "$prompt

Project directory: $app_dir
Focus on the most impactful single change. Output a JSON response with:
- file: the file to change
- description: what to change and why
- severity: low/medium/high
- effort: low/medium/high" \
      2>/dev/null) || {
      log_error "Claude Code analysis failed or timed out for $app"
      return 1
    }
  else
    log_error "Claude Code CLI not found. Install it or provide improve-app.sh"
    return 1
  fi

  if [[ -z "$analysis" ]]; then
    log_warn "Empty analysis result for $app ($improvement_type)"
    return 1
  fi

  # Save the analysis report
  cat > "$report_file" << REPORT_EOF
{
  "app": "$app",
  "improvement_type": "$improvement_type",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$branch_name",
  "analysis": $(echo "$analysis" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo "\"analysis saved to log\"")
}
REPORT_EOF

  log_info "Analysis report saved: $report_file"

  # Attempt to create branch and commit if there are changes
  if cd "$WORKSPACE" 2>/dev/null; then
    # Check if we're in a git repo
    if git rev-parse --is-inside-work-tree &>/dev/null; then
      # Check for any uncommitted changes from the analysis
      if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
        git checkout -b "$branch_name" 2>/dev/null || git checkout "$branch_name" 2>/dev/null || true
        git add -A
        git commit -m "auto-improve($app): $improvement_type

Automated improvement by self-improve orchestrator.
Type: $improvement_type
App: $app
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>/dev/null || true
        log_info "Changes committed to branch: $branch_name"

        # Push to remote if available
        if git remote get-url origin &>/dev/null; then
          git push -u origin "$branch_name" 2>/dev/null && \
            log_info "Pushed branch $branch_name to origin" || \
            log_warn "Failed to push branch $branch_name"
        fi

        # Return to previous branch
        git checkout - 2>/dev/null || git checkout main 2>/dev/null || true
      else
        log_info "No code changes produced (analysis-only cycle)"
      fi
    fi
  fi

  return 0
}

# ---------------------------------------------------------------------------
# Update state after improvement
# ---------------------------------------------------------------------------
record_result() {
  local app="$1"
  local improvement_type="$2"
  local success="$3"  # 0 = success, non-zero = failure
  local duration="$4"

  local timestamp
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  if [[ "$success" -eq 0 ]]; then
    update_state "
state['total_successes'] = state.get('total_successes', 0) + 1
app_state = state.get('apps', {}).get('$app', {})
app_state['total_improvements'] = app_state.get('total_improvements', 0) + 1
app_state['last_success'] = '$timestamp'
app_state['last_type'] = '$improvement_type'
app_state['last_duration'] = $duration
if 'last_fail_cycle' in app_state:
    del app_state['last_fail_cycle']
state.setdefault('apps', {})['$app'] = app_state
"
    log_info "Recorded SUCCESS for $app ($improvement_type) in ${duration}s"
  else
    update_state "
state['total_failures'] = state.get('total_failures', 0) + 1
current_cycle = state.get('total_cycles', 0)
app_state = state.get('apps', {}).get('$app', {})
app_state['last_fail_cycle'] = current_cycle
app_state['last_failure'] = '$timestamp'
app_state['last_fail_type'] = '$improvement_type'
app_state['total_failures'] = app_state.get('total_failures', 0) + 1
state.setdefault('apps', {})['$app'] = app_state
"
    log_info "Recorded FAILURE for $app ($improvement_type) in ${duration}s"
  fi
}

# ---------------------------------------------------------------------------
# Cycle summary
# ---------------------------------------------------------------------------
print_summary() {
  python3 << 'PYSUMMARY'
import json, sys

try:
    with open("/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/state.json") as f:
        state = json.load(f)
except Exception as e:
    print(f"Could not read state: {e}")
    sys.exit(0)

total = state.get("total_cycles", 0)
successes = state.get("total_successes", 0)
failures = state.get("total_failures", 0)
skips = state.get("total_skips", 0)
rate = (successes / total * 100) if total > 0 else 0

print("\n" + "=" * 60)
print("  SELF-IMPROVEMENT ORCHESTRATOR - STATUS")
print("=" * 60)
print(f"  Total cycles:    {total}")
print(f"  Successes:       {successes}")
print(f"  Failures:        {failures}")
print(f"  Skips:           {skips}")
print(f"  Success rate:    {rate:.1f}%")
print(f"  Last run:        {state.get('last_run', 'never')}")
print(f"  App index:       {state.get('app_index', 0)}")
print(f"  Type index:      {state.get('type_index', 0)}")
print("-" * 60)

apps = state.get("apps", {})
if apps:
    print("  Per-app stats:")
    for name in sorted(apps.keys()):
        a = apps[name]
        improvements = a.get("total_improvements", 0)
        last_type = a.get("last_type", "-")
        last_success = a.get("last_success", "-")
        fails = a.get("total_failures", 0)
        cooldown = a.get("last_fail_cycle")
        status = "COOLDOWN" if cooldown is not None and (state.get("total_cycles", 0) - cooldown) < 2 else "ACTIVE"
        print(f"    {name:30s}  improvements={improvements:3d}  fails={fails:2d}  [{status:8s}]  last={last_type}")
else:
    print("  No app data yet.")
print("=" * 60 + "\n")
PYSUMMARY
}

# ---------------------------------------------------------------------------
# Single cycle
# ---------------------------------------------------------------------------
run_cycle() {
  log_info "--- Cycle start ---"

  # Increment cycle count
  update_state "
import datetime
state['total_cycles'] = state.get('total_cycles', 0) + 1
state['last_run'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
"

  # Pick app and type
  local app
  app=$(pick_next_app) || {
    log_error "Failed to pick next app"
    update_state "state['total_skips'] = state.get('total_skips', 0) + 1"
    return 1
  }

  local improvement_type
  improvement_type=$(pick_next_type)

  log_info "Selected: app=$app type=$improvement_type"

  # Run improvement with timing
  local start_time
  start_time=$(date +%s)
  local exit_code=0

  run_improvement "$app" "$improvement_type" || exit_code=$?

  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - start_time ))

  # Record result
  record_result "$app" "$improvement_type" "$exit_code" "$duration"

  # Print cycle summary
  local cycle_num
  cycle_num=$(read_state_field "total_cycles")
  local result_str="SUCCESS"
  [[ $exit_code -ne 0 ]] && result_str="FAILURE"

  log_info "--- Cycle $cycle_num complete: $app / $improvement_type -> $result_str (${duration}s) ---"

  return 0
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  local mode="${1:-cycle}"

  case "$mode" in
    --status|-s)
      init_state
      print_summary
      exit 0
      ;;
    --reset)
      rm -f "$STATE_FILE"
      init_state
      log_info "State file reset."
      exit 0
      ;;
    --loop|-l)
      acquire_lock
      init_state
      init_config
      log_info "Starting orchestrator in LOOP mode (interval=${LOOP_INTERVAL}s)"
      while true; do
        run_cycle || true
        print_summary
        log_info "Sleeping ${LOOP_INTERVAL}s until next cycle..."
        sleep "$LOOP_INTERVAL"
      done
      ;;
    *)
      # Single cycle mode (for LaunchAgent / cron)
      acquire_lock
      init_state
      init_config
      run_cycle || true
      print_summary
      ;;
  esac
}

main "$@"
