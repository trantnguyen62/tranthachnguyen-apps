// Input sanitization utilities for XSS prevention

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text safe for HTML rendering
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

    return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitizes text for safe display in the UI
 * Removes any potentially dangerous content
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // Remove any script tags
    let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove any event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Escape HTML
    sanitized = escapeHtml(sanitized);

    return sanitized;
}

/**
 * Validates that a string doesn't contain malicious content
 * @param {string} text - The text to validate
 * @returns {boolean} - True if text appears safe
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
 * Truncates text to a maximum length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text: string, maxLength: number = 1000): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
