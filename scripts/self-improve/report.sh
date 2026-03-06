#!/usr/bin/env bash
# Daily Improvement Report Generator
# Reads self-improvement cycle logs and produces a markdown report.
#
# Log format (one JSON object per line in logs/YYYY-MM-DD.jsonl):
#   {"ts":"HH:MM:SS","app":"appname","type":"perf|security|style|refactor|docs|test",
#    "result":"success|failure","duration_s":42,"files_changed":3,"error":"..."}
#
# Usage: ./report.sh [YYYY-MM-DD]
#   Defaults to today's date.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
REPORTS_DIR="$SCRIPT_DIR/reports"
NOTIFY="$SCRIPT_DIR/notify.sh"

DATE="${1:-$(date +%Y-%m-%d)}"
LOG_FILE="$LOGS_DIR/$DATE.jsonl"
REPORT_FILE="$REPORTS_DIR/$DATE.md"

mkdir -p "$REPORTS_DIR"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

jq_or_die() {
  if ! command -v jq &>/dev/null; then
    echo "ERROR: jq is required. Install with: brew install jq" >&2
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Guard: no log file
# ---------------------------------------------------------------------------

if [[ ! -f "$LOG_FILE" ]]; then
  cat > "$REPORT_FILE" <<EOF
# Daily Improvement Report - $DATE

> No improvement cycles were recorded today.
EOF
  echo "No log file found at $LOG_FILE. Empty report written to $REPORT_FILE"
  if [[ -x "$NOTIFY" ]]; then
    "$NOTIFY" "No improvement cycles recorded for $DATE" "info"
  fi
  exit 0
fi

jq_or_die

# ---------------------------------------------------------------------------
# Parse metrics
# ---------------------------------------------------------------------------

TOTAL=$(wc -l < "$LOG_FILE" | tr -d ' ')
SUCCESS=$(jq -c 'select(.result=="success")' "$LOG_FILE" | wc -l | tr -d ' ')
FAILURE=$((TOTAL - SUCCESS))
if [[ "$TOTAL" -gt 0 ]]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS/$TOTAL)*100}")
else
  SUCCESS_RATE="0.0"
fi

# Unique apps that had at least one improvement
APPS_IMPROVED=$(jq -r 'select(.result=="success") | .app' "$LOG_FILE" | sort -u | wc -l | tr -d ' ')
APPS_TOTAL=$(jq -r '.app' "$LOG_FILE" | sort -u | wc -l | tr -d ' ')

# Total files changed
FILES_CHANGED=$(jq -r '.files_changed // 0' "$LOG_FILE" | awk '{s+=$1} END {print s+0}')

# Average duration
AVG_DURATION=$(jq -r '.duration_s // 0' "$LOG_FILE" | awk '{s+=$1; n++} END {if(n>0) printf "%.1f", s/n; else print "0"}')

# ---------------------------------------------------------------------------
# By App table
# ---------------------------------------------------------------------------

by_app_table() {
  local apps
  apps=$(jq -r '.app' "$LOG_FILE" | sort -u)
  echo "| App | Improvements | Success Rate | Types |"
  echo "|-----|-------------|-------------|-------|"
  while IFS= read -r app; do
    [[ -z "$app" ]] && continue
    local app_total app_success app_rate app_types
    app_total=$(jq -c --arg a "$app" 'select(.app==$a)' "$LOG_FILE" | wc -l | tr -d ' ')
    app_success=$(jq -c --arg a "$app" 'select(.app==$a and .result=="success")' "$LOG_FILE" | wc -l | tr -d ' ')
    if [[ "$app_total" -gt 0 ]]; then
      app_rate=$(awk "BEGIN {printf \"%.0f\", ($app_success/$app_total)*100}")
    else
      app_rate="0"
    fi
    app_types=$(jq -r --arg a "$app" 'select(.app==$a) | .type' "$LOG_FILE" | sort -u | paste -sd, -)
    echo "| $app | $app_total | ${app_rate}% | $app_types |"
  done <<< "$apps"
}

# ---------------------------------------------------------------------------
# By Type table
# ---------------------------------------------------------------------------

