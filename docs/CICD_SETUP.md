# CI/CD Setup Guide

## Required GitHub Secrets

Before the pipeline works, add these secrets to your repository:

**Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `PROXMOX_HOST` | Server IP | `192.168.0.50` |
| `PROXMOX_USER` | SSH username | `root` |
| `PROXMOX_SSH_KEY` | Base64 encoded private key | See below |
| `GEMINI_API_KEY` | Your Gemini API key | From Google AI Studio |

## Setting Up SSH Key Authentication

### 1. Generate a new SSH key pair (on your Mac)

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key
```

### 2. Copy the public key to Proxmox

```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@192.168.0.50
```

### 3. Test the connection

```bash
ssh -i ~/.ssh/github_deploy_key root@192.168.0.50 "echo 'SSH OK'"
```

### 4. Base64 encode the private key and add to GitHub

```bash
base64 -i ~/.ssh/github_deploy_key | pbcopy
```

Then paste the copied value as the `PROXMOX_SSH_KEY` secret in GitHub.

## Creating GitHub Environment

For added security, create a `production` environment:

1. Go to **Settings → Environments → New environment**
2. Name it `production`
3. (Optional) Add required reviewers for manual approval before deploy
4. (Optional) Limit deployments to `main` branch only

## How the Pipeline Works

### Automatic Deployments (ci.yml)

```
Push to main → Detect changed apps → Build only changed → Deploy to Proxmox
```

- Only builds apps that have file changes
- All builds run in parallel for speed
- Deploy only runs if ALL builds pass
- Pull requests get builds but NOT deploys

### Manual Deployments (deploy.yml)

1. Go to **Actions → Manual Deploy → Run workflow**
2. Optionally enable "Force rebuild all containers"
3. Click **Run workflow**

## Workflow Status Badges

Add these to your README:

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/tranthachnguyen-apps/actions/workflows/ci.yml/badge.svg)
```

## Troubleshooting

### "Permission denied" during SSH
- Verify SSH key is correctly base64 encoded
- Check key was added to Proxmox `~/.ssh/authorized_keys`

### Build fails for specific app
- Check the build logs for that job
- Test locally with `docker build -t test ./app-folder`

### Deploy fails but builds pass
- Verify all GitHub secrets are set correctly
- Check Proxmox server is reachable from GitHub (public IP required)

> **Note:** If your Proxmox is behind NAT without public access, you'll need a VPN or Cloudflare Tunnel for GitHub to reach it.
