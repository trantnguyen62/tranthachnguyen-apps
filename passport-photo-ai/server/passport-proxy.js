import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: ['https://passportphoto.tranthachnguyen.com', 'http://localhost:5186', 'http://localhost:5173'],
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '5mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple in-memory rate limiter: max 10 AI requests per IP per minute
const _rateMap = new Map();
function apiRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = _rateMap.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  _rateMap.set(ip, entry);
  if (entry.count > 10) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  next();
}
// Periodically clean up stale entries to prevent memory growth
setInterval(() => { const now = Date.now(); _rateMap.forEach((v, k) => { if (now > v.resetAt) _rateMap.delete(k); }); }, 120_000);

// Serve static files from dist
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath, {
  maxAge: '7d',
  immutable: true,
  setHeaders(res, filePath) {
    // HTML must not be cached aggressively (SPA entry point changes on deploy)
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function parseBase64Image(base64Image) {
  const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/i);
  const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : null;
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) return null;
  const data = base64Image.replace(/^data:image\/[a-z]+;base64,/i, '');
  return { mimeType, data };
}

app.post('/api/passport/check', apiRateLimit, async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image || typeof base64Image !== 'string') return res.status(400).json({ error: 'No image' });
    if (base64Image.length > 4 * 1024 * 1024 * 1.4) return res.status(400).json({ error: 'Image too large' }); // ~4MB decoded

    const parsed = parseBase64Image(base64Image);
    if (!parsed) return res.status(400).json({ error: 'Invalid image type' });
    const { mimeType, data: clean } = parsed;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: clean, mimeType } },
          { text: `Analyze this passport photo. Return JSON only:
{"compliant":boolean,"summary":"string","issues":["string"],"suggestions":["string"]}
Check: plain background, neutral expression, proper lighting, no glasses glare, face centered.` }
        ]
      }
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    let aiResult = {};
    try { if (match) aiResult = JSON.parse(match[0]); } catch { /* use default */ }

    res.json({
      compliant: !!aiResult.compliant,
      summary: aiResult.summary || '',
      issues: aiResult.issues || [],
      suggestions: aiResult.suggestions || []
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

app.post('/api/passport/analyze', apiRateLimit, async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image || typeof base64Image !== 'string') return res.status(400).json({ error: 'No image' });
    if (base64Image.length > 4 * 1024 * 1024 * 1.4) return res.status(400).json({ error: 'Image too large' }); // ~4MB decoded
    const parsed = parseBase64Image(base64Image);
    if (!parsed) return res.status(400).json({ error: 'Invalid image type' });
    const { mimeType, data: clean } = parsed;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: clean, mimeType } },
          { text: `Analyze photo for passport. Return JSON:
{"overallScore":number,"autoFixRecommendations":{"adjustBrightness":number,"adjustContrast":number}}
adjustBrightness/adjustContrast are % to add (e.g., 5 means +5%)` }
        ]
      }
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    let result = { overallScore: 70, autoFixRecommendations: { adjustBrightness: 5, adjustContrast: 8 } };
    try { if (match) result = JSON.parse(match[0]); } catch { /* use default */ }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// Handle SPA routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(5185, () => console.log('API on port 5185, Key:', process.env.GEMINI_API_KEY ? 'Yes' : 'No'));




