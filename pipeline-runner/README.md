# 🏃 Pipeline Runner

An endless runner game that teaches DevOps concepts through gameplay. Navigate through CI/CD pipelines, answer questions, and level up your DevOps skills!

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

## 🚀 Quick Start

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
├── index.html              # Main HTML file
├── game.js                 # Game logic (Canvas-based)
├── styles.css              # Styling
├── capacitor.config.json   # Capacitor configuration
├── ios/                    # iOS Xcode project
├── www/                    # Built web assets for mobile
└── package.json            # Dependencies
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

## 📱 Mobile Deployment

This game is designed for app store deployment using Capacitor:

- iOS: Ready for App Store with Xcode project in `/ios`
- Android: Add the Android platform with `npx cap add android`, then `npx cap sync android` and `npx cap open android`

See [Apple Developer Program](https://developer.apple.com) for iOS App Store submission requirements.

## ⚙️ Game Configuration

Key constants in `game.js` (`CONFIG` object) that control gameplay feel:

| Constant | Default | Description |
|---|---|---|
| `GRAVITY` | `0.35` | Downward acceleration per frame (px/frame²) |
| `BOOST_FORCE` | `-7.5` | Upward velocity on tap/space (px/frame) |
| `OBSTACLE_SPEED` | `3` | Horizontal scroll speed (px/frame) |
| `OBSTACLE_GAP` | `180` | Vertical gap between obstacles (px) |
| `OBSTACLE_SPAWN_RATE` | `2200` | Milliseconds between obstacle spawns |
| `QUESTION_INTERVAL` | `5` | Gates passed before a quiz question triggers |
| `QUESTION_TIME` | `12` | Seconds to answer each quiz question |

## 💾 Local Storage

Progress is persisted in the browser's `localStorage` under two keys:

| Key | Description |
|-----|-------------|
| `pipeline-runner-best` | All-time highest gate score |
| `pipeline-runner-learned` | Cumulative count of commands learned across all sessions |

To reset progress, run `localStorage.clear()` in the browser console.

## 🗒️ Development Notes

- **Build script scope:** `npm run build` copies `*.html`, `*.css`, and `*.js` to `www/`. Image assets (e.g. `og-image.png`) must be copied to `www/` manually or added to the build script.
- **Favicon files:** `index.html` references `favicon-32x32.png`, `favicon-16x16.png`, and `apple-touch-icon.png`. These files are not yet included in the repository and must be generated (e.g. via [realfavicongenerator.net](https://realfavicongenerator.net)) before deployment.
- **AdSense integration:** The AdSense `<script>` tag in `index.html` is commented out. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID and uncomment when ready.
- **Content Security Policy:** The CSP in `index.html` is set for `'self'` + Google Fonts. If you add third-party scripts (e.g. AdSense, analytics), update the `script-src` and `connect-src` directives accordingly.
- **Reset progress in dev:** Run `localStorage.clear()` in the browser console to wipe all stored scores and progress.

## 📄 License

© 2026 Pipeline Runner. All rights reserved.
