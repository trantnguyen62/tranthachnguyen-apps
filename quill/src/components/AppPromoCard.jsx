export default function AppPromoCard({ app, variant = 'sidebar' }) {
    if (!app) return null;

    if (variant === 'inline') {
        return (
            <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: `4px solid ${app.color}`,
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    transition: 'var(--transition-base)',
                    boxShadow: 'var(--shadow-md)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-base)',
                        marginBottom: 'var(--space-xs)',
                    }}>
                        {app.name}
                    </div>
                    <div style={{
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--text-sm)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {app.tagline}
                    </div>
                </div>
                <span style={{
                    padding: 'var(--space-xs) var(--space-md)',
                    background: app.color,
                    color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                }}>
                    Try it
                </span>
            </a>
        );
    }

    // sidebar variant (default)
    return (
        <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'block',
                padding: 'var(--space-lg)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderTop: `4px solid ${app.color}`,
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                transition: 'var(--transition-base)',
                boxShadow: 'var(--shadow-md)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{
                fontWeight: 600,
                color: 'var(--color-text)',
                fontSize: 'var(--text-lg)',
                marginBottom: 'var(--space-xs)',
            }}>
                {app.name}
            </div>
            <div style={{
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-md)',
                lineHeight: 1.5,
            }}>
                {app.tagline}
            </div>
            <span style={{
                color: app.color,
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
            }}>
                Learn more →
            </span>
        </a>
    );
}
