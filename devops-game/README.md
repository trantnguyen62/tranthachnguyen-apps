# 🎮 DevOps Defender

A 2D space shooter game that teaches DevOps concepts through gameplay. Answer questions correctly to defeat enemies and progress through topic zones!

## 🎯 Game Modes

| Mode | Description |
|------|-------------|
| **Adventure** | Progress through all 12 DevOps topic zones, 5 waves each |
| **Endless** | Survive as long as possible with increasing difficulty |
| **Speed Quiz** | Race against the clock — answer fast for maximum points |
| **Practice** | Choose a specific topic zone to drill |

## 📚 Topics Covered

| Topic | Skills |
|-------|--------|
| 🐳 Docker | Images, containers, volumes, networking, Dockerfile |
| ☸️ Kubernetes | Pods, deployments, services, scaling, storage |
| 🔄 CI/CD | Pipelines, GitOps, deployment strategies, versioning |
| ☁️ AWS | EC2, S3, Lambda, IAM, VPC, RDS, ECS |
| 🏗️ Terraform | IaC concepts, providers, state, modules, workspaces |
| 🌿 Git | Branching, merging, rebase, workflows, hooks |
| 🐧 Linux | Commands, permissions, processes, scripting, networking |
| 📊 Monitoring | Prometheus, Grafana, alerting, logging, SLOs |
| 🔧 Ansible | Playbooks, roles, inventory, idempotency, modules |
| 🔷 Azure | AKS, Azure Functions, Azure DevOps, ARM templates |
| 🔒 DevSecOps | SAST, DAST, container scanning, secrets management, zero trust |
| 🌐 Networking | DNS, load balancing, TCP/IP, proxies, service mesh |

## 🕹️ Controls & Scoring

| Key | Action |
|-----|--------|
| `Arrow Keys` / `WASD` | Move your ship |
| `1, 2, 3, 4` | Select answer |
| `Space` | Confirm / Fire |
| `P` | Pause game |

| Event | Points |
|-------|--------|
| Correct answer | +100 |
| Speed bonus (< 5 sec) | +50 |
| Shoot enemy | +50 |
| Streak multiplier | ×1.5 per streak |
| Wrong answer | −20 HP |
| Timeout | −15 HP |

## 🚀 Quick Start

### Run Locally

```bash
# Just open in browser (no build required)
open index.html

# Or use a local server
npx serve .
```

### Run with Docker

```bash
docker build -t devops-game .
docker run -p 8080:80 devops-game
```

## 📁 Project Structure

```
devops-game/
├── index.html      # Main HTML file
├── game.js         # Game logic (Canvas-based)
├── styles.css      # Styling
├── assets/         # Game assets (images, etc.)
└── Dockerfile      # Docker configuration
```

## 🌐 Live Demo

[devopsgame.tranthachnguyen.com](https://devopsgame.tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
