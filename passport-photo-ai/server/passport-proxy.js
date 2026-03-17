/**
 * passport-proxy.js — Express API server for PassportLens.
 *
 * Responsibilities:
 *  - Serve the Vite-built SPA from `../dist` with aggressive asset caching.
 *  - Proxy image analysis requests to Google Gemini 2.0 Flash, enforcing:
 *      • Input validation (MIME type, size limit)
 *      • Rate limiting (10 requests / IP / minute)
 *      • Result caching (SHA-256 keyed, 60-minute TTL, max 1000 entries)
 *  - Apply security headers (HSTS, CSP, X-Frame-Options, etc.).
 *
 * Endpoints:
 *  POST /api/passport/check   — ICAO compliance report (compliant, issues, suggestions)
 *  POST /api/passport/analyze — Quality score + brightness/contrast recommendations
 *
 * Environment variables:
 *  GEMINI_API_KEY  (required) — Google AI Studio key with Gemini API access
 *  NODE_ENV        (optional) — Set to "production" to restrict CORS to the live domain only
 */
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/../.env.local` });

if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set. Server cannot start without it.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(compression());
const allowedOrigins = ['https://passportphoto.tranthachnguyen.com'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5186', 'http://localhost:5173');
}
app.use(cors({
  origin: allowedOrigins,
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '5mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  // Apply restrictive CSP and Permissions-Policy only to API responses (JSON),
  // not to HTML/asset responses — "default-src 'none'" on the HTML document would
  // block all scripts/styles from loading, and "camera=()" would break webcam capture.
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Permissions-Policy', 'geolocation=()');
  }
  next();
});

// Simple in-memory rate limiter: max 10 AI requests per IP per minute
const _rateMap = new Map();

/**
 * Express middleware that allows up to 10 requests per IP per 60-second window.
 * Counters reset automatically; stale entries are pruned every 60 seconds by
 * the `setInterval` below to prevent unbounded memory growth.
 */
function apiRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = _rateMap.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  _rateMap.set(ip, entry);
  if (entry.count > 10) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
}
// Periodically clean up stale entries to prevent memory growth
setInterval(() => { const now = Date.now(); _rateMap.forEach((v, k) => { if (now > v.resetAt) _rateMap.delete(k); }); }, 60_000);

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

// Simple result cache: avoid duplicate Gemini API calls for the same image
const _checkCache = new Map(); // hash -> { result, expires }
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes
const CACHE_MAX = 1000;
/** Returns the full SHA-256 hex hash of the base64 image data. */
function getCacheKey(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Returns the cached result for `key`, or `null` if missing or expired. */
function getCached(key) {
  const entry = _checkCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { _checkCache.delete(key); return null; }
  // Move to end (most-recently-used) for LRU eviction
  _checkCache.delete(key);
  _checkCache.set(key, entry);
  return entry.result;
}

/**
 * Stores a result in the cache with a TTL of `CACHE_TTL` ms.
 * Evicts the least-recently-used entry when the cache is full.
 */
function setCache(key, result) {
  if (_checkCache.size >= CACHE_MAX) {
    // Evict least-recently-used entry (first in insertion order)
    _checkCache.delete(_checkCache.keys().next().value);
  }
  _checkCache.set(key, { result, expires: Date.now() + CACHE_TTL });
}

/** Extracts and parses the first JSON object from an AI model response text. Returns `{}` on failure. */
function parseAIJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try { return JSON.parse(match[0]); } catch { return {}; }
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BASE64_LENGTH = 4 * 1024 * 1024 * 1.4; // ~4 MB decoded

/**
 * Parses a data URL into `{ mimeType, data }` (raw base64 without the prefix).
 * Returns `null` if the MIME type is absent or not in the allowed set.
 */
function parseBase64Image(base64Image) {
  const mimeMatch = base64Image.match(/^data:(image\/[a-z0-9][a-z0-9!#$&\-^_]*);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : null;
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) return null;
  const data = base64Image.slice(mimeMatch[0].length);
  return { mimeType, data };
}

/**
 * Validates the base64Image from a request body.
 * Returns parsed { mimeType, data } on success, or sends an error response and returns null.
 */
function validateImageRequest(req, res) {
  const { base64Image } = req.body;
  if (!base64Image || typeof base64Image !== 'string') {
    res.status(400).json({ error: 'No image' });
    return null;
  }
  if (base64Image.length > MAX_BASE64_LENGTH) {
    res.status(400).json({ error: 'Image too large' });
    return null;
  }
  const parsed = parseBase64Image(base64Image);
  if (!parsed) {
    res.status(400).json({ error: 'Invalid image type' });
    return null;
  }
  return parsed;
}

/**
 * POST /api/passport/check
 *
 * Runs an ICAO-aligned compliance check via Gemini and returns a structured report.
 * Checks performed: plain/uniform background, neutral expression, even lighting,
 * no glasses glare, and face correctly centred in frame.
 *
 * Responses are cached by image hash to avoid redundant API calls.
 *
 * Request:  { base64Image: string }  (data URL, max ~4 MB decoded)
 * Response: { compliant: boolean, summary: string, issues: string[], suggestions: string[] }
 */
app.post('/api/passport/check', apiRateLimit, async (req, res) => {
  try {
    const parsed = validateImageRequest(req, res);
    if (!parsed) return;
    const { mimeType, data: clean } = parsed;

    const cacheKey = getCacheKey(clean);
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: { maxOutputTokens: 512 },
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
    const aiResult = parseAIJson(text);

    const result = {
      compliant: !!aiResult.compliant,
      summary: typeof aiResult.summary === 'string' ? aiResult.summary.slice(0, 500) : '',
      issues: Array.isArray(aiResult.issues) ? aiResult.issues.filter(s => typeof s === 'string').map(s => s.slice(0, 200)) : [],
      suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions.filter(s => typeof s === 'string').map(s => s.slice(0, 200)) : []
    };
    setCache(cacheKey, result);
    res.json(result);
  } catch (e) {
    console.error('check error:', e instanceof Error ? e.message : 'unknown');
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

/**
 * POST /api/passport/analyze
 *
 * Returns a quality score and brightness/contrast deltas that the PhotoEditor
 * uses to pre-populate its sliders. Results are NOT cached (intentional — the
 * same image may be re-analysed after manual edits).
 *
 * Request:  { base64Image: string }  (data URL, max ~4 MB decoded)
 * Response: { overallScore: number (0–100),
 *             autoFixRecommendations: { adjustBrightness: number, adjustContrast: number } }
 *           adjustBrightness/adjustContrast are percentage deltas (e.g. 5 means +5%).
 */
app.post('/api/passport/analyze', apiRateLimit, async (req, res) => {
  try {
    const parsed = validateImageRequest(req, res);
    if (!parsed) return;
    const { mimeType, data: clean } = parsed;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: { maxOutputTokens: 256 },
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
    const aiResult = parseAIJson(text);
    const result = {
      overallScore: typeof aiResult.overallScore === 'number' ? Math.min(100, Math.max(0, aiResult.overallScore)) : 70,
      autoFixRecommendations: {
        adjustBrightness: typeof aiResult.autoFixRecommendations?.adjustBrightness === 'number' ? Math.min(100, Math.max(-100, aiResult.autoFixRecommendations.adjustBrightness)) : 5,
        adjustContrast: typeof aiResult.autoFixRecommendations?.adjustContrast === 'number' ? Math.min(100, Math.max(-100, aiResult.autoFixRecommendations.adjustContrast)) : 8,
      }
    };
    res.json(result);
  } catch (e) {
    console.error('analyze error:', e instanceof Error ? e.message : 'unknown');
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// Handle SPA routing
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(5185, () => console.log('API on port 5185, Key: Yes'));
