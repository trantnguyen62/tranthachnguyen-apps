import { useState, useEffect } from 'react';
import Header from '../components/Header';

const API_URL = '/api';

const CATEGORY_LABELS = {
    ai: 'AI Tools',
    education: 'Education',
    games: 'Games',
    content: 'Content',
    platform: 'Platform',
    marketplace: 'Marketplaces',
};

export default function Apps() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/apps`)
            .then(res => res.json())
            .then(data => {
                setApps(data.apps || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Group apps by category
    const grouped = apps.reduce((acc, app) => {
        const cat = app.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(app);
        return acc;
    }, {});

    const categoryOrder = ['ai', 'education', 'games', 'content', 'platform', 'marketplace'];

    return (
        <>
            <Header />
            <main className="article-container" style={{ maxWidth: 'var(--max-width)', paddingTop: 'calc(var(--space-3xl) + 80px)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>App Directory</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)' }}>
                        Explore our portfolio of apps and tools
                    </p>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner" />
                        <span>Loading apps...</span>
                    </div>
                ) : (
                    categoryOrder
                        .filter(cat => grouped[cat]?.length > 0)
                        .map(cat => (
                            <section key={cat} style={{ marginBottom: 'var(--space-3xl)' }}>
                                <h2 style={{
                                    fontSize: 'var(--text-2xl)',
                                    marginBottom: 'var(--space-lg)',
                                    paddingBottom: 'var(--space-sm)',
                                    borderBottom: '2px solid var(--color-border)',
                                }}>
                                    {CATEGORY_LABELS[cat] || cat}
                                </h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: 'var(--space-lg)',
                                }}>
                                    {grouped[cat].map(app => (
                                        <a
                                            key={app.id}
                                            href={app.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'block',
                                                padding: 'var(--space-xl)',
                                                background: 'var(--color-surface)',
                                                border: '1px solid var(--color-border)',
                                                borderTop: `4px solid ${app.color}`,
                                                borderRadius: 'var(--radius-lg)',
                                                textDecoration: 'none',
                                                transition: 'all var(--transition-base)',
                                                boxShadow: 'var(--shadow-sm)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.borderColor = app.color;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{
                                                fontWeight: 700,
                                                fontSize: 'var(--text-xl)',
                                                color: 'var(--color-text)',
                                                marginBottom: 'var(--space-xs)',
                                            }}>
                                                {app.name}
                                            </div>
                                            <div style={{
                                                color: app.color,
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: 600,
                                                marginBottom: 'var(--space-md)',
                                            }}>
                                                {app.tagline}
                                            </div>
                                            <div style={{
                                                color: 'var(--color-text-muted)',
                                                fontSize: 'var(--text-sm)',
                                                lineHeight: 1.6,
                                            }}>
                                                {app.description}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        ))
                )}
            </main>
        </>
    );
}
