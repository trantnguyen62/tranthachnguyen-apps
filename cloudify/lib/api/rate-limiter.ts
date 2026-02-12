/**
 * Rate Limiter - Redis-based sliding window rate limiting
 *
 * Uses a sliding window counter pattern with Redis sorted sets for accurate,
 * memory-efficient rate limiting.
 *
 * Usage in API routes:
 *   const limiter = createRateLimiter({ maxRequests: 100, windowMs: 60_000 });
 *   const result = await limiter.check(request);
 *   if (!result.allowed) return result.response;
 */

import { NextRequest, NextResponse } from "next/server";
import { getRedisClient, KEY_PREFIX } from "@/lib/storage/redis-client";

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key prefix for namespacing different limiters */
  keyPrefix?: string;
  /** Custom function to extract the identifier (defaults to IP address) */
  identifierFn?: (request: NextRequest) => string;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
  /** Total limit for the window */
  limit: number;
  /** Pre-built 429 response (only set when not allowed) */
  response?: NextResponse;
}

/**
 * Extract the client IP address from a Next.js request.
 * Checks X-Forwarded-For (reverse proxy), X-Real-IP, then falls back to a default.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

/**
 * Add rate-limit headers to a response.
 */
function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetAt.toString());
  return response;
}

/**
 * Create a rate limiter with the given configuration.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    keyPrefix = "default",
    identifierFn,
  } = config;

  return {
    /**
     * Check if the request is allowed under the rate limit.
     * Uses a Redis sorted set sliding window algorithm.
     */
    async check(request: NextRequest): Promise<RateLimitResult> {
      const identifier = identifierFn
        ? identifierFn(request)
        : getClientIp(request);

      const key = `${KEY_PREFIX.RATE}${keyPrefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      const resetAt = now + windowMs;

      try {
        const redis = getRedisClient();

        // Use a pipeline for atomic operations:
        // 1. Remove expired entries outside the window
        // 2. Add current request timestamp
        // 3. Count requests in current window
        // 4. Set key expiry to auto-cleanup
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zadd(key, now, `${now}:${Math.random()}`);
        pipeline.zcard(key);
        pipeline.pexpire(key, windowMs);

        const results = await pipeline.exec();

        // zcard result is the 3rd command (index 2)
        const requestCount = (results?.[2]?.[1] as number) || 0;
        const remaining = Math.max(0, maxRequests - requestCount);
        const allowed = requestCount <= maxRequests;

        const result: RateLimitResult = {
          allowed,
          remaining,
          resetAt,
          limit: maxRequests,
        };

        if (!allowed) {
          const retryAfter = Math.ceil(windowMs / 1000);
          const response = NextResponse.json(
            {
              error: "Too many requests",
              message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
              retryAfter,
            },
            { status: 429 }
          );
          response.headers.set("Retry-After", retryAfter.toString());
          addRateLimitHeaders(response, result);
          result.response = response;
        }

        return result;
      } catch (error) {
        // If Redis is unavailable, fail open (allow the request)
        // to avoid blocking all traffic when Redis is down.
        console.error("Rate limiter error (failing open):", error);
        return {
          allowed: true,
          remaining: maxRequests,
          resetAt,
          limit: maxRequests,
        };
      }
    },

    /**
     * Create a middleware wrapper that applies rate limiting.
     * Adds X-RateLimit-* headers to successful responses.
     */
    middleware() {
      return async (
        request: NextRequest,
        handler: (req: NextRequest) => Promise<NextResponse>
      ): Promise<NextResponse> => {
        const result = await this.check(request);

        if (!result.allowed && result.response) {
          return result.response;
        }

        const response = await handler(request);
        return addRateLimitHeaders(response, result);
      };
    },
  };
}

// ============ Pre-configured Rate Limiters ============

/** Default API rate limiter: 100 requests per minute per IP */
export const apiRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60_000,
  keyPrefix: "api",
});

/** Strict rate limiter for auth endpoints: 10 requests per minute per IP */
export const authRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
  keyPrefix: "auth",
});

/** Deploy rate limiter: 30 deploys per minute per IP */
export const deployRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
  keyPrefix: "deploy",
});

/**
 * Helper to apply rate limiting in an API route handler.
 *
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     const rateLimitResult = await apiRateLimiter.check(request);
 *     if (!rateLimitResult.allowed) return rateLimitResult.response!;
 *     // ... rest of handler
 *   }
 */
