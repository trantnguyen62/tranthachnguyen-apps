#!/usr/bin/env bash
# =============================================================================
# Cron-Triggered Deploy Script for Self-Improvement Pipeline
#
# Checks for merged PRs since last deploy, triggers deployment to Proxmox,
# validates the result, and sends notifications.
#
# Usage:
#   ./cron-deploy.sh              Run a deploy cycle
#   ./cron-deploy.sh --status     Show last deploy info
#   ./cron-deploy.sh --force      Force deploy even without new merges
#   ./cron-deploy.sh --dry-run    Check for merges but don't deploy
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
LOG_DIR="$SCRIPT_DIR/logs"
DEPLOY_STATE_FILE="$SCRIPT_DIR/.last-deploy"
DEPLOY_LOCK_FILE="$SCRIPT_DIR/.deploy.lock"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d)-deploy.log"
NOTIFY_SCRIPT="$SCRIPT_DIR/notify.sh"
DEPLOY_SCRIPT="$WORKSPACE/deploy-to-proxmox.sh"

# SSH configuration for remote validation
SSH_CMD='sshpass -p "Nuoc.123" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" root@ssh.tranthachnguyen.com'

# Health check endpoints per LXC container
declare -A HEALTH_CHECKS=(
  [201]="curl -sf http://localhost:3000 >/dev/null 2>&1"
  [203]="curl -sf http://localhost:3000/api/health >/dev/null 2>&1"
)

BRANCH_PREFIX="auto-improve"
MAX_DEPLOY_TIME=600  # 10 minutes

mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
  local level="$1"; shift
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local msg="[$timestamp] [cron-deploy] [$level] $*"
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
# Notifications
# ---------------------------------------------------------------------------
notify() {
  local message="$1"
  local severity="${2:-info}"
  if [[ -x "$NOTIFY_SCRIPT" ]]; then
    "$NOTIFY_SCRIPT" "$message" "$severity" 2>/dev/null || true
  fi
}

# ---------------------------------------------------------------------------
# Lock management
# ---------------------------------------------------------------------------
acquire_lock() {
  if [[ -f "$DEPLOY_LOCK_FILE" ]]; then
    local lock_pid
    lock_pid=$(cat "$DEPLOY_LOCK_FILE" 2>/dev/null || echo "")
    if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
      log_warn "Another deploy is running (PID $lock_pid). Exiting."
      exit 0
    else
      log_warn "Stale deploy lock found (PID $lock_pid). Removing."
      rm -f "$DEPLOY_LOCK_FILE"
    fi
  fi
  echo $$ > "$DEPLOY_LOCK_FILE"
  trap 'rm -f "$DEPLOY_LOCK_FILE"' EXIT INT TERM HUP
}

# ---------------------------------------------------------------------------
# Deploy state management
# ---------------------------------------------------------------------------
read_last_deploy() {
  if [[ -f "$DEPLOY_STATE_FILE" ]]; then
    cat "$DEPLOY_STATE_FILE"
  else
    echo ""
  fi
}

save_deploy_state() {
  local commit_hash="$1"
  local status="$2"
  local timestamp
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  cat > "$DEPLOY_STATE_FILE" <<EOF
{
  "commit": "$commit_hash",
  "status": "$status",
  "timestamp": "$timestamp",
  "deployer": "cron-deploy"
}
EOF
}

# ---------------------------------------------------------------------------
# Check for merged PRs since last deploy
# ---------------------------------------------------------------------------
check_merged_prs() {
  cd "$WORKSPACE"

  if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    log_error "Not a git repository: $WORKSPACE"
    return 1
  fi

  # Get the commit hash from last deploy
  local last_deploy_commit=""
  if [[ -f "$DEPLOY_STATE_FILE" ]]; then
    last_deploy_commit=$(python3 -c "
import json
with open('$DEPLOY_STATE_FILE') as f:
    state = json.load(f)
print(state.get('commit', ''))
" 2>/dev/null || echo "")
  fi

  # Fetch latest from remote
  git fetch --prune origin 2>/dev/null || true

  # Get the base branch
  local base_branch
  base_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "")
  if [[ -z "$base_branch" ]]; then
    if git show-ref --verify --quiet refs/remotes/origin/main 2>/dev/null; then
      base_branch="main"
    else
      base_branch="master"
    fi
  fi

  # Pull latest changes on base branch
  local current_branch
  current_branch=$(git branch --show-current)
  if [[ "$current_branch" == "$base_branch" ]]; then
    git pull --ff-only origin "$base_branch" 2>/dev/null || true
  fi

  local current_head
  current_head=$(git rev-parse "origin/$base_branch" 2>/dev/null)

  # If no previous deploy, nothing to compare
  if [[ -z "$last_deploy_commit" ]]; then
    log_info "No previous deploy recorded. Current HEAD: $current_head"
    echo "$current_head"
    return 0
  fi

  # Check if there are new commits since last deploy
  if [[ "$current_head" == "$last_deploy_commit" ]]; then
    log_info "No new commits since last deploy ($last_deploy_commit)"
    echo ""
    return 0
  fi

  # List commits since last deploy that came from improvement branches
  local new_commits
  new_commits=$(git log --oneline "${last_deploy_commit}..origin/${base_branch}" 2>/dev/null || echo "")

  if [[ -z "$new_commits" ]]; then
    log_info "No new commits since last deploy"
    echo ""
    return 0
  fi

  # Count improvement-related commits
  local improvement_count
  improvement_count=$(echo "$new_commits" | grep -c "${BRANCH_PREFIX}\|auto-improve" || echo "0")

  local total_count
  total_count=$(echo "$new_commits" | wc -l | tr -d ' ')

  log_info "Found $total_count new commits ($improvement_count from auto-improve) since last deploy"
  log_info "Commits:"
  echo "$new_commits" | while IFS= read -r line; do
    log_info "  $line"
  done

  echo "$current_head"
}

