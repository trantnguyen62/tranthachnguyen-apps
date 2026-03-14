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
# Edit .env.local:
#   - Set GEMINI_PROXY_URL to your gemini-web-proxy URL
#   - Uncomment and update ALLOWED_ORIGINS to include http://localhost:5173 (required to avoid CORS errors in local dev)

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
| `ALLOWED_ORIGINS` | Proxy server (`.env.local`) | `https://photoedit.tranthachnguyen.com` | Comma-separated list of allowed CORS origins; add `http://localhost:5173` for local development |

### Architecture

```
Browser (Vite :5173)
  └─► Proxy Server (Express :5174)   [server/proxy.js]
        └─► gemini-web-proxy (:3000) [Puppeteer / Gemini web UI]
```

### Run with Docker

Three Dockerfiles are provided:

| File | What it builds | When to use |
|------|---------------|-------------|
| `Dockerfile` | Frontend + proxy server in one image | Simple single-host deployments |
| `Dockerfile.web` | Frontend only (serves static files) | When proxy runs on a separate host |
| `Dockerfile.api` | Proxy server only | Paired with `Dockerfile.web` or a custom frontend |

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
├── index.css           # Global styles (Tailwind)
├── types.ts            # Shared TypeScript types (ProcessedImage, AppStatus)
├── components/         # UI components (ImageUploader, ComparisonView, Button)
├── services/           # Gemini proxy service (geminiService.ts)
├── server/             # Express proxy server (proxy.js)
└── Dockerfile*         # Docker configurations
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express
- **AI**: Google Gemini (via [gemini-web-proxy](https://github.com/tranthachnguyen/gemini-web-proxy) — Puppeteer automation, no paid API key required)
- **Styling**: Tailwind CSS

## 💡 Usage

1. Upload an image (drag & drop, file picker, or camera)
2. Describe your desired edit (e.g., "Remove the person in the background")
3. Press **Enter** or click **Generate** to apply the AI edit (`Shift+Enter` for a newline)
4. Use undo/redo to navigate your edit history
5. Preview before/after, then download your result

**Keyboard shortcuts:**

| Shortcut | Action |
|----------|--------|
| `Enter` | Generate edited image |
| `Shift+Enter` | Insert newline in prompt |
| `Ctrl+Z` | Undo last edit |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |

### Proxy Server Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/gemini/edit-image` | Edit an image with a text prompt |
| `GET` | `/api/status` | Check connectivity to gemini-web-proxy |
| `GET` | `/health` | Proxy server health check |

#### `GET /api/status`

Response when upstream is reachable:
```json
{ "proxyStatus": "connected", "geminiProxy": { ... } }
```
Response when upstream is unreachable:
```json
{ "proxyStatus": "disconnected" }
```

#### `POST /api/gemini/edit-image`

Request body (JSON):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | **Yes** | Natural language edit instruction (max 2000 characters) |
| `base64Image` | string | No | Base64 data URI of the source image (e.g. `data:image/png;base64,...`) |
| `mimeType` | string | No | MIME type of the image (`image/png`, `image/jpeg`, `image/webp`, `image/gif`); defaults to `image/png` |

> **Note:** The proxy accepts request bodies up to 10 MB, which accommodates base64-encoded images up to ~7 MB.

Success response (`200`):
```json
{ "success": true, "imageData": "data:image/png;base64,..." }
```

Error responses: `400` (missing prompt) · `502` (upstream non-JSON) · `504` (upstream timeout) · `500` (no image generated)

## 🔧 Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Failed to generate image` | gemini-web-proxy unreachable | Confirm `GEMINI_PROXY_URL` is correct and the proxy is running |
| Blank/unchanged result | Gemini produced no image | Rephrase the prompt to be more specific |
| Request timeout (>110 s) | Gemini took too long | Try a simpler edit or a smaller image |
| `502 Unexpected response` | gemini-web-proxy returned non-JSON | Check that the proxy version is compatible |
| `504 Request timed out` | Upstream took >110 s | Retry; use a smaller image or simpler prompt |
| Camera not available | Browser permission denied | Allow camera access in your browser site settings |
| CORS error in browser | Frontend hitting wrong proxy port | Ensure `VITE_PROXY_URL` matches the port where `proxy.js` is running |

## 🌐 Live Demo

[photoedit.tranthachnguyen.com](https://photoedit.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
