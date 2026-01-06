# 🌐 LinguaFlow - AI Language Partner

An AI-powered language learning partner that helps you practice conversation with real-time voice interaction and feedback.

## 🎯 Features

- **Voice Conversation** - Practice speaking with AI using WebSocket audio streaming
- **Real-time Feedback** - Get instant corrections and suggestions
- **Multiple Languages** - Practice various languages
- **Natural Dialogue** - AI responds naturally like a conversation partner
- **Progress Tracking** - Track your learning journey
- **Transcription** - See what you and the AI are saying

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
docker build -t linguaflow .
docker run -p 3000:3000 linguaflow
```

## 📁 Project Structure

```
linguaflow/
├── App.tsx             # Main React component
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
├── components/         # UI components
├── hooks/              # Custom React hooks (audio, WebSocket)
├── utils/              # Utility functions
├── server/             # Backend servers
│   ├── api-server.js   # REST API
│   └── websocket-proxy.js  # WebSocket for live audio
├── data/               # Language data and phrases
└── Dockerfile*         # Docker configurations
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, WebSocket
- **AI**: Google Gemini API with Live Audio
- **Styling**: Custom CSS

## 🌐 Live Demo

[linguaflow.tranthachnguyen.com](https://linguaflow.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
