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
├── index.html      # Main HTML — all screens, ARIA roles, Open Graph & schema.org metadata
├── game.js         # Game engine — config, questions database, game loop, rendering
├── styles.css      # Styling — CSS custom properties, keyframe animations, responsive layout
├── assets/         # Sprites and background images
└── Dockerfile      # Multi-stage build; runs as non-root, adds security headers
```

## 🏗️ Architecture

The game runs entirely in the browser with no build step.

- **Rendering** — HTML5 Canvas 2D API. A `requestAnimationFrame` loop calls `update()` then `render()` every frame. The canvas is sized to the viewport on load and on resize.
- **State** — A single mutable `game` object holds all runtime state (player, enemies, particles, score, etc.). Config constants live in `CONFIG`; they are the only tuning knobs needed for most mechanical changes.
- **Questions** — `QUESTIONS[topicId]` is an array of objects `{ q, a, c, e }`. Answers are Fisher-Yates shuffled at display time, so `c` must always index the correct item in the original `a` array.
- **HUD** — DOM-based overlay on top of the canvas. A dirty-check cache (`game._hud`) prevents redundant DOM writes every frame.
- **Persistence** — High score only, stored in `localStorage` under the key `devops-defender-highscore`.
- **Accessibility** — ARIA live region (`aria-live="polite"`) announces question results to screen readers. All interactive elements have `aria-label` attributes and keyboard equivalents.

## ➕ Adding Questions or Topics

**Add questions to an existing topic** — append objects to the relevant array in `QUESTIONS`:

```js
{ q: "Your question?", a: ["Correct", "Wrong A", "Wrong B", "Wrong C"], c: 0, e: "Explanation shown after answering." }
```

**Add a new topic:**

1. Add a new key to `QUESTIONS` with at least 5 question objects.
2. Add a matching entry to the `TOPICS` array:
   ```js
   { id: 'yourtopic', name: 'Your Topic', icon: '🔥', color: '#hexcolor', desc: 'Short description' }
   ```
That's all — the topic card, Practice mode selector, and Adventure progression pick it up automatically.

## 🌐 Live Demo

[devopsgame.tranthachnguyen.com](https://devopsgame.tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
