#!/usr/bin/env tsx
/**
 * Live Code Graph Dev Server
 *
 * Watches the Cloudify codebase for changes, auto-regenerates the graph,
 * and pushes live updates to the 3D viewer via Server-Sent Events.
 *
 * Usage:
 *   npx tsx dev-server.ts
 *
 * Then open http://localhost:4577 in your browser.
 * The graph auto-loads and live-updates when you edit code.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4577;
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const GRAPH_OUTPUT = path.resolve(__dirname, '../../code_graph.json');
const VIEWER_PATH = path.resolve(__dirname, 'code-graph-viewer-3d.html');
const GENERATOR_PATH = path.resolve(__dirname, 'generate-graph.ts');

// Directories to watch for changes
const WATCH_DIRS = [
  'app',
  'lib',
  'components',
  'hooks',
  'prisma',
].map(d => path.join(PROJECT_ROOT, d));

// File extensions to watch
const WATCH_EXTENSIONS = new Set(['.ts', '.tsx', '.prisma']);

// SSE clients
const sseClients: Set<http.ServerResponse> = new Set();

// Debounce timer
let regenerateTimer: ReturnType<typeof setTimeout> | null = null;
let isGenerating = false;
let lastGenerated = '';

// ---- Graph Generation ----
function generateGraph(): boolean {
  if (isGenerating) return false;
  isGenerating = true;

  const start = Date.now();
  console.log(`\n  [${timestamp()}] Regenerating graph...`);

  try {
    execSync(
      `npx tsx "${GENERATOR_PATH}" --root "${PROJECT_ROOT}" --output "${GRAPH_OUTPUT}"`,
      { cwd: __dirname, stdio: 'pipe', timeout: 30000 }
    );
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    lastGenerated = new Date().toISOString();
    console.log(`  [${timestamp()}] Graph regenerated in ${elapsed}s`);
    return true;
  } catch (err) {
    console.error(`  [${timestamp()}] Generation failed:`, (err as Error).message);
    return false;
  } finally {
    isGenerating = false;
  }
}

function scheduleRegenerate(changedFile: string) {
  if (regenerateTimer) clearTimeout(regenerateTimer);

  const rel = path.relative(PROJECT_ROOT, changedFile);
  console.log(`  [${timestamp()}] Changed: ${rel}`);

  // Debounce: wait 500ms after last change before regenerating
  regenerateTimer = setTimeout(() => {
    const success = generateGraph();
    if (success) {
      broadcastSSE('reload');
    }
  }, 500);
}

// ---- SSE Broadcasting ----
function broadcastSSE(event: string, data?: string) {
  const message = `event: ${event}\ndata: ${data || '{}'}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ---- File Watching ----
function startWatching() {
  for (const dir of WATCH_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`  Skipping (not found): ${path.relative(PROJECT_ROOT, dir)}`);
      continue;
    }

    try {
      fs.watch(dir, { recursive: true }, (_eventType, filename) => {
        if (!filename) return;
        const ext = path.extname(filename);
        if (!WATCH_EXTENSIONS.has(ext)) return;
        // Ignore node_modules and .next
        if (filename.includes('node_modules') || filename.includes('.next')) return;

        const fullPath = path.join(dir, filename);
        scheduleRegenerate(fullPath);
      });
      console.log(`  Watching: ${path.relative(PROJECT_ROOT, dir)}/`);
    } catch (err) {
      console.error(`  Failed to watch ${dir}:`, (err as Error).message);
    }
  }
}

// ---- HTTP Server ----
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  switch (url.pathname) {
    case '/':
    case '/index.html':
      // Serve the viewer
      serveViewer(res);
      break;

    case '/graph.json':
      // Serve the graph data
      serveGraph(res);
      break;

    case '/events':
      // SSE endpoint
      serveSSE(req, res);
      break;

    case '/status':
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        generating: isGenerating,
        lastGenerated,
        clients: sseClients.size,
        watching: WATCH_DIRS.filter(d => fs.existsSync(d)).length,
      }));
      break;

    default:
      res.writeHead(404);
      res.end('Not found');
  }
});

function serveViewer(res: http.ServerResponse) {
  try {
    let html = fs.readFileSync(VIEWER_PATH, 'utf-8');

    // Inject live-reload SSE client script before </body>
    const liveReloadScript = `
<script type="module">
// ---- Live Reload via SSE ----
(function initLiveReload() {
  const STATUS_ID = 'live-status';

  function addStatusIndicator() {
    if (document.getElementById(STATUS_ID)) return;
    const el = document.createElement('div');
    el.id = STATUS_ID;
    el.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:200;display:flex;align-items:center;gap:6px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:6px 12px;font-size:11px;color:#94a3b8;font-family:-apple-system,system-ui,sans-serif;';
    el.innerHTML = '<span id="live-dot" style="width:8px;height:8px;border-radius:50%;background:#22c55e;"></span><span id="live-text">Live</span>';
    document.body.appendChild(el);
  }

  function setStatus(connected, text) {
    const dot = document.getElementById('live-dot');
    const txt = document.getElementById('live-text');
    if (dot) dot.style.background = connected ? '#22c55e' : '#ef4444';
    if (txt) txt.textContent = text || (connected ? 'Live' : 'Disconnected');
  }

  function connect() {
    addStatusIndicator();
    const es = new EventSource('/events');

    es.onopen = () => setStatus(true, 'Live');

    es.addEventListener('reload', async () => {
      setStatus(true, 'Updating...');
      try {
        const resp = await fetch('/graph.json');
        const data = await resp.json();
        // loadGraph is defined in the main viewer script
        if (window.__loadGraph) {
          window.__loadGraph(data, 'live-graph.json');
          setStatus(true, 'Updated ' + new Date().toLocaleTimeString());
        }
      } catch (err) {
        setStatus(false, 'Update failed');
      }
    });

    es.onerror = () => {
      setStatus(false, 'Reconnecting...');
      es.close();
      setTimeout(connect, 3000);
    };
  }

  // Auto-load graph on page load
  window.addEventListener('DOMContentLoaded', async () => {
    connect();
    try {
      const resp = await fetch('/graph.json');
      if (resp.ok) {
        const data = await resp.json();
        // Wait for the main module to initialize
        const waitForLoader = setInterval(() => {
          if (window.__loadGraph) {
            clearInterval(waitForLoader);
            window.__loadGraph(data, 'code_graph.json');
          }
        }, 100);
      }
    } catch {}
  });
})();
</script>`;

    html = html.replace('</body>', liveReloadScript + '\n</body>');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500);
    res.end('Failed to read viewer: ' + (err as Error).message);
  }
}

function serveGraph(res: http.ServerResponse) {
  try {
    if (!fs.existsSync(GRAPH_OUTPUT)) {
      // Generate if doesn't exist
      generateGraph();
    }
    const data = fs.readFileSync(GRAPH_OUTPUT, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
}

function serveSSE(req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial connected event
  res.write('event: connected\ndata: {}\n\n');

  sseClients.add(res);
  console.log(`  [${timestamp()}] SSE client connected (${sseClients.size} total)`);

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`  [${timestamp()}] SSE client disconnected (${sseClients.size} total)`);
  });

  // Keep-alive ping every 30s
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(ping); }
  }, 30000);
}

function timestamp() {
  return new Date().toLocaleTimeString();
}

// ---- Start ----
console.log(`
  ╔══════════════════════════════════════╗
  ║     Code Graph Live Dev Server       ║
  ╚══════════════════════════════════════╝

  URL:     http://localhost:${PORT}
  Project: ${PROJECT_ROOT}
  Graph:   ${GRAPH_OUTPUT}
`);

// Generate initial graph if needed
if (!fs.existsSync(GRAPH_OUTPUT)) {
  console.log('  No graph found, generating initial graph...');
  generateGraph();
} else {
  console.log('  Using existing graph (will regenerate on changes)');
  lastGenerated = fs.statSync(GRAPH_OUTPUT).mtime.toISOString();
}

// Start watching
startWatching();

// Start server
server.listen(PORT, () => {
  console.log(`\n  Server running at http://localhost:${PORT}\n`);
  console.log('  Edit any .ts/.tsx/.prisma file in app/, lib/, components/,');
  console.log('  hooks/, or prisma/ and the graph updates automatically.\n');
});
