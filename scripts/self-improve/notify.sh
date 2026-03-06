#!/usr/bin/env bash
# Notification helper for the self-improvement pipeline.
#
# Usage: ./notify.sh "message" [severity]
#   severity: success | failure | info (default: info)
#
# Sends to Discord webhook if DISCORD_WEBHOOK_URL is set,
# otherwise logs to logs/notifications.log.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/notifications.log"

MESSAGE="${1:?Usage: notify.sh \"message\" [severity]}"
SEVERITY="${2:-info}"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------------------
# Severity formatting
# ---------------------------------------------------------------------------

case "$SEVERITY" in
  success)
    EMOJI="[OK]"
    DISCORD_COLOR=3066993   # green
    ;;
  failure)
    EMOJI="[FAIL]"
    DISCORD_COLOR=15158332  # red
    ;;
  info|*)
    EMOJI="[INFO]"
    DISCORD_COLOR=3447003   # blue
    ;;
esac

FORMATTED="$TIMESTAMP $EMOJI $MESSAGE"

# ---------------------------------------------------------------------------
# Always write to local log
# ---------------------------------------------------------------------------

echo "$FORMATTED" >> "$LOG_FILE"

# ---------------------------------------------------------------------------
# Discord webhook (if configured)
# ---------------------------------------------------------------------------

if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
  PAYLOAD=$(cat <<ENDJSON
{
  "embeds": [{
    "title": "Self-Improvement Pipeline",
    "description": "$MESSAGE",
    "color": $DISCORD_COLOR,
    "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
    "footer": {"text": "$SEVERITY"}
  }]
}
ENDJSON
  )
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$DISCORD_WEBHOOK_URL" 2>/dev/null || echo "000")

  if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
    echo "Notification sent to Discord ($SEVERITY)"
  else
    echo "Discord webhook failed (HTTP $HTTP_CODE), logged locally" >&2
  fi
else
  echo "Logged: $FORMATTED"
fi
