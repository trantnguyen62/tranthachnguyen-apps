import { useState, useEffect } from 'react';
import AppPromoCard from './AppPromoCard';

const API_URL = '/api';

export default function RelatedApps({ tags = [], variant = 'sidebar' }) {
    const [apps, setApps] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (tags.length > 0) params.set('tags', tags.join(','));
        params.set('limit', '3');

        fetch(`${API_URL}/apps/related?${params}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => setApps(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, [tags.join(',')]);

    if (apps.length === 0) return null;

    const isSidebar = variant === 'sidebar';

    return (
        <section style={{ marginTop: 'var(--space-2xl)' }}>
            <h4 style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-lg)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}>
                Related from our portfolio
            </h4>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isSidebar
                    ? '1fr'
                    : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-md)',
            }}>
                {apps.map(app => (
                    <AppPromoCard
                        key={app.id}
                        app={app}
                        variant={isSidebar ? 'sidebar' : 'inline'}
                    />
                ))}
            </div>
        </section>
    );
}
