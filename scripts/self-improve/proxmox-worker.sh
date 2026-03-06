#!/usr/bin/env bash
# =============================================================================
# Proxmox Worker - Runs INSIDE LXC 206 as the improvement worker
#
# This script is called by cron every 30 minutes. It:
# 1. Pulls latest code from git
# 2. Reads the work queue (work-queue.json)
# 3. Picks tasks assigned to proxmox-206
# 4. Runs improve-app.sh for each assigned app
# 5. Commits and pushes results
# 6. Updates heartbeat and shared state
#
# Usage:
#   ./proxmox-worker.sh              # Normal cycle
#   ./proxmox-worker.sh --status     # Show worker status
#   ./proxmox-worker.sh --dry-run    # Preview work without executing
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WORKER_ID="proxmox-206"
WORKSPACE="${WORKER_WORKSPACE:-/opt/workspace}"
REPO_ROOT="${WORKSPACE}"
APPS_DIR="${WORKSPACE}/tranthachnguyen-apps"
SCRIPTS_DIR="${APPS_DIR}/scripts/self-improve"
CONFIG_FILE="${SCRIPTS_DIR}/config.json"
WORK_QUEUE="${SCRIPTS_DIR}/work-queue.json"
LOCKS_DIR="${SCRIPTS_DIR}/locks"
LOG_DIR="${SCRIPTS_DIR}/logs"
HEARTBEAT_FILE="${HEARTBEAT_FILE:-/tmp/worker-heartbeat.json}"
ENV_FILE="${WORKSPACE}/.env.worker"

TODAY=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/${TODAY}-${WORKER_ID}.log"
LOCK_FILE="/tmp/proxmox-worker.lock"

MAX_APPS_PER_CYCLE=3
MAX_RUNTIME_PER_APP=600  # 10 minutes

# Improvement types rotated through
IMPROVEMENT_TYPES=(
    "seo" "accessibility" "performance" "security"
    "ux" "code-quality" "content" "docker"
)

# ---------------------------------------------------------------------------
# Init
# ---------------------------------------------------------------------------
mkdir -p "$LOG_DIR" "$LOCKS_DIR"

log() {
    local level="$1"; shift
    local ts
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    local msg="[$ts] [${WORKER_ID}] [$level] $*"
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
# Lock management
# ---------------------------------------------------------------------------
acquire_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local lock_pid
        lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
            log_warn "Another worker cycle is running (PID $lock_pid). Exiting."
            exit 0
        fi
        log_warn "Stale lock found (PID $lock_pid). Removing."
        rm -f "$LOCK_FILE"
    fi
    echo $$ > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"; update_heartbeat "idle"' EXIT INT TERM HUP
}

# ---------------------------------------------------------------------------
# Environment loading
# ---------------------------------------------------------------------------
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        set -a
        # shellcheck source=/dev/null
        source "$ENV_FILE"
        set +a
        log_info "Loaded environment from ${ENV_FILE}"
    else
        log_warn "No .env.worker found at ${ENV_FILE}"
    fi

    if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
        log_error "ANTHROPIC_API_KEY is not set. Cannot run improvements."
        log_error "Set it in ${ENV_FILE}"
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# Heartbeat
# ---------------------------------------------------------------------------
update_heartbeat() {
    local status="${1:-working}"
    local active_app="${2:-none}"

    local disk_pct
    disk_pct=$(df / --output=pcent 2>/dev/null | tail -1 | tr -d ' %' || echo "0")
    local mem_used
    mem_used=$(free -m 2>/dev/null | awk '/^Mem:/{print $3}' || echo "0")
    local mem_total
    mem_total=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")

    cat > "$HEARTBEAT_FILE" << HBEOF
{
  "worker_id": "${WORKER_ID}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "${status}",
  "active_app": "${active_app}",
  "disk_percent": ${disk_pct},
  "memory_used_mb": ${mem_used},
  "memory_total_mb": ${mem_total},
  "pid": $$,
  "log_file": "${LOG_FILE}"
}
HBEOF
}

