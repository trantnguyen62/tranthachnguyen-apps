# Infrastructure

Docker-based deployment for tranthachnguyen.com services on Proxmox.

## Architecture

```
Internet -> Cloudflare -> cloudflared (systemd) -> Docker containers (host ports)
```

## Services & Ports

| Service | Port | Domain |
|---------|------|--------|
| landing-page | 8080 | tranthachnguyen.com |
| nanoedit-web | 5173 | photoedit.tranthachnguyen.com |
| nanoedit-api | 5174 | (internal API) |
| passport-photo | 5185 | passportphoto.tranthachnguyen.com |
| illinois-driver | 4000 | illinoisdriverstudy.tranthachnguyen.com |
| linguaflow-web | 3000 | linguaflow.tranthachnguyen.com |
| linguaflow-ws | 3001 | (WebSocket proxy) |
| linguaflow-api | 3002 | (API server) |
| comic-news | 5187 | comicnews.tranthachnguyen.com |

## Deployment

```bash
# SSH to Proxmox container
ssh root@<proxmox-ip>
pct exec 201 -- bash

# Navigate to infra
cd /root/stack-v2/infra/compose

# Create .env file
cp .env.example .env
# Edit .env and add GEMINI_API_KEY

# Build and start
docker compose up -d --build

# Cloudflared runs as systemd service
systemctl status cloudflared
```

## Files

- `compose/compose.yml` - Docker Compose configuration
- `compose/.env.example` - Environment variables template
- `cloudflared/config.yml` - Tunnel routing (used by systemd cloudflared)
- `caddy/` - Caddy config (not used in current setup)
