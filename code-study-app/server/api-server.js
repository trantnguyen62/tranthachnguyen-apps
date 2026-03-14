import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3006;

// Base path for the codebase
const CODEBASE_PATH = path.resolve(__dirname, '../../');

// Directories and files to ignore
const IGNORED_DIRS = [
  'node_modules',
  'dist',
  '.git',
  '.vite',
  'build',
  'coverage',
  '.next',
  'pids',
  'logs',
];

const IGNORED_FILES = [
  '.DS_Store',
  'package-lock.json',
  '.env.local',
  '.env',
  '.gitignore',
];

const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.py', '.sh', '.yml', '.yaml'
];

const ALLOWED_ORIGINS = [
  'http://localhost:3007',
  'http://127.0.0.1:3007',
  'https://localhost:3007',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server) only in development
    if (!origin) return callback(null, process.env.NODE_ENV !== 'production');
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  next();
});

// Get language from file extension
function getLanguage(filename) {
  const ext = path.extname(filename).toLowerCase();
  const langMap = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.md': 'markdown',
    '.py': 'python',
    '.sh': 'bash',
    '.yml': 'yaml',
    '.yaml': 'yaml',
  };
  return langMap[ext] || 'text';
}

// Recursively build file tree
function buildFileTree(dirPath, basePath = '') {
  const items = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name)) continue;
        
        const children = buildFileTree(fullPath, relativePath);
        if (children.length > 0) {
          items.push({
            name: entry.name,
            path: relativePath,
            type: 'directory',
            children
          });
        }
      } else {
        if (IGNORED_FILES.includes(entry.name)) continue;
        
        const ext = path.extname(entry.name).toLowerCase();
        if (!CODE_EXTENSIONS.includes(ext)) continue;
        
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          language: getLanguage(entry.name)
        });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err.message);
  }
  
  // Sort: directories first, then files, alphabetically
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  
  return items;
}

// Get list of projects
app.get('/api/projects', (req, res) => {
  const projects = [];
  
  try {
    const entries = fs.readdirSync(CODEBASE_PATH, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (IGNORED_DIRS.includes(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'services') continue;
      if (entry.name === 'code-study-app') continue;
      
      const projectPath = path.join(CODEBASE_PATH, entry.name);
      const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
      const hasIndexHtml = fs.existsSync(path.join(projectPath, 'index.html'));
      
      if (hasPackageJson || hasIndexHtml) {
        let description = '';
        
        // Try to read description from package.json
        if (hasPackageJson) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
            description = pkg.description || '';
          } catch (e) {}
        }
        
        projects.push({
          name: entry.name,
          path: entry.name,
          description
        });
      }
    }
  } catch (err) {
    console.error('Error reading projects:', err.message);
  }
  
  res.json(projects);
});

// Simple in-memory cache for file trees (TTL: 60s)
const treeCache = new Map();
const TREE_CACHE_TTL = 300_000;
const SEARCH_RESULTS_LIMIT = 50;

// Get file tree for a project
app.get('/api/projects/:project/tree', (req, res) => {
  const projectPath = path.join(CODEBASE_PATH, req.params.project);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const cached = treeCache.get(req.params.project);
  if (cached && Date.now() - cached.ts < TREE_CACHE_TTL) {
    return res.json(cached.tree);
  }

  const tree = buildFileTree(projectPath);
  treeCache.set(req.params.project, { tree, ts: Date.now() });
  res.json(tree);
});

// Get file content
app.get('/api/file', async (req, res) => {
  const filePath = req.query.path;

  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Path required' });
  }
  if (filePath.includes('\0') || filePath.length > 500) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const fullPath = path.join(CODEBASE_PATH, filePath);

  // Security: ensure path is within codebase (append sep to prevent partial-name traversal)
  if (!fullPath.startsWith(CODEBASE_PATH + path.sep) && fullPath !== CODEBASE_PATH) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Resolve symlinks and re-validate to prevent path traversal via symlinks
    const realPath = fs.realpathSync(fullPath);
    const realBase = fs.realpathSync(CODEBASE_PATH);
    if (!realPath.startsWith(realBase + path.sep)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stat = await fs.promises.stat(fullPath);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (stat.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File too large' });
    }

    const content = await fs.promises.readFile(fullPath, 'utf-8');
    const language = getLanguage(filePath);

    res.json({
      path: filePath,
      content,
      language
    });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
    console.error('Error reading file:', err.message);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Search files
app.get('/api/search', async (req, res) => {
  const query = req.query.q?.toLowerCase();
  const project = req.query.project;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }
  if (query.length > 256 || query.includes('\0')) {
    return res.status(400).json({ error: 'Invalid query' });
  }
  if (project && (typeof project !== 'string' || project.includes('\0') || project.length > 200)) {
    return res.status(400).json({ error: 'Invalid project' });
  }

  const results = [];
  const searchPath = project ? path.join(CODEBASE_PATH, project) : CODEBASE_PATH;

  // Security: ensure search path is within codebase
  if (project && !searchPath.startsWith(CODEBASE_PATH + path.sep) && searchPath !== CODEBASE_PATH) {
    return res.status(403).json({ error: 'Access denied' });
  }

  async function searchDir(dirPath, basePath = '') {
    if (results.length >= SEARCH_RESULTS_LIMIT) return;
    let entries;
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (err) {
      return;
    }

    const subdirSearches = [];

    for (const entry of entries) {
      if (results.length >= SEARCH_RESULTS_LIMIT) break;

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name)) continue;
        subdirSearches.push(searchDir(fullPath, relativePath));
      } else {
        if (IGNORED_FILES.includes(entry.name)) continue;

        const ext = path.extname(entry.name).toLowerCase();
        if (!CODE_EXTENSIONS.includes(ext)) continue;

        // Search in filename
        if (entry.name.toLowerCase().includes(query)) {
          results.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            language: getLanguage(entry.name),
            matchType: 'filename'
          });
          continue;
        }

        // Search in content
        try {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          if (content.toLowerCase().includes(query)) {
            results.push({
              name: entry.name,
              path: relativePath,
              type: 'file',
              language: getLanguage(entry.name),
              matchType: 'content'
            });
          }
        } catch (e) {}
      }
    }

    // Traverse subdirectories in parallel rather than sequentially
    if (subdirSearches.length > 0) {
      await Promise.all(subdirSearches);
    }
  }

  await searchDir(searchPath);
  res.json(results.slice(0, SEARCH_RESULTS_LIMIT));
});

app.listen(PORT, () => {
  console.log(`[CodeStudy] API Server running on port ${PORT}`);
  console.log(`[CodeStudy] Serving codebase from: ${CODEBASE_PATH}`);
});
