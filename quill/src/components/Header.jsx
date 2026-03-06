import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!query || query.length < 2) { setResults([]); return; }
        const timer = setTimeout(() => {
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(r => r.json())
                .then(setResults)
                .catch(() => setResults([]));
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="header" role="banner">
            <Link to="/" className="logo" aria-label="Quill Home">Quill</Link>
            <nav role="navigation" aria-label="Main navigation" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div ref={searchRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => { setSearchOpen(!searchOpen); setQuery(''); setResults([]); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-muted)'
                        }}
                        aria-label="Search articles"
                    >
                        Search
                    </button>
                    {searchOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                            background: 'var(--color-surface, #1a1a2e)', borderRadius: '10px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '320px', zIndex: 100,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', border: 'none',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent', color: 'inherit', fontSize: '0.95rem',
                                    outline: 'none', borderRadius: '10px 10px 0 0', boxSizing: 'border-box'
                                }}
                            />
                            {results.length > 0 && (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {results.slice(0, 8).map(r => (
                                        <div
                                            key={r.slug}
                                            onClick={() => { navigate(`/${r.slug}`); setSearchOpen(false); }}
                                            style={{
                                                padding: '0.6rem 1rem', cursor: 'pointer',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                                                {r.title.length > 50 ? r.title.slice(0, 50) + '...' : r.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {r.readingTime} min read · {(r.views || 0).toLocaleString()} views
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {query.length >= 2 && results.length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    No articles found
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <Link to="/apps" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-muted)', textDecoration: 'none' }}>Apps</Link>
                <a href="/feed.xml" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-muted)', textDecoration: 'none' }} title="RSS Feed">RSS</a>
                <a href="https://github.com/tranthachnguyen" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-muted)', textDecoration: 'none' }} title="GitHub">GitHub</a>
                <Link to="/write">
                    <button className="btn btn-primary" aria-label="Write new article">Write</button>
                </Link>
            </nav>
        </header>
    );
}
