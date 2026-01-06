#!/bin/bash
set -e

# ============================================
# Deploy to Proxmox LXC Container 201
# ============================================
# This script deploys ALL services exclusively to LXC container 201
# Nothing runs on the Proxmox host itself - it only acts as a pass-through
# ============================================

# Configuration
PROXMOX_USER="root"
PROXMOX_HOST="192.168.0.50"
LXC_CONTAINER_ID="201"
REMOTE_PATH="/opt/tranthachnguyen"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get password from environment or prompt
if [ -z "$PROXMOX_PASS" ]; then
    read -s -p "Enter Proxmox password: " PROXMOX_PASS
    echo ""
fi

# SSH command helper
SSH_HOST="sshpass -p '${PROXMOX_PASS}' ssh -o StrictHostKeyChecking=no ${PROXMOX_USER}@${PROXMOX_HOST}"
RSYNC_CMD="sshpass -p '${PROXMOX_PASS}' rsync"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Deploying to Proxmox LXC Container ${LXC_CONTAINER_ID}                  ║${NC}"
echo -e "${BLUE}║     All apps run INSIDE container - NOT on host            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# ============================================
# STEP 1: Pre-flight checks
# ============================================
echo -e "\n${YELLOW}[1/6] Running pre-flight checks...${NC}"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass...${NC}"
    brew install hudochenkov/sshpass/sshpass 2>/dev/null || brew install sshpass 2>/dev/null
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env with your GEMINI_API_KEY"
    exit 1
fi

# Check SSH connectivity to Proxmox host
if ! eval "$SSH_HOST 'echo OK'" 2>/dev/null; then
    echo -e "${RED}Cannot connect to Proxmox host ${PROXMOX_HOST}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection to Proxmox host successful${NC}"

# Verify LXC container 201 exists and is running
echo -e "${YELLOW}   Checking LXC container ${LXC_CONTAINER_ID}...${NC}"
CONTAINER_STATUS=$(eval "$SSH_HOST 'pct status ${LXC_CONTAINER_ID} 2>/dev/null || echo NOTFOUND'")
if [[ "$CONTAINER_STATUS" == *"NOTFOUND"* ]]; then
    echo -e "${RED}Error: LXC container ${LXC_CONTAINER_ID} does not exist!${NC}"
    exit 1
fi
if [[ "$CONTAINER_STATUS" != *"running"* ]]; then
    echo -e "${YELLOW}   Starting LXC container ${LXC_CONTAINER_ID}...${NC}"
    eval "$SSH_HOST 'pct start ${LXC_CONTAINER_ID}'"
    sleep 3
fi
echo -e "${GREEN}✓ LXC container ${LXC_CONTAINER_ID} is running${NC}"

# ============================================
# STEP 2: Clean up any apps on Proxmox host
# ============================================
echo -e "\n${YELLOW}[2/6] Ensuring no apps run on Proxmox host (host is pass-through only)...${NC}"
eval "$SSH_HOST" << 'CLEANUP_SCRIPT'
# Stop and remove any Docker containers on the HOST (not in LXC)
if command -v docker &> /dev/null; then
    RUNNING_CONTAINERS=$(docker ps -q 2>/dev/null || true)
    if [ -n "$RUNNING_CONTAINERS" ]; then
        echo "Stopping Docker containers on host..."
        docker stop $RUNNING_CONTAINERS 2>/dev/null || true
        docker rm $RUNNING_CONTAINERS 2>/dev/null || true
    fi
fi

# Remove any app files from host (they should only be in container)
# Note: We keep a temp staging area but clean it after transfer
echo "Host cleanup complete - no apps will run here"
CLEANUP_SCRIPT
echo -e "${GREEN}✓ Proxmox host is clean (pass-through only)${NC}"

# ============================================
# STEP 3: Sync files to temporary staging on host
# ============================================
echo -e "\n${YELLOW}[3/6] Syncing files to Proxmox host (temporary staging)...${NC}"

# Create temp staging directory
STAGING_DIR="/tmp/tranthachnguyen-deploy-$$"
eval "$SSH_HOST 'mkdir -p ${STAGING_DIR}'"

# Rsync to staging
eval "$RSYNC_CMD -avz --progress \
    -e \"sshpass -p '${PROXMOX_PASS}' ssh -o StrictHostKeyChecking=no\" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.vite' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude 'legacy' \
    --exclude '*/node_modules' \
    ./ ${PROXMOX_USER}@${PROXMOX_HOST}:${STAGING_DIR}/"
