#!/usr/bin/env bash
# =============================================================================
# Pipeline Watchdog - Health Monitor for Self-Improvement Pipeline
# Runs every 5 minutes via LaunchAgent to ensure 24/7 operation
#
# Checks:
#   1. Is the orchestrator process running?
#   2. Did the last cycle complete within 45 minutes?
#   3. Is the state file being updated?
#   4. Is disk space sufficient (>1GB free)?
#   5. Is Claude CLI responsive?
#
# If checks fail: kill stuck processes, restart, log incident
# If 3+ restarts in 1 hour: enter safe mode (reduced frequency)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Paths
STATE_FILE="${SCRIPT_DIR}/state.json"
LOCK_FILE="${SCRIPT_DIR}/.orchestrator.lock"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/watchdog.log"
HEARTBEAT_FILE="${SCRIPT_DIR}/heartbeat.json"
WATCHDOG_STATE="${SCRIPT_DIR}/.watchdog-state.json"
ORCHESTRATOR_SCRIPT="${SCRIPT_DIR}/orchestrator.sh"

# Thresholds
MAX_CYCLE_AGE_MINUTES=45
MIN_DISK_FREE_GB=1
MAX_RESTARTS_PER_HOUR=3
SAFE_MODE_INTERVAL=3600  # 1 hour between cycles in safe mode

# Track start time for uptime
BOOT_MARKER="${SCRIPT_DIR}/.watchdog-boot"

mkdir -p "${LOG_DIR}"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
    local level="$1"; shift
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    local msg="[${timestamp}] [WATCHDOG] [${level}] $*"
    echo "${msg}" >> "${LOG_FILE}"
    if [[ "${level}" == "CRITICAL" || "${level}" == "ERROR" ]]; then
        echo "${msg}" >&2
    fi
}

log_info()     { log "INFO" "$@"; }
log_warn()     { log "WARN" "$@"; }
log_error()    { log "ERROR" "$@"; }
log_critical() { log "CRITICAL" "$@"; }

# ---------------------------------------------------------------------------
# Watchdog state management
# ---------------------------------------------------------------------------
init_watchdog_state() {
    if [[ ! -f "${WATCHDOG_STATE}" ]]; then
        cat > "${WATCHDOG_STATE}" <<'EOF'
{
  "restarts": [],
  "totalRestarts": 0,
  "safeMode": false,
  "safeModeUntil": null,
  "lastCheck": null,
  "consecutiveFailures": 0
}
EOF
    fi
    if [[ ! -f "${BOOT_MARKER}" ]]; then
        date +%s > "${BOOT_MARKER}"
    fi
}

read_watchdog_state() {
    cat "${WATCHDOG_STATE}" 2>/dev/null || echo '{}'
}

write_watchdog_state() {
    local new_state="$1"
    local tmp="${WATCHDOG_STATE}.tmp"
    echo "${new_state}" | jq '.' > "${tmp}" 2>/dev/null && mv "${tmp}" "${WATCHDOG_STATE}" || rm -f "${tmp}"
}

# Record a restart event, prune events older than 1 hour
record_restart() {
    local now
    now="$(date +%s)"
    local one_hour_ago=$(( now - 3600 ))
    local state
    state="$(read_watchdog_state)"

    local new_state
    new_state="$(echo "${state}" | jq \
        --argjson now "${now}" \
        --argjson cutoff "${one_hour_ago}" '
        .restarts = ([.restarts[] | select(. > $cutoff)] + [$now]) |
        .totalRestarts = (.totalRestarts + 1)
    ')"
    write_watchdog_state "${new_state}"
}

get_restarts_last_hour() {
    local now
    now="$(date +%s)"
    local one_hour_ago=$(( now - 3600 ))
    local state
    state="$(read_watchdog_state)"
    echo "${state}" | jq --argjson cutoff "${one_hour_ago}" '[.restarts[] | select(. > $cutoff)] | length'
}

