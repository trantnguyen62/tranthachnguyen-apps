import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import ShareButton from '../components/ShareButton';
import RelatedApps from '../components/RelatedApps';

const API_URL = '/api';

function extractHeadings(html) {
    if (!html) return [];
    const headings = [];
    const regex = /<(h[2-3])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const level = parseInt(match[1][1]);
        const text = match[3].replace(/<[^>]*>/g, '').trim();
        const id = match[2] || text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        headings.push({ id, text, level });
    }
    return headings;
}

function addIdsToHeadings(html) {
    if (!html) return html;
    return html.replace(/<(h[2-3])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, content) => {
        if (attrs.includes('id=')) return match;
        const text = content.replace(/<[^>]*>/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
    });
}

function TableOfContents({ headings }) {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '-80px 0px -80% 0px' }
        );
        for (const h of headings) {
            const el = document.getElementById(h.id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [headings]);

    if (headings.length < 3) return null;

    return (
        <nav style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--color-background)',
            borderRadius: '12px',
            marginBottom: '2rem',
            borderLeft: '3px solid var(--color-primary, #667eea)'
        }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                Table of Contents
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {headings.map(h => (
                    <li key={h.id} style={{ paddingLeft: h.level === 3 ? '1rem' : 0 }}>
                        <a
                            href={`#${h.id}`}
                            onClick={e => {
                                e.preventDefault();
                                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            style={{
                                display: 'block',
                                padding: '0.3rem 0',
                                fontSize: h.level === 3 ? '0.85rem' : '0.9rem',
                                color: activeId === h.id ? 'var(--color-primary, #667eea)' : 'var(--color-text-muted)',
                                fontWeight: activeId === h.id ? 600 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function Article() {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [readingProgress, setReadingProgress] = useState(0);
    const [relatedArticles, setRelatedArticles] = useState([]);

    const processedContent = useMemo(() => addIdsToHeadings(article?.content), [article?.content]);
    const headings = useMemo(() => extractHeadings(processedContent), [processedContent]);

    useEffect(() => {
        fetchArticle();
        fetch(`${API_URL}/articles/${slug}/related?limit=3`)
            .then(r => r.json())
            .then(setRelatedArticles)
            .catch(() => {});
    }, [slug]);

    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const scrollable = documentHeight - windowHeight;
            const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
            setReadingProgress(Math.min(progress, 100));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchArticle = async () => {
        try {
            const response = await fetch(`${API_URL}/articles/${slug}`);
            if (response.ok) {
                const data = await response.json();
                setArticle(data);
            }
        } catch (error) {
            console.error('Error fetching article:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <div className="reading-progress" style={{ width: `${readingProgress}%` }} />
                <Header />
                <div className="loading">Loading article...</div>
            </>
        );
    }

    if (!article) {
        return (
            <>
                <Header />
                <div className="article-container">
                    <h1>Article not found</h1>
                    <Link to="/">← Back to home</Link>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Reading Progress Bar */}
            <div className="reading-progress" style={{ width: `${readingProgress}%` }} />

            <Header />
            <article className="article-container">
                <div className="article-meta" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                    <span>📅 {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })}</span>
                    {' · '}
                    <span>⏱️ {article.readingTime} min read</span>
                    {' · '}
                    <span>👁️ {article.views} views</span>
                </div>

                <h1 style={{
                    fontSize: '3.5rem',
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'fadeInUp 0.8s ease'
                }}>
                    {article.title}
                </h1>

                {article.subtitle && (
                    <p style={{
                        fontSize: '1.5rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        animation: 'fadeInUp 1s ease 0.2s both'
                    }}>
                        {article.subtitle}
                    </p>
                )}

                {article.tags && article.tags.length > 0 && (
                    <div className="article-tags" style={{ marginBottom: '3rem', animation: 'fadeInUp 1.2s ease 0.4s both' }}>
                        {article.tags.map((tag, index) => (
                            <span key={index} className="tag">#{tag}</span>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <ShareButton platform="twitter" url={`https://quill.tranthachnguyen.com/${article.slug}`} title={article.title} />
                    <ShareButton platform="reddit" url={`https://quill.tranthachnguyen.com/${article.slug}`} title={article.title} />
                    <ShareButton platform="hackernews" url={`https://quill.tranthachnguyen.com/${article.slug}`} title={article.title} />
                    <ShareButton platform="linkedin" url={`https://quill.tranthachnguyen.com/${article.slug}`} title={article.title} />
                    <ShareButton platform="email" url={`https://quill.tranthachnguyen.com/${article.slug}`} title={article.title} />
                    <ShareButton platform="copy" url={`https://quill.tranthachnguyen.com/${article.slug}`} title={article.title} />
                </div>

                {article.coverImage && (
                    <img
                        src={article.coverImage}
                        alt={article.title}
                        style={{
                            width: '100%',
                            borderRadius: '16px',
                            marginBottom: '3rem',
                            boxShadow: 'var(--shadow-xl)',
                            animation: 'fadeInUp 1.4s ease 0.6s both'
                        }}
                    />
                )}

                <TableOfContents headings={headings} />

                <div
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    style={{
                        fontSize: '1.125rem',
                        lineHeight: '1.8',
                        fontFamily: 'var(--font-serif)',
                        animation: 'fadeInUp 1.6s ease 0.8s both'
                    }}
                />

                <RelatedApps tags={article.tags || []} variant="footer" />

                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    padding: '2rem',
                    background: 'var(--color-background)',
                    borderRadius: '12px',
                    marginTop: '3rem',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>Tran Thach Nguyen</div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
                            Building useful tools and sharing knowledge. Check out my{' '}
                            <a href="https://tranthachnguyen.com" target="_blank" rel="noopener noreferrer">portfolio</a>{' '}
                            and <Link to="/apps">app collection</Link>.
                        </p>
                    </div>
                </div>

                {relatedArticles.length > 0 && (
                    <div style={{ marginTop: '3rem' }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Related Articles
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {relatedArticles.map(ra => (
                                <Link
                                    key={ra.slug}
                                    to={`/${ra.slug}`}
                                    style={{
                                        textDecoration: 'none',
                                        padding: '1rem 1.25rem',
                                        background: 'var(--color-background)',
                                        borderRadius: '10px',
                                        display: 'block',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ra.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        {ra.readingTime} min read · {(ra.views || 0).toLocaleString()} views
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    marginTop: '4rem',
                    paddingTop: '2rem',
                    borderTop: '2px solid transparent',
                    borderImage: 'linear-gradient(to right, transparent, var(--color-primary), transparent) 1',
                    textAlign: 'center'
                }}>
                    <Link to="/" style={{ fontSize: '1.125rem' }}>
                        ← Back to all articles
                    </Link>
                </div>
            </article>
        </>
    );
}
