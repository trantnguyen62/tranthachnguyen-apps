import { useState } from 'react';

export default function ShareButton({ platform, url, title }) {
    const [copied, setCopied] = useState(false);

    const handleClick = () => {
        if (platform === 'twitter') {
            window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
                '_blank',
                'noopener,noreferrer'
            );
        } else if (platform === 'linkedin') {
            window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                '_blank',
                'noopener,noreferrer'
            );
        } else if (platform === 'reddit') {
            window.open(
                `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
                '_blank',
                'noopener,noreferrer'
            );
        } else if (platform === 'hackernews') {
            window.open(
                `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`,
                '_blank',
                'noopener,noreferrer'
            );
        } else if (platform === 'email') {
            window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${title}\n\n${url}`)}`;
        } else if (platform === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const labels = {
        twitter: 'Twitter',
        linkedin: 'LinkedIn',
        reddit: 'Reddit',
        hackernews: 'Hacker News',
        email: 'Email',
        copy: copied ? 'Copied!' : 'Copy Link',
    };

    return (
        <button className="share-btn" onClick={handleClick} aria-label={`Share on ${labels[platform]}`}>
            {labels[platform]}
        </button>
    );
}
