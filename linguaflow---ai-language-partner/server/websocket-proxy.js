import { WebSocketServer } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env.local` });

const PORT = 3001;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

// Allowed origins for WebSocket connections
const ALLOWED_ORIGINS = [
  'https://linguaflow.tranthachnguyen.com',
  'https://localhost:3000',
  'http://localhost:3000',
  'https://127.0.0.1:3000',
  'http://127.0.0.1:3000'
];

// In development, also allow localhost on any port (for IDE preview proxies)
const isDevelopment = process.env.NODE_ENV !== 'production';

// Rate limiting: max connections per IP per time window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_CONNECTIONS = process.env.RATE_LIMIT_MAX_CONNECTIONS ? parseInt(process.env.RATE_LIMIT_MAX_CONNECTIONS) : 5;

// Connection limits
const MAX_CONCURRENT_CONNECTIONS = 100;
const CONNECTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Message size limit (1MB)
const MAX_MESSAGE_SIZE = 1024 * 1024;

// Valid message types
const VALID_MESSAGE_TYPES = ['connect', 'realtimeInput', 'disconnect'];

// ============================================================================
// SECURITY STATE TRACKING
// ============================================================================

// Track connection attempts per IP for rate limiting
const connectionAttempts = new Map(); // IP -> [timestamps]

// Track active connections per IP
const activeConnections = new Map(); // IP -> count

// Track total active connections
let totalActiveConnections = 0;

// ============================================================================
// SECURITY HELPER FUNCTIONS
// ============================================================================

// Extract IP address from request
function getClientIP(req) {
  return req.socket.remoteAddress ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown';
}

// Validate origin
function isOriginAllowed(origin, req) {
  // Allow requests coming through Cloudflare tunnel (they have cf-ray header)
  if (req && req.headers && req.headers['cf-ray']) {
    return true;
  }
  // Allow if origin is null but has cloudflare headers (tunnel requests)
  if (!origin && req && req.headers && (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'])) {
    return true;
  }
  if (!origin) return false;
  
  // In development, allow localhost/127.0.0.1 on any port (for IDE preview proxies)
  if (isDevelopment) {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    if (localhostPattern.test(origin)) {
      return true;
    }
  }
  
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

// Check rate limit for IP
function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = connectionAttempts.get(ip) || [];

  // Remove old attempts outside the time window
  const recentAttempts = attempts.filter(timestamp =>
    now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentAttempts.length >= RATE_LIMIT_MAX_CONNECTIONS) {
    logger.security('Rate limit exceeded', { ip, attempts: recentAttempts.length });
    return false;
  }

  // Add current attempt
  recentAttempts.push(now);
  connectionAttempts.set(ip, recentAttempts);

  return true;
}

// Check connection limit
function checkConnectionLimit() {
  if (totalActiveConnections >= MAX_CONCURRENT_CONNECTIONS) {
    logger.security('Connection limit reached', {
      current: totalActiveConnections,
      max: MAX_CONCURRENT_CONNECTIONS
    });
    return false;
  }
  return true;
}

// Increment connection count for IP
function incrementConnection(ip) {
  const count = activeConnections.get(ip) || 0;
  activeConnections.set(ip, count + 1);
  totalActiveConnections++;
  logger.info('Connection established', {
    ip,
    ipConnections: count + 1,
    totalConnections: totalActiveConnections
  });
}

// Decrement connection count for IP
function decrementConnection(ip) {
  const count = activeConnections.get(ip) || 0;
  if (count > 0) {
    activeConnections.set(ip, count - 1);
  }
  if (totalActiveConnections > 0) {
    totalActiveConnections--;
  }
  logger.info('Connection closed', {
    ip,
    ipConnections: Math.max(0, count - 1),
    totalConnections: totalActiveConnections
  });
}

// Validate message structure and type
function validateMessage(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid message format' };
  }

  if (!data.type || !VALID_MESSAGE_TYPES.includes(data.type)) {
    return { valid: false, error: 'Invalid message type' };
  }

  // Validate specific message types
  if (data.type === 'realtimeInput' && !data.input) {
    return { valid: false, error: 'Missing input data' };
  }

  if (data.type === 'connect' && !data.config) {
    return { valid: false, error: 'Missing configuration' };
  }

  return { valid: true };
}

// Sanitize error messages to prevent information leakage
function sanitizeError(error) {
  // Don't expose internal error details to client
  const safeErrors = {
    'API key not configured on server': 'Service configuration error',
    'Failed to connect to Gemini': 'Unable to connect to AI service',
    'Gemini API error': 'AI service error',
    'Invalid message format': 'Invalid request format',
    'Invalid message type': 'Invalid request type',
    'Missing input data': 'Invalid request data',
    'Missing configuration': 'Invalid request configuration'
  };

  return safeErrors[error] || 'An error occurred. Please try again.';
}

// ============================================================================
// WEBSOCKET SERVER SETUP
// ============================================================================

const wss = new WebSocketServer({
  port: PORT,
  verifyClient: (info, callback) => {
    const ip = getClientIP(info.req);
    const origin = info.origin || info.req.headers.origin;

    // Validate origin
    if (!isOriginAllowed(origin, info.req)) {
      logger.security('Connection rejected: invalid origin', { ip, origin, headers: info.req.headers });
      callback(false, 403, 'Forbidden');
      return;
    }

    // Check rate limit
    if (!checkRateLimit(ip)) {
      logger.security('Connection rejected: rate limit exceeded', { ip });
      callback(false, 429, 'Too Many Requests');
      return;
    }

    // Check connection limit
    if (!checkConnectionLimit()) {
      logger.security('Connection rejected: server at capacity', { ip });
      callback(false, 503, 'Service Unavailable');
      return;
    }

    callback(true);
  }
});

logger.info(`LinguaFlow WebSocket Proxy Server running on port ${PORT}`);
logger.info(`API Key loaded: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);

