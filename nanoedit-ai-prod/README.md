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
- Gemini API Key

### Run Locally

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start development server
npm run dev
```

### Run with Docker

```bash
docker build -t nanoedit-ai .
docker run -p 5173:5173 -p 5174:5174 nanoedit-ai
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
