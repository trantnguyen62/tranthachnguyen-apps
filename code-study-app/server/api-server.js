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

app.use(cors());
app.use(express.json());

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

// Get file tree for a project
app.get('/api/projects/:project/tree', (req, res) => {
  const projectPath = path.join(CODEBASE_PATH, req.params.project);
  
  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const tree = buildFileTree(projectPath);
  res.json(tree);
});

// Get file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: 'Path required' });
  }
  
  const fullPath = path.join(CODEBASE_PATH, filePath);
  
  // Security: ensure path is within codebase
  if (!fullPath.startsWith(CODEBASE_PATH)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const language = getLanguage(filePath);
    
    res.json({
      path: filePath,
      content,
      language
    });
  } catch (err) {
    console.error('Error reading file:', err.message);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Search files
app.get('/api/search', (req, res) => {
  const query = req.query.q?.toLowerCase();
  const project = req.query.project;
  
  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }
  
  const results = [];
  const searchPath = project ? path.join(CODEBASE_PATH, project) : CODEBASE_PATH;
  
  function searchDir(dirPath, basePath = '') {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (results.length >= 50) return; // Limit results
        
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          if (IGNORED_DIRS.includes(entry.name)) continue;
          searchDir(fullPath, relativePath);
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
            const content = fs.readFileSync(fullPath, 'utf-8');
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
    } catch (err) {}
  }
  
  searchDir(searchPath);
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`[CodeStudy] API Server running on port ${PORT}`);
  console.log(`[CodeStudy] Serving codebase from: ${CODEBASE_PATH}`);
});
