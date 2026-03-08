# ✨ NanoEdit AI

A simple yet powerful AI-assisted photo editor for quick touch-ups and enhancements powered by Google Gemini.

## 🎯 Features

- **AI Image Editing** - Describe what you want to change in natural language
- **Preset Quick Actions** - Background removal, color enhancement, sketches, vintage filters, skin retouching
- **Passport Photo Generation** - One-click professional passport photo conversion
- **Edit History** - Undo/redo through multiple AI edits in a session
- **Camera Capture** - Take a photo directly from your device camera
- **Before/After Preview** - Compare your edits side-by-side with fullscreen support
- **Download Results** - Save your edited images as PNG

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- [gemini-web-proxy](https://github.com/tranthachnguyen/gemini-web-proxy) running (Puppeteer-based Gemini automation)

### Run Locally

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local and set GEMINI_PROXY_URL to your gemini-web-proxy URL

# Start the proxy server (port 5174)
node server/proxy.js

# In a separate terminal, start the frontend dev server (port 5173)
npm run dev
```

### Environment Variables

| Variable | Where | Default | Description |
|---|---|---|---|
| `VITE_PROXY_URL` | Frontend | `http://localhost:5174` | URL of the local proxy server |
| `GEMINI_PROXY_URL` | Proxy server (`.env.local`) | `http://localhost:3000` | URL of the gemini-web-proxy instance |

### Architecture

```
Browser (Vite :5173)
  └─► Proxy Server (Express :5174)   [server/proxy.js]
        └─► gemini-web-proxy (:3000) [Puppeteer / Gemini web UI]
```

### Run with Docker

```bash
# Build and run the combined image (frontend + proxy server)
docker build -t nanoedit-ai .
docker run -p 5173:5173 -p 5174:5174 \
  -e GEMINI_PROXY_URL=http://your-gemini-web-proxy:3000 \
  nanoedit-ai

# Or build separate images
docker build -f Dockerfile.web -t nanoedit-ai-web .
docker build -f Dockerfile.api -t nanoedit-ai-api .
```

## 📁 Project Structure

```
nanoedit-ai-prod/
├── App.tsx             # Main React component
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
├── components/         # UI components
├── services/           # Gemini API service
├── server/             # Proxy server for API calls
└── Dockerfile*         # Docker configurations
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express
- **AI**: Google Gemini API (Image Generation/Editing)
- **Styling**: Tailwind CSS

## 💡 Usage

1. Upload an image (drag & drop, file picker, or camera)
2. Describe your desired edit (e.g., "Remove the person in the background")
3. Press **Enter** or click **Generate** to apply the AI edit
4. Use undo/redo to navigate your edit history
5. Preview before/after, then download your result

## 🌐 Live Demo

[photoedit.tranthachnguyen.com](https://photoedit.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
