# Cloudify K3s Infrastructure

## Overview

This directory contains Kubernetes manifests for deploying Cloudify as a production-ready Vercel rival using K3d (K3s in Docker) on Proxmox LXC containers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Proxmox Host (192.168.0.50)                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ LXC 205          │  │ LXC 204          │  │ LXC 203          │  │
│  │ K3d Cluster      │  │ CF Tunnel        │  │ Cloudify App     │  │
│  │ • Docker + K3d   │  │ • cloudflared    │  │ • Next.js        │  │
│  │ • All K8s svcs   │  │ • routes traffic │  │ • PostgreSQL     │  │
│  │ 192.168.0.205    │  │ 192.168.0.204    │  │ 192.168.0.203    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  K3d Cluster Services (all on LXC 205):                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ MinIO :30900/901 │  │ Redis :30379     │  │ Site Router      │  │
│  │ • Build artifacts│  │ • KV store       │  │ • :30080         │  │
│  │ • Blob storage   │  │ • Job queue      │  │ • Nginx routing  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    Cloudflare Tunnel
                              ↓
                {project}.tranthachnguyen.com
```

**Note**: We use K3d (K3s in Docker) instead of native K3s due to LXC kernel parameter limitations. K3d runs the entire cluster inside Docker containers on LXC 205.

## Directory Structure

```
k8s/
├── namespaces/
│   └── namespaces.yaml      # cloudify-system, cloudify-builds, cloudify-sites
├── storage/
│   ├── minio.yaml           # Object storage (S3-compatible)
│   ├── redis.yaml           # KV store & job queue
│   └── registry.yaml        # Container registry
├── ingress/
│   └── site-router.yaml     # Dynamic subdomain routing
├── builds/
│   ├── build-job-template.yaml      # K8s Job template for builds
│   └── site-deployment-template.yaml # Template for deployed sites
├── secrets/
│   └── (secrets go here)
└── README.md
```

---

## Implementation Plan & Timeline

### Phase 1: K3s Infrastructure (Week 1-2)

| Task | Status | Description |
|------|--------|-------------|
| Create LXC 205 (K3d host) | ✅ | 4GB RAM, 2 cores, privileged |
| Create LXC 206 (unused) | ✅ | Reserved for future expansion |
| Install K3d cluster | ✅ | Docker + K3d on LXC 205 |
| Deploy namespaces | ✅ | Apply namespaces.yaml |
| Deploy MinIO | ✅ | Apply storage/minio.yaml |
| Deploy Redis | ✅ | Apply storage/redis.yaml |
| Deploy site-router | ✅ | Apply ingress/site-router.yaml |
| Update Cloudflare Tunnel | ✅ | Routes *.tranthachnguyen.com to K3s |
| Non-wildcard DNS setup | ✅ | Cloudflare API integration |

### Phase 2: Real Deployment Pipeline (Week 2-4)

| Task | Status | Description |
|------|--------|-------------|
| Create k8s-executor.ts | ⬜ | K8s Job management |
| Create artifact-manager.ts | ⬜ | MinIO operations |
| Update worker.ts | ⬜ | Use K8s executor |
| Update /api/deploy | ⬜ | Real implementation |
| Build log streaming | ⬜ | SSE endpoint |
| Site deployment creation | ⬜ | Dynamic K8s deployments |

### Phase 3: Serverless Functions (Week 4-5)

| Task | Status | Description |
|------|--------|-------------|
| Function executor | ⬜ | Docker-based execution |
| Pool manager | ⬜ | Warm container pools |
| Invoke API | ⬜ | POST /api/functions/[id]/invoke |
| BullMQ integration | ⬜ | Job queue for functions |

### Phase 4: Storage Backends (Week 5-6)

| Task | Status | Description |
|------|--------|-------------|
| MinIO client | ⬜ | lib/storage/minio-client.ts |
| Blob service | ⬜ | Upload/download/presigned URLs |
| KV service | ⬜ | Redis operations |
| KV sync | ⬜ | Redis ↔ Postgres sync |

### Phase 5: GitHub Integration (Week 6-7)

| Task | Status | Description |
|------|--------|-------------|
| GitHub App setup | ⬜ | Create app, configure |
| Commit status updates | ⬜ | pending/success/failure |
| PR preview deployments | ⬜ | Auto-deploy on PR |
| PR comments | ⬜ | Post preview URLs |

### Phase 6: Billing System (Week 7-8)

| Task | Status | Description |
|------|--------|-------------|
| Stripe integration | ⬜ | Customer, subscription |
| Pricing tiers | ⬜ | Free, Pro ($20/mo), Enterprise |
| Usage metering | ⬜ | Build minutes, bandwidth |
| Webhook handler | ⬜ | Stripe events |

### Phase 7: Notifications (Week 8-9)

| Task | Status | Description |
|------|--------|-------------|
| Notification service | ⬜ | Core notification logic |
| Slack integration | ⬜ | Deploy notifications |
| Discord integration | ⬜ | Webhook notifications |
| Custom webhooks | ⬜ | User-defined endpoints |

### Phase 8: Analytics Pipeline (Week 9-10)

| Task | Status | Description |
|------|--------|-------------|
| Client SDK | ⬜ | Embeddable analytics script |
| Ingestion API | ⬜ | High-volume event ingestion |
| Web Vitals | ⬜ | LCP, FID, CLS tracking |
| Real-time dashboard | ⬜ | SSE live updates |

### Phase 9: SSL & Domains (Week 10-11)

| Task | Status | Description |
|------|--------|-------------|
| Domain verification | ⬜ | DNS TXT records |
| Let's Encrypt | ⬜ | Auto SSL provisioning |
| Certificate renewal | ⬜ | Automation |

### Phase 10: Production Hardening (Week 11-12)

| Task | Status | Description |
|------|--------|-------------|
| Security audit | ⬜ | Input sanitization, rate limiting |
| Monitoring | ⬜ | Prometheus, alerting |
| E2E tests | ⬜ | Full deployment flow |
| Load testing | ⬜ | Performance validation |

---

## Quick Start (K3d Method)

### 1. Create LXC Container for K3d

```bash
# On Proxmox host (192.168.0.50)

