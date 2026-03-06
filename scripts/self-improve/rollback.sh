#!/usr/bin/env bash
# rollback.sh - Roll back a deployed app to previous Docker image version
# Usage: ./rollback.sh <app-name> <deploy-id>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"

# --- SSH configuration ---
SSH_CMD='sshpass -p "Nuoc.123" ssh -o StrictHostKeyChecking=no -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" root@ssh.tranthachnguyen.com'

# --- Argument validation ---
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <app-name> <deploy-id>"
    echo "Example: $0 cloudify deploy-2026-03-06-1430"
    exit 1
fi

APP_NAME="$1"
DEPLOY_ID="$2"

mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/rollback_${APP_NAME}_${TIMESTAMP}.log"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

log "Starting rollback for app=${APP_NAME} deploy_id=${DEPLOY_ID}"

# --- Read config ---
if [[ ! -f "$CONFIG_FILE" ]]; then
    log "ERROR: Config file not found at ${CONFIG_FILE}"
    exit 1
fi

APP_CONFIG="$(python3 -c "
import json, sys
with open('${CONFIG_FILE}') as f:
    cfg = json.load(f)
apps = cfg.get('apps', {})
if '${APP_NAME}' not in apps:
    print('NOT_FOUND')
    sys.exit(0)
app = apps['${APP_NAME}']
print(app.get('lxc', ''))
print(app.get('container_name', app.get('name', '${APP_NAME}')))
print(app.get('image', '${APP_NAME}:latest'))
print(app.get('network', ''))
print(app.get('ports', ''))
print(app.get('env_file', ''))
print(app.get('health_endpoint', '/api/health'))
print(app.get('health_port', '3000'))
print(app.get('notification_webhook', ''))
")"

APP_LXC="$(echo "$APP_CONFIG" | sed -n '1p')"
CONTAINER_NAME="$(echo "$APP_CONFIG" | sed -n '2p')"
DOCKER_IMAGE="$(echo "$APP_CONFIG" | sed -n '3p')"
NETWORK="$(echo "$APP_CONFIG" | sed -n '4p')"
PORTS="$(echo "$APP_CONFIG" | sed -n '5p')"
ENV_FILE="$(echo "$APP_CONFIG" | sed -n '6p')"
HEALTH_ENDPOINT="$(echo "$APP_CONFIG" | sed -n '7p')"
HEALTH_PORT="$(echo "$APP_CONFIG" | sed -n '8p')"
NOTIFICATION_WEBHOOK="$(echo "$APP_CONFIG" | sed -n '9p')"

if [[ "$APP_LXC" == "NOT_FOUND" || -z "$APP_LXC" ]]; then
    log "ERROR: App '${APP_NAME}' not found in config or missing LXC ID"
    exit 1
fi

log "Config: lxc=${APP_LXC} container=${CONTAINER_NAME} image=${DOCKER_IMAGE}"

# --- Helper: run command on remote LXC ---
remote_exec() {
    local cmd="$1"
    eval "${SSH_CMD} \"pct exec ${APP_LXC} -- bash -c '${cmd}'\""
}

# --- Step 1: Get current container info (for logging) ---
log "Fetching current container state..."
CURRENT_IMAGE="$(remote_exec "docker inspect --format='{{.Config.Image}}' ${CONTAINER_NAME} 2>/dev/null || echo 'unknown'")" || true
log "Current running image: ${CURRENT_IMAGE}"

# --- Step 2: Find the previous image to roll back to ---
log "Looking for previous image version..."

# List images sorted by creation time, find the one before current
PREVIOUS_IMAGE="$(remote_exec "docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}}' | grep '${APP_NAME}' | head -5")" || true
log "Available images: ${PREVIOUS_IMAGE}"

# Tag convention: the current running image gets tagged as :rollback before deploy
# Check if a :previous or :rollback tag exists
ROLLBACK_IMAGE="${APP_NAME}:previous"
HAS_ROLLBACK="$(remote_exec "docker images -q ${ROLLBACK_IMAGE} 2>/dev/null")" || true

if [[ -z "$HAS_ROLLBACK" ]]; then
    # Try deploy-id based tag
    ROLLBACK_IMAGE="${APP_NAME}:${DEPLOY_ID}"
    HAS_ROLLBACK="$(remote_exec "docker images -q ${ROLLBACK_IMAGE} 2>/dev/null")" || true
fi

if [[ -z "$HAS_ROLLBACK" ]]; then
    # Last resort: use the second most recent image
    ROLLBACK_IMAGE="$(remote_exec "docker images --format '{{.Repository}}:{{.Tag}}' ${APP_NAME} | grep -v '<none>' | sed -n '2p'")" || true
fi

if [[ -z "$ROLLBACK_IMAGE" ]]; then
    log "ERROR: No previous image found for rollback"
    exit 1
fi

log "Rolling back to image: ${ROLLBACK_IMAGE}"

