/**
 * Updates the `content` attribute of a meta tag matching the given CSS selector.
 * Used by page components to update dynamic meta tags (og:title, description, etc.)
 * for SEO and social sharing without a full page reload.
 *
 * @param {string} sel - CSS selector for the meta tag (e.g. 'meta[name="description"]')
 * @param {string} content - New content value to set
 */
export const setMeta = (sel, content) => document.querySelector(sel)?.setAttribute('content', content);

/**
 * Removes any existing <head> element with `attrs.id`, creates a new element
 * of `tag` with all `attrs` applied, appends it to <head>, and returns it.
 *
 * @param {string} tag - HTML tag name (e.g. 'link', 'meta', 'script')
 * @param {Object} attrs - Attributes to assign to the element (must include `id`)
 * @returns {HTMLElement}
 */
export function injectHeadElement(tag, attrs) {
  document.getElementById(attrs.id)?.remove();
  const el = Object.assign(document.createElement(tag), attrs);
  document.head.appendChild(el);
  return el;
}

/**
 * Injects a JSON-LD <script> into <head>, replacing any existing one with the same id.
 *
 * @param {string} id - Element id used to deduplicate (e.g. 'page-jsonld')
 * @param {Object} data - Structured data object to serialise
 * @returns {HTMLScriptElement}
 */
export function injectJsonLd(id, data) {
  const el = injectHeadElement('script', { id, type: 'application/ld+json' });
  el.textContent = JSON.stringify(data);
  return el;
}
