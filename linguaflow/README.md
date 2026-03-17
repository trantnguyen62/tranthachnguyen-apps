# 🌐 LinguaFlow - AI Language Partner

An AI-powered language learning partner that helps you practice conversation with real-time voice interaction and feedback.

## 🎯 Features

- **Voice Conversation** - Practice speaking with AI using WebSocket audio streaming
- **Real-time Feedback** - Get instant corrections and suggestions
- **Multiple Languages** - Practice Spanish, French, German, Japanese, Vietnamese, and English; includes a dedicated Vietnamese-to-English bilingual course
- **Natural Dialogue** - AI responds naturally like a conversation partner
- **Progress Tracking** - Track your learning journey
- **Transcription** - See what you and the AI are saying

## 🏗️ How It Works

```
Browser  ──(WebSocket)──▶  ws-proxy (port 3001)  ──▶  Gemini Live Audio API
   │                                                          │
   │◀─────────────── audio + transcription ──────────────────┘
   │
   └──(HTTP)──▶  api-server (port 3002)  ──▶  data/users.json
```

- **WebSocket proxy** keeps your Gemini API key server-side and never exposes it to the browser. It also enforces rate limiting and origin validation.
- **API server** stores learner profiles (name, lesson number, words learned) so the AI tutor can personalise each session.
- **Frontend** captures microphone audio as PCM16 at 16 kHz, streams it to the proxy, and plays back Gemini's PCM16 responses at 24 kHz using the Web Audio API.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- Gemini API Key

### Run Locally

```bash
# Install dependencies
npm install

# Set up environment (create .env.local with your keys)
cat > .env.local << 'EOF'
GEMINI_API_KEY=your_api_key_here
VITE_PROXY_URL=ws://localhost:3001
EOF

# Start backend servers (WebSocket proxy + API)
npm run server

# In a separate terminal, start the frontend
npm run dev
```

### Run with Docker

```bash
docker build -t linguaflow .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_api_key_here linguaflow
```

## 📁 Project Structure

```
linguaflow/
├── App.tsx             # Main React component
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
├── constants.ts        # Language configs, voices, and conversation topics
├── types.ts            # TypeScript interfaces and enums
├── components/         # UI components (Visualizer, Transcript, LanguageSelector, UserProfileModal)
├── hooks/              # Custom React hooks (useLiveSession — audio + WebSocket lifecycle)
├── utils/              # Utility functions (audio codec, proxy client, XSS sanitization)
├── server/             # Backend servers
│   ├── api-server.js       # REST API for learner profiles (port 3002)
│   ├── websocket-proxy.js  # WebSocket gateway to Gemini Live API (port 3001)
│   ├── logger.js           # Shared security logging utility
│   └── websocket-proxy.test.js  # Security tests for the proxy
├── data/               # User session data (users.json)
└── Dockerfile*         # Docker configurations
```

## ⚙️ Environment Variables

Create `.env.local` in the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (get one at [aistudio.google.com](https://aistudio.google.com)) |
| `VITE_PROXY_URL` | Yes | WebSocket proxy URL. Use `ws://localhost:3001` for local dev; set to `/ws` in `.env.production` for production builds |

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server (port 3000) |
| `npm run server` | Start both backend servers (WebSocket proxy + API) |
| `npm run proxy` | Start WebSocket proxy only (port 3001) |
| `npm run api` | Start API server only (port 3002) |
| `npm run build` | Build frontend for production |
| `npm test` | Run all tests |
| `npm run test:security` | Run WebSocket security tests |

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, WebSocket
- **AI**: Google Gemini API with Live Audio
- **Styling**: Custom CSS

## 🌐 Live Demo

[linguaflow.tranthachnguyen.com](https://linguaflow.tranthachnguyen.com)

## 📄 License

© 2025–2026 Tran Thach Nguyen. All rights reserved.
