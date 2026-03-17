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
├── index.html      # Main HTML file with all content and JSON-LD structured data
├── styles.css      # All styles: hand-inlined Tailwind utilities + custom CSS (no build step)
├── og-image.png    # Open Graph preview image (1200×630) for social link previews
├── fonts/          # Self-hosted Inter font (7 woff2 files, one per unicode range)
├── Dockerfile      # Docker configuration
├── serve.json      # Security headers and 3-tier cache rules for `npx serve`
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
| Comic News | AI-generated comic strip versions of today's top news headlines |
| DevOps Mastery | DevOps flashcards and quizzes |
| DevOps Defender | DevOps learning game |
| Resume & Portfolio | Professional resume and portfolio |

## ➕ Adding a New App Card

Each card is a `<li data-card>` inside the `<ul>` grid in `<main>`. Copy this
template and replace the `{color}` placeholders with one of the accent colours
already used by other cards (`blue`, `emerald`, `purple`, `rose`, `orange`,
`yellow`, `sky`, `cyan`).

Increment the `animation-delay` by `0.03s` relative to the previous card so
the entrance animation staggers correctly. The current 8 cards use delays
`0.03s`–`0.24s`, so the next card should use `0.27s`.

After adding the card, update the `dateModified` value in the `<script type="application/ld+json">` block in `index.html` to today's date (ISO 8601 format, e.g. `2026-03-15`).

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
      <h3 class="text-2xl font-bold group-hover:text-{color}-400 transition-colors flex items-center gap-3">
        <span aria-hidden="true" class="app-icon icon-{color}">🔧</span>App Name
      </h3>
      <span aria-hidden="true" class="px-3 py-1 bg-{color}-500/20 text-{color}-300 text-xs font-medium rounded-full">Category</span>
    </div>
    <p class="text-slate-300 mb-4 leading-relaxed group-hover:text-slate-200 transition-colors">
      Short description of what the app does.
    </p>
    <div class="cta-row flex items-center text-{color}-400 font-semibold">
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
- **Permissions-Policy** — disables camera, microphone, geolocation, payment, USB, and ad-targeting APIs
- **Strict-Transport-Security** — enforces HTTPS for 1 year across all subdomains (HSTS preload eligible)
- **Cross-Origin-Opener-Policy: same-origin** — isolates the browsing context to prevent cross-origin window attacks
- **Cross-Origin-Resource-Policy: same-origin** — prevents other origins from loading this site's resources
- **X-Permitted-Cross-Domain-Policies: none** — blocks Adobe Flash/PDF cross-domain policy files
- **Cache-Control** — 1-hour cache for HTML, 30-day cache for CSS, 1-year immutable cache for fonts

## ♿ Accessibility

- **Skip link** — keyboard users can skip directly to `#main-content` via a visually-hidden link at the top of the page
- **ARIA labels** — all interactive cards include `aria-label` with destination and "(opens in new tab)" notice; decorative elements use `aria-hidden="true"`
- **Semantic landmarks** — `<main>`, `<nav>`, `<header>`, `<footer>` with matching `aria-labelledby` / `aria-label` attributes
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` in `styles.css` disables all CSS animations for users who opt out
- **Focus styles** — `focus-visible` outlines on all interactive elements with a 2px ring and per-card accent colour

## 🔍 SEO

- **Schema.org structured data** — `<script type="application/ld+json">` in `index.html` contains a `@graph` with `WebSite`, `Person`, `ItemList`, and `SoftwareApplication` entries for each app
- **Open Graph & Twitter Card** — full metadata for rich link previews on social platforms, referencing `og-image.png` (1200×630)
- **Canonical & hreflang** — `<link rel="canonical">` and `hreflang="en"` / `hreflang="x-default"` tags prevent duplicate-content issues
- **sitemap.xml** — lists the root URL; update `<lastmod>` and add sub-URLs here when new apps go live on the same domain
- **robots.txt** — allows all crawlers and references the sitemap location
- **dateModified** — update the `dateModified` field in the JSON-LD block whenever content changes; this signals freshness to search engines

## 🌐 Live Demo

[tranthachnguyen.com](https://tranthachnguyen.com)

## 📄 License

© 2026 Tran Thach Nguyen. All rights reserved.
