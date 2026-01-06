# 🎮 DevOps Defender

A 2D space shooter game that teaches DevOps concepts through gameplay. Answer questions correctly to defeat enemies and progress through topic zones!

## 🎯 Features

- **Adventure Mode** - Progress through DevOps topic zones (Docker, Kubernetes, CI/CD, etc.)
- **Endless Mode** - Survive as long as you can while answering questions
- **Speed Quiz Mode** - Answer fast, score high
- **Practice Mode** - Focus on specific topics
- **Multiple Topics** - Docker, Kubernetes, CI/CD, AWS, Terraform, Git, Linux, Monitoring

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `Arrow Keys` / `WASD` | Move your ship |
| `1, 2, 3, 4` | Select answer |
| `Space` | Confirm / Fire |
| `P` | Pause game |

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

© 2025 Tran Thach Nguyen. All rights reserved.
