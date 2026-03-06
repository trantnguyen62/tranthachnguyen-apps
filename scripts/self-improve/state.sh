#!/usr/bin/env bash
# state.sh - Persistent state manager for the self-improvement pipeline
# Manages state.json with counters, cooldowns, and app tracking
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${SCRIPT_DIR}/state.json"
COOLDOWN_MINUTES="${COOLDOWN_MINUTES:-60}"

# Initialize state file if missing
init_state() {
    if [[ ! -f "${STATE_FILE}" ]]; then
        cat > "${STATE_FILE}" <<'INIT'
{
  "totalCycles": 0,
  "totalSuccess": 0,
  "totalFailure": 0,
  "lastCycle": null,
  "apps": {},
  "typeRotation": {
    "currentIndex": 0,
    "lastUsed": {}
  }
}
INIT
        echo "Initialized state at ${STATE_FILE}"
    fi
}

# Ensure jq is available
require_jq() {
    if ! command -v jq &>/dev/null; then
        echo "Error: jq is required but not installed" >&2
        exit 1
    fi
}

# Read state file
read_state() {
    init_state
    cat "${STATE_FILE}"
}

# Write state file atomically
write_state() {
    local new_state="$1"
    local tmp="${STATE_FILE}.tmp"
    echo "${new_state}" | jq '.' > "${tmp}" 2>/dev/null
    if [[ $? -eq 0 ]]; then
        mv "${tmp}" "${STATE_FILE}"
    else
        rm -f "${tmp}"
        echo "Error: Invalid JSON, state not updated" >&2
        return 1
    fi
}

# --- Commands ---

# Get a value by dot-notation key (e.g., "apps.cloudify.totalImprovements")
cmd_get() {
    local key="$1"
    local state
    state="$(read_state)"

    # Convert dot notation to jq path
    local jq_path
    jq_path="$(echo "${key}" | sed 's/\././g')"
    echo "${state}" | jq -r ".${jq_path} // empty"
}

# Set a value by dot-notation key
cmd_set() {
    local key="$1"
    local value="$2"
    local state
    state="$(read_state)"

    local jq_path
    jq_path=".${key}"

    # Detect value type for proper JSON encoding
    local new_state
    if [[ "${value}" == "null" || "${value}" == "true" || "${value}" == "false" ]]; then
        new_state="$(echo "${state}" | jq "${jq_path} = ${value}")"
    elif [[ "${value}" =~ ^-?[0-9]+$ ]]; then
        new_state="$(echo "${state}" | jq "${jq_path} = ${value}")"
    elif [[ "${value}" =~ ^-?[0-9]+\.[0-9]+$ ]]; then
        new_state="$(echo "${state}" | jq "${jq_path} = ${value}")"
    else
        new_state="$(echo "${state}" | jq --arg v "${value}" "${jq_path} = \$v")"
    fi

    write_state "${new_state}"
    echo "Set ${key} = ${value}"
}

# Increment a numeric counter
cmd_increment() {
    local key="$1"
    local state
    state="$(read_state)"

    local jq_path=".${key}"
    local current
    current="$(echo "${state}" | jq -r "${jq_path} // 0")"

    if ! [[ "${current}" =~ ^-?[0-9]+$ ]]; then
        echo "Error: ${key} is not a number (current value: ${current})" >&2
        return 1
    fi

    local new_val=$((current + 1))
    local new_state
    new_state="$(echo "${state}" | jq "${jq_path} = ${new_val}")"
    write_state "${new_state}"
    echo "${key}: ${current} -> ${new_val}"
}

# Get last improvement time for an app
cmd_last_improvement() {
    local app="$1"
    local state
    state="$(read_state)"

    local last
    last="$(echo "${state}" | jq -r ".apps.\"${app}\".lastImprovement // empty")"

    if [[ -z "${last}" || "${last}" == "null" ]]; then
        echo "No improvements recorded for ${app}"
        return 0
    fi

    echo "Last improvement for ${app}: ${last}"

    # Show type if available
    local last_type
    last_type="$(echo "${state}" | jq -r ".apps.\"${app}\".lastType // empty")"
    if [[ -n "${last_type}" && "${last_type}" != "null" ]]; then
        echo "Type: ${last_type}"
    fi

    # Show total
    local total
    total="$(echo "${state}" | jq -r ".apps.\"${app}\".totalImprovements // 0")"
    echo "Total improvements: ${total}"
}

