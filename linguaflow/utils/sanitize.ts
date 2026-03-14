/**
 * Input sanitisation helpers used throughout the app to prevent XSS.
 *
 * Functions:
 *   - escapeHtml     — HTML-encodes special characters (safe for innerHTML / dangerouslySetInnerHTML)
 *   - sanitizeText   — strips script tags, event handlers, and javascript: URIs then escapes
 *   - isTextSafe     — lightweight guard that returns false if any dangerous pattern is detected
 *   - truncateText   — clamps text to a maximum byte length (default 1 000 characters)
 */

// Pre-compiled regex patterns to avoid recompilation on every call
const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_RE = /on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_PROTO_RE = /javascript:/gi;
const HTML_CHARS_RE = /[&<>"'/]/g;

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param text - The text to escape.
 * @returns Escaped text safe for HTML rendering.
 */
export function escapeHtml(text: string): string {
    if (!text) return '';

    const htmlEscapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return text.replace(HTML_CHARS_RE, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitises text for safe display in the UI by removing potentially dangerous
 * content (script tags, event handlers, javascript: URIs) then HTML-escaping.
 * @param text - The text to sanitise.
 * @returns Sanitised text safe for display.
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // Remove any script tags
    let sanitized = text.replace(SCRIPT_TAG_RE, '');

    // Remove any event handlers
    sanitized = sanitized.replace(EVENT_HANDLER_RE, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(JAVASCRIPT_PROTO_RE, '');

    // Escape HTML
    sanitized = escapeHtml(sanitized);

    return sanitized;
}

/**
 * Returns `false` if the string contains any recognised XSS pattern
 * (script tags, inline event handlers, javascript: or data:text/html URIs).
 * @param text - The text to check.
 */
export function isTextSafe(text: string): boolean {
    if (!text) return true;

    // Check for script tags
    if (/<script/i.test(text)) return false;

    // Check for event handlers
    if (/on\w+\s*=/i.test(text)) return false;

    // Check for javascript: protocol
    if (/javascript:/i.test(text)) return false;

    // Check for data: protocol (can be used for XSS)
    if (/data:text\/html/i.test(text)) return false;

    return true;
}

/**
 * Truncates `text` to `maxLength` characters, appending `"…"` when clipped.
 * @param text      - The text to truncate.
 * @param maxLength - Maximum number of characters to keep (default 1 000).
 */
export function truncateText(text: string, maxLength: number = 1000): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
