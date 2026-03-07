# ✨ NanoEdit AI

A simple yet powerful AI-assisted photo editor for quick touch-ups and enhancements powered by Google Gemini.

## 🎯 Features

- **AI Image Editing** - Describe what you want to change in natural language
- **Quick Touch-ups** - Remove objects, fix blemishes, adjust colors
- **Image Enhancement** - Upscale, sharpen, and improve image quality
- **Multiple Operations** - Crop, rotate, filters, and more
- **Before/After Preview** - Compare your edits instantly
- **Download Results** - Save your edited images

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
- **Styling**: Custom CSS

## 💡 Usage

1. Upload an image or take a photo
2. Enter a prompt describing your desired edit (e.g., "Remove the person in the background")
3. Click "Apply" to generate the edit
4. Preview, compare, and download your result

## 🌐 Live Demo

[photoedit.tranthachnguyen.com](https://photoedit.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