# --- Step 3: Stop current container ---
log "Stopping current container: ${CONTAINER_NAME}"
remote_exec "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
remote_exec "docker rename ${CONTAINER_NAME} ${CONTAINER_NAME}-rollback-${TIMESTAMP} 2>/dev/null || true"

# --- Step 4: Start container with previous image ---
log "Starting container with rollback image..."

# Build docker run command
DOCKER_RUN="docker run -d --name ${CONTAINER_NAME}"

if [[ -n "$NETWORK" ]]; then
    DOCKER_RUN="${DOCKER_RUN} --network ${NETWORK}"
fi

if [[ -n "$PORTS" ]]; then
    # Ports can be comma-separated: "3000:3000,8080:8080"
    IFS=',' read -ra PORT_LIST <<< "$PORTS"
    for port in "${PORT_LIST[@]}"; do
        DOCKER_RUN="${DOCKER_RUN} -p ${port}"
    done
fi

if [[ -n "$ENV_FILE" ]]; then
    DOCKER_RUN="${DOCKER_RUN} --env-file ${ENV_FILE}"
fi

DOCKER_RUN="${DOCKER_RUN} ${ROLLBACK_IMAGE}"

log "Running: ${DOCKER_RUN}"
remote_exec "$DOCKER_RUN" 2>&1 | tee -a "$LOG_FILE"

# --- Step 5: Health check ---
log "Waiting for service to become healthy..."
MAX_RETRIES=30
RETRY_INTERVAL=2
HEALTHY=false

for ((i=1; i<=MAX_RETRIES; i++)); do
    sleep $RETRY_INTERVAL
    # Check if container is running
    CONTAINER_STATUS="$(remote_exec "docker inspect --format='{{.State.Status}}' ${CONTAINER_NAME} 2>/dev/null")" || true

    if [[ "$CONTAINER_STATUS" != "running" ]]; then
        log "Attempt ${i}/${MAX_RETRIES}: Container status=${CONTAINER_STATUS}"
        continue
    fi

    # Try health endpoint
    HEALTH_CHECK="$(remote_exec "curl -sf http://localhost:${HEALTH_PORT}${HEALTH_ENDPOINT} 2>/dev/null && echo OK || echo FAIL")" || true

    if [[ "$HEALTH_CHECK" == *"OK"* ]]; then
        HEALTHY=true
        log "Health check passed on attempt ${i}"
        break
    fi

    log "Attempt ${i}/${MAX_RETRIES}: Health check not yet passing..."
done

if [[ "$HEALTHY" != "true" ]]; then
    log "ERROR: Service did not become healthy after rollback"
    log "Container logs:"
    remote_exec "docker logs --tail 50 ${CONTAINER_NAME}" 2>&1 | tee -a "$LOG_FILE" || true

    # Attempt to restore the original container
    log "Attempting to restore original container..."
    remote_exec "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
    remote_exec "docker rm ${CONTAINER_NAME} 2>/dev/null || true"
    remote_exec "docker rename ${CONTAINER_NAME}-rollback-${TIMESTAMP} ${CONTAINER_NAME} 2>/dev/null || true"
    remote_exec "docker start ${CONTAINER_NAME} 2>/dev/null || true"
    log "Original container restored"

    # Send failure notification
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        curl -sf -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"ROLLBACK FAILED: ${APP_NAME} (deploy: ${DEPLOY_ID}) - service unhealthy after rollback, original container restored\"}" \
            2>/dev/null || true
    fi

    exit 1
fi

# --- Step 6: Cleanup old container ---
log "Cleaning up old container..."
remote_exec "docker rm ${CONTAINER_NAME}-rollback-${TIMESTAMP} 2>/dev/null || true"

# --- Step 7: Send notification ---
log "Rollback completed successfully"

NOTIFICATION_MSG="ROLLBACK SUCCESS: ${APP_NAME} rolled back from ${CURRENT_IMAGE} to ${ROLLBACK_IMAGE} (deploy: ${DEPLOY_ID})"

if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
    curl -sf -X POST "$NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"${NOTIFICATION_MSG}\"}" \
        2>/dev/null || log "WARNING: Failed to send notification"
fi

log "$NOTIFICATION_MSG"

# Write rollback report
REPORT_FILE="${SCRIPT_DIR}/reports/rollback_${APP_NAME}_${TIMESTAMP}.json"
mkdir -p "${SCRIPT_DIR}/reports"
cat > "$REPORT_FILE" <<EOF
{
    "app": "${APP_NAME}",
    "deploy_id": "${DEPLOY_ID}",
    "previous_image": "${CURRENT_IMAGE}",
    "rollback_image": "${ROLLBACK_IMAGE}",
    "status": "success",
    "healthy": true,
    "timestamp": "${TIMESTAMP}",
    "log_file": "${LOG_FILE}"
}
EOF

log "Report written to ${REPORT_FILE}"
exit 0
