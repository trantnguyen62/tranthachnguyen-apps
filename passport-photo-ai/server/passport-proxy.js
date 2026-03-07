import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

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
app.use(express.static(distPath));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

app.post('/api/passport/check', apiRateLimit, async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image || typeof base64Image !== 'string') return res.status(400).json({ error: 'No image' });

    const mimeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : null;
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) return res.status(400).json({ error: 'Invalid image type' });
    const clean = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

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
    const parsed = match ? JSON.parse(match[0]) : {};
    
    res.json({
      compliant: !!parsed.compliant,
      summary: parsed.summary || '',
      issues: parsed.issues || [],
      suggestions: parsed.suggestions || []
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
    const mimeMatch2 = base64Image.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType2 = mimeMatch2 ? mimeMatch2[1] : null;
    if (!mimeType2 || !ALLOWED_MIME_TYPES.has(mimeType2)) return res.status(400).json({ error: 'Invalid image type' });
    const clean = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: clean, mimeType: mimeType2 } },
          { text: `Analyze photo for passport. Return JSON:
{"overallScore":number,"autoFixRecommendations":{"adjustBrightness":number,"adjustContrast":number}}
adjustBrightness/adjustContrast are % to add (e.g., 5 means +5%)` }
        ]
      }
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    res.json(match ? JSON.parse(match[0]) : { overallScore: 70, autoFixRecommendations: { adjustBrightness: 5, adjustContrast: 8 } });
  } catch (e) {
    res.json({ overallScore: 70, autoFixRecommendations: { adjustBrightness: 5, adjustContrast: 8 } });
  }
});

// Handle SPA routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(5185, () => console.log('API on port 5185, Key:', process.env.GEMINI_API_KEY ? 'Yes' : 'No'));