echo -e "${GREEN}✓ Files synced to staging area${NC}"

# ============================================
# STEP 4: Transfer files into LXC container 201
# ============================================
echo -e "\n${YELLOW}[4/6] Transferring files into LXC container ${LXC_CONTAINER_ID}...${NC}"
eval "$SSH_HOST" << TRANSFER_SCRIPT
set -e

# Create app directory inside LXC container
pct exec ${LXC_CONTAINER_ID} -- mkdir -p ${REMOTE_PATH}

# Transfer files using tar (works with all storage types including LVM)
cd ${STAGING_DIR}
tar cf - . | pct exec ${LXC_CONTAINER_ID} -- tar xf - -C ${REMOTE_PATH}

# Clean up staging directory on host (host should have nothing)
rm -rf ${STAGING_DIR}

echo "Files transferred to LXC ${LXC_CONTAINER_ID} at ${REMOTE_PATH}"
TRANSFER_SCRIPT
echo -e "${GREEN}✓ Files transferred to LXC container${NC}"

# ============================================
# STEP 5: Setup Docker inside LXC container
# ============================================
echo -e "\n${YELLOW}[5/6] Setting up Docker inside LXC container ${LXC_CONTAINER_ID}...${NC}"
eval "$SSH_HOST" << 'DOCKER_SETUP'
pct exec 201 -- bash -c '
# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get update
    apt-get install -y docker.io docker-compose-plugin curl
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
    # Ensure docker-compose-plugin is installed (V2)
    apt-get update && apt-get install -y docker-compose-plugin 2>/dev/null || true
    systemctl start docker 2>/dev/null || true
fi

# Verify Docker is working
docker --version
docker compose version
'
DOCKER_SETUP
echo -e "${GREEN}✓ Docker ready in LXC container${NC}"

# ============================================
# STEP 6: Build and start all containers INSIDE LXC
# ============================================
echo -e "\n${YELLOW}[6/6] Building and starting all apps inside LXC container ${LXC_CONTAINER_ID}...${NC}"
eval "$SSH_HOST" << DEPLOY_SCRIPT
pct exec ${LXC_CONTAINER_ID} -- bash -c '
cd ${REMOTE_PATH}

echo "=== Stopping and removing ALL existing containers ==="
docker compose down --remove-orphans 2>/dev/null || true
# Force remove any lingering containers by name to avoid conflicts
docker rm -f cloudflared landing-page nanoedit-ai passport-photo-ai illinois-driver-study linguaflow comic-news devops-study devops-game 2>/dev/null || true

echo ""
echo "=== Building and starting all services (no cache) ==="
docker compose build --no-cache
docker compose up -d

echo ""
echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Running Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
'
DEPLOY_SCRIPT

# ============================================
# Deployment Complete
# ============================================
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Architecture:${NC}"
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  Proxmox Host (192.168.0.50) - Pass-through only       │"
echo "  │    └── LXC Container 201                               │"
echo "  │          └── Docker Containers (ALL APPS HERE)         │"
echo "  │               ├── cloudflared (Cloudflare Tunnel)      │"
echo "  │               ├── landing-page                         │"
echo "  │               ├── nanoedit-ai                          │"
echo "  │               ├── passport-photo-ai                    │"
echo "  │               ├── illinois-driver-study                │"
echo "  │               ├── linguaflow                           │"
echo "  │               ├── comic-news                           │"
echo "  │               ├── devops-study                         │"
echo "  │               └── devops-game                          │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  • https://tranthachnguyen.com"
echo "  • https://photoedit.tranthachnguyen.com"
echo "  • https://passportphoto.tranthachnguyen.com"
echo "  • https://illinoisdriverstudy.tranthachnguyen.com"
echo "  • https://linguaflow.tranthachnguyen.com"
echo "  • https://comicnews.tranthachnguyen.com"
echo "  • https://devopsstudy.tranthachnguyen.com"
echo "  • https://devopsgame.tranthachnguyen.com"
echo ""
echo -e "${BLUE}Management (SSH into Proxmox, then into LXC):${NC}"
echo "  # From your Mac:"
echo "  ssh root@192.168.0.50"
echo "  pct enter 201"
echo ""
echo "  # Inside LXC container 201:"
echo "  cd ${REMOTE_PATH}"
echo "  docker compose logs -f              # View all logs"
echo "  docker compose logs -f devops-game  # View specific app logs"
echo "  docker compose restart devops-game  # Restart specific app"
echo "  docker compose down                 # Stop all"
echo "  docker compose up -d --build        # Rebuild and start"
echo ""
