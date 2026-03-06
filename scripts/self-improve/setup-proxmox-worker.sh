#!/usr/bin/env bash
# =============================================================================
# Setup Proxmox LXC 206 as a Dedicated Improvement Worker
#
# This script SSHes into the Proxmox host and provisions LXC 206 with all
# dependencies needed to run the self-improvement pipeline autonomously.
#
# Run from any machine with cloudflared installed.
#
# Usage:
#   ./setup-proxmox-worker.sh                   # Full setup
#   ./setup-proxmox-worker.sh --check           # Verify worker health
#   ./setup-proxmox-worker.sh --update          # Pull latest code + reinstall cron
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Proxmox connection ---
PVE_PASS="Nuoc.123"
PVE_SSH="sshpass -p \"${PVE_PASS}\" ssh -o StrictHostKeyChecking=no -o \"ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com\" root@ssh.tranthachnguyen.com"
CTID=206

# --- Worker config ---
WORKER_WORKSPACE="/opt/workspace"
WORKER_SCRIPTS="${WORKER_WORKSPACE}/tranthachnguyen-apps/scripts/self-improve"
REPO_URL="https://github.com/tranthachnguyen/TranThachnguyen.com.git"
WORKER_ID="proxmox-206"
HEARTBEAT_FILE="/tmp/worker-heartbeat.json"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Execute command on Proxmox host
pve_exec() {
    sshpass -p "${PVE_PASS}" ssh -o StrictHostKeyChecking=no \
        -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" \
        root@ssh.tranthachnguyen.com "$@"
}

# Execute command inside LXC 206
lxc_exec() {
    pve_exec "pct exec ${CTID} -- bash -c '$*'"
}

# =============================================================================
# Step 1: Create LXC 206 if it doesn't exist
# =============================================================================
create_container() {
    log_info "Checking if LXC ${CTID} exists..."

    local exists
    exists=$(pve_exec "pct list 2>/dev/null | grep -c '${CTID}' || echo 0")

    if [[ "$exists" -gt 0 ]]; then
        log_info "LXC ${CTID} already exists."
        local status
        status=$(pve_exec "pct status ${CTID} 2>/dev/null | awk '{print \$2}'" || echo "unknown")
        if [[ "$status" != "running" ]]; then
            log_info "Starting LXC ${CTID}..."
            pve_exec "pct start ${CTID}" || true
            sleep 5
        fi
        return 0
    fi

    log_info "Creating LXC ${CTID} (Ubuntu 24.04, 4GB RAM, 2 CPU, 20GB disk)..."

    # Check available templates
    local template
    template=$(pve_exec "ls /var/lib/vz/template/cache/ | grep -i 'ubuntu-24' | head -1" || echo "")
    if [[ -z "$template" ]]; then
        log_info "Downloading Ubuntu 24.04 template..."
        pve_exec "pveam update && pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst" || {
            # Try alternative template name
            template=$(pve_exec "pveam available --section system | grep ubuntu-24 | awk '{print \$2}' | head -1")
            if [[ -n "$template" ]]; then
                pve_exec "pveam download local ${template}"
                template=$(pve_exec "ls /var/lib/vz/template/cache/ | grep -i 'ubuntu-24' | head -1")
            fi
        }
        template=$(pve_exec "ls /var/lib/vz/template/cache/ | grep -i 'ubuntu-24' | head -1")
    fi

    if [[ -z "$template" ]]; then
        log_error "No Ubuntu 24.04 template found. Please download one manually."
        exit 1
    fi

    log_info "Using template: ${template}"

    pve_exec "pct create ${CTID} local:vztmpl/${template} \
        --hostname improvement-worker \
        --memory 4096 \
        --swap 2048 \
        --cores 2 \
        --rootfs local-lvm:20 \
        --net0 name=eth0,bridge=vmbr0,ip=dhcp \
        --features nesting=1 \
        --unprivileged 1 \
        --start 1"

    log_info "LXC ${CTID} created and started."
    sleep 10  # Wait for container networking
}

# =============================================================================
# Step 2: Install system dependencies inside LXC 206
# =============================================================================
install_dependencies() {
    log_info "Installing system dependencies in LXC ${CTID}..."

    lxc_exec "export DEBIAN_FRONTEND=noninteractive && \
        apt-get update -qq && \
        apt-get install -y -qq \
            curl wget git jq rsync unzip \
            build-essential ca-certificates gnupg \
            logrotate cron"

    # Install Node.js 22 LTS
    log_info "Installing Node.js 22 LTS..."
    lxc_exec "curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
        apt-get install -y -qq nodejs && \
        node --version && npm --version"

    # Install Docker
    log_info "Installing Docker..."
    lxc_exec "if ! command -v docker &>/dev/null; then
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    fi
    docker --version"

    # Install Claude Code CLI
    log_info "Installing Claude Code CLI..."
    lxc_exec "npm install -g @anthropic-ai/claude-code && claude --version 2>/dev/null || echo 'Claude CLI installed'"

    # Install GitHub CLI
    log_info "Installing GitHub CLI..."
    lxc_exec "if ! command -v gh &>/dev/null; then
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo 'deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' > /etc/apt/sources.list.d/github-cli.list
        apt-get update -qq && apt-get install -y -qq gh
    fi
    gh --version"

    log_info "All dependencies installed."
}

