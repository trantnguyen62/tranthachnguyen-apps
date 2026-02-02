/**
 * Input Validation & Sanitization
 * Prevent XSS, SQL injection, and command injection attacks
 */

// ============ String Sanitization ============

/**
 * Sanitize string to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Remove all HTML tags from string
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize string for use in shell commands
 */
export function sanitizeShellArg(input: string): string {
  // Remove dangerous characters and escape quotes
  return input
    .replace(/[;&|`$(){}[\]!#]/g, "")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

/**
 * Validate and sanitize a project slug
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

/**
 * Validate and sanitize a domain name
 */
export function sanitizeDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/, "");
}

// ============ URL Validation ============

/**
 * Validate a URL is safe (no javascript:, data:, etc.)
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate a GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== "https:") return false;

    // Must be github.com
    if (parsed.hostname !== "github.com") return false;

    // Reject credentials in URL (user:pass@github.com)
    if (parsed.username || parsed.password) return false;

    // Reject path traversal attempts in the original URL (before URL normalization)
    // new URL() normalizes ".." so we must check the raw input
    if (url.includes("..")) return false;

    // Must have owner/repo pattern
    if (!/^\/[^/]+\/[^/]+/.test(parsed.pathname)) return false;

    // Reject URLs with shell metacharacters (even if valid URL syntax)
    if (/[;&|`$(){}[\]!#<>]/.test(url)) return false;

    // Reject URLs with whitespace or newlines
    if (/[\s\r\n]/.test(url)) return false;

    return true;
  } catch {
    return false;
  }
}

// ============ Command Validation ============

/**
 * Dangerous patterns in shell commands
 */
const DANGEROUS_PATTERNS = [
  /;/,               // Semicolon command chaining (always dangerous)
  /\|(?!\|)/,        // Single pipe (but not ||)
  /\$\(/,            // Command substitution $()
  /\$\{/,            // Variable substitution ${} (IFS injection, etc.)
  /\$[A-Za-z_]/,     // Environment variable expansion $VAR
  /`/,               // Backticks
  /[\r\n]/,          // Newline/CRLF injection
  /<\(/,             // Process substitution <()
  />\(/,             // Process substitution >()
  /<<</,             // Here-string
  /<<\s*\w/,         // Here-doc
  />\s*\/(?:etc|dev|proc|sys|boot)/i, // Redirect to system dirs
  /rm\s+(-rf?|--recursive|--force)\s+\//i, // Dangerous rm
  /wget|curl.*\|\s*sh/i, // Download and execute
  /eval\s*\(/,       // Eval
  /base64\s+-d/i,    // Base64 decode (often used to hide commands)
  /\|\|\s*(?:curl|wget|sh|bash)/i, // || followed by dangerous commands
  /nc\s+/i,          // Netcat
  /\/dev\/tcp/i,     // Bash TCP redirection
];

/**
 * Safe command patterns that use && for chaining
 */
const SAFE_CHAINED_COMMANDS = [
  /^(?:npm|yarn|pnpm|bun)\s+(?:ci|install)\s*&&\s*(?:npm|yarn|pnpm|bun)\s+(?:run\s+)?build/i,
  /^(?:npm|yarn|pnpm|bun)\s+(?:run\s+)?(?:build|test|lint)/i,
];

/**
 * Validate a build command is safe
 */
export function isValidBuildCommand(command: string): {
  valid: boolean;
  reason?: string;
} {
  // Check for empty command
  if (!command || command.trim().length === 0) {
    return { valid: true }; // Empty is okay
  }

  const trimmedCommand = command.trim();

  // IMPORTANT: Check dangerous patterns FIRST before safe patterns
  // This prevents attacks like "npm run build; rm -rf /"
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmedCommand)) {
      return {
        valid: false,
        reason: "Command contains potentially dangerous characters or patterns",
      };
    }
  }

  // Check for && with non-whitelisted commands
  // This MUST be checked BEFORE SAFE_CHAINED_COMMANDS to prevent
  // attacks like "npm run build && curl evil.com" matching the safe pattern
  if (trimmedCommand.includes("&&")) {
    // Split by && and validate each part
    const parts = trimmedCommand.split(/\s*&&\s*/);
    for (const part of parts) {
      const partResult = isValidBuildCommand(part);
      if (!partResult.valid) {
        return partResult;
      }
    }
    return { valid: true };
  }

  // Check if it matches known safe chained patterns (for single commands)
  for (const pattern of SAFE_CHAINED_COMMANDS) {
    if (pattern.test(trimmedCommand)) {
      return { valid: true };
    }
  }

  // Validate allowed commands (whitelist approach)
  const allowedPrefixes = [
    "npm",
    "yarn",
    "pnpm",
    "bun",
    "node",
    "npx",
    "next",
    "vite",
    "turbo",
    "tsc",
    "esbuild",
    "rollup",
    "webpack",
    "parcel",
    "grunt",
    "gulp",
    "make",
  ];

  const commandParts = trimmedCommand.split(/\s+/);
  const baseCommand = commandParts[0].toLowerCase();

  if (!allowedPrefixes.some((prefix) => baseCommand.startsWith(prefix))) {
    return {
      valid: false,
      reason: `Command "${baseCommand}" is not in the allowed list`,
    };
  }

  return { valid: true };
}

// ============ Path Validation ============

/**
 * Validate a file path doesn't escape the root
 */
export function isValidPath(path: string, allowAbsolute = false): boolean {
  if (!path) return false;

  // Check for null bytes
  if (path.includes("\0")) return false;

  // Normalize Unicode to NFC form to prevent bypass with different representations
  // e.g., fullwidth characters like ％２ｅ (fullwidth .)
  let normalized = path.normalize("NFC");

  // Reject fullwidth ASCII characters (U+FF00-U+FFEF range)
  // These are Unicode characters that look like ASCII but aren't
  if (/[\uFF00-\uFFEF]/.test(normalized)) return false;

  // Decode URL-encoded characters to prevent bypass
  let decoded = normalized;
  try {
    // Keep decoding until no more encoded characters
    let prev = "";
    while (prev !== decoded) {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    // Invalid encoding, reject
    return false;
  }

  // Normalize slashes and check for path traversal
  const pathNormalized = decoded.replace(/\\/g, "/");
  if (pathNormalized.includes("..")) return false;

  // Check for home directory expansion (security risk)
  if (pathNormalized.startsWith("~")) return false;

  // Check for absolute paths
  if (!allowAbsolute && (pathNormalized.startsWith("/") || /^[a-zA-Z]:/.test(pathNormalized))) {
    return false;
  }

  return true;
}

/**
 * Normalize and validate a relative path
 */
export function normalizePath(path: string): string | null {
  if (!isValidPath(path)) return null;

  return path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/$/, "");
}

// ============ Environment Variable Validation ============

/**
 * Validate environment variable key
 */
export function isValidEnvKey(key: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/i.test(key) && key.length <= 256;
}

/**
 * Sanitize environment variable value
 */
export function sanitizeEnvValue(value: string): string {
  // Remove null bytes and limit length
  return value.replace(/\0/g, "").slice(0, 32768);
}

// ============ JSON Validation ============

/**
 * Safely parse JSON with size limit
 */
export function safeJsonParse<T>(
  input: string,
  maxSize = 1024 * 1024 // 1MB default
): T | null {
  if (input.length > maxSize) {
    return null;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

/**
 * Validate object doesn't contain prototype pollution
 */
export function isCleanObject(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return true;

  if (Array.isArray(obj)) {
    return obj.every(isCleanObject);
  }

  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  for (const key of Object.keys(obj)) {
    if (dangerousKeys.includes(key)) return false;
    if (!isCleanObject((obj as Record<string, unknown>)[key])) return false;
  }

  return true;
}

// ============ Rate Limit Key Sanitization ============

/**
 * Create a safe rate limit key from user input
 */
export function sanitizeRateLimitKey(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9:._-]/g, "")
    .slice(0, 256);
}

// ============ Email Validation ============

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  // Basic email validation (not exhaustive but catches most issues)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============ Webhook URL Validation ============

/**
 * Validate a webhook URL is safe to call
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== "https:") return false;

    // Block localhost and private IPs
    const blockedHosts = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "169.254",
      "10.",
      "172.16",
      "172.17",
      "172.18",
      "172.19",
      "172.20",
      "172.21",
      "172.22",
      "172.23",
      "172.24",
      "172.25",
      "172.26",
      "172.27",
      "172.28",
      "172.29",
      "172.30",
      "172.31",
      "192.168",
    ];

    const hostname = parsed.hostname.toLowerCase();
    if (blockedHosts.some((h) => hostname.startsWith(h))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ============ Export Validation Schemas ============

/**
 * Common validation rules
 */
export const ValidationRules = {
  projectName: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/,
  },
  slug: {
    minLength: 1,
    maxLength: 63,
    pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
  },
  domain: {
    minLength: 3,
    maxLength: 253,
    pattern: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/,
  },
  envVarKey: {
    minLength: 1,
    maxLength: 256,
    pattern: /^[A-Z_][A-Z0-9_]*$/i,
  },
};

/**
 * Validate input against rules
 */
export function validate(
  value: string,
  rules: { minLength?: number; maxLength?: number; pattern?: RegExp }
): { valid: boolean; error?: string } {
  if (rules.minLength && value.length < rules.minLength) {
    return { valid: false, error: `Minimum length is ${rules.minLength}` };
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return { valid: false, error: `Maximum length is ${rules.maxLength}` };
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return { valid: false, error: "Invalid format" };
  }

  return { valid: true };
}