# Check if an app is in cooldown
cmd_cooldown() {
    local app="$1"
    local state
    state="$(read_state)"

    local cooldown_until
    cooldown_until="$(echo "${state}" | jq -r ".apps.\"${app}\".cooldownUntil // empty")"

    if [[ -z "${cooldown_until}" || "${cooldown_until}" == "null" ]]; then
        echo "No cooldown set for ${app}"
        echo "READY"
        return 0
    fi

    local now cooldown_ts
    now="$(date +%s)"

    # Parse ISO timestamp to epoch
    if date -j -f "%Y-%m-%dT%H:%M:%S" "${cooldown_until%%.*}" "+%s" &>/dev/null 2>&1; then
        # macOS date
        cooldown_ts="$(date -j -f "%Y-%m-%dT%H:%M:%S" "${cooldown_until%%.*}" "+%s" 2>/dev/null || echo 0)"
    else
        # GNU date
        cooldown_ts="$(date -d "${cooldown_until}" "+%s" 2>/dev/null || echo 0)"
    fi

    if [[ "${now}" -ge "${cooldown_ts}" ]]; then
        echo "Cooldown expired for ${app}"
        # Clear the cooldown
        local new_state
        new_state="$(echo "${state}" | jq ".apps.\"${app}\".cooldownUntil = null")"
        write_state "${new_state}"
        echo "READY"
        return 0
    fi

    local remaining=$(( cooldown_ts - now ))
    local mins=$(( remaining / 60 ))
    local secs=$(( remaining % 60 ))
    echo "App ${app} is in cooldown until ${cooldown_until}"
    echo "Time remaining: ${mins}m ${secs}s"
    echo "COOLDOWN"
    return 1
}

# Initialize an app entry if it doesn't exist
cmd_init_app() {
    local app="$1"
    local state
    state="$(read_state)"

    local exists
    exists="$(echo "${state}" | jq -r ".apps.\"${app}\" // empty")"

    if [[ -n "${exists}" && "${exists}" != "null" ]]; then
        echo "App ${app} already initialized"
        return 0
    fi

    local new_state
    new_state="$(echo "${state}" | jq --arg app "${app}" '.apps[$app] = {
        "lastImprovement": null,
        "lastType": null,
        "totalImprovements": 0,
        "consecutiveFailures": 0,
        "cooldownUntil": null
    }')"
    write_state "${new_state}"
    echo "Initialized app: ${app}"
}

# Record a successful improvement
cmd_record_success() {
    local app="$1"
    local improvement_type="${2:-unknown}"
    local state
    state="$(read_state)"

    local now
    now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    # Ensure app exists
    local exists
    exists="$(echo "${state}" | jq -r ".apps.\"${app}\" // empty")"
    if [[ -z "${exists}" || "${exists}" == "null" ]]; then
        cmd_init_app "${app}"
        state="$(read_state)"
    fi

    local new_state
    new_state="$(echo "${state}" | jq \
        --arg app "${app}" \
        --arg now "${now}" \
        --arg type "${improvement_type}" '
        .totalCycles += 1 |
        .totalSuccess += 1 |
        .lastCycle = $now |
        .apps[$app].lastImprovement = $now |
        .apps[$app].lastType = $type |
        .apps[$app].totalImprovements += 1 |
        .apps[$app].consecutiveFailures = 0
    ')"
    write_state "${new_state}"
    echo "Recorded success for ${app} (type: ${improvement_type})"
}

# Record a failed improvement
cmd_record_failure() {
    local app="$1"
    local state
    state="$(read_state)"

    local now
    now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    # Ensure app exists
    local exists
    exists="$(echo "${state}" | jq -r ".apps.\"${app}\" // empty")"
    if [[ -z "${exists}" || "${exists}" == "null" ]]; then
        cmd_init_app "${app}"
        state="$(read_state)"
    fi

    # Get current consecutive failures
    local failures
    failures="$(echo "${state}" | jq -r ".apps.\"${app}\".consecutiveFailures // 0")"
    failures=$((failures + 1))

    # Set cooldown if 3+ consecutive failures (exponential backoff)
    local cooldown_until="null"
    if [[ "${failures}" -ge 3 ]]; then
        local cooldown_mins=$(( COOLDOWN_MINUTES * (failures - 2) ))
        if date -v+${cooldown_mins}M '+%Y-%m-%dT%H:%M:%SZ' &>/dev/null 2>&1; then
            # macOS
            cooldown_until="\"$(date -u -v+${cooldown_mins}M '+%Y-%m-%dT%H:%M:%SZ')\""
        else
            # GNU
            cooldown_until="\"$(date -u -d "+${cooldown_mins} minutes" '+%Y-%m-%dT%H:%M:%SZ')\""
        fi
        echo "Warning: ${failures} consecutive failures for ${app}, cooldown set for ${cooldown_mins} minutes"
    fi

    local new_state
    new_state="$(echo "${state}" | jq \
        --arg app "${app}" \
        --arg now "${now}" \
        --argjson failures "${failures}" \
        --argjson cooldown "${cooldown_until}" '
        .totalCycles += 1 |
        .totalFailure += 1 |
        .lastCycle = $now |
        .apps[$app].consecutiveFailures = $failures |
        .apps[$app].cooldownUntil = $cooldown
    ')"
    write_state "${new_state}"
    echo "Recorded failure #${failures} for ${app}"
}