by_type_table() {
  local types
  types=$(jq -r '.type' "$LOG_FILE" | sort -u)
  echo "| Type | Count | Success Rate |"
  echo "|------|-------|-------------|"
  while IFS= read -r t; do
    [[ -z "$t" ]] && continue
    local t_total t_success t_rate
    t_total=$(jq -c --arg t "$t" 'select(.type==$t)' "$LOG_FILE" | wc -l | tr -d ' ')
    t_success=$(jq -c --arg t "$t" 'select(.type==$t and .result=="success")' "$LOG_FILE" | wc -l | tr -d ' ')
    if [[ "$t_total" -gt 0 ]]; then
      t_rate=$(awk "BEGIN {printf \"%.0f\", ($t_success/$t_total)*100}")
    else
      t_rate="0"
    fi
    echo "| $t | $t_total | ${t_rate}% |"
  done <<< "$types"
}

# ---------------------------------------------------------------------------
# Timeline table
# ---------------------------------------------------------------------------

timeline_table() {
  echo "| Time | App | Type | Result | Duration |"
  echo "|------|-----|------|--------|----------|"
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local ts app type result dur
    ts=$(echo "$line" | jq -r '.ts // "?"')
    app=$(echo "$line" | jq -r '.app // "?"')
    type=$(echo "$line" | jq -r '.type // "?"')
    result=$(echo "$line" | jq -r '.result // "?"')
    dur=$(echo "$line" | jq -r '.duration_s // "?"')
    echo "| $ts | $app | $type | $result | ${dur}s |"
  done < "$LOG_FILE"
}

# ---------------------------------------------------------------------------
# Failures section
# ---------------------------------------------------------------------------

failures_section() {
  local has_failures=false
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local result
    result=$(echo "$line" | jq -r '.result')
    if [[ "$result" == "failure" ]]; then
      local app type err
      app=$(echo "$line" | jq -r '.app // "?"')
      type=$(echo "$line" | jq -r '.type // "?"')
      err=$(echo "$line" | jq -r '.error // "unknown error"')
      echo "- [$app] $type: $err"
      has_failures=true
    fi
  done < "$LOG_FILE"
  if [[ "$has_failures" == false ]]; then
    echo "_No failures today._"
  fi
}

# ---------------------------------------------------------------------------
# Write report
# ---------------------------------------------------------------------------

{
  echo "# Daily Improvement Report - $DATE"
  echo ""
  echo "## Summary"
  echo "- Total cycles: $TOTAL"
  echo "- Success rate: ${SUCCESS_RATE}%"
  echo "- Apps improved: ${APPS_IMPROVED}/${APPS_TOTAL}"
  echo "- Files changed: $FILES_CHANGED"
  echo "- Avg duration: ${AVG_DURATION}s"
  echo ""
  echo "## By App"
  by_app_table
  echo ""
  echo "## By Type"
  by_type_table
  echo ""
  echo "## Timeline"
  timeline_table
  echo ""
  echo "## Failures"
  failures_section
} > "$REPORT_FILE"

echo "Report written to $REPORT_FILE"

# ---------------------------------------------------------------------------
# Notify
# ---------------------------------------------------------------------------

if [[ -x "$NOTIFY" ]]; then
  if [[ "$FAILURE" -gt 0 ]]; then
    SEVERITY="failure"
  else
    SEVERITY="success"
  fi
  "$NOTIFY" "Daily report ($DATE): $TOTAL cycles, ${SUCCESS_RATE}% success, $FILES_CHANGED files changed" "$SEVERITY"
fi

# ---------------------------------------------------------------------------
# Optional webhook (REPORT_WEBHOOK_URL)
# ---------------------------------------------------------------------------

if [[ -n "${REPORT_WEBHOOK_URL:-}" ]]; then
  REPORT_CONTENT=$(cat "$REPORT_FILE")
  PAYLOAD=$(jq -n --arg content "$REPORT_CONTENT" '{content: $content}')
  curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$REPORT_WEBHOOK_URL" >/dev/null 2>&1 || true
  echo "Report sent to webhook."
fi
