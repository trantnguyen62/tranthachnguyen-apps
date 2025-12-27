#!/bin/bash
set -e

# ============================================
# Deploy to Proxmox Server
# ============================================
# This script deploys all services to your Proxmox server
# and starts them with Docker Compose + Cloudflare Tunnel
# ============================================

# Configuration
PROXMOX_USER="root"
PROXMOX_HOST="192.168.0.50"
REMOTE_PATH="/opt/tranthachnguyen"

# Get password from environment or prompt
if [ -z "$PROXMOX_PASS" ]; then
    read -s -p "Enter Proxmox password: " PROXMOX_PASS
    echo ""
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# SSH/SCP commands with sshpass
SSH_CMD="sshpass -p '${PROXMOX_PASS}' ssh -o StrictHostKeyChecking=no ${PROXMOX_USER}@${PROXMOX_HOST}"
RSYNC_CMD="sshpass -p '${PROXMOX_PASS}' rsync"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploying to Proxmox Server${NC}"
echo -e "${GREEN}========================================${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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

# Check SSH connectivity
echo -e "\n${YELLOW}[1/5] Testing SSH connection...${NC}"
if ! eval "$SSH_CMD 'echo SSH OK'" 2>/dev/null; then
    echo -e "${RED}Cannot connect to ${PROXMOX_HOST}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"

# Create remote directory
echo -e "\n${YELLOW}[2/5] Preparing remote directory...${NC}"
eval "$SSH_CMD 'mkdir -p ${REMOTE_PATH}'"
echo -e "${GREEN}✓ Remote directory ready${NC}"

# Sync files to Proxmox (excluding unnecessary files)
echo -e "\n${YELLOW}[3/5] Syncing files to Proxmox...${NC}"
eval "$RSYNC_CMD -avz --progress \
    -e \"sshpass -p '${PROXMOX_PASS}' ssh -o StrictHostKeyChecking=no\" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.vite' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude 'legacy' \
    --exclude 'personal-website/node_modules' \
    --exclude 'passport-photo-ai/node_modules' \
    ./ ${PROXMOX_USER}@${PROXMOX_HOST}:${REMOTE_PATH}/"
echo -e "${GREEN}✓ Files synced${NC}"

# Install Docker if not present and start services
echo -e "\n${YELLOW}[4/5] Setting up Docker on Proxmox...${NC}"
eval "$SSH_CMD" << 'REMOTE_SCRIPT'
set -e

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Ensure Docker is running
systemctl start docker 2>/dev/null || true
REMOTE_SCRIPT
echo -e "${GREEN}✓ Docker ready${NC}"

# Build and start containers
echo -e "\n${YELLOW}[5/5] Building and starting containers...${NC}"
eval "$SSH_CMD" << REMOTE_SCRIPT
set -e
cd ${REMOTE_PATH}

# Stop existing containers if running
docker-compose down 2>/dev/null || true

# Build and start all services
docker-compose up -d --build

# Show status
echo ""
echo "Container Status:"
docker-compose ps
REMOTE_SCRIPT

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your services are now running on Proxmox."
echo "Cloudflare Tunnel is handling external access."
echo ""
echo "Services:"
echo "  - https://tranthachnguyen.com"
echo "  - https://photoedit.tranthachnguyen.com"
echo "  - https://passportphoto.tranthachnguyen.com"
echo "  - https://illinoisdriverstudy.tranthachnguyen.com"
echo "  - https://linguaflow.tranthachnguyen.com"
echo "  - https://comicnews.tranthachnguyen.com"
echo ""
echo "Management commands (run on Proxmox):"
echo "  cd ${REMOTE_PATH}"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose restart <name>   # Restart a service"
echo "  docker-compose down             # Stop all"
echo "  docker-compose up -d --build    # Rebuild and start"
echo ""
