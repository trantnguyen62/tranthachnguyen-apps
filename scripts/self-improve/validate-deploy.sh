#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# validate-deploy.sh - Post-deployment validation for self-improvement pipeline
#
# Usage: ./validate-deploy.sh <app-name|all>
# Example: ./validate-deploy.sh cloudify
#          ./validate-deploy.sh all
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="${SCRIPT_DIR}/reports"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_FILE="${REPORT_DIR}/validation_${TIMESTAMP}.txt"

TIMEOUT=10
MAX_RESPONSE_TIME=5

SSH_BASE='sshpass -p "Nuoc.123" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" root@ssh.tranthachnguyen.com'

# App registry: name|url|lxc_id|container_name
declare -A APP_URLS=(
  [portfolio]="https://tranthachnguyen.com"
  [photoedit]="https://photoedit.tranthachnguyen.com"
  [passportphoto]="https://passportphoto.tranthachnguyen.com"
  [illinoisdriverstudy]="https://illinoisdriverstudy.tranthachnguyen.com"
  [linguaflow]="https://linguaflow.tranthachnguyen.com"
  [comicnews]="https://comicnews.tranthachnguyen.com"
  [devopsstudy]="https://devopsstudy.tranthachnguyen.com"
  [cloudify]="https://cloudify.tranthachnguyen.com"
)

declare -A APP_LXC=(
  [portfolio]="201"
  [photoedit]="201"
  [passportphoto]="201"
  [illinoisdriverstudy]="201"
  [linguaflow]="201"
  [comicnews]="201"
  [devopsstudy]="201"
  [cloudify]="203"
)

declare -A APP_CONTAINER=(
  [portfolio]="portfolio"
  [photoedit]="photoedit"
  [passportphoto]="passportphoto"
  [illinoisdriverstudy]="illinoisdriverstudy"
  [linguaflow]="linguaflow"
  [comicnews]="comicnews"
  [devopsstudy]="devopsstudy"
  [cloudify]="cloudify"
)

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$REPORT_DIR"

usage() {
  echo "Usage: $0 <app-name|all>"
  echo ""
  echo "Available apps:"
  for app in "${!APP_URLS[@]}"; do
    echo "  $app  ->  ${APP_URLS[$app]}"
  done | sort
  echo "  all   ->  validate all apps"
  exit 1
}

log() {
  local msg="$1"
  echo -e "$msg"
  echo -e "$msg" | sed 's/\x1b\[[0-9;]*m//g' >> "$REPORT_FILE"
}

log_result() {
  local app="$1" url="$2" check="$3" status="$4" detail="$5"
  TOTAL=$((TOTAL + 1))
  local color="$GREEN"
  local icon="PASS"
  if [[ "$status" == "FAIL" ]]; then
    color="$RED"
    icon="FAIL"
    FAILED=$((FAILED + 1))
  elif [[ "$status" == "WARN" ]]; then
    color="$YELLOW"
    icon="WARN"
    WARNINGS=$((WARNINGS + 1))
  else
    PASSED=$((PASSED + 1))
  fi
  log "  ${color}[${icon}]${NC} ${check}: ${detail}"
}

# ---- Validation checks ----

check_http_status() {
  local app="$1" url="$2"
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" -L "$url" 2>/dev/null || echo "000")
  if [[ "$status_code" == "200" ]]; then
    log_result "$app" "$url" "HTTP Status" "PASS" "$status_code"
    return 0
  elif [[ "$status_code" == "000" ]]; then
    log_result "$app" "$url" "HTTP Status" "FAIL" "Connection failed (timeout or DNS)"
    return 1
  else
    log_result "$app" "$url" "HTTP Status" "FAIL" "$status_code (expected 200)"
    return 1
  fi
}

check_response_time() {
  local app="$1" url="$2"
  local time_total
  time_total=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" -L "$url" 2>/dev/null || echo "99")
  local time_ms
  time_ms=$(printf "%.2f" "$time_total")
  if (( $(echo "$time_total < $MAX_RESPONSE_TIME" | bc -l) )); then
    log_result "$app" "$url" "Response Time" "PASS" "${time_ms}s (< ${MAX_RESPONSE_TIME}s)"
    return 0
  else
    log_result "$app" "$url" "Response Time" "FAIL" "${time_ms}s (> ${MAX_RESPONSE_TIME}s)"
    return 1
  fi
}

