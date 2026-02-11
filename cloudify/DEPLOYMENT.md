# Cloudify Deployment Guide

This guide covers deploying Cloudify to a production environment.

## Prerequisites

- Docker installed on the host
- PostgreSQL database
- Redis instance
- MinIO or S3-compatible storage
- Nginx for reverse proxy
- Cloudflare tunnel (optional, for HTTPS)

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
| `AUTH_SECRET` | NextAuth secret (min 32 chars) | `cloudify-auth-secret-change-in-production-min-32` |
| `AUTH_URL` | Public URL of the application | `https://cloudify.example.com` |
| `BASE_DOMAIN` | Base domain for deployed sites | `example.com` |

### Build Pipeline Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_DOCKER_ISOLATION` | Run builds in Docker containers | `true` |
| `REPOS_DIR` | Directory for cloning repositories | `/data/repos` |
| `BUILDS_DIR` | Directory for build artifacts | `/data/builds` |

> **Note**: Set `USE_DOCKER_ISOLATION=false` when running Cloudify inside a container without Docker-in-Docker support.

### OAuth Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

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

For HTTPS with wildcard subdomains, configure the Cloudflare tunnel:

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
- [ ] Configure Cloudflare tunnel for wildcard subdomain
- [ ] Set up database migrations: `npx prisma migrate deploy`

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

### OAuth login fails

Check that:
1. `AUTH_URL` matches the public URL
2. OAuth redirect URIs are configured correctly in GitHub/Google
3. `AUTH_SECRET` is at least 32 characters
4. Cookies work (HTTPS required for secure cookies)

## Database Migrations

After updating Cloudify, run migrations:

```bash
docker exec cloudify npx prisma migrate deploy
```

Or rebuild the image which runs migrations on startup.
