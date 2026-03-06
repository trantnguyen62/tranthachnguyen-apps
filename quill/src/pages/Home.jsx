import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import AppPromoCard from '../components/AppPromoCard';

const API_URL = '/api';

export default function Home() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeTag, setActiveTag] = useState(null);
    const [featuredApps, setFeaturedApps] = useState([]);
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState(null);

    useEffect(() => {
        fetchArticles();
        fetch('/api/apps/related?limit=3').then(r => r.json()).then(setFeaturedApps).catch(() => {});
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScroll = useCallback(() => {
        setShowScrollTop(window.scrollY > 400);
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const fetchArticles = async () => {
        try {
            const response = await fetch(`${API_URL}/articles?status=published`);
            const data = await response.json();
            setArticles(data);
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Memoize filtered articles for performance
    const filteredArticles = useMemo(() => {
        if (!activeTag) return articles;
        return articles.filter(article =>
            article.tags && article.tags.includes(activeTag)
        );
    }, [articles, activeTag]);

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tags = new Set();
        articles.forEach(article => {
            article.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }, [articles]);

    if (loading) {
        return (
            <>
                <Header />
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <span>Loading articles...</span>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />

            {/* Hero Section - Enhanced with social proof */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to Quill</h1>
                    <p className="hero-subtitle">
                        A humble place to share ideas, teach, and inspire through beautifully crafted stories
                    </p>

                    {/* Social Proof */}
                    {articles.length > 0 && (
                        <div className="social-proof" style={{
                            display: 'flex',
                            gap: '2rem',
                            marginBottom: '2rem',
                            justifyContent: 'center',
                            opacity: 0.9
                        }}>
                            <div className="stat">
                                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{articles.length}</span>
                                <span style={{ display: 'block', fontSize: '0.9rem' }}>Stories</span>
                            </div>
                            <div className="stat">
                                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {articles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString()}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.9rem' }}>Total Views</span>
                            </div>
                            <div className="stat">
                                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {articles.reduce((sum, a) => sum + (a.readingTime || 0), 0)}+
                                </span>
                                <span style={{ display: 'block', fontSize: '0.9rem' }}>Min of Content</span>
                            </div>
                        </div>
                    )}

                    <div className="hero-cta">
                        <Link to="/write">
                            <button className="btn btn-accent pulse">
                                Start Writing ✍️
                            </button>
                        </Link>
                        {articles.length > 0 && (
                            <button
                                className="btn"
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }}
                                onClick={() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' })}
                            >
                                Explore Articles ↓
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                {articles.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            No articles yet
                        </h2>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            Be the first to share your knowledge with the world!
                        </p>
                        <Link to="/write">
                            <button className="btn btn-accent">
                                Write Your First Post 🚀
                            </button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Trending Articles */}
                        {articles.length >= 5 && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    marginBottom: '1rem',
                                    textAlign: 'center',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Trending Now
                                </h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {[...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((a, i) => (
                                        <Link key={a.id} to={`/${a.slug}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                padding: '1rem',
                                                background: 'var(--color-background)',
                                                borderRadius: '10px',
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                            >
                                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary, #667eea)', opacity: 0.3, marginBottom: '0.25rem' }}>
                                                    #{i + 1}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                                                    {a.title.length > 60 ? a.title.slice(0, 60) + '...' : a.title}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    {(a.views || 0).toLocaleString()} views
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section Header */}
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '0.5rem'
                            }}>
                                Latest Articles
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                                {filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'} to explore
                            </p>
                        </div>

                        {/* Tag Filter - Progressive Disclosure (Miller's Law) */}
                        {allTags.length > 0 && (
                            <div className="tag-filter" style={{
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                marginBottom: '2rem'
                            }}>
                                <button
                                    className={`tag ${!activeTag ? 'active' : ''}`}
                                    onClick={() => setActiveTag(null)}
                                    style={!activeTag ? { background: 'var(--gradient-1)', color: 'white' } : {}}
                                >
                                    All
                                </button>
                                {allTags.slice(0, 7).map(tag => (
                                    <button
                                        key={tag}
                                        className={`tag ${activeTag === tag ? 'active' : ''}`}
                                        onClick={() => setActiveTag(tag)}
                                        style={activeTag === tag ? { background: 'var(--gradient-1)', color: 'white' } : {}}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Article Cards - Von Restorff: Featured first article */}
                        {filteredArticles.map((article, index) => (
                            <Link
                                key={article.id}
                                to={`/${article.slug}`}
                                style={{ textDecoration: 'none' }}
                                aria-label={`Read: ${article.title}`}
                            >
                                <article
                                    className={`article-card ${index === 0 ? 'featured' : ''}`}
                                    style={{
                                        animation: `fadeInUp 0.6s ease ${index * 0.1}s both`
                                    }}
                                >
                                    <div className="article-meta">
                                        <span>📅 {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}</span>
                                        <span>⏱️ {article.readingTime} min read</span>
                                        <span>👁️ {article.views?.toLocaleString() || 0} views</span>
                                    </div>
                                    <h2 className="article-title">{article.title}</h2>
                                    {article.subtitle && (
                                        <p className="article-subtitle">{article.subtitle}</p>
                                    )}
                                    {article.tags?.length > 0 && (
                                        <div className="article-tags">
                                            {article.tags.map((tag, tagIndex) => (
                                                <span key={tagIndex} className="tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            </Link>
                        ))}

                        {/* Featured Apps Spotlight */}
                        {featuredApps.length > 0 && (
                            <section style={{
                                marginTop: '3rem',
                                marginBottom: '3rem',
                                padding: '2rem',
                                background: 'var(--color-background)',
                                borderRadius: '16px',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Built by the same team</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                    Explore our collection of 20+ tools and apps
                                </p>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1rem',
                                    textAlign: 'left',
                                    marginBottom: '1.5rem'
                                }}>
                                    {featuredApps.map(app => (
                                        <AppPromoCard key={app.id} app={app} />
                                    ))}
                                </div>
                                <Link to="/apps" style={{ fontSize: '1rem', fontWeight: 600 }}>
                                    View all apps &rarr;
                                </Link>
                            </section>
                        )}

                        {/* Newsletter Signup - Trust Builder */}
                        <div className="glass-card" style={{
                            marginTop: '3rem',
                            textAlign: 'center',
                            maxWidth: '600px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>📬 Stay Updated</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Get notified when new articles are published
                            </p>
                            {subscribeStatus === 'success' ? (
                                <p style={{ color: '#4ade80', fontWeight: 600 }}>Thanks for subscribing!</p>
                            ) : (
                                <form
                                    className="newsletter-form"
                                    style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!email) return;
                                        setSubscribeStatus('loading');
                                        try {
                                            const res = await fetch('/api/subscribe', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email })
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                setSubscribeStatus('success');
                                                setEmail('');
                                            } else {
                                                setSubscribeStatus(data.error || 'Failed');
                                            }
                                        } catch {
                                            setSubscribeStatus('Network error');
                                        }
                                    }}
                                >
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="form-input"
                                        style={{ maxWidth: '300px' }}
                                        aria-label="Email for newsletter"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={subscribeStatus === 'loading'}
                                    >
                                        {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                                    </button>
                                </form>
                            )}
                            {subscribeStatus && subscribeStatus !== 'success' && subscribeStatus !== 'loading' && (
                                <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{subscribeStatus}</p>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Scroll to Top - Fitts' Law: Large target */}
            <button
                className={`scroll-top ${showScrollTop ? 'visible' : ''}`}
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                ↑
            </button>
        </>
    );
}
