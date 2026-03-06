import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';
import { renderHomePage, renderArticlePage, escapeXml } from './html-renderer.js';
import { dbAll, dbGet } from './db-utils.js';
import { APP_REGISTRY, APP_CATEGORIES, getRelatedApps } from './app-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads')));

// Multer config for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '..', 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Helper: Calculate reading time (words per minute = 200)
function calculateReadingTime(content) {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
}

// Helper: Generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Routes

// Get all published articles
app.get('/api/articles', (req, res) => {
    const status = req.query.status || 'published';

    db.all(
        'SELECT * FROM articles WHERE status = ? ORDER BY publishedAt DESC, createdAt DESC',
        [status],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows.map(row => ({
                    ...row,
                    tags: row.tags ? JSON.parse(row.tags) : []
                })));
            }
        }
    );
});

// Get single article by slug
app.get('/api/articles/:slug', (req, res) => {
    db.get('SELECT * FROM articles WHERE slug = ?', [req.params.slug], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Article not found' });
        } else {
            // Increment view count (only for non-bot, non-API-direct requests)
            const ua = (req.get('User-Agent') || '').toLowerCase();
            const isBot = /bot|crawl|spider|slurp|googlebot|bingbot/i.test(ua);
            if (!isBot) {
                db.run('UPDATE articles SET views = views + 1 WHERE slug = ?', [req.params.slug]);
            }

            res.json({
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : []
            });
        }
    });
});

// Create new article
app.post('/api/articles', (req, res) => {
    const { title, subtitle, content, coverImage, tags, status, category, metaDescription } = req.body;

    const slug = generateSlug(title);
    const readingTime = calculateReadingTime(content);
    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    db.run(
        `INSERT INTO articles (slug, title, subtitle, content, coverImage, tags, status, readingTime, publishedAt, category, metaDescription)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [slug, title, subtitle, content, coverImage, JSON.stringify(tags || []), status, readingTime, publishedAt, category || 'general', metaDescription || null],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID, slug });
            }
        }
    );
});

// Update article
app.put('/api/articles/:slug', (req, res) => {
    const { title, subtitle, content, coverImage, tags, status, category, metaDescription } = req.body;

    const newSlug = title ? generateSlug(title) : req.params.slug;
    const readingTime = content ? calculateReadingTime(content) : null;
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    const tagsJson = tags !== undefined ? JSON.stringify(tags || []) : null;

    db.run(
        `UPDATE articles
     SET slug = COALESCE(?, slug), title = COALESCE(?, title), subtitle = COALESCE(?, subtitle),
         content = COALESCE(?, content), coverImage = COALESCE(?, coverImage), tags = COALESCE(?, tags),
         status = COALESCE(?, status), readingTime = COALESCE(?, readingTime),
         publishedAt = COALESCE(?, publishedAt), updatedAt = CURRENT_TIMESTAMP,
         category = COALESCE(?, category), metaDescription = COALESCE(?, metaDescription)
     WHERE slug = ?`,
        [newSlug, title, subtitle, content, coverImage, tagsJson, status, readingTime, publishedAt, category, metaDescription, req.params.slug],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ slug: newSlug });
            }
        }
    );
});

// Delete article
app.delete('/api/articles/:slug', (req, res) => {
    db.run('DELETE FROM articles WHERE slug = ?', [req.params.slug], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        url: `/uploads/${req.file.filename}`
    });
});

// Related articles by tag overlap
app.get('/api/articles/:slug/related', async (req, res) => {
    try {
        const article = await dbGet('SELECT tags FROM articles WHERE slug = ?', [req.params.slug]);
        if (!article) return res.json([]);
        const tags = article.tags ? JSON.parse(article.tags) : [];
        if (tags.length === 0) return res.json([]);

        const allArticles = await dbAll(
            'SELECT slug, title, subtitle, tags, readingTime, views, publishedAt FROM articles WHERE status = ? AND slug != ? ORDER BY publishedAt DESC',
            ['published', req.params.slug]
        );
        const scored = allArticles.map(a => {
            const aTags = a.tags ? JSON.parse(a.tags) : [];
            const overlap = tags.filter(t => aTags.includes(t)).length;
            return { ...a, tags: aTags, score: overlap };
        }).filter(a => a.score > 0).sort((a, b) => b.score - a.score);

        res.json(scored.slice(0, parseInt(req.query.limit) || 3));
    } catch (err) {
        res.json([]);
    }
});

// === SEO Routes ===

// Sitemap
app.get('/sitemap.xml', async (req, res) => {
    try {
        const articles = await dbAll(
            'SELECT slug, updatedAt, publishedAt FROM articles WHERE status = ? ORDER BY publishedAt DESC',
            ['published']
        );
        const baseUrl = 'https://quill.tranthachnguyen.com';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${baseUrl}/apps</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        for (const article of articles) {
            const lastmod = (article.updatedAt || article.publishedAt || '').split('T')[0];
            xml += `  <url>\n    <loc>${baseUrl}/${escapeXml(article.slug)}</loc>\n`;
            if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }
        xml += '</urlset>';
        res.set('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /write\nDisallow: /api/\n\nSitemap: https://quill.tranthachnguyen.com/sitemap.xml\nLlms-txt: https://quill.tranthachnguyen.com/llms.txt\n`);
});