check_html_content() {
  local app="$1" url="$2"
  local body
  body=$(curl -s --max-time "$TIMEOUT" -L "$url" 2>/dev/null || echo "")
  if [[ -z "$body" ]]; then
    log_result "$app" "$url" "HTML Content" "FAIL" "Empty response body"
    return 1
  fi

  local has_title=false has_body=false
  if echo "$body" | grep -qi '<title'; then
    has_title=true
  fi
  if echo "$body" | grep -qi '<body\|<div\|<main\|<section'; then
    has_body=true
  fi

  if $has_title && $has_body; then
    log_result "$app" "$url" "HTML Content" "PASS" "Contains title and body elements"
    return 0
  elif $has_title || $has_body; then
    log_result "$app" "$url" "HTML Content" "WARN" "Partial HTML (title=$has_title, body=$has_body)"
    return 0
  else
    log_result "$app" "$url" "HTML Content" "FAIL" "Missing title and body elements"
    return 1
  fi
}

check_no_server_errors() {
  local app="$1" url="$2"
  local body
  body=$(curl -s --max-time "$TIMEOUT" -L "$url" 2>/dev/null || echo "")

  local error_patterns="Internal Server Error|500 Error|502 Bad Gateway|503 Service Unavailable|504 Gateway Timeout|Application Error|ECONNREFUSED|ENOTFOUND|Fatal error|Unhandled Runtime Error"
  local found
  found=$(echo "$body" | grep -oiE "$error_patterns" | head -3 || true)

  if [[ -z "$found" ]]; then
    log_result "$app" "$url" "Server Errors" "PASS" "No error messages detected"
    return 0
  else
    local errors
    errors=$(echo "$found" | tr '\n' ', ' | sed 's/, $//')
    log_result "$app" "$url" "Server Errors" "FAIL" "Found: $errors"
    return 1
  fi
}

check_ssl() {
  local app="$1" url="$2"
  local host
  host=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')

  local ssl_output
  ssl_output=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "FAIL")

  if [[ "$ssl_output" == "FAIL" ]]; then
    log_result "$app" "$url" "SSL Certificate" "FAIL" "Could not verify certificate"
    return 1
  fi

  local not_after
  not_after=$(echo "$ssl_output" | grep "notAfter" | cut -d= -f2)
  local expiry_epoch
  expiry_epoch=$(date -jf "%b %d %H:%M:%S %Y %Z" "$not_after" "+%s" 2>/dev/null || date -d "$not_after" "+%s" 2>/dev/null || echo "0")
  local now_epoch
  now_epoch=$(date "+%s")
  local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

  if [[ "$days_left" -gt 14 ]]; then
    log_result "$app" "$url" "SSL Certificate" "PASS" "Valid, expires in ${days_left} days"
    return 0
  elif [[ "$days_left" -gt 0 ]]; then
    log_result "$app" "$url" "SSL Certificate" "WARN" "Expiring in ${days_left} days"
    return 0
  else
    log_result "$app" "$url" "SSL Certificate" "FAIL" "Expired or invalid"
    return 1
  fi
}

check_docker_container() {
  local app="$1" lxc_id="$2" container="$3"
  local docker_output
  docker_output=$(eval "$SSH_BASE \"pct exec $lxc_id -- bash -c 'docker ps --filter name=$container --format \\\"{{.Names}}|{{.Status}}\\\" 2>/dev/null'\"" 2>/dev/null || echo "SSH_FAIL")

  if [[ "$docker_output" == "SSH_FAIL" || -z "$docker_output" ]]; then
    log_result "$app" "-" "Docker Container" "FAIL" "Cannot reach LXC $lxc_id or container not found"
    return 1
  fi

  local status
  status=$(echo "$docker_output" | head -1 | cut -d'|' -f2)
  if echo "$status" | grep -qi "up"; then
    if echo "$status" | grep -qi "healthy"; then
      log_result "$app" "-" "Docker Container" "PASS" "Running and healthy ($status)"
    else
      log_result "$app" "-" "Docker Container" "PASS" "Running ($status)"
    fi
    return 0
  else
    log_result "$app" "-" "Docker Container" "FAIL" "Not running ($status)"
    return 1
  fi
}

# ---- Cloudify-specific checks ----

check_cloudify_api() {
  local url="https://cloudify.tranthachnguyen.com"

  # Check /api/health or a basic API endpoint
  local api_status
  api_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" -L "${url}/api/auth/session" 2>/dev/null || echo "000")
  if [[ "$api_status" == "200" ]]; then
    log_result "cloudify" "$url" "API Endpoints" "PASS" "/api/auth/session returns $api_status"
  else
    log_result "cloudify" "$url" "API Endpoints" "FAIL" "/api/auth/session returns $api_status"
  fi
}

check_cloudify_database() {
  local lxc_id="203"
  local db_output
  db_output=$(eval "$SSH_BASE \"pct exec $lxc_id -- bash -c 'docker exec cloudify-db psql -h localhost -U cloudify cloudify -c \\\"SELECT 1 AS ok;\\\" 2>&1'\"" 2>/dev/null || echo "FAIL")

  if echo "$db_output" | grep -q "1 row"; then
    log_result "cloudify" "-" "Database Connection" "PASS" "PostgreSQL responding"
    return 0
  else
    log_result "cloudify" "-" "Database Connection" "FAIL" "PostgreSQL not responding"
    return 1
  fi
}

