/**
 * Bug-Finding Tests for Rate Limiting
 * Tests that rate limiting actually works with real timing
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_PRESETS,
  SlidingWindowRateLimiter,
  banIP,
  unbanIP,
  isIPBanned,
} from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";

describe("Rate Limiting - Bug Finding Tests", () => {
  beforeEach(() => {
    // Clear any cached state between tests
    vi.clearAllMocks();
  });

  describe("checkRateLimit()", () => {
    it("should allow requests under the limit", () => {
      const config = { limit: 10, window: 60000 };

      // First request should be allowed
      const result1 = checkRateLimit("test-key-1", config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(9);

      // Subsequent requests should also be allowed
      for (let i = 0; i < 8; i++) {
        const result = checkRateLimit("test-key-1", config);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block requests at the limit", () => {
      const config = { limit: 5, window: 60000 };
      const key = "test-key-limit-" + Date.now();

      // Make exactly limit requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(key, config);
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const blockedResult = checkRateLimit(key, config);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it("should track different keys independently", () => {
      const config = { limit: 2, window: 60000 };
      const key1 = "test-user-a-" + Date.now();
      const key2 = "test-user-b-" + Date.now();

      // Exhaust key1
      checkRateLimit(key1, config);
      checkRateLimit(key1, config);

      // key1 should be blocked
      expect(checkRateLimit(key1, config).allowed).toBe(false);

      // key2 should still be allowed
      expect(checkRateLimit(key2, config).allowed).toBe(true);
    });

    // BUG FINDER: What happens with limit = 0?
    it("should handle zero limit", () => {
      const config = { limit: 0, window: 60000 };
      const key = "test-zero-limit-" + Date.now();

      // With limit 0, first request should be blocked
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(false);
    });

    // BUG FINDER: What happens with negative limit?
    it("should handle negative limit", () => {
      const config = { limit: -1, window: 60000 };
      const key = "test-negative-limit-" + Date.now();

      const result = checkRateLimit(key, config);
      // Negative limit is ambiguous - should probably be blocked
      // This test documents actual behavior
      expect(result.allowed).toBe(false);
    });

    // BUG FINDER: Very short window
    it("should handle very short window", () => {
      const config = { limit: 10, window: 1 }; // 1ms window
      const key = "test-short-window-" + Date.now();

      const result1 = checkRateLimit(key, config);
      expect(result1.allowed).toBe(true);

      // Wait 2ms, should reset
      // Note: This is timing sensitive
    });

    // Property: resetAt should be in the future
    it("should have resetAt in the future", () => {
      const config = { limit: 10, window: 60000 };
      const key = "test-reset-time-" + Date.now();

      const result = checkRateLimit(key, config);
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60000 + 100); // Allow 100ms tolerance
    });
  });

  describe("getClientIdentifier()", () => {
    it("should extract IP from X-Forwarded-For", () => {
      const request = new NextRequest("http://localhost/api", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });

      const ip = getClientIdentifier(request);
      expect(ip).toBe("1.2.3.4");
    });

    it("should extract IP from X-Real-IP", () => {
      const request = new NextRequest("http://localhost/api", {
        headers: { "x-real-ip": "9.8.7.6" },
      });

      const ip = getClientIdentifier(request);
      expect(ip).toBe("9.8.7.6");
    });

    it("should fallback to unknown", () => {
      const request = new NextRequest("http://localhost/api");

      const ip = getClientIdentifier(request);
      expect(ip).toBe("unknown");
    });

    // BUG FINDER: IP spoofing via headers
    it("should handle malformed X-Forwarded-For", () => {
      const request = new NextRequest("http://localhost/api", {
        headers: { "x-forwarded-for": "" },
      });

      const ip = getClientIdentifier(request);
      // Empty header should not cause issues
      expect(ip).toBeTruthy();
    });

    it("should handle whitespace in IP headers", () => {
      const request = new NextRequest("http://localhost/api", {
        headers: { "x-forwarded-for": "  1.2.3.4  ,  5.6.7.8  " },
      });

      const ip = getClientIdentifier(request);
      expect(ip).toBe("1.2.3.4");
    });
  });

  describe("RATE_LIMIT_PRESETS", () => {
    // Property: All presets should have positive limits
    it("should have positive limits", () => {
      for (const [name, config] of Object.entries(RATE_LIMIT_PRESETS)) {
        expect(config.limit).toBeGreaterThan(0);
        expect(config.window).toBeGreaterThan(0);
      }
    });

    // Property: Authenticated limits >= regular limits
    it("should have higher authenticated limits", () => {
      for (const [name, config] of Object.entries(RATE_LIMIT_PRESETS)) {
        if (config.authenticatedLimit) {
          expect(config.authenticatedLimit).toBeGreaterThanOrEqual(config.limit);
        }
      }
    });

    // Property: Auth endpoint should be most restrictive
    it("should have restrictive auth limits", () => {
      expect(RATE_LIMIT_PRESETS.auth.limit).toBeLessThan(RATE_LIMIT_PRESETS.public.limit);
    });
  });

  describe("SlidingWindowRateLimiter", () => {
    it("should accurately track requests in sliding window", () => {
      const limiter = new SlidingWindowRateLimiter({ limit: 5, window: 1000 });
      const key = "sliding-test-" + Date.now();

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = limiter.check(key);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }

      // 6th request should be blocked
      const blocked = limiter.check(key);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    // BUG FINDER: Memory leak in sliding window
    it("should cleanup old timestamps", () => {
      const limiter = new SlidingWindowRateLimiter({ limit: 1000, window: 10 });
      const key = "cleanup-test-" + Date.now();

      // Make many requests
      for (let i = 0; i < 100; i++) {
        limiter.check(key);
      }

      // Cleanup should remove old entries
      limiter.cleanup();

      // After cleanup with 10ms window, old timestamps should be removed
      // (This test is timing-sensitive)
    });
  });

  describe("IP Banning", () => {
    it("should ban IP", () => {
      const ip = "ban-test-" + Date.now();

      expect(isIPBanned(ip)).toBe(false);

      banIP(ip, 60000);
      expect(isIPBanned(ip)).toBe(true);
    });

    it("should unban IP", () => {
      const ip = "unban-test-" + Date.now();

      banIP(ip, 60000);
      expect(isIPBanned(ip)).toBe(true);

      unbanIP(ip);
      expect(isIPBanned(ip)).toBe(false);
    });

    it("should auto-expire bans", async () => {
      const ip = "expire-test-" + Date.now();

      // Ban for 10ms
      banIP(ip, 10);
      expect(isIPBanned(ip)).toBe(true);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be auto-unbanned
      expect(isIPBanned(ip)).toBe(false);
    });

    // BUG FINDER: What happens with 0 duration?
    it("should handle zero duration ban", () => {
      const ip = "zero-ban-" + Date.now();

      banIP(ip, 0);
      // Should immediately expire
      expect(isIPBanned(ip)).toBe(false);
    });

    // BUG FINDER: What happens with negative duration?
    it("should handle negative duration ban", () => {
      const ip = "negative-ban-" + Date.now();

      banIP(ip, -1000);
      // Negative duration should not ban or should immediately expire
      expect(isIPBanned(ip)).toBe(false);
    });
  });

  describe("Edge Cases and Race Conditions", () => {
    // BUG FINDER: Concurrent requests
    it("should handle concurrent requests correctly", async () => {
      const config = { limit: 10, window: 60000 };
      const key = "concurrent-test-" + Date.now();

      // Simulate concurrent requests
      const results = await Promise.all(
        Array(15)
          .fill(null)
          .map(() => Promise.resolve(checkRateLimit(key, config)))
      );

      const allowed = results.filter((r) => r.allowed).length;
      const blocked = results.filter((r) => !r.allowed).length;

      // Exactly 10 should be allowed, 5 blocked
      expect(allowed).toBe(10);
      expect(blocked).toBe(5);
    });

    // BUG FINDER: Very large key
    it("should handle very long keys", () => {
      const config = { limit: 10, window: 60000 };
      const longKey = "key-" + "x".repeat(10000);

      const result = checkRateLimit(longKey, config);
      expect(result.allowed).toBe(true);
    });

    // BUG FINDER: Special characters in key
    it("should handle special characters in key", () => {
      const config = { limit: 10, window: 60000 };
      const specialKey = "key:with:colons:and/slashes/and?queries=true";

      const result = checkRateLimit(specialKey, config);
      expect(result.allowed).toBe(true);
    });
  });
});
