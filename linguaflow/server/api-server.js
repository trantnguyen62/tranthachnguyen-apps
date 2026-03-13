/**
 * LinguaFlow API Server — REST backend for learner profiles and session tracking.
 *
 * Runs on port 3002. All routes are prefixed with /api.
 *
 * Endpoints:
 *   GET  /api/health                    Health check; returns { status, timestamp }.
 *   GET  /api/users/search?name=<name>  Find a user by name (case-insensitive).
 *   GET  /api/users/:id                 Fetch a single user by their generated ID.
 *   POST /api/users                     Create a user (or return existing by name).
 *   PATCH /api/users/:id                Update profile fields (lessonNumber, notes, etc.).
 *   POST /api/users/:id/words           Append new vocabulary words (deduped, lowercase).
 *   POST /api/users/:id/session         Record a completed session and advance lesson.
 *
 * Persistence:
 *   User data is stored as JSON in data/users.json and cached in memory after the
 *   first read. Writes flush to disk immediately so data survives restarts.
 *
 * User object schema:
 *   {
 *     id:              string,   // URL-safe slug derived from name + timestamp
 *     name:            string,
 *     lessonNumber:    number,   // Auto-incremented on session completion
 *     wordsLearned:    string[], // Deduplicated, lowercase vocabulary list
 *     lastSessionDate: string,   // ISO 8601 timestamp
 *     totalSessions:   number,
 *     notes:           string    // Free-form tutor notes from the AI
 *   }
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Rate limiting: max requests per IP per time window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;
const apiRateLimitMap = new Map(); // IP -> [timestamps]

function apiRateLimit(req, res, next) {
  const ip = req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const now = Date.now();
  const timestamps = (apiRateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    logger.security('API rate limit exceeded', { ip });
    return res.status(429).json({ error: 'Too many requests' });
  }
  timestamps.push(now);
  apiRateLimitMap.set(ip, timestamps);
  next();
}

// Periodically clean up stale rate-limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of apiRateLimitMap.entries()) {
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) apiRateLimitMap.delete(ip);
    else apiRateLimitMap.set(ip, recent);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

// Middleware
app.use(cors({
  origin: [
    'https://linguaflow.tranthachnguyen.com',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '64kb' }));
app.use(apiRateLimit);

// Ensure data directory and file exist
async function initDataStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify({ users: {} }, null, 2));
    }
    logger.info('Data store initialized');
  } catch (err) {
    logger.error('Failed to initialize data store', { error: err.message });
  }
}

// In-memory cache — populated on first read, updated on every write
let usersCache = null;

// Read users data
async function readUsers() {
  if (usersCache) return usersCache;
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    usersCache = JSON.parse(data);
    return usersCache;
  } catch {
    usersCache = { users: {} };
    return usersCache;
  }
}

// Write users data
async function writeUsers(data) {
  usersCache = data;
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// Generate simple ID from name
function generateId(name) {
  return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================================================
// API ROUTES
// ============================================================================

// Get user by name (for returning users)
app.get('/api/users/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof name !== 'string' || name.length > 100) {
      return res.status(400).json({ error: 'Invalid name parameter' });
    }

    const data = await readUsers();
    const normalizedName = name.toLowerCase().trim();
    
    // Find user by name (case-insensitive)
    const user = Object.values(data.users).find(
      u => u.name.toLowerCase() === normalizedName
    );

    if (user) {
      logger.info('User found', { name: user.name, id: user.id });
      res.json({ user });
    } else {
      res.json({ user: null });
    }
  } catch (err) {
    logger.error('Error searching user', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readUsers();
    const user = data.users[id];

    if (user) {
      res.json({ user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    logger.error('Error getting user', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return res.status(400).json({ error: 'Valid name is required' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name must be 100 characters or fewer' });
    }

    const data = await readUsers();
    const normalizedName = name.trim();
    
    // Check if user already exists
    const existingUser = Object.values(data.users).find(
      u => u.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (existingUser) {
      logger.info('Returning existing user', { name: existingUser.name });
      return res.json({ user: existingUser, isNew: false });
    }

    // Create new user
    const id = generateId(normalizedName);
    const newUser = {
      id,
      name: normalizedName,
      lessonNumber: 1,
      wordsLearned: [],
      lastSessionDate: new Date().toISOString(),
      totalSessions: 0,
      notes: ''
    };

    data.users[id] = newUser;
    await writeUsers(data);

    logger.info('New user created', { name: normalizedName, id });
    res.status(201).json({ user: newUser, isNew: true });
  } catch (err) {
    logger.error('Error creating user', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user progress
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const data = await readUsers();
    const user = data.users[id];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate notes length if provided
    if (updates.notes !== undefined && (typeof updates.notes !== 'string' || updates.notes.length > 10000)) {
      return res.status(400).json({ error: 'Notes must be a string of 10000 characters or fewer' });
    }

    // Update allowed fields
    const allowedFields = ['lessonNumber', 'wordsLearned', 'notes', 'totalSessions'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    }
    user.lastSessionDate = new Date().toISOString();

    data.users[id] = user;
    await writeUsers(data);

    logger.info('User updated', { id, updates: Object.keys(updates) });
    res.json({ user });
  } catch (err) {
    logger.error('Error updating user', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Add words learned
app.post('/api/users/:id/words', async (req, res) => {
  try {
    const { id } = req.params;
    const { words } = req.body;

    if (!Array.isArray(words)) {
      return res.status(400).json({ error: 'Words must be an array' });
    }
    if (words.length > 500) {
      return res.status(400).json({ error: 'Too many words in a single request (max 500)' });
    }

    const data = await readUsers();
    const user = data.users[id];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add new words (avoid duplicates, skip non-strings, enforce word length)
    const existingWords = new Set(user.wordsLearned);
    words.forEach(word => { if (typeof word === 'string' && word.length <= 100) existingWords.add(word.toLowerCase()); });
    user.wordsLearned = Array.from(existingWords);
    user.lastSessionDate = new Date().toISOString();

    data.users[id] = user;
    await writeUsers(data);

    logger.info('Words added', { id, newWords: words.length, totalWords: user.wordsLearned.length });
    res.json({ user });
  } catch (err) {
    logger.error('Error adding words', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Record session completion
app.post('/api/users/:id/session', async (req, res) => {
  try {
    const { id } = req.params;
    const { lessonCompleted, wordsLearned, notes } = req.body;

    const data = await readUsers();
    const user = data.users[id];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.totalSessions += 1;
    user.lastSessionDate = new Date().toISOString();
    
    if (lessonCompleted && user.lessonNumber === lessonCompleted) {
      user.lessonNumber += 1;
    }

    if (wordsLearned && Array.isArray(wordsLearned)) {
      const existingWords = new Set(user.wordsLearned);
      wordsLearned.forEach(word => { if (typeof word === 'string' && word.length <= 100) existingWords.add(word.toLowerCase()); });
      user.wordsLearned = Array.from(existingWords);
    }

    if (notes) {
      if (typeof notes !== 'string' || notes.length > 10000) {
        return res.status(400).json({ error: 'Notes must be a string of 10000 characters or fewer' });
      }
      user.notes = notes;
    }

    data.users[id] = user;
    await writeUsers(data);

    logger.info('Session recorded', { id, totalSessions: user.totalSessions });
    res.json({ user });
  } catch (err) {
    logger.error('Error recording session', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
initDataStore().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`LinguaFlow API Server running on port ${PORT}`);
  });
});
