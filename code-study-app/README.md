# Code Study App

An AI-powered code study application that helps you learn and understand your codebase using Gemini Live voice audio.

## Features

- **Browse Your Codebase**: Navigate through all your projects in the TranThachNguyen.com folder
- **Voice Interaction**: Talk to an AI tutor about your code using Gemini Live
- **Code Context**: The AI understands the file you're viewing and can answer questions about it
- **Search**: Search across files and content in your projects
- **Real-time Transcription**: See what you and the AI are saying

## Architecture

- **Frontend**: React + Vite (Port 3007)
- **WebSocket Proxy**: Proxies Gemini Live API (Port 3005)
- **API Server**: Serves file tree and content (Port 3006)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start all servers:
   ```bash
   npm start
   ```

   Or start individually:
   ```bash
   # Terminal 1: WebSocket proxy
   node server/websocket-proxy.js

   # Terminal 2: API server
   node server/api-server.js

   # Terminal 3: Frontend
   npm run dev
   ```

4. Open http://localhost:3007

## Usage

1. Select a project from the dropdown
2. Browse files in the file tree
3. Click on a file to view its content
4. Click "Start Voice Session" to begin talking with the AI
5. Ask questions about the code you're viewing!

## Example Questions

- "What does this file do?"
- "Explain the useLiveSession hook"
- "How does the WebSocket connection work?"
- "What patterns are used in this code?"
- "How can I improve this function?"