get_restarts_today() {
    local state
    state="$(read_watchdog_state)"
    # Count restarts from today (since midnight UTC)
    local today_start
    today_start="$(date -u -j -f '%Y-%m-%d %H:%M:%S' "$(date -u '+%Y-%m-%d') 00:00:00" '+%s' 2>/dev/null || date -d "$(date -u '+%Y-%m-%d')" '+%s' 2>/dev/null || echo 0)"
    echo "${state}" | jq --argjson cutoff "${today_start}" '[.restarts[] | select(. > $cutoff)] | length'
}

is_safe_mode() {
    local state
    state="$(read_watchdog_state)"
    local safe_mode
    safe_mode="$(echo "${state}" | jq -r '.safeMode // false')"
    local safe_until
    safe_until="$(echo "${state}" | jq -r '.safeModeUntil // "null"')"

    if [[ "${safe_mode}" == "true" && "${safe_until}" != "null" ]]; then
        local now
        now="$(date +%s)"
        # Parse ISO timestamp
        local safe_ts
        if date -j -f "%Y-%m-%dT%H:%M:%S" "${safe_until%%.*}" "+%s" &>/dev/null 2>&1; then
            safe_ts="$(date -j -f "%Y-%m-%dT%H:%M:%S" "${safe_until%%.*}" "+%s" 2>/dev/null || echo 0)"
        else
            safe_ts="$(date -d "${safe_until}" "+%s" 2>/dev/null || echo 0)"
        fi
        if [[ "${now}" -lt "${safe_ts}" ]]; then
            echo "true"
            return 0
        else
            # Safe mode expired, clear it
            local new_state
            new_state="$(echo "${state}" | jq '.safeMode = false | .safeModeUntil = null')"
            write_watchdog_state "${new_state}"
        fi
    fi
    echo "false"
}

enter_safe_mode() {
    local duration_hours="${1:-6}"
    local state
    state="$(read_watchdog_state)"
    local safe_until
    if date -v+${duration_hours}H '+%Y-%m-%dT%H:%M:%SZ' &>/dev/null 2>&1; then
        safe_until="$(date -u -v+${duration_hours}H '+%Y-%m-%dT%H:%M:%SZ')"
    else
        safe_until="$(date -u -d "+${duration_hours} hours" '+%Y-%m-%dT%H:%M:%SZ')"
    fi
    local new_state
    new_state="$(echo "${state}" | jq --arg until "${safe_until}" '.safeMode = true | .safeModeUntil = $until')"
    write_watchdog_state "${new_state}"
    log_critical "SAFE MODE ACTIVATED until ${safe_until} (${duration_hours}h). Reducing cycle frequency."
}

# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------

# Check 1: Is the orchestrator/meta-agent process alive?
check_process() {
    local status="pass"
    local detail=""

    # Check for orchestrator process
    if pgrep -f "orchestrator.sh" > /dev/null 2>&1; then
        detail="orchestrator.sh is running (PID: $(pgrep -f 'orchestrator.sh' | head -1))"
    elif pgrep -f "meta-agent" > /dev/null 2>&1; then
        detail="meta-agent is running (PID: $(pgrep -f 'meta-agent' | head -1))"
    else
        # Check if a LaunchAgent cycle is expected to be running
        # The orchestrator runs as single cycles via LaunchAgent, so it may not always be running
        # Check if the lock file exists (indicates a stuck process)
        if [[ -f "${LOCK_FILE}" ]]; then
            local lock_pid
            lock_pid="$(cat "${LOCK_FILE}" 2>/dev/null || echo "")"
            if [[ -n "${lock_pid}" ]] && kill -0 "${lock_pid}" 2>/dev/null; then
                detail="orchestrator running with PID ${lock_pid} (from lock file)"
            else
                status="warn"
                detail="stale lock file found (PID: ${lock_pid})"
            fi
        else
            # No process and no lock file - this is normal between cycles
            detail="no active cycle (normal between LaunchAgent intervals)"
        fi
    fi

    echo "${status}|${detail}"
}

