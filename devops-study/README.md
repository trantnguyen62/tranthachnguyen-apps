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
├── index.html          # Main HTML file (SEO meta tags + JSON-LD structured data)
├── privacy.html        # Privacy policy page
├── app.js              # Application logic and study data
├── app.min.js          # Minified version (generated — do not edit)
├── styles.css          # Styling
├── styles.min.css      # Minified version (generated — do not edit)
├── serve.json          # Static server config: security headers + 1-year cache for .min.* files
├── Dockerfile          # Container config (Alpine-based, runs as non-root)
├── package.json        # Dev dependencies (terser, clean-css-cli)
├── og-image.svg        # Open Graph / social sharing preview image
├── robots.txt          # Search engine crawl directives
└── sitemap.xml         # XML sitemap for search indexing
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

## 🔧 Troubleshooting

**Progress not saving / resetting unexpectedly**
- Progress is stored in `localStorage` under `devops-mastery-progress`. Private/incognito windows do not persist it across sessions.
- To manually reset progress, run in the browser console: `localStorage.removeItem('devops-mastery-progress')`

**Blank page or broken layout**
- Open the browser DevTools console and check for errors. The app requires a modern browser (Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+).
- If opening `index.html` directly from disk (`file://`), some browsers block localStorage — use `npx serve .` instead.

**Minified files out of sync**
- After editing `app.js` or `styles.css`, regenerate the `.min.*` files before deploying (see [Development](#️-development) above). Serving stale minified files is the most common cause of production-only bugs.

## 🌐 Live Demo

[devopsstudy.tranthachnguyen.com](https://devopsstudy.tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
