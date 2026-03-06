#!/usr/bin/env bash
# =============================================================================
# Git Operations for Self-Improvement Pipeline
#
# Standardized git workflow for AI-generated improvement branches.
#
# Usage:
#   ./git-ops.sh branch  <app> <type>                 Create improvement branch
#   ./git-ops.sh commit  <app> <type> <summary>        Commit with standard msg
#   ./git-ops.sh push    <branch>                      Push branch to remote
#   ./git-ops.sh pr      <branch> <title> <body>       Create PR via gh CLI
#   ./git-ops.sh merge   <pr-number>                   Auto-merge PR
#   ./git-ops.sh cleanup                               Delete merged branches
#   ./git-ops.sh status                                Show open improvement PRs
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
STATE_FILE="$SCRIPT_DIR/state.json"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).log"
NOTIFY_SCRIPT="$SCRIPT_DIR/notify.sh"

BRANCH_PREFIX="auto-improve"

mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
  local level="$1"; shift
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local msg="[$timestamp] [git-ops] [$level] $*"
  echo "$msg" >> "$LOG_FILE"
  if [[ "$level" == "ERROR" ]]; then
    echo "$msg" >&2
  else
    echo "$msg"
  fi
}

log_info()  { log "INFO"  "$@"; }
log_error() { log "ERROR" "$@"; }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
notify() {
  local message="$1"
  local severity="${2:-info}"
  if [[ -x "$NOTIFY_SCRIPT" ]]; then
    "$NOTIFY_SCRIPT" "$message" "$severity" 2>/dev/null || true
  fi
}

ensure_git_repo() {
  cd "$WORKSPACE"
  if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    log_error "Not a git repository: $WORKSPACE"
    exit 1
  fi
}

read_cycle_number() {
  if [[ -f "$STATE_FILE" ]]; then
    python3 -c "
import json
with open('$STATE_FILE') as f:
    state = json.load(f)
print(state.get('total_cycles', 0))
" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

read_health_score() {
  local app="$1"
  if [[ -f "$STATE_FILE" ]]; then
    python3 -c "
import json
with open('$STATE_FILE') as f:
    state = json.load(f)
app_state = state.get('apps', {}).get('$app', {})
successes = app_state.get('total_improvements', 0)
failures = app_state.get('total_failures', 0)
total = successes + failures
score = int(successes / total * 100) if total > 0 else 0
print(score)
" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

# Create a new improvement branch
cmd_branch() {
  local app="${1:?Usage: git-ops.sh branch <app> <type>}"
  local type="${2:?Usage: git-ops.sh branch <app> <type>}"
  local timestamp
  timestamp=$(date +%Y%m%d-%H%M%S)
  local branch_name="${BRANCH_PREFIX}/${app}/${type}-${timestamp}"

  ensure_git_repo
  cd "$WORKSPACE"

  # Make sure we start from a clean main/master branch
  local base_branch
  base_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "")
  if [[ -z "$base_branch" ]]; then
    # Fallback: try main, then master
    if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
      base_branch="main"
    elif git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
      base_branch="master"
    else
      base_branch=$(git branch --show-current)
    fi
  fi

  git checkout "$base_branch" 2>/dev/null || true
  git pull --ff-only 2>/dev/null || true
  git checkout -b "$branch_name"

  log_info "Created branch: $branch_name (from $base_branch)"
  echo "$branch_name"
}

# Commit changes with standardized message
cmd_commit() {
  local app="${1:?Usage: git-ops.sh commit <app> <type> <summary>}"
  local type="${2:?Usage: git-ops.sh commit <app> <type> <summary>}"
  local summary="${3:?Usage: git-ops.sh commit <app> <type> <summary>}"

  ensure_git_repo
  cd "$WORKSPACE"

  # Gather metadata
  local cycle_num
  cycle_num=$(read_cycle_number)
  local health_before
  health_before=$(read_health_score "$app")

  # Stage all changes
  git add -A

  # Check if there's anything to commit
  if git diff --cached --quiet; then
    log_info "Nothing to commit for $app ($type)"
    echo "no-changes"
    return 0
  fi

  # Build standardized commit message
  local commit_msg
  commit_msg=$(cat <<EOF
auto-improve(${app}): ${type}

${summary}

Improvement Type: ${type}
Cycle: #${cycle_num}
Health Score: ${health_before}%

Co-Authored-By: Claude Code AI <noreply@anthropic.com>
EOF
)

  git commit -m "$commit_msg"

  local commit_hash
  commit_hash=$(git rev-parse --short HEAD)
  log_info "Committed: $commit_hash - auto-improve($app): $type"
  notify "Committed improvement for $app ($type): $commit_hash" "success"
  echo "$commit_hash"
}

# Push branch to remote
cmd_push() {
  local branch="${1:?Usage: git-ops.sh push <branch>}"

  ensure_git_repo
  cd "$WORKSPACE"

  # Verify the branch exists locally
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    # Maybe we're already on that branch
    local current
    current=$(git branch --show-current)
    if [[ "$current" != "$branch" ]]; then
      log_error "Branch not found: $branch"
      exit 1
    fi
  fi

  git push -u origin "$branch" 2>&1
  local exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    log_info "Pushed branch: $branch"
    notify "Pushed branch $branch to remote" "info"
  else
    log_error "Failed to push branch: $branch"
    notify "Failed to push branch $branch" "failure"
  fi

  return $exit_code
}

# Create a Pull Request via gh CLI
cmd_pr() {
  local branch="${1:?Usage: git-ops.sh pr <branch> <title> <body>}"
  local title="${2:?Usage: git-ops.sh pr <branch> <title> <body>}"
  local body="${3:-Auto-generated improvement by self-improvement pipeline.}"

  ensure_git_repo
  cd "$WORKSPACE"

  if ! command -v gh &>/dev/null; then
    log_error "gh CLI not installed. Install with: brew install gh"
    exit 1
  fi

  # Determine base branch
  local base_branch
  base_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "")
  if [[ -z "$base_branch" ]]; then
    if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
      base_branch="main"
    else
      base_branch="master"
    fi
  fi

  local pr_url
  pr_url=$(gh pr create \
    --head "$branch" \
    --base "$base_branch" \
    --title "$title" \
    --body "$body" \
    --label "auto-improve" \
    2>&1) || {
    # If label doesn't exist, retry without it
    pr_url=$(gh pr create \
      --head "$branch" \
      --base "$base_branch" \
      --title "$title" \
      --body "$body" \
      2>&1) || {
      log_error "Failed to create PR for branch: $branch"
      notify "Failed to create PR for $branch" "failure"
      exit 1
    }
  }

  log_info "Created PR: $pr_url"
  notify "Created PR: $pr_url" "success"
  echo "$pr_url"
}