# Check 2: Did the last cycle complete within MAX_CYCLE_AGE_MINUTES?
check_last_cycle() {
    local status="pass"
    local detail=""
    local age_minutes=0

    if [[ ! -f "${STATE_FILE}" ]]; then
        status="warn"
        detail="state file does not exist"
        echo "${status}|${detail}|0"
        return
    fi

    local last_run
    last_run="$(jq -r '.last_run // .lastCycle // empty' "${STATE_FILE}" 2>/dev/null || echo "")"

    if [[ -z "${last_run}" || "${last_run}" == "null" ]]; then
        status="warn"
        detail="no cycles recorded yet"
        echo "${status}|${detail}|0"
        return
    fi

    # Parse the timestamp
    local last_ts now
    now="$(date +%s)"

    if date -j -f "%Y-%m-%dT%H:%M:%S" "${last_run%%Z*}" "+%s" &>/dev/null 2>&1; then
        last_ts="$(date -j -f "%Y-%m-%dT%H:%M:%S" "${last_run%%Z*}" "+%s" 2>/dev/null || echo 0)"
    else
        last_ts="$(date -d "${last_run}" "+%s" 2>/dev/null || echo 0)"
    fi

    if [[ "${last_ts}" -eq 0 ]]; then
        status="warn"
        detail="could not parse last_run timestamp: ${last_run}"
        echo "${status}|${detail}|0"
        return
    fi

    age_minutes=$(( (now - last_ts) / 60 ))

    if [[ "${age_minutes}" -gt "${MAX_CYCLE_AGE_MINUTES}" ]]; then
        status="fail"
        detail="last cycle was ${age_minutes} minutes ago (threshold: ${MAX_CYCLE_AGE_MINUTES}m)"
    else
        detail="last cycle ${age_minutes} minutes ago"
    fi

    echo "${status}|${detail}|${age_minutes}"
}

# Check 3: Is the state file being updated?
check_state_file() {
    local status="pass"
    local detail=""

    if [[ ! -f "${STATE_FILE}" ]]; then
        status="fail"
        detail="state file missing"
        echo "${status}|${detail}"
        return
    fi

    # Check mtime - file should have been modified in the last 60 minutes
    local now file_mtime age_minutes
    now="$(date +%s)"

    if stat -f %m "${STATE_FILE}" &>/dev/null 2>&1; then
        # macOS
        file_mtime="$(stat -f %m "${STATE_FILE}")"
    else
        # Linux
        file_mtime="$(stat -c %Y "${STATE_FILE}")"
    fi

    age_minutes=$(( (now - file_mtime) / 60 ))

    if [[ "${age_minutes}" -gt 60 ]]; then
        status="warn"
        detail="state file not modified for ${age_minutes} minutes"
    else
        detail="state file last modified ${age_minutes} minutes ago"
    fi

    # Validate JSON
    if ! jq '.' "${STATE_FILE}" > /dev/null 2>&1; then
        status="fail"
        detail="state file contains invalid JSON"
    fi

    echo "${status}|${detail}"
}

# Check 4: Is disk space sufficient?
check_disk_space() {
    local status="pass"
    local detail=""
    local free_gb=0

    # Get available disk space in GB
    if df -g "${WORKSPACE}" &>/dev/null 2>&1; then
        # macOS: df -g gives output in GB
        free_gb="$(df -g "${WORKSPACE}" | tail -1 | awk '{print $4}')"
    else
        # Linux: df gives KB, convert to GB
        local free_kb
        free_kb="$(df "${WORKSPACE}" | tail -1 | awk '{print $4}')"
        free_gb=$(( free_kb / 1048576 ))
    fi

    if [[ "${free_gb}" -lt "${MIN_DISK_FREE_GB}" ]]; then
        status="fail"
        detail="only ${free_gb}GB free (minimum: ${MIN_DISK_FREE_GB}GB)"
    else
        detail="${free_gb}GB free"
    fi

    echo "${status}|${detail}|${free_gb}"
}

# Check 5: Is Claude CLI responsive?
check_claude_cli() {
    local status="pass"
    local detail=""

    if ! command -v claude &>/dev/null; then
        status="fail"
        detail="claude CLI not found in PATH"
        echo "${status}|${detail}"
        return
    fi

    # Test with a quick version check (timeout 10s)
    local version
    if version="$(timeout 10 claude --version 2>&1)"; then
        detail="claude CLI responsive (${version})"
    else
        status="fail"
        detail="claude CLI unresponsive or timed out"
    fi

    echo "${status}|${detail}"
}

