#!/usr/bin/env bash
# =============================================================================
# Emergency Recovery Script for Self-Improvement Pipeline
#
# Performs a full reset and recovery:
#   1. Kill all stuck improvement processes
#   2. Reset state.json cooldowns
#   3. Clear lock files
#   4. Restart all LaunchAgents
#   5. Run a test cycle to verify
#   6. Report status
#
# Usage:
#   ./recover.sh              # Full recovery
#   ./recover.sh --dry-run    # Show what would be done
#   ./recover.sh --status     # Show current health status
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Paths
STATE_FILE="${SCRIPT_DIR}/state.json"
LOCK_FILE="${SCRIPT_DIR}/.orchestrator.lock"
WATCHDOG_STATE="${SCRIPT_DIR}/.watchdog-state.json"
HEARTBEAT_FILE="${SCRIPT_DIR}/heartbeat.json"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/recovery.log"

# LaunchAgent identifiers
LAUNCH_AGENTS=(
    "com.self-improve-portfolio"
    "com.pipeline-watchdog"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DRY_RUN=false

mkdir -p "${LOG_DIR}"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
    local level="$1"; shift
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    local msg="[${timestamp}] [RECOVERY] [${level}] $*"
    echo "${msg}" >> "${LOG_FILE}"
}

print_step() {
    local step="$1"; shift
    echo -e "${CYAN}[Step ${step}]${NC} $*"
    log "INFO" "Step ${step}: $*"
}

print_ok() {
    echo -e "  ${GREEN}OK${NC} $*"
    log "INFO" "$*"
}

print_warn() {
    echo -e "  ${YELLOW}WARN${NC} $*"
    log "WARN" "$*"
}

print_fail() {
    echo -e "  ${RED}FAIL${NC} $*"
    log "ERROR" "$*"
}

print_info() {
    echo -e "  ${BLUE}INFO${NC} $*"
}