# =============================================================================
# Step 3: Clone repository and configure workspace
# =============================================================================
setup_workspace() {
    log_info "Setting up workspace at ${WORKER_WORKSPACE}..."

    lxc_exec "if [ -d '${WORKER_WORKSPACE}/.git' ]; then
        cd '${WORKER_WORKSPACE}'
        git fetch --all
        git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
        echo 'Repository updated.'
    else
        mkdir -p '$(dirname ${WORKER_WORKSPACE})'
        git clone '${REPO_URL}' '${WORKER_WORKSPACE}'
        echo 'Repository cloned.'
    fi"

    # Configure git identity
    lxc_exec "cd '${WORKER_WORKSPACE}' && \
        git config user.name 'Proxmox Improvement Worker' && \
        git config user.email 'worker-206@tranthachnguyen.com'"

    # Make scripts executable
    lxc_exec "chmod +x '${WORKER_SCRIPTS}'/*.sh 2>/dev/null || true"

    log_info "Workspace ready."
}

# =============================================================================
# Step 4: Configure environment variables
# =============================================================================
configure_environment() {
    log_info "Configuring environment variables..."

    lxc_exec "cat > /etc/environment << 'ENVEOF'
WORKER_ID=proxmox-206
WORKER_WORKSPACE=/opt/workspace
WORKER_SCRIPTS=/opt/workspace/tranthachnguyen-apps/scripts/self-improve
HEARTBEAT_FILE=/tmp/worker-heartbeat.json
NODE_ENV=production
ENVEOF"

    # Create the API key placeholder (user must fill this in)
    lxc_exec "if [ ! -f /opt/workspace/.env.worker ]; then
        cat > /opt/workspace/.env.worker << 'ENVEOF'
# Self-improvement worker environment
# Fill in your Anthropic API key:
ANTHROPIC_API_KEY=
# Optional: GitHub token for pushing changes
GITHUB_TOKEN=
ENVEOF
        echo 'Created .env.worker - PLEASE ADD YOUR ANTHROPIC_API_KEY'
    else
        echo '.env.worker already exists'
    fi"

    log_info "Environment configured. Remember to set ANTHROPIC_API_KEY in /opt/workspace/.env.worker"
}

# =============================================================================
# Step 5: Setup cron job (every 30 minutes)
# =============================================================================
setup_cron() {
    log_info "Setting up cron job..."

    lxc_exec "cat > /etc/cron.d/self-improve-worker << 'CRONEOF'
# Self-improvement worker - runs every 30 minutes
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

*/30 * * * * root /opt/workspace/tranthachnguyen-apps/scripts/self-improve/proxmox-worker.sh >> /var/log/self-improve-worker.log 2>&1
CRONEOF
    chmod 644 /etc/cron.d/self-improve-worker
    systemctl restart cron 2>/dev/null || service cron restart 2>/dev/null || true"

    log_info "Cron job installed (every 30 minutes)."
}

# =============================================================================
# Step 6: Setup log rotation
# =============================================================================
setup_logrotate() {
    log_info "Setting up log rotation..."

    lxc_exec "cat > /etc/logrotate.d/self-improve-worker << 'LOGEOF'
/var/log/self-improve-worker.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    size 50M
}

/opt/workspace/tranthachnguyen-apps/scripts/self-improve/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    size 50M
}
LOGEOF"

    log_info "Log rotation configured."
}

