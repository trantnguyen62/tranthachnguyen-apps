#!/usr/bin/env bash
# log-aggregator.sh - Centralized logging for the self-improvement pipeline
# Aggregates logs from: local cycle logs, GitHub Actions, Docker containers, deploy validation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="${SCRIPT_DIR}/logs"
AGGREGATED_DIR="${LOGS_DIR}/aggregated"
TODAY="$(date +%Y-%m-%d)"
AGGREGATED_FILE="${AGGREGATED_DIR}/${TODAY}.log"

# SSH config for Proxmox/LXC access
SSH_PASS="${SSH_PASS:-Nuoc.123}"
SSH_HOST="${SSH_HOST:-ssh.tranthachnguyen.com}"
LXC_ID="${LXC_ID:-203}"

# Ensure directories exist
mkdir -p "${AGGREGATED_DIR}"

# --- Unified log format ---
# [YYYY-MM-DD HH:MM:SS] [SOURCE] [LEVEL] [APP] message
emit_log() {
    local source="$1" level="$2" app="$3" message="$4"
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    printf '[%s] [%-12s] [%-5s] [%-12s] %s\n' \
        "${ts}" "${source}" "${level}" "${app}" "${message}"
}

write_aggregated() {
    local line="$1"
    echo "${line}" >> "${AGGREGATED_FILE}"
}

# --- Source: Local self-improvement cycle logs ---
aggregate_local_logs() {
    local app_filter="${1:-}"
    local count=0

    for logfile in "${LOGS_DIR}"/*.log; do
        [ -f "${logfile}" ] || continue
        local basename
        basename="$(basename "${logfile}")"

        # Skip aggregated directory logs
        [[ "${basename}" == aggregated* ]] && continue

        # Infer app name from filename (e.g., cloudify-2026-03-06.log -> cloudify)
        local app
        app="$(echo "${basename}" | sed -E 's/[-_][0-9]{4}.*//; s/\.log$//')"
        app="${app:-unknown}"

        # Apply app filter
        if [[ -n "${app_filter}" && "${app}" != "${app_filter}" ]]; then
            continue
        fi

        while IFS= read -r line; do
            [ -z "${line}" ] && continue
            local level="INFO"
            # Detect level from content
            if echo "${line}" | grep -qiE '(error|fail|fatal|panic)'; then
                level="ERROR"
            elif echo "${line}" | grep -qiE '(warn|warning)'; then
                level="WARN"
            elif echo "${line}" | grep -qiE '(debug|trace)'; then
                level="DEBUG"
            fi

            local formatted
            formatted="$(emit_log "LOCAL" "${level}" "${app}" "${line}")"
            write_aggregated "${formatted}"
            count=$((count + 1))
        done < "${logfile}"
    done

    echo "Aggregated ${count} lines from local logs"
}

# --- Source: GitHub Actions ---
aggregate_github_actions() {
    local app_filter="${1:-}"
    local count=0

    if ! command -v gh &>/dev/null; then
        emit_log "GITHUB" "WARN" "system" "gh CLI not installed, skipping GitHub Actions" | tee -a "${AGGREGATED_FILE}"
        return
    fi

    # List repos to check
    local repos=("tranthachnguyen-apps/cloudify" "tranthachnguyen-apps/portfolio")
    for repo in "${repos[@]}"; do
        local app
        app="$(basename "${repo}")"

        if [[ -n "${app_filter}" && "${app}" != "${app_filter}" ]]; then
            continue
        fi

        # Get recent workflow runs (last 5)
        local runs
        runs="$(gh run list --repo "${repo}" --limit 5 --json databaseId,status,conclusion,name,createdAt 2>/dev/null || echo "[]")"

        if [[ "${runs}" == "[]" || -z "${runs}" ]]; then
            continue
        fi

        echo "${runs}" | jq -r '.[] | "\(.databaseId)|\(.status)|\(.conclusion // "pending")|\(.name)|\(.createdAt)"' 2>/dev/null | while IFS='|' read -r run_id status conclusion name created_at; do
            local level="INFO"
            local message="Run #${run_id} '${name}': ${status}"
            if [[ "${conclusion}" == "failure" ]]; then
                level="ERROR"
                message="${message} (FAILED)"
            elif [[ "${conclusion}" == "success" ]]; then
                message="${message} (success)"
            fi

            local formatted
            formatted="$(emit_log "GITHUB" "${level}" "${app}" "${message}")"
            write_aggregated "${formatted}"
            count=$((count + 1))
        done
    done

    echo "Aggregated ${count} lines from GitHub Actions"
}

