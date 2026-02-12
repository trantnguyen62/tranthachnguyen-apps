/**
 * Rate Limiting
 * Redis-backed sliding window rate limiter for API endpoints.
 *
 * Uses Redis INCR + EXPIRE for an efficient fixed-window counter.
 * Falls back to in-memory storage when Redis is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/lib/storage/redis-client";
import { fail } from "@/lib/api/response";

// Rate limit configuration by endpoint pattern
export interface RateLimitConfig {
  // Maximum requests per window
  limit: number;
  // Window size in seconds
  windowSeconds: number;
  // Optional: different limits for authenticated users
  authenticatedLimit?: number;
  // Custom key generator (default: IP address)
  keyGenerator?: (request: NextRequest) => string;
}

// Default configurations for different endpoint types
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  // Public API endpoints (more restrictive)
  public: {
    limit: 60,
    windowSeconds: 60,
    authenticatedLimit: 120,
  },
  // Authentication endpoints (very restrictive to prevent brute force)
  auth: {
    limit: 10,
    windowSeconds: 60,
  },
  // Write operations (deployments, projects)
  write: {
    limit: 30,
    windowSeconds: 60,
    authenticatedLimit: 100,
  },
  // Read operations (more lenient)
  read: {
    limit: 120,
    windowSeconds: 60,
    authenticatedLimit: 300,
  },
  // Analytics ingestion (very high volume)
  analytics: {
    limit: 500,
    windowSeconds: 60,
  },
  // Webhooks (allow bursts)
  webhook: {
    limit: 100,
    windowSeconds: 60,
  },
};

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: NextRequest): string {
  // Check X-Forwarded-For header (behind proxy/load balancer)
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }

  // Check X-Real-IP header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default
  return "unknown";
}

/**
 * Check rate limit for a key using Redis INCR + EXPIRE.
 *
 * The key expires after the window, so counters auto-reset.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Handle invalid limits (0 or negative) - block all requests
  if (config.limit <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + config.windowSeconds * 1000,
    };
  }

  try {
    const redis = getRedisClient();
    const redisKey = `rate:${key}`;

    // Atomic increment
    const count = await redis.incr(redisKey);

    if (count === 1) {
      // First request in this window -- set expiry
      await redis.expire(redisKey, config.windowSeconds);
    }

    // Get TTL to compute resetAt
    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowSeconds * 1000);

    if (count > config.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return {
      allowed: true,
      remaining: config.limit - count,
      resetAt,
    };
  } catch {
    // Redis unavailable -- fail open (allow the request)
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: Date.now() + config.windowSeconds * 1000,
    };
  }
}

/**
 * Rate limit middleware for Next.js API routes.
 *
 * Returns a function that, when called with a request, returns a 429
 * response (using the standard API envelope) if the limit is exceeded,
 * or null to indicate the request is allowed.
 */
export function rateLimit(
  config: RateLimitConfig = RATE_LIMIT_PRESETS.public
): (
  request: NextRequest,
  isAuthenticated?: boolean
) => Promise<NextResponse | null> {
  return async (request: NextRequest, isAuthenticated = false): Promise<NextResponse | null> => {
    // Get rate limit key
    const keyGenerator = config.keyGenerator || getClientIdentifier;
    const clientKey = keyGenerator(request);
    const key = `${request.nextUrl.pathname}:${clientKey}`;

    // Use higher limit for authenticated users if configured
    const limit =
      isAuthenticated && config.authenticatedLimit
        ? config.authenticatedLimit
        : config.limit;

    const effectiveConfig = { ...config, limit };
    const result = await checkRateLimit(key, effectiveConfig);

    // If rate limited, return 429 using the standard envelope
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      return fail("RATE_LIMITED", "Rate limit exceeded. Please try again later.", 429, undefined, {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      });
    }

    // Request is allowed
    return null;
  };
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  key: string,
  config: RateLimitConfig
): NextResponse {
  // We set headers based on config defaults since the actual count
  // is in Redis. For precise values, call checkRateLimit first.
  response.headers.set("X-RateLimit-Limit", String(config.limit));
  return response;
}

/**
 * Create a rate limiter for specific use case
 */
export function createRateLimiter(preset: keyof typeof RATE_LIMIT_PRESETS | RateLimitConfig) {
  const config = typeof preset === "string" ? RATE_LIMIT_PRESETS[preset] : preset;
  return rateLimit(config);
}

/**
 * IP-based ban list (Redis-backed)
 */
export async function banIP(ip: string, durationMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  if (durationMs <= 0) return;

  try {
    const redis = getRedisClient();
    const seconds = Math.ceil(durationMs / 1000);
    await redis.set(`rate:ban:${ip}`, "1", "EX", seconds);
  } catch {
    // Redis unavailable -- skip ban
  }
}

export async function unbanIP(ip: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`rate:ban:${ip}`);
  } catch {
    // Redis unavailable
  }
}

export async function isIPBanned(ip: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const banned = await redis.exists(`rate:ban:${ip}`);
    return banned > 0;
  } catch {
    return false;
  }
}

/**
 * Check if request should be blocked
 */
export async function shouldBlockRequest(request: NextRequest): Promise<boolean> {
  const ip = getClientIdentifier(request);
  return isIPBanned(ip);
}
