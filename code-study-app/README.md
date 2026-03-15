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

**Understanding a file:**
- "What does this file do and how does it fit into the project?"
- "What are the most important things to pay attention to here?"
- "Walk me through the data flow in this component"

**Going deeper:**
- "Why is this logic in a custom hook instead of the component?"
- "What problem does this cache solve, and what are its trade-offs?"
- "Are there any potential bugs or edge cases in this code?"

**Architecture and patterns:**
- "Give me a high-level overview of this project's architecture"
- "How do the frontend and backend communicate?"
- "What design patterns are used here and why?"
- "How does this compare to the pattern used in LinguaFlow?"

**Server-side code:**
- "Why does this run on the server instead of in the browser?"
- "How does this API route handle errors?"
- "What happens if the external API call fails?"

**Learning concepts:**
- "Explain React.memo — when is it actually worth using?"
- "What's the difference between useCallback and useMemo here?"
- "How does virtual scrolling work in the code viewer?"