# ---------------------------------------------------------------------------
# Git operations
# ---------------------------------------------------------------------------
pull_latest() {
    log_info "Pulling latest code..."
    cd "$REPO_ROOT"

    if [[ ! -d ".git" ]]; then
        log_error "Not a git repository: ${REPO_ROOT}"
        return 1
    fi

    # Stash any local changes
    git stash --include-untracked -q 2>/dev/null || true

    # Pull latest
    git fetch origin 2>/dev/null
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || {
        log_error "Failed to pull latest code"
        return 1
    }

    # Re-apply stash if needed
    git stash pop -q 2>/dev/null || true

    log_info "Code updated to $(git rev-parse --short HEAD)"
}

push_changes() {
    local app="$1"
    local improvement_type="$2"

    cd "$REPO_ROOT"

    # Check for changes
    if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
        log_info "No changes to push for ${app}"
        return 0
    fi

    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local branch_name="auto-improve/${app}/${improvement_type}-${timestamp}"

    # Create branch, commit, push
    git checkout -b "$branch_name" 2>/dev/null || {
        log_error "Failed to create branch: ${branch_name}"
        return 1
    }

    git add -A
    git commit -m "auto-improve(${app}): ${improvement_type}

Automated improvement by Proxmox worker (${WORKER_ID}).
Type: ${improvement_type}
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)

Co-Authored-By: Claude Code AI <noreply@anthropic.com>" 2>/dev/null || {
        log_warn "Nothing to commit for ${app}"
        git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
        git branch -D "$branch_name" 2>/dev/null || true
        return 0
    }

    if git push -u origin "$branch_name" 2>/dev/null; then
        log_info "Pushed branch: ${branch_name}"
    else
        log_warn "Failed to push branch: ${branch_name}"
    fi

    # Return to main branch
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Lock file management (prevent duplicate work across workers)
# ---------------------------------------------------------------------------
acquire_app_lock() {
    local app="$1"
    local lock_file="${LOCKS_DIR}/${app}.lock"

    if [[ -f "$lock_file" ]]; then
        local lock_data
        lock_data=$(cat "$lock_file" 2>/dev/null || echo "{}")
        local lock_worker
        lock_worker=$(echo "$lock_data" | jq -r '.worker // empty' 2>/dev/null || echo "")
        local lock_time
        lock_time=$(echo "$lock_data" | jq -r '.timestamp // empty' 2>/dev/null || echo "")

        if [[ -n "$lock_worker" && -n "$lock_time" ]]; then
            # Check if lock is stale (older than 20 minutes)
            local lock_epoch
            lock_epoch=$(date -d "$lock_time" +%s 2>/dev/null || echo "0")
            local now_epoch
            now_epoch=$(date +%s)
            local age=$(( now_epoch - lock_epoch ))

            if [[ $age -lt 1200 ]]; then
                log_info "App ${app} is locked by ${lock_worker} (${age}s ago). Skipping."
                return 1
            fi
            log_warn "Stale lock for ${app} by ${lock_worker} (${age}s ago). Taking over."
        fi
    fi

    # Write our lock
    cat > "$lock_file" << LOCKEOF
{
  "worker": "${WORKER_ID}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "pid": $$
}
LOCKEOF

    # Commit lock to git so other workers see it
    cd "$REPO_ROOT"
    git add "$lock_file" 2>/dev/null
    git commit -m "lock: ${app} claimed by ${WORKER_ID}" --no-verify 2>/dev/null || true
    git push origin HEAD 2>/dev/null || true

    return 0
}