# --- Source: Docker container logs ---
aggregate_docker_logs() {
    local app_filter="${1:-}"
    local count=0
    local since="${2:-1h}"

    local containers=("cloudify" "cloudify-db" "cloudify-redis" "cloudify-minio" "cloudify-nginx")

    for container in "${containers[@]}"; do
        # Map container to app name
        local app
        if [[ "${container}" == cloudify-* ]]; then
            app="cloudify"
        else
            app="${container}"
        fi

        if [[ -n "${app_filter}" && "${app}" != "${app_filter}" ]]; then
            continue
        fi

        local logs
        logs="$(sshpass -p "${SSH_PASS}" ssh -o StrictHostKeyChecking=no \
            -o "ProxyCommand=cloudflared access ssh --hostname ${SSH_HOST}" \
            "root@${SSH_HOST}" \
            "pct exec ${LXC_ID} -- bash -c 'docker logs --since ${since} ${container} 2>&1 | tail -100'" 2>/dev/null || echo "")"

        if [[ -z "${logs}" ]]; then
            continue
        fi

        while IFS= read -r line; do
            [ -z "${line}" ] && continue
            local level="INFO"
            if echo "${line}" | grep -qiE '(error|err|fail|fatal|panic|exception)'; then
                level="ERROR"
            elif echo "${line}" | grep -qiE '(warn|warning)'; then
                level="WARN"
            elif echo "${line}" | grep -qiE '(debug|trace)'; then
                level="DEBUG"
            fi

            local formatted
            formatted="$(emit_log "DOCKER:${container}" "${level}" "${app}" "${line}")"
            write_aggregated "${formatted}"
            count=$((count + 1))
        done <<< "${logs}"
    done

    echo "Aggregated ${count} lines from Docker containers"
}

# --- Source: Deploy validation results ---
aggregate_deploy_validation() {
    local app_filter="${1:-}"
    local count=0

    for report in "${SCRIPT_DIR}/reports"/*.json; do
        [ -f "${report}" ] || continue
        local basename
        basename="$(basename "${report}")"
        local app
        app="$(echo "${basename}" | sed -E 's/[-_][0-9]{4}.*//; s/\.json$//')"
        app="${app:-unknown}"

        if [[ -n "${app_filter}" && "${app}" != "${app_filter}" ]]; then
            continue
        fi

        # Extract key fields from report JSON
        local status message
        status="$(jq -r '.status // "unknown"' "${report}" 2>/dev/null || echo "unknown")"
        message="$(jq -r '.message // .summary // "No details"' "${report}" 2>/dev/null || echo "No details")"

        local level="INFO"
        if [[ "${status}" == "failure" || "${status}" == "error" ]]; then
            level="ERROR"
        elif [[ "${status}" == "warning" ]]; then
            level="WARN"
        fi

        local formatted
        formatted="$(emit_log "DEPLOY" "${level}" "${app}" "Validation: ${status} - ${message}")"
        write_aggregated "${formatted}"
        count=$((count + 1))
    done

    echo "Aggregated ${count} lines from deploy validation reports"
}

# --- Filtering ---
filter_logs() {
    local app_filter="${1:-}" level_filter="${2:-}" date_filter="${3:-${TODAY}}"
    local target_file="${AGGREGATED_DIR}/${date_filter}.log"

    if [[ ! -f "${target_file}" ]]; then
        echo "No aggregated logs for ${date_filter}"
        return 1
    fi

    local pattern="."
    if [[ -n "${app_filter}" ]]; then
        pattern="${pattern}.*\\[${app_filter}"
    fi
    if [[ -n "${level_filter}" ]]; then
        local upper
        upper="$(echo "${level_filter}" | tr '[:lower:]' '[:upper:]')"
        pattern="${pattern}.*\\[${upper}"
    fi

    grep -E "${pattern}" "${target_file}" || echo "No matching logs found"
}

# --- Tail recent logs ---
tail_logs() {
    local num_lines="${1:-50}"
    local target_file="${AGGREGATED_FILE}"

    if [[ ! -f "${target_file}" ]]; then
        echo "No aggregated logs for today (${TODAY})"
        return 1
    fi

    tail -n "${num_lines}" "${target_file}"
}