# Auto-merge a PR by number
cmd_merge() {
  local pr_number="${1:?Usage: git-ops.sh merge <pr-number>}"

  ensure_git_repo
  cd "$WORKSPACE"

  if ! command -v gh &>/dev/null; then
    log_error "gh CLI not installed. Install with: brew install gh"
    exit 1
  fi

  # Check PR status first
  local pr_state
  pr_state=$(gh pr view "$pr_number" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")

  if [[ "$pr_state" == "MERGED" ]]; then
    log_info "PR #$pr_number is already merged"
    echo "already-merged"
    return 0
  fi

  if [[ "$pr_state" == "CLOSED" ]]; then
    log_error "PR #$pr_number is closed"
    return 1
  fi

  # Check if checks are passing (if any)
  local checks_status
  checks_status=$(gh pr checks "$pr_number" 2>/dev/null || echo "no-checks")

  # Attempt merge with squash
  gh pr merge "$pr_number" --squash --delete-branch 2>&1 || {
    # Fallback to regular merge if squash fails
    gh pr merge "$pr_number" --merge --delete-branch 2>&1 || {
      log_error "Failed to merge PR #$pr_number"
      notify "Failed to merge PR #$pr_number" "failure"
      exit 1
    }
  }

  log_info "Merged PR #$pr_number"
  notify "Merged PR #$pr_number" "success"
  echo "merged"
}

# Delete merged improvement branches
cmd_cleanup() {
  ensure_git_repo
  cd "$WORKSPACE"

  log_info "Cleaning up merged improvement branches..."

  # Fetch latest remote state
  git fetch --prune origin 2>/dev/null || true

  local deleted=0

  # Find local branches matching the prefix that have been merged
  local base_branch
  base_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

  while IFS= read -r branch; do
    branch=$(echo "$branch" | xargs)  # trim whitespace
    if [[ -z "$branch" ]]; then
      continue
    fi
    # Check if the branch is merged into base
    if git branch --merged "$base_branch" 2>/dev/null | grep -qF "$branch"; then
      git branch -d "$branch" 2>/dev/null && {
        log_info "Deleted local branch: $branch"
        deleted=$((deleted + 1))
      }
    fi
  done < <(git branch --list "${BRANCH_PREFIX}/*" 2>/dev/null)

  # Also clean up remote tracking branches that no longer exist
  while IFS= read -r remote_branch; do
    remote_branch=$(echo "$remote_branch" | xargs | sed 's@origin/@@')
    if [[ -z "$remote_branch" || "$remote_branch" == *"HEAD"* ]]; then
      continue
    fi
    # Check if it's a merged improvement branch on remote
    if [[ "$remote_branch" == ${BRANCH_PREFIX}/* ]]; then
      if git branch -r --merged "origin/$base_branch" 2>/dev/null | grep -qF "origin/$remote_branch"; then
        git push origin --delete "$remote_branch" 2>/dev/null && {
          log_info "Deleted remote branch: origin/$remote_branch"
          deleted=$((deleted + 1))
        }
      fi
    fi
  done < <(git branch -r --list "origin/${BRANCH_PREFIX}/*" 2>/dev/null)

  log_info "Cleanup complete. Deleted $deleted branch(es)."
  notify "Branch cleanup: deleted $deleted merged improvement branch(es)" "info"
  echo "$deleted"
}

# Show all open improvement PRs
cmd_status() {
  ensure_git_repo
  cd "$WORKSPACE"

  echo "============================================================"
  echo "  Self-Improvement Git Status"
  echo "============================================================"
  echo ""

  # Local branches
  echo "--- Local improvement branches ---"
  local local_branches
  local_branches=$(git branch --list "${BRANCH_PREFIX}/*" 2>/dev/null || echo "")
  if [[ -n "$local_branches" ]]; then
    echo "$local_branches" | while IFS= read -r branch; do
      branch=$(echo "$branch" | xargs)
      local last_commit
      last_commit=$(git log -1 --format="%h %s (%cr)" "$branch" 2>/dev/null || echo "unknown")
      echo "  $branch  ->  $last_commit"
    done
  else
    echo "  (none)"
  fi
  echo ""

  # Remote branches
  echo "--- Remote improvement branches ---"
  git fetch --prune origin 2>/dev/null || true
  local remote_branches
  remote_branches=$(git branch -r --list "origin/${BRANCH_PREFIX}/*" 2>/dev/null || echo "")
  if [[ -n "$remote_branches" ]]; then
    echo "$remote_branches" | while IFS= read -r branch; do
      branch=$(echo "$branch" | xargs)
      local last_commit
      last_commit=$(git log -1 --format="%h %s (%cr)" "$branch" 2>/dev/null || echo "unknown")
      echo "  $branch  ->  $last_commit"
    done
  else
    echo "  (none)"
  fi
  echo ""

  # Open PRs (if gh is available)
  if command -v gh &>/dev/null; then
    echo "--- Open improvement PRs ---"
    local prs
    prs=$(gh pr list --state open --search "head:${BRANCH_PREFIX}" --json number,title,headRefName,createdAt,url \
      --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}    Branch: {{.headRefName}}{{"\n"}}    Created: {{.createdAt}}{{"\n"}}    URL: {{.url}}{{"\n\n"}}{{end}}' 2>/dev/null || echo "")
    if [[ -n "$prs" ]]; then
      echo "$prs"
    else
      echo "  (no open PRs)"
    fi
    echo ""

    echo "--- Recently merged improvement PRs ---"
    local merged_prs
    merged_prs=$(gh pr list --state merged --search "head:${BRANCH_PREFIX}" --limit 10 --json number,title,mergedAt,url \
      --template '{{range .}}  #{{.number}} {{.title}} (merged: {{.mergedAt}}){{"\n"}}    URL: {{.url}}{{"\n"}}{{end}}' 2>/dev/null || echo "")
    if [[ -n "$merged_prs" ]]; then
      echo "$merged_prs"
    else
      echo "  (no recently merged PRs)"
    fi
  else
    echo "--- gh CLI not available, skipping PR status ---"
  fi

  echo ""
  echo "============================================================"
}

# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------
main() {
  local command="${1:-help}"
  shift || true

  case "$command" in
    branch)   cmd_branch "$@" ;;
    commit)   cmd_commit "$@" ;;
    push)     cmd_push "$@" ;;
    pr)       cmd_pr "$@" ;;
    merge)    cmd_merge "$@" ;;
    cleanup)  cmd_cleanup ;;
    status)   cmd_status ;;
    help|--help|-h)
      echo "Usage: git-ops.sh <command> [args...]"
      echo ""
      echo "Commands:"
      echo "  branch  <app> <type>              Create improvement branch"
      echo "  commit  <app> <type> <summary>    Commit with standardized message"
      echo "  push    <branch>                  Push branch to remote"
      echo "  pr      <branch> <title> <body>   Create PR via gh CLI"
      echo "  merge   <pr-number>               Auto-merge PR"
      echo "  cleanup                           Delete merged improvement branches"
      echo "  status                            Show improvement branches and PRs"
      ;;
    *)
      log_error "Unknown command: $command"
      echo "Run: git-ops.sh help"
      exit 1
      ;;
  esac
}

main "$@"
