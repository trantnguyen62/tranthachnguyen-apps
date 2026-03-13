/**
 * Updates the `content` attribute of a meta tag matching the given CSS selector.
 * Used by page components to update dynamic meta tags (og:title, description, etc.)
 * for SEO and social sharing without a full page reload.
 *
 * @param {string} sel - CSS selector for the meta tag (e.g. 'meta[name="description"]')
 * @param {string} content - New content value to set
 */
export const setMeta = (sel, content) => document.querySelector(sel)?.setAttribute('content', content);
