# Skill: deploy-app

## Description
Deploy a specific app to its Proxmox production target (LXC container).

## Triggers
- "deploy <app>"
- "ship <app>"
- "push <app> to production"
- "deploy cloudify"
- "ship landing-page"

## What It Does
1. Reads app config from `config.json` to determine deploy target
2. Builds Docker image on the build machine (LXC 201)
3. Transfers image to the target LXC container (if different from 201)
4. Restarts the service via docker-compose
5. Optionally restarts cloudflared if routes changed
6. Validates deployment via production URL health check

## Configuration
- **Config**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/config.json
- **Deploy script**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/cron-deploy.sh
- **Validate script**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/validate-deploy.sh

## Deploy Targets
| Target | IP | Apps |
|--------|-----|------|
| lxc201 | 192.168.0.201 | landing-page, nanoedit-ai, passport-photo-ai, linguaflow, quill, and more |
| lxc202 | 192.168.0.100 | pet-services, digital-creators, local-services, and more |
| lxc203 | 192.168.0.203 | cloudify, cloudify-docs |
| none | - | Stock predictors, iOS apps, dev-only apps |

## SSH Access
```bash
# Via Cloudflare Tunnel
sshpass -p "Nuoc.123" ssh -o StrictHostKeyChecking=no \
  -o "ProxyCommand=cloudflared access ssh --hostname ssh.tranthachnguyen.com" \
  root@ssh.tranthachnguyen.com "pct exec <LXC_ID> -- bash -c 'COMMAND'"
```

## Deployment Workflow
```bash
# 1. Build on LXC 201
pct exec 201 -- docker build -t <app>:latest /opt/tranthachnguyen-apps/<app>/

# 2. Save and transfer (if target != 201)
pct exec 201 -- docker save <app>:latest -o /tmp/<app>.tar
pct pull 201 /tmp/<app>.tar /tmp/<app>.tar
pct push <TARGET> /tmp/<app>.tar /tmp/<app>.tar
pct exec <TARGET> -- docker load -i /tmp/<app>.tar

# 3. Restart service
pct exec <TARGET> -- docker-compose -f /opt/docker-compose.yml up -d <app>

# 4. Validate
curl -s -o /dev/null -w "%{http_code}" https://<app>.tranthachnguyen.com
```

## Usage Examples

### Example 1
```
User: deploy cloudify
Action: Build on LXC 201, transfer to LXC 203, restart, validate
```

### Example 2
```
User: ship landing-page to production
Action: Build on LXC 201, restart docker-compose, validate
```

## Safety
- Build must succeed before deployment
- Rollback available via `rollback.sh`
- Validate deployment via production URL
- Wait 1-5 minutes for DNS propagation before debugging 404s

---
*Part of the self-improvement pipeline for tranthachnguyen-apps*
