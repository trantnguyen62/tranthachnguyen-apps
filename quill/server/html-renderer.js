import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let htmlTemplate = null;

function getTemplate() {
    if (!htmlTemplate) {
        htmlTemplate = readFileSync(join(__dirname, '..', 'dist', 'index.html'), 'utf-8');
    }
    return htmlTemplate;
}

const BASE_URL = 'https://quill.tranthachnguyen.com';

export function renderHomePage(articles) {
    const html = getTemplate();
    const title = 'Quill - A humble place to share ideas and knowledge';
    const description = 'Explore articles on AI, DevOps, web development, and more. Written by Tran Thach Nguyen.';

    const metaTags = `
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    <meta name="author" content="Tran Thach Nguyen" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${BASE_URL}/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${BASE_URL}/" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${BASE_URL}/og-image.png" />
    <meta property="og:site_name" content="Quill" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${BASE_URL}/" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${BASE_URL}/og-image.png" />`;

    const blogPosts = (articles || []).slice(0, 10).map(a => ({
        "@type": "BlogPosting",
        "headline": a.title,
        "url": `${BASE_URL}/${a.slug}`,
        "datePublished": a.publishedAt,
        "author": { "@type": "Person", "name": "Tran Thach Nguyen" }
    }));

    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Quill",
        "description": description,
        "url": `${BASE_URL}/`,
        "author": { "@type": "Person", "name": "Tran Thach Nguyen", "url": "https://tranthachnguyen.com/" },
        "blogPost": blogPosts
    });

    return injectIntoHtml(html, metaTags, `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>`);
}

export function renderArticlePage(article) {
    const html = getTemplate();
    const title = `${article.title} | Quill`;
    const description = article.metaDescription || article.subtitle || stripHtml(article.content).substring(0, 160);
    const url = `${BASE_URL}/${article.slug}`;
    const image = article.coverImage
        ? (article.coverImage.startsWith('http') ? article.coverImage : `${BASE_URL}${article.coverImage}`)
        : `${BASE_URL}/api/og-image/${article.slug}`;
    const tags = article.tags ? (typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags) : [];

    const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="Tran Thach Nguyen" />
    <meta name="robots" content="index, follow" />
    <meta name="keywords" content="${escapeHtml(tags.join(', '))}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(article.title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:site_name" content="Quill" />
    <meta property="article:published_time" content="${article.publishedAt}" />
    <meta property="article:author" content="Tran Thach Nguyen" />
    ${tags.map(t => `<meta property="article:tag" content="${escapeHtml(t)}" />`).join('\n    ')}
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${escapeHtml(article.title)}" />
    <meta property="twitter:description" content="${escapeHtml(description)}" />
    <meta property="twitter:image" content="${escapeHtml(image)}" />`;

    const plainText = stripHtml(article.content);
    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "description": description,
        "image": image,
        "url": url,
        "datePublished": article.publishedAt,
        "dateModified": article.updatedAt || article.publishedAt,
        "author": { "@type": "Person", "name": "Tran Thach Nguyen", "url": "https://tranthachnguyen.com/" },
        "publisher": { "@type": "Person", "name": "Tran Thach Nguyen", "url": "https://tranthachnguyen.com/" },
        "mainEntityOfPage": { "@type": "WebPage", "@id": url },
        "wordCount": plainText.split(/\s+/).length,
        "timeRequired": `PT${article.readingTime || 1}M`,
        "keywords": tags.join(', ')
    });

    return injectIntoHtml(html, metaTags, `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>`);
}

function safeJsonLd(json) {
    return json.replace(/</g, '\\u003c');
}

function injectIntoHtml(html, metaTags, structuredData) {
    let result = html;
    // Remove existing title, meta, canonical, and JSON-LD
    result = result.replace(/<title>.*?<\/title>/s, '');
    result = result.replace(/<meta\s+(name|property)="(title|description|og:[^"]*|twitter:[^"]*|article:[^"]*|robots|keywords|author)"[^>]*\/?>/g, '');
    result = result.replace(/<link\s+rel="canonical"[^>]*\/?>/g, '');
    result = result.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    // Inject new tags
    result = result.replace('</head>', `${metaTags}\n${structuredData}\n</head>`);
    return result;
}

function stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export { escapeXml };