check_cloudify_redis() {
  local lxc_id="203"
  local redis_output
  redis_output=$(eval "$SSH_BASE \"pct exec $lxc_id -- bash -c 'docker exec cloudify-redis redis-cli ping 2>&1'\"" 2>/dev/null || echo "FAIL")

  if echo "$redis_output" | grep -qi "PONG"; then
    log_result "cloudify" "-" "Redis Connection" "PASS" "Redis responding (PONG)"
    return 0
  else
    log_result "cloudify" "-" "Redis Connection" "FAIL" "Redis not responding"
    return 1
  fi
}

# ---- Main validation runner ----

validate_app() {
  local app="$1"
  local url="${APP_URLS[$app]}"
  local lxc="${APP_LXC[$app]}"
  local container="${APP_CONTAINER[$app]}"

  log ""
  log "${CYAN}=== Validating: $app ===${NC}"
  log "    URL: $url"
  log "    LXC: $lxc | Container: $container"
  log ""

  check_http_status "$app" "$url" || true
  check_response_time "$app" "$url" || true
  check_html_content "$app" "$url" || true
  check_no_server_errors "$app" "$url" || true
  check_ssl "$app" "$url" || true
  check_docker_container "$app" "$lxc" "$container" || true

  # Cloudify-specific checks
  if [[ "$app" == "cloudify" ]]; then
    log ""
    log "  ${CYAN}-- Cloudify-specific checks --${NC}"
    check_cloudify_api || true
    check_cloudify_database || true
    check_cloudify_redis || true
  fi
}

generate_summary_table() {
  log ""
  log "${CYAN}===============================================================================${NC}"
  log "${CYAN}  VALIDATION SUMMARY TABLE${NC}"
  log "${CYAN}===============================================================================${NC}"
  log ""
  printf "%-22s | %-45s | %-6s | %-8s | %-7s\n" "APP" "URL" "STATUS" "TIME" "HEALTHY" >> "$REPORT_FILE"
  printf "%-22s | %-45s | %-6s | %-8s | %-7s\n" "APP" "URL" "STATUS" "TIME" "HEALTHY"
  echo "------------------------|-----------------------------------------------|--------|----------|--------" >> "$REPORT_FILE"
  echo "------------------------|-----------------------------------------------|--------|----------|--------"

  for app in $(echo "${!APP_URLS[@]}" | tr ' ' '\n' | sort); do
    local url="${APP_URLS[$app]}"
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" -L "$url" 2>/dev/null || echo "000")
    local time_total
    time_total=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" -L "$url" 2>/dev/null || echo "99.00")
    local time_fmt
    time_fmt=$(printf "%.2fs" "$time_total")

    local healthy="YES"
    if [[ "$status_code" != "200" ]]; then
      healthy="NO"
    fi
    if (( $(echo "$time_total >= $MAX_RESPONSE_TIME" | bc -l 2>/dev/null || echo 0) )); then
      healthy="SLOW"
    fi

    printf "%-22s | %-45s | %-6s | %-8s | %-7s\n" "$app" "$url" "$status_code" "$time_fmt" "$healthy" >> "$REPORT_FILE"
    local color="$GREEN"
    if [[ "$healthy" == "NO" ]]; then color="$RED"; fi
    if [[ "$healthy" == "SLOW" ]]; then color="$YELLOW"; fi
    echo -e "${color}$(printf "%-22s | %-45s | %-6s | %-8s | %-7s" "$app" "$url" "$status_code" "$time_fmt" "$healthy")${NC}"
  done
}

# ---- Entry point ----

if [[ $# -lt 1 ]]; then
  usage
fi

APP_ARG="$1"

log "${CYAN}===============================================================================${NC}"
log "${CYAN}  DEPLOYMENT VALIDATION REPORT${NC}"
log "${CYAN}  Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log "${CYAN}  Target: ${APP_ARG}${NC}"
log "${CYAN}===============================================================================${NC}"

if [[ "$APP_ARG" == "all" ]]; then
  for app in $(echo "${!APP_URLS[@]}" | tr ' ' '\n' | sort); do
    validate_app "$app"
  done
  generate_summary_table
else
  if [[ -z "${APP_URLS[$APP_ARG]+x}" ]]; then
    echo "Error: Unknown app '$APP_ARG'"
    usage
  fi
  validate_app "$APP_ARG"
fi

log ""
log "${CYAN}===============================================================================${NC}"
log "  Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}, ${YELLOW}${WARNINGS} warnings${NC} (${TOTAL} total checks)"
log "  Report saved to: ${REPORT_FILE}"
log "${CYAN}===============================================================================${NC}"

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi
exit 0