# =============================================================================
# Step 7: Create heartbeat service
# =============================================================================
setup_heartbeat() {
    log_info "Setting up heartbeat service..."

    lxc_exec "cat > /usr/local/bin/worker-heartbeat.sh << 'HBEOF'
#!/bin/bash
# Write heartbeat JSON for health monitoring
HEARTBEAT_FILE=\"/tmp/worker-heartbeat.json\"
WORKER_ID=\"proxmox-206\"

# Count running processes
ACTIVE_JOBS=\$(pgrep -c -f 'improve-app.sh' 2>/dev/null || echo 0)

# Disk usage
DISK_PCT=\$(df / --output=pcent | tail -1 | tr -d ' %')

# Memory usage
MEM_TOTAL=\$(free -m | awk '/^Mem:/{print \$2}')
MEM_USED=\$(free -m | awk '/^Mem:/{print \$3}')

# Last improvement log
LAST_LOG=\$(ls -t /opt/workspace/tranthachnguyen-apps/scripts/self-improve/logs/*.log 2>/dev/null | head -1)
LAST_LINE=\"\"
if [ -n \"\$LAST_LOG\" ]; then
    LAST_LINE=\$(tail -1 \"\$LAST_LOG\" 2>/dev/null | head -c 200)
fi

cat > \"\$HEARTBEAT_FILE\" << JSONEOF
{
  \"worker_id\": \"\$WORKER_ID\",
  \"timestamp\": \"\$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"status\": \"alive\",
  \"active_jobs\": \$ACTIVE_JOBS,
  \"disk_percent\": \$DISK_PCT,
  \"memory_total_mb\": \$MEM_TOTAL,
  \"memory_used_mb\": \$MEM_USED,
  \"uptime\": \"\$(uptime -p 2>/dev/null || uptime)\",
  \"last_log\": \"\$(echo \$LAST_LINE | sed 's/\"/\\\\\"/g')\"
}
JSONEOF
HBEOF
    chmod +x /usr/local/bin/worker-heartbeat.sh"

    # Add heartbeat to cron (every 5 minutes)
    lxc_exec "cat >> /etc/cron.d/self-improve-worker << 'CRONEOF'

# Heartbeat - every 5 minutes
*/5 * * * * root /usr/local/bin/worker-heartbeat.sh
CRONEOF"

    # Run it once now
    lxc_exec "/usr/local/bin/worker-heartbeat.sh"

    log_info "Heartbeat service configured (every 5 minutes)."
}

# =============================================================================
# Check mode: verify worker health
# =============================================================================
check_worker() {
    log_info "Checking Proxmox worker health..."

    # Check if container is running
    local status
    status=$(pve_exec "pct status ${CTID} 2>/dev/null | awk '{print \$2}'" || echo "not-found")
    echo "  Container status: ${status}"

    if [[ "$status" != "running" ]]; then
        log_error "LXC ${CTID} is not running!"
        return 1
    fi

    # Read heartbeat
    local heartbeat
    heartbeat=$(lxc_exec "cat ${HEARTBEAT_FILE} 2>/dev/null" || echo "{}")
    echo "  Heartbeat: ${heartbeat}"

    # Check key services
    echo ""
    echo "  Services:"
    echo -n "    Node.js: "
    lxc_exec "node --version 2>/dev/null || echo 'NOT INSTALLED'"
    echo -n "    Claude CLI: "
    lxc_exec "claude --version 2>/dev/null || echo 'NOT INSTALLED'"
    echo -n "    Docker: "
    lxc_exec "docker --version 2>/dev/null || echo 'NOT INSTALLED'"
    echo -n "    Git: "
    lxc_exec "git --version 2>/dev/null || echo 'NOT INSTALLED'"
    echo -n "    Cron: "
    lxc_exec "systemctl is-active cron 2>/dev/null || service cron status 2>/dev/null | head -1 || echo 'UNKNOWN'"

    # Check workspace
    echo ""
    echo -n "  Workspace: "
    lxc_exec "[ -d '${WORKER_WORKSPACE}/.git' ] && echo 'OK' || echo 'MISSING'"

    echo -n "  API Key: "
    lxc_exec "grep -q 'ANTHROPIC_API_KEY=sk-' /opt/workspace/.env.worker 2>/dev/null && echo 'SET' || echo 'NOT SET'"

    echo ""
    log_info "Health check complete."
}

# =============================================================================
# Update mode: pull latest code
# =============================================================================
update_worker() {
    log_info "Updating Proxmox worker..."

    lxc_exec "cd '${WORKER_WORKSPACE}' && git pull --rebase"
    lxc_exec "chmod +x '${WORKER_SCRIPTS}'/*.sh 2>/dev/null || true"

    # Reinstall cron in case it changed
    setup_cron

    log_info "Worker updated."
}

# =============================================================================
# Main
# =============================================================================
main() {
    local mode="${1:-setup}"

    case "$mode" in
        --check|-c)
            check_worker
            ;;
        --update|-u)
            update_worker
            ;;
        --help|-h)
            echo "Usage: setup-proxmox-worker.sh [--check|--update|--help]"
            echo ""
            echo "  (default)   Full setup of LXC 206 as improvement worker"
            echo "  --check     Verify worker health and dependencies"
            echo "  --update    Pull latest code and reinstall cron"
            ;;
        *)
            echo "=============================================="
            echo "  Proxmox Worker Setup (LXC ${CTID})"
            echo "=============================================="
            echo ""

            create_container
            echo ""
            install_dependencies
            echo ""
            setup_workspace
            echo ""
            configure_environment
            echo ""
            setup_cron
            echo ""
            setup_logrotate
            echo ""
            setup_heartbeat
            echo ""

            echo "=============================================="
            echo "  Setup Complete!"
            echo "=============================================="
            echo ""
            echo "Next steps:"
            echo "  1. Set ANTHROPIC_API_KEY in LXC 206:"
            echo "     pct exec ${CTID} -- nano /opt/workspace/.env.worker"
            echo ""
            echo "  2. Verify worker health:"
            echo "     ./setup-proxmox-worker.sh --check"
            echo ""
            echo "  3. Trigger a manual run:"
            echo "     pct exec ${CTID} -- bash ${WORKER_SCRIPTS}/proxmox-worker.sh"
            echo ""
            echo "  4. Monitor logs:"
            echo "     pct exec ${CTID} -- tail -f /var/log/self-improve-worker.log"
            echo ""
            ;;
    esac
}

main "$@"
