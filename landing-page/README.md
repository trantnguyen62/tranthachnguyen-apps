# 🏠 Landing Page

The main portfolio landing page for tranthachnguyen.com, showcasing all AI-powered projects and apps.

## 🎯 Features

- **Modern Design** - Glassmorphism cards with smooth animations
- **Project Showcase** - Cards linking to all available apps
- **Responsive** - Works on all screen sizes
- **Fast Loading** - Static HTML with CDN-loaded TailwindCSS

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
docker build -t landing-page .
docker run -p 8080:80 landing-page
```

## 📁 Project Structure

```
landing-page/
├── index.html      # Main HTML file with all content
├── styles.css      # Additional custom styles
├── Dockerfile      # Docker configuration
├── serve.json      # Security headers and cache rules for `npx serve`
├── robots.txt      # Crawler instructions for SEO
├── sitemap.xml     # Sitemap for search engines
└── README.md       # This file
```

## 🗂️ Showcased Apps

| App | Description |
|-----|-------------|
| LinguaFlow | AI-powered language learning partner |
| Illinois Driver Study | Interactive Illinois driver's license study guide |
| NanoEdit AI | AI-assisted photo editor |
| Passport Photo AI | AI photo cropping for passport requirements |
| Comic News | Comic browser and reader |
| DevOps Mastery | DevOps flashcards and quizzes |
| DevOps Defender | DevOps learning game |
| Resume & Portfolio | Professional resume and portfolio |

## ➕ Adding a New App Card

Copy this template into `index.html` inside the `<main>` grid section:

```html
<article class="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300" aria-label="App Name">
  <div class="flex items-center gap-3 mb-3">
    <span class="text-3xl" role="img" aria-label="emoji description">🔧</span>
    <h2 class="text-xl font-semibold text-white">App Name</h2>
  </div>
  <p class="text-slate-300 text-sm mb-4">Short description of what the app does.</p>
  <a href="https://your-app-url.com" class="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors" target="_blank" rel="noopener noreferrer">
    Open App <span aria-hidden="true">→</span>
  </a>
</article>
```

Update `sitemap.xml` with the new app's URL if it lives on the same domain.

## 🛠️ Tech Stack

- **Framework**: Static HTML
- **Styling**: TailwindCSS (CDN)
- **Fonts**: Inter (Google Fonts)

## 🎨 Design

- Dark slate background with gradient blobs
- Glass-effect cards with blur
- Gradient text for headings
- Smooth hover transitions

## 🔒 Security

`serve.json` sets the following response headers:

- **CSP** — restricts resources to `self`, Google Fonts, and disables framing/forms/scripts
- **X-Content-Type-Options: nosniff** — prevents MIME-type sniffing
- **X-Frame-Options: DENY** — blocks the page from being embedded in iframes
- **Referrer-Policy: strict-origin-when-cross-origin** — limits referrer leakage
- **Permissions-Policy** — disables camera, microphone, geolocation, payment, and USB APIs
- **Cache-Control** — 1-hour cache for HTML, 7-day cache for CSS assets

## 🌐 Live Demo

[tranthachnguyen.com](https://tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
