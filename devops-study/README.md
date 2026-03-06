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

## 📁 Project Structure

```
devops-study/
├── index.html          # Main HTML file
├── privacy.html        # Privacy policy page
├── app.js              # Application logic
├── app.min.js          # Minified version
├── styles.css          # Styling
├── styles.min.css      # Minified version
└── Dockerfile          # Docker configuration
```

## 🌐 Live Demo

[devopsstudy.tranthachnguyen.com](https://devopsstudy.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
