# Proxmox Deployment Guide

## Overview

This deploys all tranthachnguyen.com services to your Proxmox server with **Cloudflare Tunnel included** - no port forwarding needed!

## Services

| Service | Domain |
|---------|--------|
| landing-page | tranthachnguyen.com |
| nanoedit-ai | photoedit.tranthachnguyen.com |
| passport-photo-ai | passportphoto.tranthachnguyen.com |
| illinois-driver-study | illinoisdriverstudy.tranthachnguyen.com |
| linguaflow | linguaflow.tranthachnguyen.com |
| comic-news | comicnews.tranthachnguyen.com |

## Quick Deploy (Recommended)

### Prerequisites
1. Proxmox container/VM with SSH access
2. SSH key authentication set up (`ssh-copy-id root@192.168.0.50`)
3. `.env` file with your `GEMINI_API_KEY`

### One-Command Deploy

```bash
./deploy-to-proxmox.sh
```

This script will:
- Test SSH connectivity
- Sync all files to Proxmox
- Install Docker if needed
- Build and start all containers
- Start Cloudflare Tunnel automatically

### After Deployment

Stop your local Mac services:
```bash
./legacy/stop-all-services.sh
```

---

## Manual Deployment (Alternative)

### 1. Copy files to Proxmox

```bash
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    ./ root@192.168.0.50:/opt/tranthachnguyen/
```

### 2. SSH and start services

```bash
ssh root@192.168.0.50
cd /opt/tranthachnguyen

# Install Docker if needed
apt update && apt install -y docker.io docker-compose
systemctl enable docker && systemctl start docker

# Start all services
docker-compose up -d --build
```

## Managing Services

```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart nanoedit-ai

# View logs for a specific service
docker-compose logs -f linguaflow

# Rebuild and restart a specific service
docker-compose up -d --build passport-photo-ai
```

## Cloudflare Tunnel Setup

If you're using Cloudflare Tunnels for external access, update your tunnel config to point to the new Proxmox container IP:

```yaml
# Example cloudflared config
ingress:
  - hostname: tranthachnguyen.com
    service: http://<container-ip>:8080
  - hostname: photoedit.tranthachnguyen.com
    service: http://<container-ip>:5173
  - hostname: passportphoto.tranthachnguyen.com
    service: http://<container-ip>:5185
  - hostname: ildriver.tranthachnguyen.com
    service: http://<container-ip>:4000
  - hostname: linguaflow.tranthachnguyen.com
    service: http://<container-ip>:3000
  - service: http_status:404
```

## Cleanup Mac Services

After confirming everything works on Proxmox, disable the Mac services:

```bash
# On your Mac
cd /Users/trannguyen/Documents/Tranthachnguyen.com

# Stop all services
./stop-all-services.sh

# Remove LaunchAgents (if installed)
launchctl unload ~/Library/LaunchAgents/com.tranthachnguyen.services.plist 2>/dev/null
launchctl unload ~/Library/LaunchAgents/com.tranthachnguyen.health-monitor.plist 2>/dev/null
rm -f ~/Library/LaunchAgents/com.tranthachnguyen.*.plist
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs <service-name>
```

### Port already in use
```bash
# Find what's using the port
netstat -tlnp | grep <port>
# Or change the host port in docker-compose.yml
```

### API key not working
```bash
# Verify env is loaded
docker-compose exec nanoedit-ai env | grep GEMINI
```