release_app_lock() {
    local app="$1"
    local lock_file="${LOCKS_DIR}/${app}.lock"

    rm -f "$lock_file"

    cd "$REPO_ROOT"
    git add "$lock_file" 2>/dev/null || true
    git rm -f "$lock_file" 2>/dev/null || true
    git commit -m "unlock: ${app} released by ${WORKER_ID}" --no-verify 2>/dev/null || true
    git push origin HEAD 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Work queue reading
# ---------------------------------------------------------------------------
get_assigned_apps() {
    # Read work-queue.json if it exists
    if [[ -f "$WORK_QUEUE" ]]; then
        local apps
        apps=$(jq -r ".\"${WORKER_ID}\" // [] | .[]" "$WORK_QUEUE" 2>/dev/null || echo "")
        if [[ -n "$apps" ]]; then
            echo "$apps"
            return 0
        fi
    fi

    # Fallback: pick apps from config.json based on type (static/simple apps)
    log_info "No work-queue.json found, using default assignment strategy..."
    python3 -c "
import json
with open('${CONFIG_FILE}') as f:
    config = json.load(f)
# Proxmox handles: static-html, simple nodejs, react apps (not nextjs with complex deps)
simple_types = ['static-html', 'nodejs']
for app in config.get('apps', []):
    app_type = app.get('type', '')
    name = app.get('name', '')
    priority = app.get('priority', 5)
    # Skip iOS apps and very complex apps
    if app_type in simple_types and priority >= 3:
        print(name)
    elif app_type == 'react' and priority >= 3 and name not in ['linguaflow']:
        print(name)
" 2>/dev/null || echo ""
}

# ---------------------------------------------------------------------------
# Pick improvement type (round-robin based on state)
# ---------------------------------------------------------------------------
pick_improvement_type() {
    local app="$1"

    # Use a simple file-based counter per app
    local counter_file="${SCRIPTS_DIR}/locks/.type-counter-${app}"
    local idx=0
    if [[ -f "$counter_file" ]]; then
        idx=$(cat "$counter_file" 2>/dev/null || echo "0")
    fi

    local type_count=${#IMPROVEMENT_TYPES[@]}
    local selected="${IMPROVEMENT_TYPES[$(( idx % type_count ))]}"

    echo $(( idx + 1 )) > "$counter_file"
    echo "$selected"
}

# ---------------------------------------------------------------------------
# Run improvement for a single app
# ---------------------------------------------------------------------------
run_improvement() {
    local app="$1"
    local improvement_type="$2"
    local app_dir="${APPS_DIR}/${app}"

    # Check app path from config
    local app_path
    app_path=$(python3 -c "
import json
with open('${CONFIG_FILE}') as f:
    config = json.load(f)
for a in config.get('apps', []):
    if a.get('name') == '${app}':
        print(a.get('path', '${app}'))
        break
" 2>/dev/null || echo "$app")

    if [[ "$app_path" != /* ]]; then
        app_dir="${APPS_DIR}/${app_path}"
    else
        app_dir="$app_path"
    fi

    if [[ ! -d "$app_dir" ]]; then
        log_error "App directory not found: ${app_dir}"
        return 1
    fi

    log_info "Running improvement: app=${app} type=${improvement_type} dir=${app_dir}"
    update_heartbeat "working" "$app"

    local improve_script="${SCRIPTS_DIR}/improve-app.sh"
    local exit_code=0
    local start_time
    start_time=$(date +%s)

    if [[ -x "$improve_script" ]]; then
        timeout "$MAX_RUNTIME_PER_APP" bash "$improve_script" "$app" "$improvement_type" >> "$LOG_FILE" 2>&1 || exit_code=$?
    else
        log_error "improve-app.sh not found or not executable at ${improve_script}"
        return 1
    fi

    local end_time
    end_time=$(date +%s)
    local duration=$(( end_time - start_time ))

    if [[ $exit_code -eq 0 ]]; then
        log_info "SUCCESS: ${app}/${improvement_type} in ${duration}s"
        push_changes "$app" "$improvement_type"
    elif [[ $exit_code -eq 124 ]]; then
        log_error "TIMEOUT: ${app}/${improvement_type} after ${MAX_RUNTIME_PER_APP}s"
    else
        log_error "FAILURE: ${app}/${improvement_type} exit=${exit_code} in ${duration}s"
    fi

    return $exit_code
}

# ---------------------------------------------------------------------------
# Status command
# ---------------------------------------------------------------------------
show_status() {
    echo "=============================================="
    echo "  Proxmox Worker Status (${WORKER_ID})"
    echo "=============================================="
    echo ""

    if [[ -f "$HEARTBEAT_FILE" ]]; then
        echo "--- Heartbeat ---"
        cat "$HEARTBEAT_FILE" | jq '.' 2>/dev/null || cat "$HEARTBEAT_FILE"
        echo ""
    fi

    echo "--- Assigned Apps ---"
    get_assigned_apps | while read -r app; do
        local lock_file="${LOCKS_DIR}/${app}.lock"
        local status="available"
        if [[ -f "$lock_file" ]]; then
            local lock_worker
            lock_worker=$(jq -r '.worker // "unknown"' "$lock_file" 2>/dev/null || echo "unknown")
            status="locked by ${lock_worker}"
        fi
        echo "  ${app}: ${status}"
    done

    echo ""
    echo "--- Active Locks ---"
    for lock_file in "${LOCKS_DIR}"/*.lock; do
        if [[ -f "$lock_file" ]]; then
            local app_name
            app_name=$(basename "$lock_file" .lock)
            local lock_data
            lock_data=$(cat "$lock_file" 2>/dev/null)
            echo "  ${app_name}: ${lock_data}"
        fi
    done

    echo ""
    echo "--- Recent Logs ---"
    if [[ -f "$LOG_FILE" ]]; then
        tail -20 "$LOG_FILE"
    else
        echo "  No logs for today"
    fi
    echo ""
}

# ---------------------------------------------------------------------------
# Main cycle
# ---------------------------------------------------------------------------
run_cycle() {
    local dry_run="${1:-false}"

    log_info "=== Proxmox Worker Cycle Start ==="

    # Pull latest code
    pull_latest || {
        log_error "Failed to pull latest code. Aborting cycle."
        return 1
    }

    # Get assigned apps
    local apps=()
    while IFS= read -r app; do
        [[ -n "$app" ]] && apps+=("$app")
    done < <(get_assigned_apps)

    if [[ ${#apps[@]} -eq 0 ]]; then
        log_warn "No apps assigned to this worker."
        return 0
    fi

    log_info "Assigned apps (${#apps[@]}): ${apps[*]}"

    # Process up to MAX_APPS_PER_CYCLE apps
    local processed=0
    local successes=0
    local failures=0

    for app in "${apps[@]}"; do
        if [[ $processed -ge $MAX_APPS_PER_CYCLE ]]; then
            log_info "Reached max apps per cycle (${MAX_APPS_PER_CYCLE}). Stopping."
            break
        fi

        # Try to acquire lock
        if ! acquire_app_lock "$app"; then
            continue
        fi

        local improvement_type
        improvement_type=$(pick_improvement_type "$app")

        if [[ "$dry_run" == "true" ]]; then
            log_info "[DRY RUN] Would improve: ${app} (${improvement_type})"
            release_app_lock "$app"
            processed=$((processed + 1))
            continue
        fi

        # Run the improvement
        if run_improvement "$app" "$improvement_type"; then
            successes=$((successes + 1))
        else
            failures=$((failures + 1))
        fi

        release_app_lock "$app"
        processed=$((processed + 1))
    done

    log_info "=== Cycle Complete: processed=${processed} success=${successes} fail=${failures} ==="
    update_heartbeat "idle"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    local mode="${1:-cycle}"

    case "$mode" in
        --status|-s)
            show_status
            ;;
        --dry-run|-n)
            load_env
            acquire_lock
            update_heartbeat "starting"
            run_cycle "true"
            ;;
        --help|-h)
            echo "Usage: proxmox-worker.sh [--status|--dry-run|--help]"
            echo ""
            echo "  (default)    Run one improvement cycle"
            echo "  --status     Show worker status"
            echo "  --dry-run    Preview work without executing"
            ;;
        *)
            load_env
            acquire_lock
            update_heartbeat "starting"
            run_cycle "false"
            ;;
    esac
}

main "$@"
