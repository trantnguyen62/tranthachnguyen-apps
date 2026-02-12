# Cloudify Deployment Guide

This guide covers deploying Cloudify to a production environment.

## Prerequisites

- Docker installed on the host
- PostgreSQL database
- Redis instance
- MinIO or S3-compatible storage
- Nginx for reverse proxy (or Cloudflare Tunnel)

## Container Architecture

| Container | Purpose | Port |
|-----------|---------|------|
| cloudify | Next.js application | 3000 |
| cloudify-db | PostgreSQL database | 5432 |
| cloudify-redis | Redis cache | 6379 |
| cloudify-minio | S3-compatible storage | 9000/9001 |
| cloudify-nginx | Reverse proxy | 8080 |

## Required Directories

Create the following directories on the host:

```bash
mkdir -p /data/builds /data/repos
chown -R 1001:1001 /data
```

> **Important**: The Cloudify container runs as user `nextjs` (uid 1001). The /data directory must be writable by this user.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://cloudify:pass@cloudify-db:5432/cloudify` |
| `REDIS_URL` | Redis connection string | `redis://cloudify-redis:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `openssl rand -base64 32` |
| `AUTH_SECRET` | NextAuth secret (min 32 chars) | `openssl rand -base64 32` |
| `AUTH_URL` | Public URL of the application | `https://cloudify.example.com` |
| `BASE_DOMAIN` | Base domain for deployed sites | `example.com` |

### Build Pipeline Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BUILDS_DIR` | Directory for build artifacts | `/data/builds` |
| `REPOS_DIR` | Directory for cloning repositories | `/data/repos` |
| `USE_DOCKER_ISOLATION` | Run builds in Docker containers | `true` |
| `USE_K3S_BUILDS` | Use K3s cluster for builds | `false` |

> **Note**: Set `USE_DOCKER_ISOLATION=false` when running Cloudify inside a container without Docker-in-Docker support.

### GitHub Integration Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying GitHub webhook payloads |
| `GITHUB_APP_ID` | GitHub App ID (optional, for enhanced integration) |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key (PEM format) |
| `GITHUB_CLIENT_ID` | GitHub App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub App client secret |
| `GITHUB_TOKEN` | Personal access token for repo access |

### Cloudflare Variables

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Zone:DNS:Edit permissions |
| `CLOUDFLARE_ZONE_ID` | Zone ID (optional, auto-detected) |
| `CLOUDFLARE_TUNNEL_ID` | Tunnel ID for routing traffic |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID for Workers APIs |

### Billing Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Pro monthly |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Stripe price ID for Pro yearly |
| `STRIPE_TEAM_MONTHLY_PRICE_ID` | Stripe price ID for Team monthly |
| `STRIPE_TEAM_YEARLY_PRICE_ID` | Stripe price ID for Team yearly |

See `.env.example` for the complete list of environment variables.

## Docker Run Command

```bash
docker run -d --name cloudify \
  --network cloudify_default \
  -p 3000:3000 \
  -v /data:/data \
  --env-file /opt/cloudify/.env.secrets \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://cloudify:password@cloudify-db:5432/cloudify \
  -e REDIS_URL=redis://cloudify-redis:6379 \
  -e JWT_SECRET=your-jwt-secret-minimum-32-characters \
  -e AUTH_SECRET=your-auth-secret-minimum-32-characters \
  -e AUTH_URL=https://cloudify.example.com \
  -e BASE_DOMAIN=example.com \
  -e USE_DOCKER_ISOLATION=false \
  cloudify:latest
```

## Nginx Configuration

Configure Nginx to serve static sites from `/data/builds`:

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.example\.com$;

    location / {
        root /data/builds/$subdomain;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Mount the builds directory into the nginx container:

```bash
docker run -d --name cloudify-nginx \
  --network cloudify_default \
  -p 8080:80 \
  -v /data/builds:/data/builds:ro \
  -v /opt/cloudify/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine
```

## Cloudflare Tunnel Configuration

For HTTPS with subdomains, configure the Cloudflare tunnel:

```yaml
# /etc/cloudflared/config.yml
tunnel: your-tunnel-id
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: "*.example.com"
    service: http://192.168.x.x:8080
  - hostname: cloudify.example.com
    service: http://192.168.x.x:3000
  - service: http_status:404
```

> **Note**: Cloudify uses non-wildcard CNAME records per project for free Cloudflare SSL. Wildcard SSL requires Cloudflare Advanced Certificate Manager.

## Health Check

The `/api/health` endpoint provides system status:

```bash
curl https://cloudify.example.com/api/health
```

Response includes checks for:
- Database connectivity
- Redis connectivity
- Build pipeline (git availability, directory permissions)

## Deployment Checklist

Before deploying:

- [ ] Create `/data/builds` and `/data/repos` directories
- [ ] Set ownership: `chown -R 1001:1001 /data`
- [ ] Mount volume: `-v /data:/data`
- [ ] Set `USE_DOCKER_ISOLATION=false` (if no Docker-in-Docker)
- [ ] Set `BASE_DOMAIN` for deployment URLs
- [ ] Configure nginx to serve from `/data/builds`
- [ ] Configure Cloudflare tunnel for subdomain routing
- [ ] Run database migrations: `npx prisma db push`
- [ ] Set `GITHUB_WEBHOOK_SECRET` and configure GitHub webhook

## Database Migrations

After updating Cloudify, push schema changes:

```bash
docker exec cloudify npx prisma db push
```

Or rebuild the image which runs migrations on startup.

## Troubleshooting

### Build fails with "git: command not found"

Ensure git is installed in the Docker image. The Dockerfile should include:

```dockerfile
RUN apt-get update && apt-get install -y git
```

### Build fails with "spawn docker ENOENT"

Set `USE_DOCKER_ISOLATION=false` to run builds directly without Docker isolation.

### Permission denied on /data

The container runs as uid 1001. Fix ownership:

```bash
chown -R 1001:1001 /data
```

### Repository clone fails with "Remote branch main not found"

The repository may use `master` instead of `main`. Either:
1. Specify the correct branch when creating the project
2. Update the project's `repoBranch` field in the database

### Login fails

Check that:
1. `AUTH_URL` matches the public URL
2. `JWT_SECRET` and `AUTH_SECRET` are at least 32 characters
3. Cookies work (HTTPS required for secure cookies in production)
4. Database is accessible and schema is up to date
