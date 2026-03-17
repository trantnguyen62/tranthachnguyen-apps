# 🏃 Pipeline Runner

An endless runner game that teaches DevOps concepts through gameplay. Navigate through CI/CD pipelines, answer questions, and level up your DevOps skills!

## Table of Contents

- [Features](#-features)
- [Controls](#️-controls)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Tech Stack](#️-tech-stack)
- [Gameplay](#-gameplay)
- [Docker](#-docker)
- [Mobile Deployment](#-mobile-deployment)
- [Ranks & Progression](#-ranks--progression)
- [Game Configuration](#️-game-configuration)
- [Local Storage](#-local-storage)
- [Troubleshooting](#-troubleshooting)
- [Development Notes](#️-development-notes)

## 🎯 Features

- **Endless Runner Gameplay** - Tap/Space to boost through obstacles
- **DevOps Questions** - Answer questions at score milestones
- **Multiple Topics** - Docker, Kubernetes, CI/CD, AWS, Terraform, Git, Linux, Monitoring
- **Rewarded Ads** - Watch ads for extra lives (placeholder in demo mode)
- **Mobile Ready** - Built with Capacitor for iOS/Android deployment
- **Progress Tracking** - Track your best runs and learning progress

## 🕹️ Controls

| Input | Action |
|-------|--------|
| `Space` / `Click` / `Tap` | Boost upward |
| `1` / `2` / `3` / `4` | Select quiz answer during question |
| `Arrow keys` | Navigate topic selection on start screen |

## 🚀 Quick Start

> **Requirements:** Node.js 18+ is required for Capacitor 8.

### Run Locally (Web)

```bash
# Install dependencies
npm install

# Build web assets into www/
# Note: this copies *.html, *.css, *.js to www/ — images must be copied separately
npm run build

# Serve built assets (requires build step first)
npm start

# Or open the source directly in a browser (no build needed)
open index.html
```

> **Tip:** During development, opening `index.html` directly in a browser is the fastest workflow. The `npm start` command serves from `www/` (post-build assets), so changes to source files require a `npm run build` before they are reflected.

### Build for iOS (with Capacitor)

```bash
# Build web assets
npm run build

# Sync with iOS project
npm run ios:sync   # or: npx cap sync ios

# Open in Xcode
npm run ios        # or: npx cap open ios
```

## 📁 Project Structure

```
pipeline-runner/
├── index.html              # Main HTML file (SEO, ARIA, structured data)
├── game.js                 # Game logic (Canvas-based engine, quiz engine)
├── styles.css              # Styling and animations
├── package.json            # Node.js dependencies and scripts
├── capacitor.config.json   # Capacitor app configuration
├── Dockerfile              # Container image (nginx:1.27-alpine)
├── nginx.conf              # Nginx config with security headers
├── robots.txt              # Search engine crawl rules
├── sitemap.xml             # XML sitemap for SEO
├── og-image.png            # Social media share image (Open Graph)
├── ios/                    # iOS Xcode project (Capacitor-generated)
└── www/                    # Built web assets synced to mobile (git-ignored)
```

## 🛠️ Tech Stack

- **Game Engine**: HTML5 Canvas, Vanilla JavaScript
- **Styling**: Custom CSS with animations
- **Fonts**: Orbitron, Outfit (Google Fonts)
- **Mobile**: Capacitor for native builds

## 🎮 Gameplay

1. Choose your topic path from the start screen
2. Tap/Space to boost your runner through gates
3. Avoid hitting obstacles to keep your lives
4. Answer DevOps questions at milestones to earn bonuses
5. Try to beat your high score!

## 🐳 Docker

```bash
# Build the image
docker build -t pipeline-runner .

# Run on port 8080
docker run -p 8080:80 pipeline-runner
```

Then open `http://localhost:8080` in your browser.

## 📱 Mobile Deployment

This game is designed for app store deployment using Capacitor:

- iOS: Ready for App Store with Xcode project in `/ios`
- Android: Add the Android platform with `npx cap add android`, then `npx cap sync android` and `npx cap open android`

See [Apple Developer Program](https://developer.apple.com) for iOS App Store submission requirements.

## 🏅 Ranks & Progression

Gates passed determine your rank at the end of each run:

| Gates | Rank |
|-------|------|
| 0 | 🔧 Junior DevOps |
| 10 | ⚙️ DevOps Engineer |
| 25 | 🛠️ Senior DevOps |
| 50 | 🚀 DevOps Lead |
| 75 | 🌟 Platform Engineer |
| 100 | 👑 DevOps Architect |

## ⚙️ Game Configuration

Key constants in `game.js` (`CONFIG` object) that control gameplay feel:

| Constant | Default | Description |
|---|---|---|
| `GRAVITY` | `0.35` | Downward acceleration per frame (px/frame²) |
| `BOOST_FORCE` | `-7.5` | Upward velocity on tap/space (px/frame) |
| `OBSTACLE_SPEED` | `3` | Horizontal scroll speed (px/frame) |
| `OBSTACLE_GAP` | `180` | Vertical gap between obstacles (px) |
| `OBSTACLE_SPAWN_RATE` | `2200` | Milliseconds between obstacle spawns |
| `PLAYER_SIZE` | `50` | Player sprite bounding box (px) |
| `OBSTACLE_WIDTH` | `100` | Width of each obstacle column (px) |
| `QUESTION_INTERVAL` | `5` | Gates passed before a quiz question triggers |
| `QUESTION_TIME` | `12` | Seconds to answer each quiz question |
| `TERMINAL_VELOCITY` | `12` | Maximum downward speed to prevent tunneling (px/frame) |

## 💾 Local Storage

Progress is persisted in the browser's `localStorage` under two keys:

| Key | Description |
|-----|-------------|
| `pipeline-runner-best` | All-time highest gate score |
| `pipeline-runner-learned` | Cumulative count of commands learned across all sessions |

To reset progress, run `localStorage.clear()` in the browser console.

## 📝 Adding Questions & Learning Content

### Questions (`QUESTIONS` in `game.js`)

Each entry uses this schema:

```js
{ q: "Question text",
  a: ["correct answer", "wrong 1", "wrong 2", "wrong 3"],
  c: 0,       // index into `a` of the correct answer (0 = first element)
  fact: "Fun fact shown after answering" }
```

Answers are shuffled at runtime, so order in the source only matters for determining which index `c` points to.

### Learnable Content (`LEARNABLE_CONTENT` in `game.js`)

Each entry uses this schema:

```js
{ cmd: 'command or concept', desc: 'one-line description' }
```

Content is shown on obstacle gates and in the tip banner as the player passes through. Items are cycled in random order without repeating within a session.

## 🔧 Troubleshooting

**Game runs slowly or stutters**
- Make sure hardware acceleration is enabled in your browser.
- Close other CPU-intensive tabs; the game loop runs at ~60 fps via `requestAnimationFrame`.

**Quiz questions or tip banners stop appearing**
- This can happen if `localStorage` data becomes corrupted. Run `localStorage.clear()` in the browser console and reload.

**`npm start` shows an old version of the game**
- The dev server serves from `www/` (built assets). Run `npm run build` after making changes to source files.

**Favicon errors in the console**
- `favicon-32x32.png`, `favicon-16x16.png`, and `apple-touch-icon.png` are referenced in `index.html` but not included. Generate them at [realfavicongenerator.net](https://realfavicongenerator.net) and place them in the project root.

**iOS build fails after pulling changes**
- Re-run `npm run build && npm run ios:sync` to sync the latest web assets into the Xcode project before opening Xcode.

## 🗒️ Development Notes

- **Build script scope:** `npm run build` copies `*.html`, `*.css`, and `*.js` to `www/`. Image assets (e.g. `og-image.png`) must be copied to `www/` manually or added to the build script.
- **Favicon files:** `index.html` references `favicon-32x32.png`, `favicon-16x16.png`, and `apple-touch-icon.png`. These files are not yet included in the repository and must be generated (e.g. via [realfavicongenerator.net](https://realfavicongenerator.net)) before deployment.
- **AdSense integration:** The AdSense `<script>` tag in `index.html` is commented out. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID and uncomment when ready.
- **Content Security Policy:** The CSP in `index.html` is set for `'self'` + Google Fonts. If you add third-party scripts (e.g. AdSense, analytics), update the `script-src` and `connect-src` directives accordingly.

## 📄 License

MIT © 2026 Pipeline Runner.
