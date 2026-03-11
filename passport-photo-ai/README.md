# 📸 Passport Photo AI (PassportLens)

Automatically crop and format your photos to meet strict passport and visa requirements using AI.

## 🎯 Features

- **Auto Face Detection** - Automatically detects and centers your face
- **Smart Cropping** - Crops to exact passport size specifications
- **Background Removal** - AI-powered background removal for clean photos
- **Compliance Checks** - Verifies background, lighting, expression, and face centering against standard passport requirements
- **Instant Download** - Get your photo immediately after processing
- **Print Ready** - Output formatted for standard print sizes

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- Gemini API Key

### Run Locally

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Terminal 1 — start the API server
npm run server

# Terminal 2 — start the frontend dev server (http://localhost:5186)
npm run dev
```

### Run with Docker

```bash
docker build -t passport-photo-ai .
docker run -p 5185:5185 -e GEMINI_API_KEY=your_key_here passport-photo-ai
```

## 📁 Project Structure

```
passport-photo-ai/
├── App.tsx                        # Main React component
├── types.ts                       # Shared TypeScript types and enums
├── theme.ts                       # Shared color constants
├── index.html                     # Entry HTML file
├── index.tsx                      # React entry point
├── components/
│   ├── ImageUploader.tsx          # Drag-and-drop / camera capture UI
│   └── PhotoEditor.tsx            # AI auto-fix and crop editor
├── server/
│   └── passport-proxy.js          # Express API server (Gemini integration)
├── public/                        # Static assets
└── Dockerfile                     # Docker configuration
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Express 5
- **Styling**: Custom CSS with gradients
- **Fonts**: Space Grotesk, Syne
- **AI**: Google Gemini 2.0 Flash for compliance analysis
- **Image Processing**: `@imgly/background-removal` for client-side background removal

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/passport/check` | Analyze a photo and return a compliance report |
| `POST` | `/api/passport/analyze` | Return an overall score and auto-fix recommendations |

Both endpoints accept `{ base64Image: string }` (data URL) and are rate-limited to 10 requests per IP per minute.

**`/api/passport/check` response:**
```json
{
  "compliant": false,
  "summary": "Photo has a non-plain background and slight shadow under chin.",
  "issues": ["Background is not plain white or off-white", "Shadow visible under chin"],
  "suggestions": ["Shoot against a plain white wall", "Use diffuse lighting to eliminate chin shadows"]
}
```

**`/api/passport/analyze` response:**
```json
{
  "overallScore": 72,
  "autoFixRecommendations": {
    "adjustBrightness": 5,
    "adjustContrast": 8
  }
}
```

## 🔧 Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Camera access denied" | Allow camera permission in the browser address bar, then try again |
| "Unable to access camera" | Camera requires a secure (HTTPS) connection; `localhost` is exempt |
| "Image too large" error | Resize the image to under 4 MB before uploading |
| Analysis returns no result | Verify `GEMINI_API_KEY` is set and the API server is running on port 5185 |
| Background removal stalls | The first run downloads ML model weights (~20 MB); wait for the progress bar to complete |

## 🌐 Live Demo

[passportphoto.tranthachnguyen.com](https://passportphoto.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
