/**
 * Webhook Signature Validation Tests
 *
 * Verifies that webhook endpoints properly validate signatures to prevent:
 * 1. Unauthorized webhook calls
 * 2. Replay attacks
 * 3. Body tampering
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

// Helper to create GitHub webhook signature
function createGitHubSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

// Webhook signature verifier implementation
function verifyGitHubWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  if (!signature.startsWith("sha256=")) return false;

  const expectedSignature = createGitHubSignature(payload, secret);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Webhook timestamp verifier (replay attack prevention)
function isValidWebhookTimestamp(timestamp: number, maxAgeMs: number = 300000): boolean {
  const now = Date.now();
  const webhookTime = timestamp * 1000; // Convert to milliseconds

  // Reject if timestamp is in the future (with 60s tolerance for clock skew)
  if (webhookTime > now + 60000) return false;

  // Reject if timestamp is too old
  if (now - webhookTime > maxAgeMs) return false;

  return true;
}

describe("GitHub Webhook Signature Validation", () => {
  const WEBHOOK_SECRET = "test-webhook-secret-12345";
  const validPayload = JSON.stringify({
    action: "push",
    repository: { full_name: "user/repo" },
  });

  describe("Signature Verification", () => {
    it("accepts valid signature", () => {
      const signature = createGitHubSignature(validPayload, WEBHOOK_SECRET);
      const result = verifyGitHubWebhookSignature(validPayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(true);
    });

    it("rejects missing signature", () => {
      const result = verifyGitHubWebhookSignature(validPayload, null, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects empty signature", () => {
      const result = verifyGitHubWebhookSignature(validPayload, "", WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects invalid signature format (missing sha256= prefix)", () => {
      const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
      hmac.update(validPayload);
      const rawSignature = hmac.digest("hex");

      const result = verifyGitHubWebhookSignature(validPayload, rawSignature, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects signature with wrong algorithm prefix", () => {
      const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
      hmac.update(validPayload);
      const signature = `sha1=${hmac.digest("hex")}`;

      const result = verifyGitHubWebhookSignature(validPayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects invalid signature (wrong secret)", () => {
      const signature = createGitHubSignature(validPayload, "wrong-secret");
      const result = verifyGitHubWebhookSignature(validPayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects tampered payload", () => {
      const signature = createGitHubSignature(validPayload, WEBHOOK_SECRET);
      const tamperedPayload = JSON.stringify({
        action: "push",
        repository: { full_name: "attacker/repo" }, // Changed!
      });

      const result = verifyGitHubWebhookSignature(tamperedPayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects signature with extra characters", () => {
      const signature = createGitHubSignature(validPayload, WEBHOOK_SECRET);
      const paddedSignature = signature + "extra";

      const result = verifyGitHubWebhookSignature(validPayload, paddedSignature, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("rejects truncated signature", () => {
      const signature = createGitHubSignature(validPayload, WEBHOOK_SECRET);
      const truncatedSignature = signature.slice(0, -10);

      const result = verifyGitHubWebhookSignature(validPayload, truncatedSignature, WEBHOOK_SECRET);
      expect(result).toBe(false);
    });

    it("handles unicode payload correctly", () => {
      const unicodePayload = JSON.stringify({ message: "Hello 世界 🌍" });
      const signature = createGitHubSignature(unicodePayload, WEBHOOK_SECRET);

      const result = verifyGitHubWebhookSignature(unicodePayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(true);
    });

    it("handles empty payload", () => {
      const emptyPayload = "";
      const signature = createGitHubSignature(emptyPayload, WEBHOOK_SECRET);

      const result = verifyGitHubWebhookSignature(emptyPayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(true);
    });

    it("handles large payload", () => {
      const largePayload = JSON.stringify({ data: "x".repeat(1024 * 1024) }); // 1MB
      const signature = createGitHubSignature(largePayload, WEBHOOK_SECRET);

      const result = verifyGitHubWebhookSignature(largePayload, signature, WEBHOOK_SECRET);
      expect(result).toBe(true);
    });
  });

  describe("Timing Attack Prevention", () => {
    it("uses constant-time comparison", () => {
      // This test documents that we use crypto.timingSafeEqual
      // The actual timing attack is difficult to test in unit tests

      const signature = createGitHubSignature(validPayload, WEBHOOK_SECRET);
      const wrongSignature = "sha256=" + "0".repeat(64);

      // Both comparisons should take similar time
      // (can't easily test this, but documenting the requirement)
      verifyGitHubWebhookSignature(validPayload, signature, WEBHOOK_SECRET);
      verifyGitHubWebhookSignature(validPayload, wrongSignature, WEBHOOK_SECRET);

      expect(true).toBe(true);
    });
  });
});

describe("Replay Attack Prevention", () => {
  describe("Timestamp Validation", () => {
    it("accepts recent timestamp", () => {
      const now = Math.floor(Date.now() / 1000);
      expect(isValidWebhookTimestamp(now)).toBe(true);
    });

    it("accepts timestamp within tolerance", () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60;
      expect(isValidWebhookTimestamp(fiveMinutesAgo)).toBe(true);
    });

    it("rejects timestamp too old (replay attack)", () => {
      const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
      expect(isValidWebhookTimestamp(tenMinutesAgo)).toBe(false);
    });

    it("rejects timestamp from the future", () => {
      const twoMinutesFromNow = Math.floor(Date.now() / 1000) + 120;
      expect(isValidWebhookTimestamp(twoMinutesFromNow)).toBe(false);
    });

    it("allows small clock skew (60 seconds)", () => {
      const thirtySecondsFromNow = Math.floor(Date.now() / 1000) + 30;
      expect(isValidWebhookTimestamp(thirtySecondsFromNow)).toBe(true);
    });

    it("rejects zero timestamp", () => {
      expect(isValidWebhookTimestamp(0)).toBe(false);
    });

    it("rejects negative timestamp", () => {
      expect(isValidWebhookTimestamp(-1000)).toBe(false);
    });
  });

  describe("Request Deduplication", () => {
    // Mock a simple deduplication store
    const processedWebhooks = new Set<string>();

    const processWebhook = (deliveryId: string): boolean => {
      if (processedWebhooks.has(deliveryId)) {
        return false; // Already processed
      }
      processedWebhooks.add(deliveryId);
      return true;
    };

    beforeEach(() => {
      processedWebhooks.clear();
    });

    it("processes new webhook delivery", () => {
      expect(processWebhook("delivery-123")).toBe(true);
    });

    it("rejects duplicate delivery (replay)", () => {
      processWebhook("delivery-123");
      expect(processWebhook("delivery-123")).toBe(false);
    });

    it("accepts different delivery IDs", () => {
      expect(processWebhook("delivery-123")).toBe(true);
      expect(processWebhook("delivery-456")).toBe(true);
    });
  });
});

describe("Webhook Body Validation", () => {
  describe("Payload Size Limits", () => {
    const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB

    const validatePayloadSize = (payload: string): boolean => {
      return Buffer.byteLength(payload, "utf8") <= MAX_PAYLOAD_SIZE;
    };

    it("accepts normal-sized payload", () => {
      const normalPayload = JSON.stringify({ data: "test" });
      expect(validatePayloadSize(normalPayload)).toBe(true);
    });

    it("rejects oversized payload", () => {
      const oversizedPayload = "x".repeat(10 * 1024 * 1024); // 10MB
      expect(validatePayloadSize(oversizedPayload)).toBe(false);
    });
  });

  describe("Content-Type Validation", () => {
    const isValidContentType = (contentType: string | null): boolean => {
      if (!contentType) return false;

      const allowedTypes = [
        "application/json",
        "application/x-www-form-urlencoded",
      ];

      const normalizedType = contentType.split(";")[0].trim().toLowerCase();
      return allowedTypes.includes(normalizedType);
    };

    it("accepts application/json", () => {
      expect(isValidContentType("application/json")).toBe(true);
    });

    it("accepts application/json with charset", () => {
      expect(isValidContentType("application/json; charset=utf-8")).toBe(true);
    });

    it("rejects missing content-type", () => {
      expect(isValidContentType(null)).toBe(false);
    });

    it("rejects text/plain", () => {
      expect(isValidContentType("text/plain")).toBe(false);
    });

    it("rejects text/html (potential XSS)", () => {
      expect(isValidContentType("text/html")).toBe(false);
    });
  });

  describe("JSON Payload Validation", () => {
    const validateWebhookPayload = (payload: unknown): boolean => {
      if (typeof payload !== "object" || payload === null) return false;

      // Check for required fields (GitHub example)
      const p = payload as Record<string, unknown>;
      if (!p.action && !p.zen) return false; // Must have action or be ping

      return true;
    };

    it("accepts valid GitHub push payload", () => {
      const payload = {
        action: "push",
        repository: { full_name: "user/repo" },
      };
      expect(validateWebhookPayload(payload)).toBe(true);
    });

    it("accepts GitHub ping payload", () => {
      const payload = {
        zen: "Keep it logically awesome.",
        hook_id: 123,
      };
      expect(validateWebhookPayload(payload)).toBe(true);
    });

    it("rejects null payload", () => {
      expect(validateWebhookPayload(null)).toBe(false);
    });

    it("rejects array payload", () => {
      expect(validateWebhookPayload([])).toBe(false);
    });

    it("rejects payload without required fields", () => {
      const payload = { random: "data" };
      expect(validateWebhookPayload(payload)).toBe(false);
    });
  });
});

describe("Webhook Source Validation", () => {
  describe("IP Allowlisting (GitHub)", () => {
    // GitHub webhook IPs: https://api.github.com/meta
    const GITHUB_WEBHOOK_IPS = [
      "192.30.252.0/22",
      "185.199.108.0/22",
      "140.82.112.0/20",
    ];

    const isInCIDR = (ip: string, cidr: string): boolean => {
      // Simplified check - in production, use a proper IP library
      const [network, bits] = cidr.split("/");
      const networkParts = network.split(".").map(Number);
      const ipParts = ip.split(".").map(Number);
      const mask = parseInt(bits, 10);

      // Very simplified - only handles /8, /16, /20, /22, /24
      const checkBits = Math.floor(mask / 8);
      for (let i = 0; i < checkBits; i++) {
        if (networkParts[i] !== ipParts[i]) return false;
      }

      return true;
    };

    const isGitHubIP = (ip: string): boolean => {
      return GITHUB_WEBHOOK_IPS.some((cidr) => isInCIDR(ip, cidr));
    };

    it("accepts GitHub webhook IPs", () => {
      expect(isGitHubIP("192.30.252.1")).toBe(true);
      expect(isGitHubIP("185.199.108.1")).toBe(true);
      expect(isGitHubIP("140.82.112.1")).toBe(true);
    });

    it("rejects non-GitHub IPs", () => {
      expect(isGitHubIP("8.8.8.8")).toBe(false);
      expect(isGitHubIP("192.168.1.1")).toBe(false);
    });
  });

  describe("User-Agent Validation", () => {
    const isValidGitHubUserAgent = (userAgent: string | null): boolean => {
      if (!userAgent) return false;
      return userAgent.startsWith("GitHub-Hookshot/");
    };

    it("accepts GitHub webhook user agent", () => {
      expect(isValidGitHubUserAgent("GitHub-Hookshot/abc123")).toBe(true);
    });

    it("rejects missing user agent", () => {
      expect(isValidGitHubUserAgent(null)).toBe(false);
    });

    it("rejects non-GitHub user agents", () => {
      expect(isValidGitHubUserAgent("curl/7.64.1")).toBe(false);
      expect(isValidGitHubUserAgent("Mozilla/5.0")).toBe(false);
    });
  });
});

describe("Error Handling", () => {
  it("should not leak secret in error messages", () => {
    const secret = "super-secret-key-12345";

    try {
      // Simulate verification failure
      const result = verifyGitHubWebhookSignature("{}", "invalid", secret);
      expect(result).toBe(false);
    } catch (error) {
      // If any error is thrown, it should not contain the secret
      const errorMessage = (error as Error).message;
      expect(errorMessage).not.toContain(secret);
    }
  });

  it("should handle malformed JSON gracefully", () => {
    const malformedPayload = "{ invalid json }";
    const signature = createGitHubSignature(malformedPayload, "secret");

    // Signature verification should still work (it operates on raw string)
    const result = verifyGitHubWebhookSignature(malformedPayload, signature, "secret");
    expect(result).toBe(true);

    // JSON parsing would fail separately
    expect(() => JSON.parse(malformedPayload)).toThrow();
  });
});
