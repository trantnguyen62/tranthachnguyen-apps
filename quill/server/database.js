import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'db', 'quill.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      content TEXT NOT NULL,
      coverImage TEXT,
      tags TEXT,
      status TEXT DEFAULT 'draft',
      readingTime INTEGER,
      views INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      publishedAt DATETIME
    )
  `);

    // Migrations - add new columns (silently ignore if already exists)
    db.run(`ALTER TABLE articles ADD COLUMN category TEXT DEFAULT 'general'`, () => {});
    db.run(`ALTER TABLE articles ADD COLUMN metaDescription TEXT`, () => {});

    // Newsletter subscribers table
    db.run(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed INTEGER DEFAULT 0
    )
  `);
}

export default db;
