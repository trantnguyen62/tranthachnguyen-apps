// WebSocket proxy server that bridges the browser client and the Gemini Live API.
//
// Why a proxy? The Gemini API key must not be exposed in browser-side code.
// This server holds the key server-side and forwards audio/text between the
// client (port 3007) and Gemini.
//
// Security measures:
//   - Origin allowlist: only requests from the Vite dev server are accepted
//   - Rate limiting: max 10 connection attempts per IP per 60-second window
//   - Session timeout: connections are forcibly closed after 30 minutes
//
// Message protocol (JSON over WebSocket):
//   Client → server: { type: "connect"|"realtimeInput"|"sendText"|"disconnect", ... }
//   Server → client: { type: "open"|"message"|"close"|"error", ... }

import { WebSocketServer } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env.local` });

const PORT = 3005;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3007',
  'http://127.0.0.1:3007',
  'https://localhost:3007',
];

const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting
const connectionAttempts = new Map();
const activeConnections = new Map();
let totalActiveConnections = 0;

function getClientIP(req) {
  return req.socket.remoteAddress ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown';
}

function isOriginAllowed(origin, _req) {
  if (!origin) return isDevelopment;

  if (isDevelopment) {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    if (localhostPattern.test(origin)) return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
}

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = connectionAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(ts => now - ts < 60000);

  if (recentAttempts.length >= 10) return false;

  recentAttempts.push(now);
  connectionAttempts.set(ip, recentAttempts);
  return true;
}

// Periodically clean up stale rate limit entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of connectionAttempts) {
    const recent = attempts.filter(ts => now - ts < 60000);
    if (recent.length === 0) connectionAttempts.delete(ip);
    else connectionAttempts.set(ip, recent);
  }
}, 60000);

const wss = new WebSocketServer({
  port: PORT,
  verifyClient: (info, callback) => {
    const ip = getClientIP(info.req);
    const origin = info.origin || info.req.headers.origin;

    if (!isOriginAllowed(origin, info.req)) {
      console.log(`[Security] Rejected: invalid origin ${origin} from ${ip}`);
      callback(false, 403, 'Forbidden');
      return;
    }

    if (!checkRateLimit(ip)) {
      console.log(`[Security] Rate limit exceeded for ${ip}`);
      callback(false, 429, 'Too Many Requests');
      return;
    }

    callback(true);
  }
});

console.log(`[CodeStudy] WebSocket Proxy Server running on port ${PORT}`);
console.log(`[CodeStudy] API Key loaded: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);

wss.on('connection', (clientWs, req) => {
  const ip = getClientIP(req);
  totalActiveConnections++;
  console.log(`[Connection] New client from ${ip}. Total: ${totalActiveConnections}`);

  let geminiSession = null;
  let isConnecting = false;
  let connectionTimeout = null;

  connectionTimeout = setTimeout(() => {
    console.log(`[Timeout] Session timeout for ${ip}`);
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: 'Session timeout. Please reconnect.' }));
    }
    clientWs.close();
  }, 30 * 60 * 1000);

  clientWs.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'connect') {
        if (isConnecting || geminiSession) return;

        isConnecting = true;
        console.log(`[Gemini] Connecting for ${ip}...`);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.error('[Error] API key not configured');
          clientWs.send(JSON.stringify({ type: 'error', error: 'API key not configured' }));
          isConnecting = false;
          return;
        }

        const ai = new GoogleGenAI({ apiKey });

        const config = {
          model: MODEL_NAME,
          config: {
            responseModalities: data.config?.responseModalities || ['AUDIO'],
            speechConfig: data.config?.speechConfig,
            systemInstruction: data.config?.systemInstruction,
            inputAudioTranscription: data.config?.inputAudioTranscription || {},
            outputAudioTranscription: data.config?.outputAudioTranscription || {},
          },
        };

        try {
          geminiSession = await ai.live.connect({
            ...config,
            callbacks: {
              onopen: () => {
                console.log(`[Gemini] Connected for ${ip}`);
                clientWs.send(JSON.stringify({ type: 'open' }));
                isConnecting = false;
              },
              onmessage: (msg) => {
                clientWs.send(JSON.stringify({ type: 'message', data: msg }));
              },
              onclose: (event) => {
                console.log(`[Gemini] Closed for ${ip}`);
                if (clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'close', code: event?.code, reason: event?.reason }));
                }
                geminiSession = null;
              },
              onerror: (err) => {
                console.error(`[Gemini] Error for ${ip}:`, err?.message || err);
                if (clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'error', error: 'AI service error' }));
                }
                isConnecting = false;
              }
            }
          });
        } catch (err) {
          console.error(`[Gemini] Connection failed for ${ip}:`, err.message);
          clientWs.send(JSON.stringify({ type: 'error', error: 'Failed to connect to AI service' }));
          isConnecting = false;
        }
      }

      else if (data.type === 'realtimeInput' && geminiSession) {
        await geminiSession.sendRealtimeInput(data.input);
      }

      else if (data.type === 'sendText' && geminiSession) {
        // Send text message to Gemini (for code context)
        await geminiSession.send({ text: data.text });
      }

      else if (data.type === 'disconnect' && geminiSession) {
        try { geminiSession.close(); } catch (e) {}
        geminiSession = null;
      }

    } catch (error) {
      console.error(`[Error] Message handling for ${ip}:`, error.message);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', error: 'An error occurred' }));
      }
    }
  });

  clientWs.on('close', () => {
    totalActiveConnections--;
    console.log(`[Connection] Client ${ip} disconnected. Total: ${totalActiveConnections}`);
    
    if (connectionTimeout) clearTimeout(connectionTimeout);
    if (geminiSession) {
      try { geminiSession.close(); } catch (e) {}
      geminiSession = null;
    }
  });

  clientWs.on('error', (error) => {
    console.error(`[Error] WebSocket error for ${ip}:`, error.message);
  });
});