# K3d Host (LXC 205) - privileged for Docker
pct create 205 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname k3d-host \
  --memory 4096 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.0.205/24,gw=192.168.0.1 \
  --storage local-lvm \
  --rootfs local-lvm:30 \
  --features nesting=1 \
  --unprivileged 0

# Add AppArmor unconfined for Docker
cat >> /etc/pve/lxc/205.conf << 'EOF'
lxc.apparmor.profile: unconfined
lxc.cap.drop:
lxc.cgroup2.devices.allow: a
lxc.mount.entry: /dev/kmsg dev/kmsg none defaults,bind,create=file
EOF

pct start 205
```

### 2. Install Docker and K3d

```bash
# SSH to LXC 205
ssh root@192.168.0.205

# Install Docker
apt-get update && apt-get install -y docker.io
systemctl enable docker && systemctl start docker

# Install K3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && mv kubectl /usr/local/bin/
```

### 3. Create K3d Cluster

```bash
# Create cluster with port mappings
k3d cluster create cloudify \
  --api-port 6443 \
  --servers 1 \
  --agents 1 \
  -p "30080:30080@agent:0" \
  -p "30379:30379@agent:0" \
  -p "30900:30900@agent:0" \
  -p "30901:30901@agent:0" \
  --k3s-arg "--disable=traefik@server:0"

# Merge kubeconfig
k3d kubeconfig merge cloudify --kubeconfig-merge-default

# Verify
kubectl get nodes
```

### 4. Deploy Cloudify Infrastructure

```bash
# Deploy namespaces
kubectl apply -f k8s/namespaces/namespaces.yaml

# Deploy storage
kubectl apply -f k8s/storage/minio.yaml
kubectl apply -f k8s/storage/redis.yaml

# Deploy site router
kubectl apply -f k8s/ingress/site-router.yaml

# Verify all pods are running
kubectl get pods -A
```

### 5. Copy Kubeconfig to Cloudify (LXC 203)

```bash
# On Proxmox host
pct exec 205 -- cat /root/.kube/config | \
  sed 's/127.0.0.1/192.168.0.205/g' > /tmp/k3s-kubeconfig

