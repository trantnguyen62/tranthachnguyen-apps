/**
 * Bug-Finding Tests for Rate Limiting
 * Tests that rate limiting actually works with Redis-backed storage.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Redis client
const mockRedis = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
}));

vi.mock("@/lib/storage/redis-client", () => ({
  getRedisClient: () => mockRedis,
}));

import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_PRESETS,
  banIP,
  unbanIP,
  isIPBanned,
} from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";

describe("Rate Limiting - Bug Finding Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRateLimit()", () => {
    it("should allow requests under the limit", async () => {
      const config = { limit: 10, windowSeconds: 60 };

      // First request
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result1 = await checkRateLimit("test-key-1", config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(9);
    });

    it("should block requests at the limit", async () => {
      const config = { limit: 5, windowSeconds: 60 };

      // Simulate 6th request (count exceeds limit)
      mockRedis.incr.mockResolvedValue(6);
      mockRedis.ttl.mockResolvedValue(55);

      const blockedResult = await checkRateLimit("test-key-limit", config);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it("should set expiry on first request in window", async () => {
      const config = { limit: 10, windowSeconds: 60 };

      mockRedis.incr.mockResolvedValue(1); // count === 1 means first request
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      await checkRateLimit("test-first", config);

      expect(mockRedis.expire).toHaveBeenCalledWith("rate:test-first", 60);
    });

    it("should not set expiry on subsequent requests", async () => {
      const config = { limit: 10, windowSeconds: 60 };

      mockRedis.incr.mockResolvedValue(3); // not the first request
      mockRedis.ttl.mockResolvedValue(45);

      await checkRateLimit("test-subsequent", config);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it("should track different keys independently", async () => {
      const config = { limit: 2, windowSeconds: 60 };

      // key1 is at limit
      mockRedis.incr.mockResolvedValue(3);
      mockRedis.ttl.mockResolvedValue(50);
      const result1 = await checkRateLimit("test-user-a", config);
      expect(result1.allowed).toBe(false);

      // key2 is fresh
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);
      const result2 = await checkRateLimit("test-user-b", config);
      expect(result2.allowed).toBe(true);
    });

    // BUG FINDER: What happens with limit = 0?
    it("should handle zero limit", async () => {
      const config = { limit: 0, windowSeconds: 60 };

      // With limit 0, first request should be blocked (no Redis call needed)
      const result = await checkRateLimit("test-zero-limit", config);
      expect(result.allowed).toBe(false);
    });

    // BUG FINDER: What happens with negative limit?
    it("should handle negative limit", async () => {
      const config = { limit: -1, windowSeconds: 60 };

      const result = await checkRateLimit("test-negative-limit", config);
      expect(result.allowed).toBe(false);
    });

    // Property: resetAt should be in the future
    it("should have resetAt in the future", async () => {
      const config = { limit: 10, windowSeconds: 60 };

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result = await checkRateLimit("test-reset-time", config);
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60000 + 100);
    });

    // Redis failure should fail open
    it("should fail open when Redis is unavailable", async () => {
      const config = { limit: 10, windowSeconds: 60 };

      mockRedis.incr.mockRejectedValue(new Error("Redis connection failed"));

      const result = await checkRateLimit("test-redis-down", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
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
      for (const [_name, config] of Object.entries(RATE_LIMIT_PRESETS)) {
        expect(config.limit).toBeGreaterThan(0);
        expect(config.windowSeconds).toBeGreaterThan(0);
      }
    });

    // Property: Authenticated limits >= regular limits
    it("should have higher authenticated limits", () => {
      for (const [_name, config] of Object.entries(RATE_LIMIT_PRESETS)) {
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

  describe("IP Banning", () => {
    it("should ban IP", async () => {
      mockRedis.exists.mockResolvedValue(0);
      expect(await isIPBanned("ban-test")).toBe(false);

      mockRedis.set.mockResolvedValue("OK");
      await banIP("ban-test", 60000);

      expect(mockRedis.set).toHaveBeenCalledWith("rate:ban:ban-test", "1", "EX", 60);
    });

    it("should unban IP", async () => {
      mockRedis.del.mockResolvedValue(1);
      await unbanIP("unban-test");

      expect(mockRedis.del).toHaveBeenCalledWith("rate:ban:unban-test");
    });

    it("should check if IP is banned", async () => {
      mockRedis.exists.mockResolvedValue(1);
      expect(await isIPBanned("check-test")).toBe(true);

      mockRedis.exists.mockResolvedValue(0);
      expect(await isIPBanned("check-test")).toBe(false);
    });

    // BUG FINDER: What happens with 0 duration?
    it("should handle zero duration ban", async () => {
      await banIP("zero-ban", 0);
      // With 0 duration, banIP should skip the ban (durationMs <= 0 guard)
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    // BUG FINDER: What happens with negative duration?
    it("should handle negative duration ban", async () => {
      await banIP("negative-ban", -1000);
      // Negative duration should not ban (durationMs <= 0 guard)
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    // BUG FINDER: Very large key
    it("should handle very long keys", async () => {
      const config = { limit: 10, windowSeconds: 60 };
      const longKey = "key-" + "x".repeat(10000);

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result = await checkRateLimit(longKey, config);
      expect(result.allowed).toBe(true);
    });

    // BUG FINDER: Special characters in key
    it("should handle special characters in key", async () => {
      const config = { limit: 10, windowSeconds: 60 };
      const specialKey = "key:with:colons:and/slashes/and?queries=true";

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result = await checkRateLimit(specialKey, config);
      expect(result.allowed).toBe(true);
    });
  });
});
