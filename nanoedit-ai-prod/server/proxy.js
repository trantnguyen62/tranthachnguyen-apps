import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
const PORT = 5174;

// URL of the gemini-web-proxy server
const GEMINI_PROXY_URL = process.env.GEMINI_PROXY_URL || 'http://localhost:3000';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

// Keep-alive agents reuse TCP connections to the upstream proxy, reducing
// per-request connection overhead (especially important for local loopback).
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50, maxFreeSockets: 10 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50, maxFreeSockets: 10 });
const fetchOptions = (url) => (url.startsWith('https://') ? { agent: httpsAgent } : { agent: httpAgent });

app.use(compression());

// Restrict CORS to the known production origin only
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || 'https://photoedit.tranthachnguyen.com').split(','));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Limit to 10 MB — sufficient for base64-encoded images up to ~7 MB
app.use(express.json({ limit: '10mb' }));

/**
 * POST /api/gemini/edit-image
 *
 * Routes an image-editing request to gemini-web-proxy (Puppeteer automation).
 *
 * Request body:
 *   @param {string}  prompt      - Required. Natural language edit instruction.
 *   @param {string}  [base64Image] - Optional. Base64 data URI of the source image.
 *   @param {string}  [mimeType]  - MIME type of the image (default: `'image/png'`).
 *
 * Response (200):
 *   @returns {{ success: true, imageData: string }} Base64 data URI or URL of the edited image.
 *
 * Errors:
 *   - 400 Missing or invalid `prompt` (also: unsupported MIME type, invalid image data).
 *   - 502 gemini-web-proxy returned a non-JSON response.
 *   - 504 Upstream request timed out (110 s limit).
 *   - 500 gemini-web-proxy returned no image, or an unexpected internal error.
 */
app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { base64Image, mimeType, prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt field' });
    }
    if (prompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt exceeds maximum length of 2000 characters' });
    }

    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ error: 'Unsupported image type' });
    }

    if (base64Image && typeof base64Image !== 'string') {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    // base64Image is now optional - gemini-web-proxy uses text-only generation

    // Call the gemini-web-proxy /api/edit-image endpoint
    const upstreamController = new AbortController();
    const upstreamTimeout = setTimeout(() => upstreamController.abort(), 110_000);
    let response;
    try {
      response = await fetch(`${GEMINI_PROXY_URL}/api/edit-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          base64Image,
          mimeType: mimeType || 'image/png'
        }),
        signal: upstreamController.signal,
        ...fetchOptions(GEMINI_PROXY_URL),
      });
    } finally {
      clearTimeout(upstreamTimeout);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      console.error('[edit-image] Upstream returned non-JSON response (status %d)', response.status);
      return res.status(502).json({ error: 'Upstream proxy returned an unexpected response' });
    }

    if (!response.ok || !data.success) {
      console.error('[edit-image] Proxy error:', data.error);
      return res.status(response.status).json({
        error: data.error || 'Failed to edit image via proxy'
      });
    }

    // Extract image from response.
    // gemini-web-proxy returns an 'images' array whose entries can be either:
    //   - base64 data URIs  (e.g. "data:image/png;base64,…") — returned directly
    //   - regular HTTPS URLs — also returned directly; the client renders them via <img src>
    //   - blob: URLs        — these are browser-scoped and inaccessible server-side;
    //                         we still forward them so the client can attempt to render them,
    //                         though they will typically fail outside the originating browser tab.
    // In all cases we return the first image as `imageData` for simplicity.
    if (data.images && data.images.length > 0) {
      const imageData = data.images[0];

      if (imageData.startsWith('data:')) {
        // Base64 data URI — safe to return as-is
        return res.json({
          success: true,
          imageData: imageData
        });
      }

      // HTTP(S) URL or blob URL — pass through; client handles rendering
      return res.json({
        success: true,
        imageData: imageData,
        text: data.text
      });
    }

    // If no images but we have text response (maybe Gemini described what to do)
    if (data.text) {
      return res.status(500).json({
        error: 'Gemini responded with text but no generated image. Try rephrasing your prompt.',
        text: data.text
      });
    }

    console.error('[edit-image] No images in response');
    return res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[edit-image] Upstream request timed out');
      return res.status(504).json({ error: 'Request to AI service timed out. Please try again.' });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[edit-image] Error:', message);
    return res.status(500).json({ error: 'An internal error occurred. Please try again.' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'gemini-web-proxy' });
});

/**
 * GET /api/status
 *
 * Reports whether gemini-web-proxy is reachable.
 *
 * Response (200):
 *   { proxyStatus: 'connected', geminiProxy: <upstream status object> }
 *   { proxyStatus: 'disconnected' }  — when upstream is unreachable (never throws)
 */
app.get('/api/status', async (req, res) => {
  try {
    const statusController = new AbortController();
    const statusTimeout = setTimeout(() => statusController.abort(), 5_000);
    let response;
    try {
      response = await fetch(`${GEMINI_PROXY_URL}/api/status`, {
        signal: statusController.signal,
        ...fetchOptions(GEMINI_PROXY_URL),
      });
    } finally {
      clearTimeout(statusTimeout);
    }
    const data = await response.json();
    res.json({
      proxyStatus: 'connected',
      geminiProxy: data
    });
  } catch (error) {
    console.error('[status] Upstream unreachable:', error instanceof Error ? error.message : String(error));
    res.json({
      proxyStatus: 'disconnected',
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎨 NanoEdit AI Proxy Server running on port ${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Mode: Gemini Web Proxy (Puppeteer automation)`);
  console.log(`   Proxy URL: ${GEMINI_PROXY_URL}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n⚠️  Make sure gemini-web-proxy is running!`);
  console.log(`   cd /path/to/gemini-web-proxy && npm start\n`);
});