wss.on('connection', (clientWs, req) => {
  const ip = getClientIP(req);
  incrementConnection(ip);

  let geminiSession = null;
  let isConnecting = false;
  let connectionTimeout = null;

  // Set connection timeout
  connectionTimeout = setTimeout(() => {
    logger.warn('Connection timeout', { ip });
    clientWs.send(JSON.stringify({
      type: 'error',
      error: 'Session timeout. Please reconnect.'
    }));
    clientWs.close();
  }, CONNECTION_TIMEOUT_MS);

  clientWs.on('message', async (message) => {
    try {
      // Check message size
      if (message.length > MAX_MESSAGE_SIZE) {
        logger.security('Message size limit exceeded', {
          ip,
          size: message.length,
          limit: MAX_MESSAGE_SIZE
        });
        clientWs.send(JSON.stringify({
          type: 'error',
          error: sanitizeError('Message too large')
        }));
        return;
      }

      const data = JSON.parse(message.toString());

      // Validate message
      const validation = validateMessage(data);
      if (!validation.valid) {
        logger.warn('Invalid message received', { ip, error: validation.error });
        clientWs.send(JSON.stringify({
          type: 'error',
          error: sanitizeError(validation.error)
        }));
        return;
      }

      // Handle connection request from client
      if (data.type === 'connect') {
        if (isConnecting || geminiSession) {
          return;
        }

        isConnecting = true;
        logger.info('Connecting to Gemini Live API', { ip });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          logger.error('API key not configured');
          clientWs.send(JSON.stringify({
            type: 'error',
            error: sanitizeError('API key not configured on server')
          }));
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
                logger.info('Connected to Gemini Live API', { ip });
                clientWs.send(JSON.stringify({ type: 'open' }));
                isConnecting = false;
              },
              onmessage: (msg) => {
                // Forward Gemini messages to client
                clientWs.send(JSON.stringify({
                  type: 'message',
                  data: msg
                }));
              },
              onclose: (event) => {
                logger.info('Gemini connection closed', { ip, code: event?.code, reason: event?.reason, wasClean: event?.wasClean });
                const closeReason = event?.reason || '';
                clientWs.send(JSON.stringify({ type: 'close', code: event?.code, reason: closeReason }));
                geminiSession = null;
              },
              onerror: (err) => {
                logger.error('Gemini error', { ip, error: err?.message || err, stack: err?.stack });
                clientWs.send(JSON.stringify({
                  type: 'error',
                  error: sanitizeError('Gemini API error')
                }));
                isConnecting = false;
              }
            }
          });
        } catch (err) {
          logger.error('Failed to connect to Gemini', { ip, error: err.message });
          clientWs.send(JSON.stringify({
            type: 'error',
            error: sanitizeError('Failed to connect to Gemini')
          }));
          isConnecting = false;
        }
      }

      // Handle audio/data from client to send to Gemini
      else if (data.type === 'realtimeInput' && geminiSession) {
        await geminiSession.sendRealtimeInput(data.input);
      }

      // Handle disconnect request
      else if (data.type === 'disconnect' && geminiSession) {
        try {
          geminiSession.close();
        } catch (e) {
          logger.warn('Error closing Gemini session', { ip, error: e.message });
        }
        geminiSession = null;
      }

    } catch (error) {
      logger.error('Error handling client message', { ip, error: error.message });
      clientWs.send(JSON.stringify({
        type: 'error',
        error: sanitizeError(error.message)
      }));
    }
  });

  clientWs.on('close', () => {
    decrementConnection(ip);

    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    if (geminiSession) {
      try {
        geminiSession.close();
      } catch (e) {
        logger.warn('Error closing Gemini session on client disconnect', {
          ip,
          error: e.message
        });
      }
      geminiSession = null;
    }
  });

  clientWs.on('error', (error) => {
    logger.error('Client WebSocket error', { ip, error: error.message });
  });
});
