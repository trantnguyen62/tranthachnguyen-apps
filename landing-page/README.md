# 🏠 Landing Page

The main portfolio landing page for tranthachnguyen.com, showcasing all AI-powered projects and apps.

## 🎯 Features

- **Modern Design** - Glassmorphism cards with smooth animations
- **Project Showcase** - Cards linking to all available apps
- **Responsive** - Works on all screen sizes
- **Fast Loading** - Static HTML with hand-inlined Tailwind utility classes (no CDN, no build step)

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
├── fonts/          # Self-hosted Inter font files (woff2, multiple unicode ranges)
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

Each card is a `<li data-card>` inside the `<ul>` grid in `<main>`. Copy this
template and replace the `{color}` placeholders with one of the accent colours
already used by other cards (`blue`, `emerald`, `purple`, `rose`, `orange`,
`yellow`, `sky`, `cyan`).

Increment the `animation-delay` by `0.03s` relative to the previous card so
the entrance animation staggers correctly.

```html
<!-- App Name -->
<li data-card style="animation-delay: 0.XXs">
  <a href="https://your-app-url.com"
     target="_blank" rel="noopener noreferrer"
     aria-label="Launch App Name — Category (opens in new tab)"
     class="glass-card card-{color} p-8 rounded-2xl border-t-2 border-{color}-500/40
            hover:scale-[1.02] focus-visible:outline focus-visible:outline-2
            focus-visible:outline-{color}-400 focus-visible:outline-offset-2
            group cursor-pointer block">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-2xl font-bold group-hover:text-{color}-400 transition-colors">
        <span aria-hidden="true" class="mr-2">🔧</span>App Name
      </h3>
      <span aria-hidden="true" class="px-3 py-1 bg-{color}-500/20 text-{color}-300 text-xs font-medium rounded-full">Category</span>
    </div>
    <p class="text-slate-300 mb-4 leading-relaxed group-hover:text-slate-200 transition-colors">
      Short description of what the app does.
    </p>
    <div class="cta-row flex items-center text-{color}-400 font-semibold mt-4 border-t border-white/10">
      Launch App <span class="ml-2 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true">↗</span>
    </div>
  </a>
</li>
```

Update `sitemap.xml` with the new app's URL if it lives on the same domain.

## 🛠️ Tech Stack

- **Framework**: Static HTML
- **Styling**: TailwindCSS utilities (hand-inlined — no CDN, no build step)
- **Fonts**: Inter (self-hosted woff2, no external requests)

## 🎨 Design

- Dark slate background with gradient blobs
- Glass-effect cards with blur
- Gradient text for headings
- Smooth hover transitions

## 🔒 Security

`serve.json` sets the following response headers:

- **CSP** — restricts resources to `self` only (fonts, styles, images); disables scripts, framing, and forms
- **X-Content-Type-Options: nosniff** — prevents MIME-type sniffing
- **X-Frame-Options: DENY** — blocks the page from being embedded in iframes
- **Referrer-Policy: strict-origin-when-cross-origin** — limits referrer leakage
- **Permissions-Policy** — disables camera, microphone, geolocation, payment, and USB APIs
- **Cache-Control** — 1-hour cache for HTML, 30-day cache for CSS assets

## 🌐 Live Demo

[tranthachnguyen.com](https://tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