# --- Statistics ---
show_stats() {
    local date_filter="${1:-${TODAY}}"
    local target_file="${AGGREGATED_DIR}/${date_filter}.log"

    if [[ ! -f "${target_file}" ]]; then
        echo "No aggregated logs for ${date_filter}"
        return 1
    fi

    local total error warn info debug
    total="$(wc -l < "${target_file}" | tr -d ' ')"
    error="$(grep -c '\[ERROR\]' "${target_file}" 2>/dev/null || echo 0)"
    warn="$(grep -c '\[WARN \]' "${target_file}" 2>/dev/null || echo 0)"
    info="$(grep -c '\[INFO \]' "${target_file}" 2>/dev/null || echo 0)"
    debug="$(grep -c '\[DEBUG\]' "${target_file}" 2>/dev/null || echo 0)"

    echo "=== Log Statistics for ${date_filter} ==="
    echo "Total lines:  ${total}"
    echo "  ERROR:      ${error}"
    echo "  WARN:       ${warn}"
    echo "  INFO:       ${info}"
    echo "  DEBUG:      ${debug}"
    echo ""

    echo "--- By Source ---"
    grep -oP '(?<=\] \[)[A-Z_:a-z-]+(?=\s*\])' "${target_file}" 2>/dev/null | head -1000 | sort | uniq -c | sort -rn || \
        sed -nE 's/.*\] \[([A-Za-z_:0-9-]+)[[:space:]]*\].*/\1/p' "${target_file}" | head -1000 | sort | uniq -c | sort -rn
    echo ""

    echo "--- By App ---"
    # Extract app field (4th bracketed field)
    awk -F'[][]' '{print $8}' "${target_file}" 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | head -1000 | sort | uniq -c | sort -rn
    echo ""

    if [[ "${error}" -gt 0 ]]; then
        echo "--- Recent Errors ---"
        grep '\[ERROR\]' "${target_file}" | tail -10
    fi
}

# --- Aggregate all sources ---
aggregate_all() {
    local app_filter="${1:-}"
    echo "=== Aggregating logs ($(date '+%Y-%m-%d %H:%M:%S')) ==="
    echo "Target: ${AGGREGATED_FILE}"
    echo ""

    aggregate_local_logs "${app_filter}"
    aggregate_github_actions "${app_filter}"
    aggregate_docker_logs "${app_filter}"
    aggregate_deploy_validation "${app_filter}"

    echo ""
    echo "Done. Aggregated log: ${AGGREGATED_FILE}"
}

# --- CLI ---
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Centralized log aggregator for the self-improvement pipeline.

Commands:
  (default)          Aggregate all log sources
  --tail N           Show last N lines of today's aggregated log (default: 50)
  --stats            Show log statistics
  --filter           Filter aggregated logs

Options:
  --app APP          Filter by application name (e.g., cloudify, portfolio)
  --level LEVEL      Filter by log level (error, warn, info, debug)
  --today            Use today's date (default)
  --date YYYY-MM-DD  Use specific date
  --since DURATION   Docker log duration (default: 1h)
  -h, --help         Show this help

Examples:
  $(basename "$0")                              # Aggregate all sources
  $(basename "$0") --app cloudify               # Aggregate only cloudify logs
  $(basename "$0") --app cloudify --level error --today  # Filter errors
  $(basename "$0") --tail 50                    # Show last 50 lines
  $(basename "$0") --stats                      # Show statistics
  $(basename "$0") --stats --date 2026-03-05    # Stats for specific date
EOF
}

# Parse arguments
APP_FILTER=""
LEVEL_FILTER=""
DATE_FILTER="${TODAY}"
DOCKER_SINCE="1h"
ACTION="aggregate"
TAIL_LINES=50

while [[ $# -gt 0 ]]; do
    case "$1" in
        --app)
            APP_FILTER="$2"; shift 2 ;;
        --level)
            LEVEL_FILTER="$2"; shift 2 ;;
        --today)
            DATE_FILTER="${TODAY}"; shift ;;
        --date)
            DATE_FILTER="$2"; shift 2 ;;
        --since)
            DOCKER_SINCE="$2"; shift 2 ;;
        --tail)
            ACTION="tail"
            if [[ "${2:-}" =~ ^[0-9]+$ ]]; then
                TAIL_LINES="$2"; shift
            fi
            shift ;;
        --stats)
            ACTION="stats"; shift ;;
        --filter)
            ACTION="filter"; shift ;;
        -h|--help)
            usage; exit 0 ;;
        *)
            echo "Unknown option: $1"; usage; exit 1 ;;
    esac
done

case "${ACTION}" in
    aggregate)
        aggregate_all "${APP_FILTER}" ;;
    tail)
        tail_logs "${TAIL_LINES}" ;;
    stats)
        show_stats "${DATE_FILTER}" ;;
    filter)
        filter_logs "${APP_FILTER}" "${LEVEL_FILTER}" "${DATE_FILTER}" ;;
esac
