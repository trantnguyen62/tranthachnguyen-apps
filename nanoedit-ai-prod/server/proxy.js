import express from 'express';
import cors from 'cors';
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

// Keep-alive agents reuse TCP connections to the upstream proxy, reducing
// per-request connection overhead (especially important for local loopback).
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const fetchOptions = (url) => (url.startsWith('https://') ? { agent: httpsAgent } : { agent: httpAgent });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
 *   - 400 Missing `prompt`.
 *   - 500 gemini-web-proxy returned no image or an upstream error.
 *   - 500 Upstream request timed out (110 s limit).
 */
app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { base64Image, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt field' });
    }

    // base64Image is now optional - gemini-web-proxy uses text-only generation

    console.log(`[edit-image] prompt="${prompt.substring(0, 80)}"`);

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

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[edit-image] Proxy error:', data.error);
      return res.status(response.status).json({
        error: data.error || 'Failed to edit image via proxy'
      });
    }

    console.log('[edit-image] Success! Got response from gemini-web-proxy');

    // Extract image from response
    // The gemini-web-proxy returns images in the 'images' array as URLs or base64
    if (data.images && data.images.length > 0) {
      // If images are returned as blob URLs, we need to handle differently
      // For now, return the first image
      const imageData = data.images[0];

      // If it's already a data URL, return as-is
      if (imageData.startsWith('data:')) {
        return res.json({
          success: true,
          imageData: imageData
        });
      }

      // If it's a blob URL, we can't access it from server-side
      // Return text response with instructions
      console.log('[edit-image] Image URL:', imageData.substring(0, 100));
      return res.json({
        success: true,
        imageData: imageData,
        text: data.text
      });
    }

    // If no images but we have text response (maybe Gemini described what to do)
    if (data.text) {
      console.log('[edit-image] Got text response, no images');
      return res.status(500).json({
        error: 'Gemini responded with text but no generated image. Try rephrasing your prompt.',
        text: data.text
      });
    }

    console.error('[edit-image] No images in response');
    return res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[edit-image] Error:', message);
    return res.status(500).json({ error: message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'gemini-web-proxy' });
});

/**
 * Check gemini-web-proxy status
 */
app.get('/api/status', async (req, res) => {
  try {
    const response = await fetch(`${GEMINI_PROXY_URL}/api/status`, fetchOptions(GEMINI_PROXY_URL));
    const data = await response.json();
    res.json({
      proxyStatus: 'connected',
      geminiProxy: data
    });
  } catch (error) {
    res.json({
      proxyStatus: 'disconnected',
      error: error instanceof Error ? error.message : String(error),
      note: 'Make sure gemini-web-proxy is running on ' + GEMINI_PROXY_URL
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎨 NanoEdit AI Proxy Server running on port ${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Mode: Gemini Web Proxy (Puppeteer automation)`);
  console.log(`   Proxy URL: ${GEMINI_PROXY_URL}`);
  console.log(`   Video generation: REMOVED`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n⚠️  Make sure gemini-web-proxy is running!`);
  console.log(`   cd /path/to/gemini-web-proxy && npm start\n`);
});
