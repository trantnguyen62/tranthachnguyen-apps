# 📸 Passport Photo AI (PassportLens)

Automatically crop and format your photos to meet strict passport and visa requirements using AI.

## 🎯 Features

- **Auto Face Detection** - Automatically detects and centers your face
- **Smart Cropping** - Crops to exact passport size specifications
- **Background Removal** - AI-powered background removal for clean photos
- **Multi-Country Support** - Supports passport sizes for different countries
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
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start development server
npm run dev
```

### Run with Docker

```bash
docker build -t passport-photo-ai .
docker run -p 5185:5185 passport-photo-ai
```

## 📁 Project Structure

```
passport-photo-ai/
├── App.tsx             # Main React component
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
├── components/         # UI components (uploader, preview, etc.)
├── server/             # API server for image processing
├── public/             # Static assets
└── Dockerfile          # Docker configuration
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Custom CSS with gradients
- **Fonts**: Space Grotesk, Syne
- **AI**: Google Gemini API for image processing

## 🌐 Live Demo

[passportphoto.tranthachnguyen.com](https://passportphoto.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