// LLMs.txt - AI agent discoverability (https://llmstxt.org/)
app.get('/llms.txt', async (req, res) => {
    try {
        const articles = await dbAll(
            'SELECT title, slug, metaDescription, subtitle, category FROM articles WHERE status = ? ORDER BY publishedAt DESC',
            ['published']
        );
        const baseUrl = 'https://quill.tranthachnguyen.com';
        let txt = '# Quill\n\n';
        txt += '> A blog by Tran Thach Nguyen covering AI, DevOps, education, design, gaming, business, productivity, and lifestyle topics. 101+ long-form articles with practical guides, tutorials, and industry analysis.\n\n';
        txt += `## About\n\n`;
        txt += `Quill is a blogging platform at ${baseUrl} featuring SEO-optimized articles across technology, education, business, design, gaming, and lifestyle categories. All content is written to provide actionable insights and practical knowledge.\n\n`;
        txt += `## Links\n\n`;
        txt += `- [Home](${baseUrl}/)\n`;
        txt += `- [RSS Feed](${baseUrl}/feed.xml)\n`;
        txt += `- [Sitemap](${baseUrl}/sitemap.xml)\n`;
        txt += `- [Full Content for LLMs](${baseUrl}/llms-full.txt)\n\n`;
        txt += `## Articles\n\n`;
        for (const a of articles) {
            const desc = a.metaDescription || a.subtitle || '';
            txt += `- [${a.title}](${baseUrl}/${a.slug}): ${desc}\n`;
        }
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(txt);
    } catch (err) {
        res.status(500).send('Error generating llms.txt');
    }
});