pct exec 203 -- mkdir -p /root/.kube
pct push 203 /tmp/k3s-kubeconfig /root/.kube/config
```

---

## Subdomain Routing

Cloudify uses **non-wildcard subdomains** for deployed projects to leverage free Cloudflare SSL:

### How It Works

1. When a project is deployed, Cloudify creates a CNAME record via Cloudflare API:
   - `myproject.tranthachnguyen.com` → `{tunnel-id}.cfargotunnel.com`

2. Cloudflare Tunnel routes the request to K3s site-router (192.168.0.205:30080)

3. Site-router proxies to the project's K8s service: `site-myproject.cloudify-sites.svc`

### Reserved Subdomains

These subdomains are NOT routed to deployed sites:
- `www`, `cloudify`, `api`, `admin`, `app`, `dashboard`, `console`, `mail`, `smtp`, `ftp`, `ssh`

### Creating DNS Records

```typescript
import { createProjectSubdomain, deleteProjectSubdomain } from '@/lib/integrations/cloudflare';

// On deploy
await createProjectSubdomain('myproject');
// Creates: myproject.tranthachnguyen.com → tunnel.cfargotunnel.com

// On delete
await deleteProjectSubdomain('myproject');
```

---

## Services & Ports

| Service | Namespace | ClusterIP Port | NodePort | Access URL |
|---------|-----------|----------------|----------|------------|
| minio | cloudify-system | 9000 | 30900 | http://192.168.0.205:30900 |
| minio-console | cloudify-system | 9001 | 30901 | http://192.168.0.205:30901 |
| redis | cloudify-system | 6379 | 30379 | redis://192.168.0.205:30379 |
| site-router | cloudify-sites | 80 | 30080 | http://192.168.0.205:30080 |

---

## Environment Variables

For Cloudify app (LXC 203) to connect to K3s services:

```bash
# K3s Configuration
KUBECONFIG=/root/.kube/config
K3S_ENABLED=true

# MinIO (NodePort on LXC 205)
MINIO_ENDPOINT=192.168.0.205
MINIO_PORT=30900
MINIO_ACCESS_KEY=cloudify
MINIO_SECRET_KEY=cloudify-minio-secret-key-change-in-production
MINIO_USE_SSL=false

# Redis (NodePort on LXC 205)
REDIS_URL=redis://192.168.0.205:30379

# Cloudflare (for subdomain creation)
CLOUDFLARE_API_TOKEN=<your-token>
CLOUDFLARE_ZONE_ID=<your-zone-id>
CLOUDFLARE_TUNNEL_ID=<your-tunnel-id>
BASE_DOMAIN=tranthachnguyen.com
```

---

## Verification Checklist

After setup, verify:

- [x] `kubectl get nodes` shows k3d nodes Ready
- [x] `kubectl get pods -n cloudify-system` shows MinIO, Redis running
- [x] `kubectl get pods -n cloudify-sites` shows site-router running
- [x] MinIO console accessible at http://192.168.0.205:30901
- [x] Site router health check: `curl http://192.168.0.205:30080/health`
- [x] Cloudflare tunnel routes traffic to site-router

---

## Troubleshooting

### K3s won't install on LXC (kernel parameter errors)

Native K3s requires `/proc/sys` to be writable, which isn't possible in LXC. Use K3d instead:
- K3d runs K3s inside Docker containers
- Docker handles the kernel requirements internally

### Docker fails with AppArmor errors

Add to LXC config:
```
lxc.apparmor.profile: unconfined
```

### Site-router returns 502

Check if the target service exists:
```bash
kubectl get svc -n cloudify-sites
```

---

## Estimated Total Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. K3s Infrastructure | 2 weeks | Week 2 ✅ |
| 2. Deployment Pipeline | 2 weeks | Week 4 |
| 3. Serverless Functions | 1 week | Week 5 |
| 4. Storage Backends | 1 week | Week 6 |
| 5. GitHub Integration | 1 week | Week 7 |
| 6. Billing System | 1 week | Week 8 |
| 7. Notifications | 1 week | Week 9 |
| 8. Analytics | 1 week | Week 10 |
| 9. SSL/Domains | 1 week | Week 11 |
| 10. Hardening | 1 week | Week 12 |

**Total: ~12 weeks to production-ready Vercel rival**