# ---------------------------------------------------------------------------
# Run deployment
# ---------------------------------------------------------------------------
run_deploy() {
  local target_commit="$1"

  log_info "Starting deployment for commit: $target_commit"
  notify "Starting deployment for commit $target_commit" "info"

  cd "$WORKSPACE"

  local deploy_start
  deploy_start=$(date +%s)
  local deploy_exit=0

  if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
    log_error "Deploy script not found or not executable: $DEPLOY_SCRIPT"
    notify "Deploy failed: deploy script not found at $DEPLOY_SCRIPT" "failure"
    return 1
  fi

  # Set PROXMOX_PASS so deploy script doesn't prompt
  export PROXMOX_PASS="${PROXMOX_PASS:-Nuoc.123}"

  # Run deploy with timeout
  if command -v gtimeout &>/dev/null; then
    gtimeout "$MAX_DEPLOY_TIME" "$DEPLOY_SCRIPT" >> "$LOG_FILE" 2>&1 || deploy_exit=$?
  elif command -v timeout &>/dev/null; then
    timeout "$MAX_DEPLOY_TIME" "$DEPLOY_SCRIPT" >> "$LOG_FILE" 2>&1 || deploy_exit=$?
  else
    "$DEPLOY_SCRIPT" >> "$LOG_FILE" 2>&1 || deploy_exit=$?
  fi

  local deploy_end
  deploy_end=$(date +%s)
  local deploy_duration=$(( deploy_end - deploy_start ))

  if [[ $deploy_exit -eq 124 ]]; then
    log_error "Deployment timed out after ${MAX_DEPLOY_TIME}s"
    notify "Deployment TIMED OUT after ${MAX_DEPLOY_TIME}s for commit $target_commit" "failure"
    save_deploy_state "$target_commit" "timeout"
    return 1
  fi

  if [[ $deploy_exit -ne 0 ]]; then
    log_error "Deployment failed with exit code $deploy_exit (${deploy_duration}s)"
    notify "Deployment FAILED (exit $deploy_exit) for commit $target_commit in ${deploy_duration}s" "failure"
    save_deploy_state "$target_commit" "failed"
    return 1
  fi

  log_info "Deployment script completed in ${deploy_duration}s"
  return 0
}

