#!/usr/bin/env bash
# =============================================================================
# Worker Coordinator - Coordinates all 3 workers before each cycle
#
# This runs on the Mac Mini before each improvement cycle to:
# 1. Check if Proxmox worker (LXC 206) is alive
# 2. Check if GitHub Actions are running
# 3. Distribute work to avoid conflicts
# 4. Aggregate results from all workers
# 5. Update unified state.json and metrics
#
# Usage:
#   ./worker-coordinator.sh                # Pre-cycle coordination
#   ./worker-coordinator.sh --status       # Show all worker statuses
#   ./worker-coordinator.sh --aggregate    # Aggregate results only
#   ./worker-coordinator.sh --full-cycle   # Coordinate + run Mac Mini cycle
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
STATE_FILE="${SCRIPT_DIR}/state.json"
WORK_QUEUE="${SCRIPT_DIR}/work-queue.json"
COORDINATOR_STATE="${SCRIPT_DIR}/coordinator-state.json"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/$(date +%Y-%m-%d)-coordinator.log"

# Worker connection details
PVE_PASS="Nuoc.123"
CTID=206

# Timeouts
PROXMOX_HEARTBEAT_STALE_SECONDS=600  # 10 minutes
GH_ACTIONS_CHECK_TIMEOUT=30

mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
    local level="$1"; shift
    local ts
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    local msg="[$ts] [coordinator] [$level] $*"
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
# Proxmox worker health check
# ---------------------------------------------------------------------------
check_proxmox_worker() {
    log_info "Checking Proxmox worker (LXC ${CTID})..."

    local is_alive=false
    local heartbeat_data=""
    local worker_status="unknown"

    # Try to read heartbeat from LXC 206
    heartbeat_data=$(sshpass -p "${PVE_PASS}" ssh -o StrictHostKeyChecking=no \
        -o ConnectTimeout=10 \
        -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" \
        root@ssh.tranthachnguyen.com \
        "pct exec ${CTID} -- cat /tmp/worker-heartbeat.json 2>/dev/null" 2>/dev/null) || {
        log_warn "Cannot reach Proxmox worker"
        echo '{"alive": false, "status": "unreachable", "data": {}}'
        return 1
    }

    if [[ -z "$heartbeat_data" ]]; then
        log_warn "Proxmox worker heartbeat is empty"
        echo '{"alive": false, "status": "no-heartbeat", "data": {}}'
        return 1
    fi

    # Parse heartbeat timestamp
    local hb_timestamp
    hb_timestamp=$(echo "$heartbeat_data" | jq -r '.timestamp // empty' 2>/dev/null || echo "")

    if [[ -n "$hb_timestamp" ]]; then
        # Check if heartbeat is stale
        local hb_epoch now_epoch age
        if date -j -f "%Y-%m-%dT%H:%M:%S" "${hb_timestamp%%.*}" "+%s" &>/dev/null 2>&1; then
            hb_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$hb_timestamp" "+%s" 2>/dev/null || echo "0")
        else
            hb_epoch=$(date -d "$hb_timestamp" "+%s" 2>/dev/null || echo "0")
        fi
        now_epoch=$(date +%s)
        age=$(( now_epoch - hb_epoch ))

        if [[ $age -lt $PROXMOX_HEARTBEAT_STALE_SECONDS ]]; then
            is_alive=true
            worker_status=$(echo "$heartbeat_data" | jq -r '.status // "unknown"' 2>/dev/null)
            log_info "Proxmox worker is ALIVE (heartbeat ${age}s ago, status: ${worker_status})"
        else
            log_warn "Proxmox worker heartbeat is STALE (${age}s old)"
            worker_status="stale"
        fi
    fi

    echo "{\"alive\": ${is_alive}, \"status\": \"${worker_status}\", \"data\": ${heartbeat_data}}"
    if [[ "$is_alive" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

# ---------------------------------------------------------------------------
# GitHub Actions check
# ---------------------------------------------------------------------------
check_github_actions() {
    log_info "Checking GitHub Actions..."

    if ! command -v gh &>/dev/null; then
        log_warn "gh CLI not available. Skipping GitHub Actions check."
        echo '{"active": false, "status": "gh-not-available", "runs": []}'
        return 0
    fi

    local active_runs=""
    active_runs=$(timeout "$GH_ACTIONS_CHECK_TIMEOUT" gh run list \
        --workflow "self-improve" \
        --status "in_progress" \
        --json databaseId,name,status,startedAt \
        2>/dev/null) || {
        log_warn "Failed to check GitHub Actions"
        echo '{"active": false, "status": "check-failed", "runs": []}'
        return 0
    }

    local run_count
    run_count=$(echo "$active_runs" | jq 'length' 2>/dev/null || echo "0")

    if [[ "$run_count" -gt 0 ]]; then
        log_info "GitHub Actions: ${run_count} active run(s)"
        echo "{\"active\": true, \"status\": \"running\", \"count\": ${run_count}, \"runs\": ${active_runs}}"
    else
        log_info "GitHub Actions: no active runs"
        echo '{"active": false, "status": "idle", "count": 0, "runs": []}'
    fi
}

# ---------------------------------------------------------------------------
# Distribute work
# ---------------------------------------------------------------------------
distribute_work() {
    local proxmox_alive="$1"
    local gh_actions_active="$2"

    log_info "Distributing work (proxmox=${proxmox_alive}, gh-actions=${gh_actions_active})..."

    # Run the distribution script
    if [[ -x "${SCRIPT_DIR}/distribute-work.sh" ]]; then
        bash "${SCRIPT_DIR}/distribute-work.sh" 2>&1 | tee -a "$LOG_FILE"
    else
        log_error "distribute-work.sh not found or not executable"
        return 1
    fi

    # If Proxmox is down, reassign its work to Mac Mini
    if [[ "$proxmox_alive" == "false" && -f "$WORK_QUEUE" ]]; then
        log_warn "Proxmox worker is down. Reassigning its apps to mac-mini..."

        python3 << PYREASSIGN
import json

with open("${WORK_QUEUE}") as f:
    queue = json.load(f)

proxmox_apps = queue.get("proxmox-206", [])
if proxmox_apps:
    # Move up to 3 highest-priority apps to mac-mini
    mac_apps = queue.get("mac-mini", [])
    reassigned = proxmox_apps[:3]
    remaining = proxmox_apps[3:]

    queue["mac-mini"] = mac_apps + reassigned
    queue["proxmox-206"] = remaining

    # Move overflow to github-actions
    if remaining:
        gh_apps = queue.get("github-actions", [])
        queue["github-actions"] = gh_apps + remaining
        queue["proxmox-206"] = []

    queue.setdefault("metadata", {})["proxmox_reassigned"] = True
    queue["metadata"]["reassigned_apps"] = reassigned

    with open("${WORK_QUEUE}", "w") as f:
        json.dump(queue, f, indent=2)

    print(f"Reassigned {len(reassigned)} apps from proxmox-206 to mac-mini")
    if remaining:
        print(f"Overflowed {len(remaining)} apps to github-actions")
PYREASSIGN
    fi

    log_info "Work distribution complete."
}

# ---------------------------------------------------------------------------
# Aggregate results from all workers
# ---------------------------------------------------------------------------
aggregate_results() {
    log_info "Aggregating results from all workers..."

    # Read Proxmox worker state if available
    local proxmox_state="{}"
    proxmox_state=$(sshpass -p "${PVE_PASS}" ssh -o StrictHostKeyChecking=no \
        -o ConnectTimeout=10 \
        -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" \
        root@ssh.tranthachnguyen.com \
        "pct exec ${CTID} -- cat /opt/workspace/tranthachnguyen-apps/scripts/self-improve/state.json 2>/dev/null" 2>/dev/null) || {
        log_warn "Cannot read Proxmox worker state"
        proxmox_state="{}"
    }

    # Read local (Mac Mini) state
    local local_state="{}"
    if [[ -f "$STATE_FILE" ]]; then
        local_state=$(cat "$STATE_FILE")
    fi

    # Merge states
    python3 << PYMERGE
import json
from datetime import datetime

# Load states
try:
    local_state = json.loads('''${local_state}''')
except:
    local_state = {}

try:
    proxmox_state = json.loads('''${proxmox_state}''')
except:
    proxmox_state = {}

# Build coordinator state
coordinator = {
    "last_coordination": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "workers": {
        "mac-mini": {
            "total_cycles": local_state.get("total_cycles", local_state.get("totalCycles", 0)),
            "total_successes": local_state.get("total_successes", local_state.get("totalSuccess", 0)),
            "total_failures": local_state.get("total_failures", local_state.get("totalFailure", 0)),
            "last_run": local_state.get("last_run", local_state.get("lastCycle")),
        },
        "proxmox-206": {
            "total_cycles": proxmox_state.get("total_cycles", proxmox_state.get("totalCycles", 0)),
            "total_successes": proxmox_state.get("total_successes", proxmox_state.get("totalSuccess", 0)),
            "total_failures": proxmox_state.get("total_failures", proxmox_state.get("totalFailure", 0)),
            "last_run": proxmox_state.get("last_run", proxmox_state.get("lastCycle")),
        },
        "github-actions": {
            "total_cycles": 0,
            "total_successes": 0,
            "total_failures": 0,
            "last_run": None,
        },
    },
    "totals": {
        "total_cycles": (
            local_state.get("total_cycles", local_state.get("totalCycles", 0)) +
            proxmox_state.get("total_cycles", proxmox_state.get("totalCycles", 0))
        ),
        "total_successes": (
            local_state.get("total_successes", local_state.get("totalSuccess", 0)) +
            proxmox_state.get("total_successes", proxmox_state.get("totalSuccess", 0))
        ),
        "total_failures": (
            local_state.get("total_failures", local_state.get("totalFailure", 0)) +
            proxmox_state.get("total_failures", proxmox_state.get("totalFailure", 0))
        ),
    },
    "all_apps": {},
}

# Merge app states from both workers
for source_name, source_state in [("mac-mini", local_state), ("proxmox-206", proxmox_state)]:
    apps = source_state.get("apps", {})
    for app_name, app_data in apps.items():
        if app_name not in coordinator["all_apps"]:
            coordinator["all_apps"][app_name] = {
                "worker": source_name,
                "total_improvements": 0,
                "total_failures": 0,
                "last_success": None,
                "last_type": None,
            }
        existing = coordinator["all_apps"][app_name]
        existing["total_improvements"] += app_data.get("total_improvements", app_data.get("totalImprovements", 0))
        existing["total_failures"] += app_data.get("total_failures", app_data.get("consecutiveFailures", 0))

        # Keep most recent success
        new_success = app_data.get("last_success", app_data.get("lastImprovement"))
        if new_success and (not existing["last_success"] or new_success > existing["last_success"]):
            existing["last_success"] = new_success
            existing["last_type"] = app_data.get("last_type", app_data.get("lastType"))
            existing["worker"] = source_name

# Calculate success rate
total = coordinator["totals"]["total_cycles"]
if total > 0:
    coordinator["totals"]["success_rate"] = round(
        coordinator["totals"]["total_successes"] / total * 100, 1
    )
else:
    coordinator["totals"]["success_rate"] = 0

with open("${COORDINATOR_STATE}", "w") as f:
    json.dump(coordinator, f, indent=2)

print("=== Aggregated Results ===")
print(f"Total cycles (all workers): {coordinator['totals']['total_cycles']}")
print(f"Total successes: {coordinator['totals']['total_successes']}")
print(f"Total failures: {coordinator['totals']['total_failures']}")
print(f"Success rate: {coordinator['totals']['success_rate']}%")
print()

for worker_name, worker_data in coordinator["workers"].items():
    cycles = worker_data["total_cycles"]
    successes = worker_data["total_successes"]
    rate = round(successes / cycles * 100, 1) if cycles > 0 else 0
    print(f"  {worker_name}: {cycles} cycles, {successes} successes ({rate}%)")

print()
print(f"Apps tracked: {len(coordinator['all_apps'])}")
print(f"State written to: ${COORDINATOR_STATE}")
PYMERGE

    log_info "Aggregation complete."
}

# ---------------------------------------------------------------------------
# Show all worker statuses
# ---------------------------------------------------------------------------
show_status() {
    echo "=============================================="
    echo "  Worker Coordinator Status"
    echo "=============================================="
    echo ""

    # Mac Mini (local)
    echo "--- Mac Mini (local) ---"
    if [[ -f "$STATE_FILE" ]]; then
        local total successes
        total=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d.get('total_cycles', d.get('totalCycles', 0)))" 2>/dev/null || echo "0")
        successes=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d.get('total_successes', d.get('totalSuccess', 0)))" 2>/dev/null || echo "0")
        echo "  Cycles: ${total}, Successes: ${successes}"
    else
        echo "  No state file found"
    fi
    echo ""

    # Proxmox worker
    echo "--- Proxmox Worker (LXC ${CTID}) ---"
    local proxmox_result
    proxmox_result=$(check_proxmox_worker 2>/dev/null) || true
    local proxmox_alive
    proxmox_alive=$(echo "$proxmox_result" | jq -r '.alive' 2>/dev/null || echo "false")
    local proxmox_status
    proxmox_status=$(echo "$proxmox_result" | jq -r '.status' 2>/dev/null || echo "unknown")
    echo "  Alive: ${proxmox_alive}"
    echo "  Status: ${proxmox_status}"

    if [[ "$proxmox_alive" == "true" ]]; then
        local active_app
        active_app=$(echo "$proxmox_result" | jq -r '.data.active_app // "none"' 2>/dev/null || echo "none")
        local disk_pct
        disk_pct=$(echo "$proxmox_result" | jq -r '.data.disk_percent // "?"' 2>/dev/null || echo "?")
        local mem_used
        mem_used=$(echo "$proxmox_result" | jq -r '.data.memory_used_mb // "?"' 2>/dev/null || echo "?")
        local mem_total
        mem_total=$(echo "$proxmox_result" | jq -r '.data.memory_total_mb // "?"' 2>/dev/null || echo "?")
        echo "  Active app: ${active_app}"
        echo "  Disk: ${disk_pct}%"
        echo "  Memory: ${mem_used}MB / ${mem_total}MB"
    fi
    echo ""

    # GitHub Actions
    echo "--- GitHub Actions ---"
    local gh_result
    gh_result=$(check_github_actions 2>/dev/null) || true
    local gh_active
    gh_active=$(echo "$gh_result" | jq -r '.active' 2>/dev/null || echo "false")
    local gh_count
    gh_count=$(echo "$gh_result" | jq -r '.count // 0' 2>/dev/null || echo "0")
    echo "  Active: ${gh_active} (${gh_count} runs)"
    echo ""

    # Work distribution
    echo "--- Work Distribution ---"
    if [[ -f "$WORK_QUEUE" ]]; then
        local generated_at
        generated_at=$(jq -r '.generated_at // "unknown"' "$WORK_QUEUE" 2>/dev/null || echo "unknown")
        echo "  Generated: ${generated_at}"
        for worker in "mac-mini" "proxmox-206" "github-actions"; do
            local count
            count=$(jq -r ".\"${worker}\" | length" "$WORK_QUEUE" 2>/dev/null || echo "0")
            echo "  ${worker}: ${count} apps"
        done
    else
        echo "  No work-queue.json found"
    fi
    echo ""

    # Aggregated totals
    if [[ -f "$COORDINATOR_STATE" ]]; then
        echo "--- Aggregated Totals ---"
        local agg_cycles agg_success agg_rate
        agg_cycles=$(jq -r '.totals.total_cycles // 0' "$COORDINATOR_STATE" 2>/dev/null || echo "0")
        agg_success=$(jq -r '.totals.total_successes // 0' "$COORDINATOR_STATE" 2>/dev/null || echo "0")
        agg_rate=$(jq -r '.totals.success_rate // 0' "$COORDINATOR_STATE" 2>/dev/null || echo "0")
        echo "  Total cycles: ${agg_cycles}"
        echo "  Total successes: ${agg_success}"
        echo "  Success rate: ${agg_rate}%"
        echo ""
    fi

    echo "=============================================="
}

# ---------------------------------------------------------------------------
# Full pre-cycle coordination
# ---------------------------------------------------------------------------
coordinate() {
    log_info "=== Worker Coordination Start ==="

    # Step 1: Check Proxmox worker
    local proxmox_alive="false"
    local proxmox_result
    proxmox_result=$(check_proxmox_worker 2>/dev/null) || true
    proxmox_alive=$(echo "$proxmox_result" | jq -r '.alive' 2>/dev/null || echo "false")

    # Step 2: Check GitHub Actions
    local gh_active="false"
    local gh_result
    gh_result=$(check_github_actions 2>/dev/null) || true
    gh_active=$(echo "$gh_result" | jq -r '.active' 2>/dev/null || echo "false")

    # Step 3: Distribute work
    distribute_work "$proxmox_alive" "$gh_active"

    # Step 4: Aggregate results
    aggregate_results

    log_info "=== Coordination Complete ==="
    log_info "Proxmox: ${proxmox_alive} | GitHub Actions: ${gh_active}"

    # Return Mac Mini's assigned apps
    if [[ -f "$WORK_QUEUE" ]]; then
        local mac_apps
        mac_apps=$(jq -r '."mac-mini" | join(", ")' "$WORK_QUEUE" 2>/dev/null || echo "none")
        log_info "Mac Mini assigned: ${mac_apps}"
    fi
}

# ---------------------------------------------------------------------------
# Full cycle: coordinate then run Mac Mini improvements
# ---------------------------------------------------------------------------
full_cycle() {
    coordinate

    # Now run the Mac Mini's orchestrator for its assigned apps
    if [[ -x "${SCRIPT_DIR}/orchestrator.sh" ]]; then
        log_info "Starting Mac Mini improvement cycle..."
        bash "${SCRIPT_DIR}/orchestrator.sh" 2>&1 | tee -a "$LOG_FILE"
    else
        log_error "orchestrator.sh not found"
    fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    local mode="${1:-coordinate}"

    case "$mode" in
        --status|-s)
            show_status
            ;;
        --aggregate|-a)
            aggregate_results
            ;;
        --full-cycle|-f)
            full_cycle
            ;;
        --help|-h)
            echo "Usage: worker-coordinator.sh [--status|--aggregate|--full-cycle|--help]"
            echo ""
            echo "  (default)       Pre-cycle coordination (check workers, distribute, aggregate)"
            echo "  --status        Show all worker statuses"
            echo "  --aggregate     Aggregate results from all workers"
            echo "  --full-cycle    Coordinate + run Mac Mini improvement cycle"
            ;;
        *)
            coordinate
            ;;
    esac
}

main "$@"
