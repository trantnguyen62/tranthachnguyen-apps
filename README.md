# 🚀 TranThachNguyen Apps

A monorepo containing AI-powered web applications and learning tools by Tran Thach Nguyen.

[![Live Site](https://img.shields.io/badge/Live-tranthachnguyen.com-blue?style=for-the-badge)](https://tranthachnguyen.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)
[![Apps](https://img.shields.io/badge/Apps-10+-green?style=for-the-badge)](#-applications)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](./CONTRIBUTING.md)

---

## 📱 Applications

### AI-Powered Tools

| App | Description | Tech Stack | Live URL |
|-----|-------------|------------|----------|
| **[LinguaFlow](./linguaflow)** | AI language learning partner with real-time voice conversation | React, Vite, Gemini API | [linguaflow.tranthachnguyen.com](https://linguaflow.tranthachnguyen.com) |
| **[NanoEdit AI](./nanoedit-ai-prod)** | AI-assisted photo editor for quick touch-ups and enhancements | React, Vite, Gemini API | [photoedit.tranthachnguyen.com](https://photoedit.tranthachnguyen.com) |
| **[Passport Photo AI](./passport-photo-ai)** | Auto-crop and format photos for passport requirements | React, Vite, TypeScript | [passportphoto.tranthachnguyen.com](https://passportphoto.tranthachnguyen.com) |
| **[Code Study App](./code-study-app)** | Browse and learn your codebase with Gemini Live voice audio | React, Vite, Gemini Live | - |

### Educational Apps

| App | Description | Tech Stack | Live URL |
|-----|-------------|------------|----------|
| **[Illinois Driver Study](./illinois-driver-study)** | Interactive study guide for the Illinois Driver's License test | React, Vite, TypeScript | [illinoisdriverstudy.tranthachnguyen.com](https://illinoisdriverstudy.tranthachnguyen.com) |
| **[DevOps Mastery](./devops-study)** | Interactive flashcards, quizzes, and progress tracking for DevOps | Vanilla JS, CSS | [devopsstudy.tranthachnguyen.com](https://devopsstudy.tranthachnguyen.com) |

### Games

| App | Description | Tech Stack | Live URL |
|-----|-------------|------------|----------|
| **[DevOps Defender](./devops-game)** | 2D space shooter game to learn DevOps concepts | Canvas, Vanilla JS | [devopsgame.tranthachnguyen.com](https://devopsgame.tranthachnguyen.com) |
| **[Pipeline Runner](./pipeline-runner)** | Endless runner game with DevOps questions (mobile-ready with Capacitor) | Canvas, Vanilla JS, Capacitor | - |

### Other

| App | Description | Tech Stack | Live URL |
|-----|-------------|------------|----------|
| **[Comic News](./comic-news)** | Comic reader with bookmark and progress tracking | Node.js, Express | [comicnews.tranthachnguyen.com](https://comicnews.tranthachnguyen.com) |
| **[Landing Page](./landing-page)** | Portfolio landing page showcasing all apps | HTML, TailwindCSS | [tranthachnguyen.com](https://tranthachnguyen.com) |

---

## 🏗️ Infrastructure & Documentation

| Folder | Description |
|--------|-------------|
| **[docs/](./docs)** | Deployment guides and CI/CD setup |
| **[terraform/](./terraform)** | Terraform configurations for Cloudflare DNS and infrastructure |
| **[infra/](./infra)** | Docker Compose configurations for Proxmox deployment |
| **[.github/](./.github)** | GitHub Actions workflows for CI/CD |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Docker** (for deployment)

### Running an App Locally

```bash
# Navigate to any app directory
cd <app-name>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running with Docker

```bash
# Build and run all services
docker compose up -d --build
```

---

## 📁 Project Structure

```
tranthachnguyen-apps/
├── .github/                    # CI/CD workflows
├── terraform/                  # Infrastructure as Code
├── infra/                      # Docker deployment configs
├── code-study-app/             # AI code tutor with voice
├── comic-news/                 # Comic reader app
├── devops-game/                # DevOps learning game
├── devops-study/               # DevOps flashcards & quizzes
├── illinois-driver-study/      # IL driver's test prep
├── landing-page/               # Portfolio landing page
├── linguaflow/                        # AI language partner
├── nanoedit-ai-prod/           # AI photo editor
├── passport-photo-ai/          # Passport photo tool
├── pipeline-runner/            # DevOps endless runner (mobile)
├── docker-compose.yml          # Local Docker setup
└── deploy-to-proxmox.sh        # Deployment script
```

---

## 🌐 Deployment

All apps are deployed to a Proxmox container and served via Cloudflare Tunnel.

See [docs/PROXMOX_DEPLOYMENT.md](./docs/PROXMOX_DEPLOYMENT.md) and [infra/README.md](./infra/README.md) for details.

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

© 2025 Tran Thach Nguyen
