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
└── Dockerfile      # Docker configuration
```

## 🛠️ Tech Stack

- **Framework**: Static HTML
- **Styling**: TailwindCSS (CDN)
- **Fonts**: Inter (Google Fonts)

## 🎨 Design

- Dark slate background with gradient blobs
- Glass-effect cards with blur
- Gradient text for headings
- Smooth hover transitions

## 🌐 Live Demo

[tranthachnguyen.com](https://tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
