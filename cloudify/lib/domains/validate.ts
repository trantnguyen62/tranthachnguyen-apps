/**
 * Domain Validation Utilities
 * Strict validation to prevent injection attacks in shell commands and configs
 */

// Strict hostname regex: only alphanumeric, hyphens, dots
// Each label: starts/ends with alphanumeric, hyphens in middle, max 63 chars
// TLD must be at least 2 chars, all alpha
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Validate that a string is a safe domain name
 * Prevents shell injection, OpenSSL config injection, etc.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") return false;
  if (domain.length > 253) return false; // RFC 1035 max
  if (domain.includes("..")) return false; // No consecutive dots
  return DOMAIN_REGEX.test(domain);
}

/**
 * Validate an array of domains
 */
export function validateDomains(domains: string[]): { valid: boolean; invalid: string[] } {
  const invalid = domains.filter((d) => !isValidDomain(d));
  return { valid: invalid.length === 0, invalid };
}

/**
 * Sanitize a domain for safe use in file paths and commands
 * Returns null if the domain is invalid
 */
export function sanitizeDomain(domain: string): string | null {
  if (!isValidDomain(domain)) return null;
  return domain.toLowerCase();
}
