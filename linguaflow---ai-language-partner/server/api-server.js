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
app.use(express.json());

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

// Read users data
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { users: {} };
  }
}

// Write users data
async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// Generate simple ID from name
function generateId(name) {
  return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
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

    const data = await readUsers();
    const user = data.users[id];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add new words (avoid duplicates)
    const existingWords = new Set(user.wordsLearned);
    words.forEach(word => existingWords.add(word.toLowerCase()));
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
      wordsLearned.forEach(word => existingWords.add(word.toLowerCase()));
      user.wordsLearned = Array.from(existingWords);
    }

    if (notes) {
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