# ---------------------------------------------------------------------------
# Status command
# ---------------------------------------------------------------------------
show_status() {
    echo ""
    echo "=========================================="
    echo "  Pipeline Health Status"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    echo ""

    # Process status
    echo -e "${CYAN}Processes:${NC}"
    local orch_pids
    orch_pids="$(pgrep -f 'orchestrator.sh' 2>/dev/null || echo '')"
    if [[ -n "${orch_pids}" ]]; then
        echo -e "  ${GREEN}orchestrator.sh${NC}: running (PIDs: ${orch_pids})"
    else
        echo -e "  ${YELLOW}orchestrator.sh${NC}: not running"
    fi

    local claude_pids
    claude_pids="$(pgrep -f 'claude.*--print' 2>/dev/null || echo '')"
    if [[ -n "${claude_pids}" ]]; then
        echo -e "  ${GREEN}claude (analysis)${NC}: running (PIDs: ${claude_pids})"
    else
        echo -e "  claude (analysis): not running"
    fi

    local improve_pids
    improve_pids="$(pgrep -f 'improve-app.sh' 2>/dev/null || echo '')"
    if [[ -n "${improve_pids}" ]]; then
        echo -e "  ${GREEN}improve-app.sh${NC}: running (PIDs: ${improve_pids})"
    else
        echo -e "  improve-app.sh: not running"
    fi
    echo ""

    # Lock file
    echo -e "${CYAN}Lock File:${NC}"
    if [[ -f "${LOCK_FILE}" ]]; then
        local lock_pid
        lock_pid="$(cat "${LOCK_FILE}" 2>/dev/null || echo 'unreadable')"
        if kill -0 "${lock_pid}" 2>/dev/null; then
            echo -e "  ${GREEN}Present${NC} - PID ${lock_pid} is alive"
        else
            echo -e "  ${RED}STALE${NC} - PID ${lock_pid} is dead"
        fi
    else
        echo -e "  Not present (clean)"
    fi
    echo ""

    # State file
    echo -e "${CYAN}State File:${NC}"
    if [[ -f "${STATE_FILE}" ]]; then
        if jq '.' "${STATE_FILE}" > /dev/null 2>&1; then
            local total_cycles last_run successes failures
            total_cycles="$(jq -r '.total_cycles // .totalCycles // 0' "${STATE_FILE}")"
            last_run="$(jq -r '.last_run // .lastCycle // "never"' "${STATE_FILE}")"
            successes="$(jq -r '.total_successes // .totalSuccess // 0' "${STATE_FILE}")"
            failures="$(jq -r '.total_failures // .totalFailure // 0' "${STATE_FILE}")"
            echo -e "  ${GREEN}Valid JSON${NC}"
            echo "  Total cycles: ${total_cycles}"
            echo "  Successes: ${successes}, Failures: ${failures}"
            echo "  Last run: ${last_run}"

            # Check for apps in cooldown
            local cooldown_apps
            cooldown_apps="$(jq -r '.apps // {} | to_entries[] | select(.value.cooldownUntil != null and .value.cooldownUntil != "null") | .key' "${STATE_FILE}" 2>/dev/null || echo '')"
            if [[ -n "${cooldown_apps}" ]]; then
                echo -e "  ${YELLOW}Apps in cooldown:${NC} ${cooldown_apps}"
            fi
        else
            echo -e "  ${RED}INVALID JSON${NC}"
        fi
    else
        echo -e "  ${RED}Missing${NC}"
    fi
    echo ""

    # Heartbeat
    echo -e "${CYAN}Heartbeat:${NC}"
    if [[ -f "${HEARTBEAT_FILE}" ]]; then
        local hb_status hb_age hb_restarts hb_disk
        hb_status="$(jq -r '.status // "unknown"' "${HEARTBEAT_FILE}" 2>/dev/null || echo 'unreadable')"
        hb_age="$(jq -r '.lastCycleAge // -1' "${HEARTBEAT_FILE}" 2>/dev/null || echo -1)"
        hb_restarts="$(jq -r '.restartsToday // 0' "${HEARTBEAT_FILE}" 2>/dev/null || echo 0)"
        hb_disk="$(jq -r '.diskFreeGB // 0' "${HEARTBEAT_FILE}" 2>/dev/null || echo 0)"
        case "${hb_status}" in
            healthy)  echo -e "  Status: ${GREEN}${hb_status}${NC}" ;;
            degraded) echo -e "  Status: ${YELLOW}${hb_status}${NC}" ;;
            *)        echo -e "  Status: ${RED}${hb_status}${NC}" ;;
        esac
        echo "  Last cycle age: ${hb_age} minutes"
        echo "  Restarts today: ${hb_restarts}"
        echo "  Disk free: ${hb_disk} GB"
    else
        echo -e "  ${YELLOW}No heartbeat file${NC}"
    fi
    echo ""

    # Watchdog state
    echo -e "${CYAN}Watchdog:${NC}"
    if [[ -f "${WATCHDOG_STATE}" ]]; then
        local safe_mode consec_fails total_restarts
        safe_mode="$(jq -r '.safeMode // false' "${WATCHDOG_STATE}" 2>/dev/null || echo 'unknown')"
        consec_fails="$(jq -r '.consecutiveFailures // 0' "${WATCHDOG_STATE}" 2>/dev/null || echo 0)"
        total_restarts="$(jq -r '.totalRestarts // 0' "${WATCHDOG_STATE}" 2>/dev/null || echo 0)"
        if [[ "${safe_mode}" == "true" ]]; then
            local safe_until
            safe_until="$(jq -r '.safeModeUntil // "unknown"' "${WATCHDOG_STATE}" 2>/dev/null)"
            echo -e "  ${RED}SAFE MODE${NC} until ${safe_until}"
        else
            echo -e "  Safe mode: ${GREEN}off${NC}"
        fi
        echo "  Consecutive failures: ${consec_fails}"
        echo "  Total restarts: ${total_restarts}"
    else
        echo "  No watchdog state"
    fi
    echo ""

    # LaunchAgents
    echo -e "${CYAN}LaunchAgents:${NC}"
    for agent in "${LAUNCH_AGENTS[@]}"; do
        if launchctl list 2>/dev/null | grep -q "${agent}"; then
            echo -e "  ${GREEN}${agent}${NC}: loaded"
        else
            echo -e "  ${YELLOW}${agent}${NC}: not loaded"
        fi
    done
    echo ""
    echo "=========================================="
}