# ---------------------------------------------------------------------------
# Recovery actions
# ---------------------------------------------------------------------------

kill_stuck_processes() {
    log_warn "Killing stuck orchestrator processes..."
    local killed=0

    # Kill any stuck orchestrator
    if pgrep -f "orchestrator.sh" > /dev/null 2>&1; then
        pkill -f "orchestrator.sh" 2>/dev/null || true
        killed=$((killed + 1))
    fi

    # Kill any stuck claude processes (from improve-app.sh)
    if pgrep -f "claude.*--print" > /dev/null 2>&1; then
        pkill -f "claude.*--print" 2>/dev/null || true
        killed=$((killed + 1))
    fi

    # Kill any stuck improve-app processes
    if pgrep -f "improve-app.sh" > /dev/null 2>&1; then
        pkill -f "improve-app.sh" 2>/dev/null || true
        killed=$((killed + 1))
    fi

    # Remove stale lock file
    if [[ -f "${LOCK_FILE}" ]]; then
        rm -f "${LOCK_FILE}"
        log_info "Removed stale lock file"
    fi

    log_info "Killed ${killed} stuck process group(s)"
    return ${killed}
}

restart_orchestrator() {
    log_info "Restarting orchestrator..."

    # Kill any existing processes first
    kill_stuck_processes

    # Small delay to let processes clean up
    sleep 2

    # Check if in safe mode - if so, don't restart (wait for the extended interval)
    if [[ "$(is_safe_mode)" == "true" ]]; then
        log_warn "In safe mode - skipping immediate restart"
        return 0
    fi

    # Trigger the orchestrator via launchctl if possible
    if launchctl list | grep -q "com.self-improve-portfolio" 2>/dev/null; then
        # Kick the LaunchAgent
        launchctl kickstart "gui/$(id -u)/com.self-improve-portfolio" 2>/dev/null || true
        log_info "Kicked LaunchAgent com.self-improve-portfolio"
    else
        # Run orchestrator directly in background
        nohup /bin/bash "${ORCHESTRATOR_SCRIPT}" >> "${LOG_DIR}/orchestrator-restart.log" 2>&1 &
        log_info "Started orchestrator directly (PID: $!)"
    fi

    record_restart
    log_info "Orchestrator restart initiated"
}

# ---------------------------------------------------------------------------
# Get memory usage
# ---------------------------------------------------------------------------
get_memory_usage_mb() {
    # Get RSS of all pipeline-related processes in MB
    local total_kb=0
    local pids
    pids="$(pgrep -f 'orchestrator.sh|improve-app.sh|claude.*--print|meta-agent' 2>/dev/null || echo "")"
    if [[ -n "${pids}" ]]; then
        for pid in ${pids}; do
            local rss
            rss="$(ps -o rss= -p "${pid}" 2>/dev/null | tr -d ' ' || echo 0)"
            total_kb=$((total_kb + rss))
        done
    fi
    echo $(( total_kb / 1024 ))
}

# ---------------------------------------------------------------------------
# Generate heartbeat
# ---------------------------------------------------------------------------
generate_heartbeat() {
    local overall_status="$1"
    local cycle_age="$2"
    local disk_free_gb="$3"

    local now
    now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    # Calculate uptime
    local boot_time uptime_hours
    boot_time="$(cat "${BOOT_MARKER}" 2>/dev/null || date +%s)"
    uptime_hours=$(( ($(date +%s) - boot_time) / 3600 ))

    local restarts_today
    restarts_today="$(get_restarts_today)"

    local mem_usage
    mem_usage="$(get_memory_usage_mb)"

    cat > "${HEARTBEAT_FILE}" <<HEARTBEAT
{
  "timestamp": "${now}",
  "status": "${overall_status}",
  "lastCycleAge": ${cycle_age},
  "uptimeHours": ${uptime_hours},
  "restartsToday": ${restarts_today},
  "diskFreeGB": ${disk_free_gb},
  "memUsageMB": ${mem_usage}
}
HEARTBEAT

    log_info "Heartbeat: status=${overall_status} cycleAge=${cycle_age}m uptime=${uptime_hours}h restarts=${restarts_today} disk=${disk_free_gb}GB mem=${mem_usage}MB"
}