// LLMs-full.txt - Full article content for RAG/retrieval
app.get('/llms-full.txt', async (req, res) => {
    try {
        const articles = await dbAll(
            'SELECT title, slug, content, tags, publishedAt, metaDescription, subtitle FROM articles WHERE status = ? ORDER BY publishedAt DESC LIMIT 20',
            ['published']
        );
        const baseUrl = 'https://quill.tranthachnguyen.com';
        let txt = '# Quill - Full Article Content\n\n';
        txt += '> This file contains the full text of the 20 most recent articles for AI retrieval and citation purposes.\n\n';
        for (const a of articles) {
            const tags = a.tags ? JSON.parse(a.tags) : [];
            const plainText = (a.content || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            txt += `---\n\n`;
            txt += `## ${a.title}\n\n`;
            txt += `- URL: ${baseUrl}/${a.slug}\n`;
            txt += `- Published: ${(a.publishedAt || '').split('T')[0]}\n`;
            txt += `- Tags: ${tags.join(', ')}\n`;
            txt += `- Description: ${a.metaDescription || a.subtitle || ''}\n\n`;
            txt += `${plainText}\n\n`;
        }
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(txt);
    } catch (err) {
        res.status(500).send('Error generating llms-full.txt');
    }
});

// RSS Feed
app.get('/feed.xml', async (req, res) => {
    try {
        const articles = await dbAll(
            'SELECT * FROM articles WHERE status = ? ORDER BY publishedAt DESC LIMIT 20',
            ['published']
        );
        const baseUrl = 'https://quill.tranthachnguyen.com';
        let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
        rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n';
        rss += `  <title>Quill</title>\n`;
        rss += `  <link>${baseUrl}</link>\n`;
        rss += `  <description>Ideas, tutorials, and insights by Tran Thach Nguyen</description>\n`;
        rss += `  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />\n`;
        for (const article of articles) {
            const tags = article.tags ? JSON.parse(article.tags) : [];
            rss += `  <item>\n`;
            rss += `    <title>${escapeXml(article.title)}</title>\n`;
            rss += `    <link>${baseUrl}/${escapeXml(article.slug)}</link>\n`;
            rss += `    <guid>${baseUrl}/${escapeXml(article.slug)}</guid>\n`;
            rss += `    <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>\n`;
            rss += `    <description>${escapeXml(article.subtitle || '')}</description>\n`;
            tags.forEach(t => { rss += `    <category>${escapeXml(t)}</category>\n`; });
            rss += `  </item>\n`;
        }
        rss += '</channel>\n</rss>';
        res.set('Content-Type', 'application/rss+xml');
        res.send(rss);
    } catch (err) {
        res.status(500).send('Error generating feed');
    }
});

// === Search API ===

app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json([]);
    try {
        const articles = await dbAll(
            `SELECT slug, title, subtitle, tags, readingTime, views, publishedAt
             FROM articles WHERE status = ? AND (
                 title LIKE ? OR subtitle LIKE ? OR tags LIKE ? OR content LIKE ?
             ) ORDER BY views DESC LIMIT 20`,
            ['published', `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
        );
        res.json(articles.map(a => ({ ...a, tags: a.tags ? JSON.parse(a.tags) : [] })));
    } catch (err) {
        res.json([]);
    }
});

// === Newsletter API ===

app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email required' });
    }
    db.run(
        'INSERT OR IGNORE INTO subscribers (email) VALUES (?)',
        [email.toLowerCase().trim()],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to subscribe' });
            if (this.changes === 0) return res.json({ message: 'Already subscribed' });
            res.json({ message: 'Subscribed successfully' });
        }
    );
});

app.get('/api/subscribers/count', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM subscribers', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row.count });
    });
});

// === Dynamic OG Image ===

app.get('/api/og-image/:slug', async (req, res) => {
    try {
        const article = await dbGet(
            'SELECT title, tags, readingTime, views FROM articles WHERE slug = ?',
            [req.params.slug]
        );
        if (!article) return res.status(404).send('Not found');

        const tags = article.tags ? JSON.parse(article.tags) : [];
        const title = article.title || 'Untitled';
        const tagLine = tags.slice(0, 3).map(t => `#${t}`).join('  ');

        // Wrap title into lines of ~45 chars
        const words = title.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if ((currentLine + ' ' + word).trim().length > 45 && currentLine) {
                lines.push(currentLine.trim());
                currentLine = word;
            } else {
                currentLine = (currentLine + ' ' + word).trim();
            }
        }
        if (currentLine) lines.push(currentLine.trim());

        const titleSvg = lines.slice(0, 3).map((line, i) =>
            `<text x="80" y="${180 + i * 65}" font-family="Georgia, serif" font-size="52" fill="white" font-weight="bold">${escapeXml(line)}</text>`
        ).join('\n  ');

        const tagY = 180 + Math.min(lines.length, 3) * 65 + 30;

        const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
  <text x="80" y="100" font-family="Georgia, serif" font-size="28" fill="#667eea" font-weight="bold">QUILL</text>
  ${titleSvg}
  <text x="80" y="${tagY}" font-family="sans-serif" font-size="24" fill="#a0a0c0">${escapeXml(tagLine)}</text>
  <text x="80" y="560" font-family="sans-serif" font-size="20" fill="#888">quill.tranthachnguyen.com</text>
  <text x="1120" y="560" font-family="sans-serif" font-size="18" fill="#888" text-anchor="end">${article.readingTime || 5} min read</text>
</svg>`;

        res.set('Content-Type', 'image/svg+xml');
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(svg);
    } catch (err) {
        res.status(500).send('Error generating image');
    }
});

// === App Promotion API ===

app.get('/api/apps', (req, res) => {
    const category = req.query.category;
    let apps = APP_REGISTRY;
    if (category) apps = apps.filter(a => a.category === category);
    res.json({ apps, categories: APP_CATEGORIES });
});

app.get('/api/apps/related', (req, res) => {
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const limit = parseInt(req.query.limit) || 3;
    res.json(getRelatedApps(tags, limit));
});

// Serve static files from dist (production mode only)
if (process.env.NODE_ENV === 'production') {
    // Home page with dynamic meta tags (MUST come before static middleware)
    app.get('/', async (req, res) => {
        try {
            const articles = await dbAll(
                'SELECT * FROM articles WHERE status = ? ORDER BY publishedAt DESC',
                ['published']
            );
            const parsed = articles.map(row => ({ ...row, tags: row.tags ? JSON.parse(row.tags) : [] }));
            res.send(renderHomePage(parsed));
        } catch (err) {
            res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
        }
    });

    // Serve static assets (CSS, JS, images) - exclude index.html
    app.use(express.static(join(__dirname, '..', 'dist'), { index: false }));

    // Article pages with dynamic meta tags
    app.get('/:slug', async (req, res) => {
        // Client-side routes — serve SPA shell (not article lookup)
        const spaRoutes = ['write', 'apps', 'about', 'search', 'settings', 'profile'];
        if (spaRoutes.includes(req.params.slug) || req.params.slug.startsWith('_')) {
            return res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
        }
        try {
            const article = await dbGet(
                'SELECT * FROM articles WHERE slug = ? AND status = ?',
                [req.params.slug, 'published']
            );
            if (article) {
                article.tags = article.tags ? JSON.parse(article.tags) : [];
                res.send(renderArticlePage(article));
            } else {
                res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
            }
        } catch (err) {
            res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
        }
    });

    // Fallback
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
            res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
        } else {
            next();
        }
    });
}

app.listen(PORT, () => {
    console.log(`Quill backend server running on port ${PORT}`);
});
