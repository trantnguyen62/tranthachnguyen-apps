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
npm run build

# Serve locally
npm start

# Or just open in browser directly
open index.html
```

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
- Android: Coming soon

See [Apple Developer Program](https://developer.apple.com) for app store submission requirements.

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

## 📄 License

© 2026 Pipeline Runner. All rights reserved.