# ---------------------------------------------------------------------------
# Step 1: Kill all stuck processes
# ---------------------------------------------------------------------------
step_kill_processes() {
    print_step 1 "Killing stuck improvement processes"

    local killed=0

    # Kill orchestrator
    local orch_pids
    orch_pids="$(pgrep -f 'orchestrator.sh' 2>/dev/null || echo '')"
    if [[ -n "${orch_pids}" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would kill orchestrator.sh (PIDs: ${orch_pids})"
        else
            kill ${orch_pids} 2>/dev/null || true
            sleep 1
            # Force kill if still alive
            kill -9 ${orch_pids} 2>/dev/null || true
            print_ok "Killed orchestrator.sh (PIDs: ${orch_pids})"
            killed=$((killed + 1))
        fi
    else
        print_info "No orchestrator.sh processes running"
    fi

    # Kill claude analysis processes
    local claude_pids
    claude_pids="$(pgrep -f 'claude.*--print' 2>/dev/null || echo '')"
    if [[ -n "${claude_pids}" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would kill claude processes (PIDs: ${claude_pids})"
        else
            kill ${claude_pids} 2>/dev/null || true
            sleep 1
            kill -9 ${claude_pids} 2>/dev/null || true
            print_ok "Killed claude processes (PIDs: ${claude_pids})"
            killed=$((killed + 1))
        fi
    else
        print_info "No stuck claude processes"
    fi

    # Kill improve-app
    local improve_pids
    improve_pids="$(pgrep -f 'improve-app.sh' 2>/dev/null || echo '')"
    if [[ -n "${improve_pids}" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would kill improve-app.sh (PIDs: ${improve_pids})"
        else
            kill ${improve_pids} 2>/dev/null || true
            sleep 1
            kill -9 ${improve_pids} 2>/dev/null || true
            print_ok "Killed improve-app.sh (PIDs: ${improve_pids})"
            killed=$((killed + 1))
        fi
    else
        print_info "No stuck improve-app.sh processes"
    fi

    # Kill meta-agent if present
    local meta_pids
    meta_pids="$(pgrep -f 'meta-agent' 2>/dev/null || echo '')"
    if [[ -n "${meta_pids}" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would kill meta-agent (PIDs: ${meta_pids})"
        else
            kill ${meta_pids} 2>/dev/null || true
            sleep 1
            kill -9 ${meta_pids} 2>/dev/null || true
            print_ok "Killed meta-agent (PIDs: ${meta_pids})"
            killed=$((killed + 1))
        fi
    fi

    echo "  Killed ${killed} process group(s)"
}

# ---------------------------------------------------------------------------
# Step 2: Reset state.json cooldowns
# ---------------------------------------------------------------------------
step_reset_cooldowns() {
    print_step 2 "Resetting state.json cooldowns"

    if [[ ! -f "${STATE_FILE}" ]]; then
        print_warn "State file does not exist. Skipping."
        return
    fi

    if ! jq '.' "${STATE_FILE}" > /dev/null 2>&1; then
        print_warn "State file has invalid JSON. Backing up and reinitializing."
        if [[ "${DRY_RUN}" != "true" ]]; then
            cp "${STATE_FILE}" "${STATE_FILE}.bak.$(date +%s)"
            cat > "${STATE_FILE}" <<'EOF'
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
EOF
            print_ok "State file reinitialized (backup saved)"
        else
            print_info "Would reinitialize state file"
        fi
        return
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
        print_info "Would reset all app cooldowns and consecutive failure counters"
    else
        # Reset cooldowns and failure counters for all apps
        local new_state
        new_state="$(jq '
            .apps = (.apps // {} | to_entries | map(
                .value.cooldownUntil = null |
                .value.consecutiveFailures = 0 |
                .value.last_fail_cycle = null
            ) | from_entries)
        ' "${STATE_FILE}")"
        echo "${new_state}" | jq '.' > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "${STATE_FILE}"
        print_ok "All cooldowns and failure counters reset"
    fi

    # Also reset watchdog safe mode
    if [[ -f "${WATCHDOG_STATE}" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would reset watchdog safe mode"
        else
            local wd_state
            wd_state="$(jq '.safeMode = false | .safeModeUntil = null | .consecutiveFailures = 0' "${WATCHDOG_STATE}")"
            echo "${wd_state}" | jq '.' > "${WATCHDOG_STATE}.tmp" && mv "${WATCHDOG_STATE}.tmp" "${WATCHDOG_STATE}"
            print_ok "Watchdog safe mode cleared"
        fi
    fi
}

# ---------------------------------------------------------------------------
# Step 3: Clear lock files
# ---------------------------------------------------------------------------
step_clear_locks() {
    print_step 3 "Clearing lock files"

    local cleared=0

    if [[ -f "${LOCK_FILE}" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would remove ${LOCK_FILE}"
        else
            rm -f "${LOCK_FILE}"
            print_ok "Removed orchestrator lock file"
            cleared=$((cleared + 1))
        fi
    else
        print_info "No orchestrator lock file"
    fi

    # Clear any other stale .lock or .pid files
    local lock_files
    lock_files="$(find "${SCRIPT_DIR}" -maxdepth 1 -name '*.lock' -o -name '*.pid' 2>/dev/null || echo '')"
    if [[ -n "${lock_files}" ]]; then
        while IFS= read -r f; do
            [[ -z "${f}" ]] && continue
            if [[ "${DRY_RUN}" == "true" ]]; then
                print_info "Would remove ${f}"
            else
                rm -f "${f}"
                print_ok "Removed $(basename "${f}")"
                cleared=$((cleared + 1))
            fi
        done <<< "${lock_files}"
    fi

    echo "  Cleared ${cleared} lock/pid file(s)"
}

# ---------------------------------------------------------------------------
# Step 4: Restart all LaunchAgents
# ---------------------------------------------------------------------------
step_restart_agents() {
    print_step 4 "Restarting LaunchAgents"

    local uid
    uid="$(id -u)"

    for agent in "${LAUNCH_AGENTS[@]}"; do
        local plist_file="${SCRIPT_DIR}/${agent}.plist"

        if [[ ! -f "${plist_file}" ]]; then
            print_warn "Plist not found: ${plist_file}"
            continue
        fi

        if [[ "${DRY_RUN}" == "true" ]]; then
            print_info "Would restart ${agent}"
            continue
        fi

        # Unload if loaded
        if launchctl list 2>/dev/null | grep -q "${agent}"; then
            launchctl bootout "gui/${uid}/${agent}" 2>/dev/null || \
            launchctl unload "${plist_file}" 2>/dev/null || true
            print_info "Unloaded ${agent}"
        fi

        sleep 1

        # Load
        launchctl bootstrap "gui/${uid}" "${plist_file}" 2>/dev/null || \
        launchctl load "${plist_file}" 2>/dev/null || {
            print_fail "Failed to load ${agent}"
            continue
        }

        print_ok "Loaded ${agent}"
    done
}

# ---------------------------------------------------------------------------
# Step 5: Run a test cycle
# ---------------------------------------------------------------------------
step_test_cycle() {
    print_step 5 "Running test cycle to verify pipeline"

    if [[ "${DRY_RUN}" == "true" ]]; then
        print_info "Would run: ${SCRIPT_DIR}/orchestrator.sh"
        return
    fi

    if [[ ! -x "${SCRIPT_DIR}/orchestrator.sh" ]]; then
        print_warn "orchestrator.sh not executable. Fixing..."
        chmod +x "${SCRIPT_DIR}/orchestrator.sh"
    fi

    echo "  Running orchestrator (this may take a few minutes)..."
    local exit_code=0
    timeout 120 /bin/bash "${SCRIPT_DIR}/orchestrator.sh" >> "${LOG_FILE}" 2>&1 || exit_code=$?

    if [[ "${exit_code}" -eq 0 ]]; then
        print_ok "Test cycle completed successfully"
    elif [[ "${exit_code}" -eq 124 ]]; then
        print_warn "Test cycle timed out after 120 seconds (may still be OK)"
    else
        print_fail "Test cycle exited with code ${exit_code}"
    fi
}

# ---------------------------------------------------------------------------
# Step 6: Report status
# ---------------------------------------------------------------------------
step_report() {
    print_step 6 "Final status report"

    echo ""
    echo "=========================================="
    echo "  Recovery Complete"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="

    # Process check
    if pgrep -f 'orchestrator.sh' > /dev/null 2>&1; then
        echo -e "  Orchestrator:  ${GREEN}running${NC}"
    else
        echo -e "  Orchestrator:  ${YELLOW}idle${NC} (normal between cycles)"
    fi

    # Lock file
    if [[ -f "${LOCK_FILE}" ]]; then
        echo -e "  Lock file:     ${YELLOW}present${NC}"
    else
        echo -e "  Lock file:     ${GREEN}clean${NC}"
    fi

    # State file
    if [[ -f "${STATE_FILE}" ]] && jq '.' "${STATE_FILE}" > /dev/null 2>&1; then
        echo -e "  State file:    ${GREEN}valid${NC}"
    else
        echo -e "  State file:    ${RED}invalid${NC}"
    fi

    # Watchdog
    if [[ -f "${WATCHDOG_STATE}" ]]; then
        local safe
        safe="$(jq -r '.safeMode // false' "${WATCHDOG_STATE}" 2>/dev/null)"
        if [[ "${safe}" == "true" ]]; then
            echo -e "  Safe mode:     ${RED}active${NC}"
        else
            echo -e "  Safe mode:     ${GREEN}off${NC}"
        fi
    fi

    # LaunchAgents
    for agent in "${LAUNCH_AGENTS[@]}"; do
        if launchctl list 2>/dev/null | grep -q "${agent}"; then
            echo -e "  ${agent}: ${GREEN}loaded${NC}"
        else
            echo -e "  ${agent}: ${RED}not loaded${NC}"
        fi
    done

    echo "=========================================="
    echo ""
    echo "Recovery log: ${LOG_FILE}"
    echo ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    local mode="${1:-recover}"

    case "${mode}" in
        --dry-run|-n)
            DRY_RUN=true
            echo -e "${YELLOW}=== DRY RUN MODE (no changes will be made) ===${NC}"
            echo ""
            ;;
        --status|-s)
            show_status
            exit 0
            ;;
        --help|-h)
            cat <<EOF
Usage: $(basename "$0") [option]

Emergency recovery for the self-improvement pipeline.

Options:
  (none)         Full recovery: kill, reset, clear, restart, test
  --dry-run, -n  Show what would be done without making changes
  --status, -s   Show current pipeline health status
  --help, -h     Show this help message

Recovery steps:
  1. Kill all stuck improvement processes
  2. Reset state.json cooldowns and failure counters
  3. Clear lock files
  4. Restart all LaunchAgents
  5. Run a test cycle to verify
  6. Report final status
EOF
            exit 0
            ;;
    esac

    echo ""
    echo "=========================================="
    echo "  Emergency Pipeline Recovery"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    echo ""

    log "INFO" "=== Recovery started ==="

    step_kill_processes
    echo ""
    step_reset_cooldowns
    echo ""
    step_clear_locks
    echo ""
    step_restart_agents
    echo ""

    if [[ "${DRY_RUN}" != "true" ]]; then
        step_test_cycle
        echo ""
    fi

    step_report

    log "INFO" "=== Recovery complete ==="
}

main "$@"