# ---------------------------------------------------------------------------
# Validate deployment via health checks
# ---------------------------------------------------------------------------
validate_deployment() {
  log_info "Validating deployment via health checks..."

  local all_healthy=true
  local results=""

  for lxc_id in "${!HEALTH_CHECKS[@]}"; do
    local check_cmd="${HEALTH_CHECKS[$lxc_id]}"
    local healthy=false
    local retries=5
    local wait_seconds=10

    log_info "Checking LXC $lxc_id health..."

    for ((i=1; i<=retries; i++)); do
      # Run health check on the remote LXC
      local check_result
      check_result=$(eval "$SSH_CMD \"pct exec $lxc_id -- bash -c '$check_cmd && echo HEALTHY || echo UNHEALTHY'\"" 2>/dev/null || echo "UNREACHABLE")

      if [[ "$check_result" == *"HEALTHY"* ]]; then
        healthy=true
        log_info "LXC $lxc_id: HEALTHY (attempt $i)"
        results="${results}LXC $lxc_id: HEALTHY\n"
        break
      fi

      if [[ $i -lt $retries ]]; then
        log_warn "LXC $lxc_id: not healthy yet (attempt $i/$retries), waiting ${wait_seconds}s..."
        sleep "$wait_seconds"
      fi
    done

    if [[ "$healthy" != "true" ]]; then
      log_error "LXC $lxc_id: UNHEALTHY after $retries attempts"
      results="${results}LXC $lxc_id: UNHEALTHY\n"
      all_healthy=false
    fi
  done

  echo ""
  log_info "Validation results:"
  echo -e "$results" | while IFS= read -r line; do
    [[ -n "$line" ]] && log_info "  $line"
  done

  if [[ "$all_healthy" == "true" ]]; then
    log_info "All health checks passed"
    return 0
  else
    log_error "Some health checks failed"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Show deploy status
# ---------------------------------------------------------------------------
show_status() {
  echo "============================================================"
  echo "  Cron Deploy Status"
  echo "============================================================"
  echo ""

  if [[ -f "$DEPLOY_STATE_FILE" ]]; then
    python3 -c "
import json
with open('$DEPLOY_STATE_FILE') as f:
    state = json.load(f)
print(f\"  Last deploy commit:  {state.get('commit', 'unknown')}\")
print(f\"  Status:              {state.get('status', 'unknown')}\")
print(f\"  Timestamp:           {state.get('timestamp', 'unknown')}\")
print(f\"  Deployer:            {state.get('deployer', 'unknown')}\")
" 2>/dev/null || echo "  Could not read deploy state"
  else
    echo "  No previous deploy recorded."
  fi

  echo ""

  # Check for pending changes
  cd "$WORKSPACE" 2>/dev/null || true
  if git rev-parse --is-inside-work-tree &>/dev/null; then
    local pending
    pending=$(check_merged_prs 2>/dev/null || echo "")
    if [[ -n "$pending" ]]; then
      echo "  Pending deploy:      YES (new commits available)"
    else
      echo "  Pending deploy:      NO (up to date)"
    fi
  fi

  echo ""
  echo "============================================================"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  local mode="${1:-deploy}"
  local force=false
  local dry_run=false

  case "$mode" in
    --status|-s)
      show_status
      exit 0
      ;;
    --force|-f)
      force=true
      ;;
    --dry-run|-n)
      dry_run=true
      ;;
    deploy|"")
      ;;
    --help|-h)
      echo "Usage: cron-deploy.sh [--status|--force|--dry-run]"
      echo ""
      echo "Options:"
      echo "  (default)     Check for merged PRs and deploy if needed"
      echo "  --status      Show last deploy info"
      echo "  --force       Force deploy even without new merges"
      echo "  --dry-run     Check for merges but don't deploy"
      exit 0
      ;;
    *)
      echo "Unknown option: $mode"
      echo "Run: cron-deploy.sh --help"
      exit 1
      ;;
  esac

  acquire_lock

  log_info "=== Cron deploy cycle start ==="

  # Step 1: Check for merged PRs
  local target_commit
  target_commit=$(check_merged_prs) || {
    log_error "Failed to check for merged PRs"
    notify "Deploy check failed: could not query merged PRs" "failure"
    exit 1
  }

  if [[ -z "$target_commit" && "$force" != "true" ]]; then
    log_info "No new changes to deploy. Exiting."
    exit 0
  fi

  if [[ -z "$target_commit" && "$force" == "true" ]]; then
    cd "$WORKSPACE"
    local base_branch
    base_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
    target_commit=$(git rev-parse "origin/$base_branch" 2>/dev/null || git rev-parse HEAD)
    log_info "Force deploy requested. Using current HEAD: $target_commit"
  fi

  if [[ "$dry_run" == "true" ]]; then
    log_info "Dry run: would deploy commit $target_commit"
    echo "Would deploy commit: $target_commit"
    exit 0
  fi

  # Step 2: Deploy
  local deploy_success=false
  if run_deploy "$target_commit"; then
    deploy_success=true
  fi

  # Step 3: Validate
  local validation_success=false
  if [[ "$deploy_success" == "true" ]]; then
    # Wait a moment for services to stabilize
    log_info "Waiting 15s for services to stabilize..."
    sleep 15

    if validate_deployment; then
      validation_success=true
    fi
  fi

  # Step 4: Record result and notify
  local short_commit="${target_commit:0:8}"

  if [[ "$deploy_success" == "true" && "$validation_success" == "true" ]]; then
    save_deploy_state "$target_commit" "success"
    log_info "Deploy cycle complete: SUCCESS (commit $short_commit)"
    notify "Deploy SUCCESS: commit $short_commit deployed and validated" "success"
  elif [[ "$deploy_success" == "true" && "$validation_success" != "true" ]]; then
    save_deploy_state "$target_commit" "deployed-unhealthy"
    log_warn "Deploy cycle complete: DEPLOYED but health checks FAILED (commit $short_commit)"
    notify "Deploy WARNING: commit $short_commit deployed but health checks failed. Manual inspection needed." "failure"
  else
    log_error "Deploy cycle complete: FAILED (commit $short_commit)"
    # State already saved by run_deploy
  fi

  log_info "=== Cron deploy cycle end ==="
}

main "$@"
