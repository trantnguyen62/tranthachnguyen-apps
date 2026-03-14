# ⚡ DevOps Mastery

An interactive study application to master DevOps concepts through flashcards, quizzes, matching games, and command cheat sheets.

## 🎯 Features

- **Interactive Flashcards** - Flip cards to learn terms and definitions
- **Quiz Mode** - Test your knowledge with multiple choice questions
- **Match Game** - Match terms with their definitions under time pressure
- **Codebase View** - Browse code examples and configuration templates
- **Commands Cheat Sheet** - Quick reference for essential DevOps commands
- **Progress Tracking** - Track cards studied and overall progress (persisted in browser storage)

## 📚 Topics Covered

- 🐳 Docker
- ☸️ Kubernetes
- 🔄 CI/CD
- ☁️ AWS
- 📦 Terraform
- 🌿 Git
- 🐧 Linux
- 📊 Monitoring
- 🤖 Ansible
- ☁️ Azure
- 🔒 DevSecOps
- 🌐 Networking

## 🚀 Quick Start

### Run Locally

```bash
# No build required - just open in browser
open index.html

# Or use a local server
npx serve .
```

### Run with Docker

```bash
docker build -t devops-study .
docker run -p 8080:80 devops-study
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / Next flashcard |
| `Space` / `Enter` | Flip flashcard |
| `1` – `4` | Select quiz answer |

## 📁 Project Structure

```
devops-study/
├── index.html          # Main HTML file
├── privacy.html        # Privacy policy page
├── app.js              # Application logic and study data
├── app.min.js          # Minified version (generated)
├── styles.css          # Styling
├── styles.min.css      # Minified version (generated)
├── serve.json          # Static server config with security headers
├── Dockerfile          # Docker configuration
└── package.json        # Dev dependencies (terser, clean-css-cli)
```

## 🛠️ Development

The app has no build step for development — edit `app.js` and `styles.css` directly. Requires **Node.js 20+**.

To regenerate the minified files before deploying:

```bash
npm install
npx terser app.js -o app.min.js
npx cleancss -o styles.min.css styles.css
```

> `cleancss` is a CSS-specific minifier (`npm install -g clean-css-cli`). Do not use terser for CSS files.

Progress is stored in `localStorage` under the key `devops-mastery-progress`.

## 🌐 Live Demo

[devopsstudy.tranthachnguyen.com](https://devopsstudy.tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