# Show overall statistics
cmd_stats() {
    local state
    state="$(read_state)"

    echo "=== Self-Improvement Pipeline State ==="
    echo ""
    echo "--- Global ---"
    echo "Total cycles:    $(echo "${state}" | jq -r '.totalCycles // 0')"
    echo "Total success:   $(echo "${state}" | jq -r '.totalSuccess // 0')"
    echo "Total failure:   $(echo "${state}" | jq -r '.totalFailure // 0')"

    local total success
    total="$(echo "${state}" | jq -r '.totalCycles // 0')"
    success="$(echo "${state}" | jq -r '.totalSuccess // 0')"
    if [[ "${total}" =~ ^[0-9]+$ && "${total}" -gt 0 ]]; then
        local rate
        rate="$(echo "scale=1; ${success} * 100 / ${total}" | bc 2>/dev/null || echo "N/A")"
        echo "Success rate:    ${rate}%"
    fi

    local last_cycle
    last_cycle="$(echo "${state}" | jq -r '.lastCycle // "never"')"
    echo "Last cycle:      ${last_cycle}"
    echo ""

    echo "--- Type Rotation ---"
    echo "Current index:   $(echo "${state}" | jq -r '.typeRotation.currentIndex')"
    local last_used
    last_used="$(echo "${state}" | jq -r '.typeRotation.lastUsed | to_entries[] | "  \(.key): \(.value)"' 2>/dev/null || echo "  (none)")"
    echo "Last used:"
    echo "${last_used}"
    echo ""

    echo "--- Apps ---"
    local apps
    apps="$(echo "${state}" | jq -r '.apps | keys[]' 2>/dev/null || echo "")"

    if [[ -z "${apps}" ]]; then
        echo "  No apps registered"
        return
    fi

    for app in ${apps}; do
        echo "  [${app}]"
        echo "    Total improvements:     $(echo "${state}" | jq -r ".apps.\"${app}\".totalImprovements")"
        echo "    Last improvement:       $(echo "${state}" | jq -r ".apps.\"${app}\".lastImprovement // \"never\"")"
        echo "    Last type:              $(echo "${state}" | jq -r ".apps.\"${app}\".lastType // \"none\"")"
        echo "    Consecutive failures:   $(echo "${state}" | jq -r ".apps.\"${app}\".consecutiveFailures")"
        local cd_until
        cd_until="$(echo "${state}" | jq -r ".apps.\"${app}\".cooldownUntil // \"none\"")"
        echo "    Cooldown until:         ${cd_until}"
        echo ""
    done
}

# --- CLI ---
usage() {
    cat <<EOF
Usage: $(basename "$0") <command> [args]

Persistent state manager for the self-improvement pipeline.

Commands:
  get <key>                  Get a value (dot-notation: apps.cloudify.totalImprovements)
  set <key> <value>          Set a value
  increment <key>            Increment a numeric counter
  last-improvement <app>     Get last improvement time for an app
  cooldown <app>             Check if an app is in cooldown (exits 1 if in cooldown)
  init-app <app>             Initialize an app entry
  record-success <app> [type]  Record a successful improvement
  record-failure <app>       Record a failed improvement
  stats                      Show overall statistics
  dump                       Dump raw state JSON

Options:
  -h, --help                 Show this help

Examples:
  $(basename "$0") get totalCycles
  $(basename "$0") set totalCycles 10
  $(basename "$0") increment totalCycles
  $(basename "$0") last-improvement cloudify
  $(basename "$0") cooldown cloudify
  $(basename "$0") record-success cloudify bug-fix
  $(basename "$0") record-failure cloudify
  $(basename "$0") stats
EOF
}

# Main
require_jq
init_state

if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

COMMAND="$1"
shift

case "${COMMAND}" in
    get)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh get <key>" >&2; exit 1; }
        cmd_get "$1" ;;
    set)
        [[ $# -lt 2 ]] && { echo "Usage: state.sh set <key> <value>" >&2; exit 1; }
        cmd_set "$1" "$2" ;;
    increment)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh increment <key>" >&2; exit 1; }
        cmd_increment "$1" ;;
    last-improvement)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh last-improvement <app>" >&2; exit 1; }
        cmd_last_improvement "$1" ;;
    cooldown)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh cooldown <app>" >&2; exit 1; }
        cmd_cooldown "$1" ;;
    init-app)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh init-app <app>" >&2; exit 1; }
        cmd_init_app "$1" ;;
    record-success)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh record-success <app> [type]" >&2; exit 1; }
        cmd_record_success "$1" "${2:-unknown}" ;;
    record-failure)
        [[ $# -lt 1 ]] && { echo "Usage: state.sh record-failure <app>" >&2; exit 1; }
        cmd_record_failure "$1" ;;
    stats)
        cmd_stats ;;
    dump)
        read_state | jq '.' ;;
    -h|--help)
        usage ;;
    *)
        echo "Unknown command: ${COMMAND}" >&2
        usage
        exit 1 ;;
esac
