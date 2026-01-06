import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
const PORT = 5174;

// URL of the gemini-web-proxy server
const GEMINI_PROXY_URL = process.env.GEMINI_PROXY_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

/**
 * Image editing endpoint - routes to gemini-web-proxy
 * Uses Puppeteer automation instead of paid Google API
 */
app.post('/api/gemini/edit-image', async (req, res) => {
  try {
    const { base64Image, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt field' });
    }

    // base64Image is now optional - gemini-web-proxy uses text-only generation

    console.log(`[edit-image] Routing to gemini-web-proxy...`);
    console.log(`[edit-image] Prompt: ${prompt.substring(0, 100)}...`);

    // Call the gemini-web-proxy /api/edit-image endpoint
    const response = await fetch(`${GEMINI_PROXY_URL}/api/edit-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        base64Image,
        mimeType: mimeType || 'image/png'
      }),
    });

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
    res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    console.error('[edit-image] Error:', error.message);
    res.status(500).json({ error: error.message });
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
    const response = await fetch(`${GEMINI_PROXY_URL}/api/status`);
    const data = await response.json();
    res.json({
      proxyStatus: 'connected',
      geminiProxy: data
    });
  } catch (error) {
    res.json({
      proxyStatus: 'disconnected',
      error: error.message,
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