# ---------------------------------------------------------------------------
# Main watchdog loop
# ---------------------------------------------------------------------------
main() {
    init_watchdog_state

    log_info "=== Watchdog check starting ==="

    local overall_status="healthy"
    local any_fail=false
    local any_warn=false

    # Run all health checks
    local process_result cycle_result state_result disk_result cli_result
    process_result="$(check_process)"
    cycle_result="$(check_last_cycle)"
    state_result="$(check_state_file)"
    disk_result="$(check_disk_space)"
    cli_result="$(check_claude_cli)"

    # Parse results
    local process_status process_detail
    IFS='|' read -r process_status process_detail <<< "${process_result}"

    local cycle_status cycle_detail cycle_age
    IFS='|' read -r cycle_status cycle_detail cycle_age <<< "${cycle_result}"
    cycle_age="${cycle_age:-0}"

    local state_status state_detail
    IFS='|' read -r state_status state_detail <<< "${state_result}"

    local disk_status disk_detail disk_free_gb
    IFS='|' read -r disk_status disk_detail disk_free_gb <<< "${disk_result}"
    disk_free_gb="${disk_free_gb:-0}"

    local cli_status cli_detail
    IFS='|' read -r cli_status cli_detail <<< "${cli_result}"

    # Log all check results
    log_info "Process:    [${process_status}] ${process_detail}"
    log_info "LastCycle:  [${cycle_status}] ${cycle_detail}"
    log_info "StateFile:  [${state_status}] ${state_detail}"
    log_info "DiskSpace:  [${disk_status}] ${disk_detail}"
    log_info "ClaudeCLI:  [${cli_status}] ${cli_detail}"

    # Determine overall status
    for check_status in "${process_status}" "${cycle_status}" "${state_status}" "${disk_status}" "${cli_status}"; do
        if [[ "${check_status}" == "fail" ]]; then
            any_fail=true
        elif [[ "${check_status}" == "warn" ]]; then
            any_warn=true
        fi
    done

    if [[ "${any_fail}" == "true" ]]; then
        overall_status="critical"
    elif [[ "${any_warn}" == "true" ]]; then
        overall_status="degraded"
    fi

    # Take action on failures
    if [[ "${any_fail}" == "true" ]]; then
        log_error "Health check FAILED - initiating recovery"

        # Increment consecutive failures
        local wd_state
        wd_state="$(read_watchdog_state)"
        local consec
        consec="$(echo "${wd_state}" | jq '.consecutiveFailures // 0')"
        consec=$((consec + 1))
        wd_state="$(echo "${wd_state}" | jq --argjson c "${consec}" '.consecutiveFailures = $c')"
        write_watchdog_state "${wd_state}"

        # Kill stuck processes
        kill_stuck_processes

        # Check restart frequency
        local restarts_last_hour
        restarts_last_hour="$(get_restarts_last_hour)"

        if [[ "${restarts_last_hour}" -ge "${MAX_RESTARTS_PER_HOUR}" ]]; then
            log_critical "${restarts_last_hour} restarts in the last hour (max: ${MAX_RESTARTS_PER_HOUR})"
            if [[ "$(is_safe_mode)" != "true" ]]; then
                enter_safe_mode 6
                overall_status="critical"
            fi
        else
            # Restart the orchestrator
            restart_orchestrator
        fi
    else
        # Reset consecutive failures on success
        local wd_state
        wd_state="$(read_watchdog_state)"
        wd_state="$(echo "${wd_state}" | jq '.consecutiveFailures = 0')"
        write_watchdog_state "${wd_state}"
    fi

    # Update last check timestamp
    local wd_state
    wd_state="$(read_watchdog_state)"
    local now_iso
    now_iso="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    wd_state="$(echo "${wd_state}" | jq --arg t "${now_iso}" '.lastCheck = $t')"
    write_watchdog_state "${wd_state}"

    # Generate heartbeat
    generate_heartbeat "${overall_status}" "${cycle_age}" "${disk_free_gb}"

    log_info "=== Watchdog check complete: ${overall_status} ==="
}

main "$@"
