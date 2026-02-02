/**
 * Redis-backed Rate Limiting
 * Distributed rate limiting for multi-instance deployments
 */

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "ioredis";

// Rate limit configuration
export interface RateLimitConfig {
  limit: number;
  window: number; // milliseconds
  authenticatedLimit?: number;
  keyPrefix?: string;
}

// Default configurations
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  public: {
    limit: 60,
    window: 60 * 1000,
    authenticatedLimit: 120,
    keyPrefix: "rl:public:",
  },
  auth: {
    limit: 10,
    window: 60 * 1000,
    keyPrefix: "rl:auth:",
  },
  write: {
    limit: 30,
    window: 60 * 1000,
    authenticatedLimit: 100,
    keyPrefix: "rl:write:",
  },
  read: {
    limit: 120,
    window: 60 * 1000,
    authenticatedLimit: 300,
    keyPrefix: "rl:read:",
  },
  analytics: {
    limit: 500,
    window: 60 * 1000,
    keyPrefix: "rl:analytics:",
  },
  webhook: {
    limit: 100,
    window: 60 * 1000,
    keyPrefix: "rl:webhook:",
  },
  deployment: {
    limit: 10,
    window: 60 * 1000,
    authenticatedLimit: 50,
    keyPrefix: "rl:deploy:",
  },
};

// Redis client singleton
let redisClient: Redis | null = null;
let useRedis = false;

/**
 * Initialize Redis connection
 */
export function initRedis(redisUrl?: string): Redis | null {
  const url = redisUrl || process.env.REDIS_URL;

  if (!url) {
    console.warn("REDIS_URL not configured, falling back to in-memory rate limiting");
    useRedis = false;
    return null;
  }

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error("Redis connection failed, falling back to in-memory");
          useRedis = false;
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on("connect", () => {
      console.log("Redis connected for rate limiting");
      useRedis = true;
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
      useRedis = false;
    });

    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    useRedis = false;
    return null;
  }
}

/**
 * Get Redis client (initializes if needed)
 */
export function getRedisClient(): Redis | null {
  if (redisClient === null && process.env.REDIS_URL) {
    initRedis();
  }
  return useRedis ? redisClient : null;
}

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit using Redis (with memory fallback)
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedisClient();
  const now = Date.now();
  const windowSec = Math.ceil(config.window / 1000);

  if (redis && useRedis) {
    try {
      // Use Redis MULTI/EXEC for atomic operations
      const fullKey = `${config.keyPrefix || "rl:"}${key}`;

      // Increment counter with expiry
      const pipeline = redis.multi();
      pipeline.incr(fullKey);
      pipeline.pttl(fullKey);
      const results = await pipeline.exec();

      if (!results) throw new Error("Pipeline failed");

      const count = results[0]?.[1] as number;
      let ttl = results[1]?.[1] as number;

      // Set expiry on first request
      if (ttl === -1) {
        await redis.expire(fullKey, windowSec);
        ttl = config.window;
      }

      const resetAt = now + Math.max(ttl, 0);
      const allowed = count <= config.limit;

      return {
        allowed,
        remaining: Math.max(0, config.limit - count),
        resetAt,
      };
    } catch (error) {
      console.error("Redis rate limit error, falling back to memory:", error);
      // Fall through to memory implementation
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.window,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.window,
    };
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

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

  // Check CF-Connecting-IP for Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  return "unknown";
}

/**
 * Rate limit middleware
 */
export function rateLimit(
  config: RateLimitConfig = RATE_LIMIT_PRESETS.public
): (
  request: NextRequest,
  isAuthenticated?: boolean
) => Promise<NextResponse | null> {
  return async (
    request: NextRequest,
    isAuthenticated = false
  ): Promise<NextResponse | null> => {
    const clientKey = getClientIdentifier(request);
    const pathKey = request.nextUrl.pathname.replace(/\//g, ":");
    const key = `${pathKey}:${clientKey}`;

    // Use higher limit for authenticated users
    const limit =
      isAuthenticated && config.authenticatedLimit
        ? config.authenticatedLimit
        : config.limit;

    const effectiveConfig = { ...config, limit };
    const result = await checkRateLimit(key, effectiveConfig);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  return response;
}

/**
 * Create rate limiter for specific preset
 */
export function createRateLimiter(
  preset: keyof typeof RATE_LIMIT_PRESETS | RateLimitConfig
) {
  const config = typeof preset === "string" ? RATE_LIMIT_PRESETS[preset] : preset;
  return rateLimit(config);
}

// ============ IP Banning (Redis-backed) ============

const BAN_KEY_PREFIX = "ban:ip:";

/**
 * Ban an IP address
 */
export async function banIP(
  ip: string,
  durationMs: number = 24 * 60 * 60 * 1000,
  reason?: string
): Promise<void> {
  const redis = getRedisClient();
  const key = `${BAN_KEY_PREFIX}${ip}`;
  const expirySec = Math.ceil(durationMs / 1000);

  if (redis && useRedis) {
    try {
      await redis.set(
        key,
        JSON.stringify({ reason, bannedAt: Date.now() }),
        "EX",
        expirySec
      );
      return;
    } catch (error) {
      console.error("Redis ban error:", error);
    }
  }

  // Memory fallback
  memoryStore.set(key, {
    count: -1, // Special marker for ban
    resetAt: Date.now() + durationMs,
  });
}

/**
 * Unban an IP address
 */
export async function unbanIP(ip: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${BAN_KEY_PREFIX}${ip}`;

  if (redis && useRedis) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.error("Redis unban error:", error);
    }
  }

  memoryStore.delete(key);
}

/**
 * Check if IP is banned
 */
export async function isIPBanned(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${BAN_KEY_PREFIX}${ip}`;

  if (redis && useRedis) {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Redis ban check error:", error);
    }
  }

  // Memory fallback
  const entry = memoryStore.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    memoryStore.delete(key);
    return false;
  }
  return entry.count === -1;
}

/**
 * Check if request should be blocked
 */
export async function shouldBlockRequest(request: NextRequest): Promise<boolean> {
  const ip = getClientIdentifier(request);
  return isIPBanned(ip);
}

// ============ Cleanup (for memory store) ============

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic cleanup of expired entries
 */
export function startCleanup(intervalMs: number = 60 * 1000): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, intervalMs);
}

/**
 * Stop cleanup interval
 */
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Auto-start cleanup
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  startCleanup();
}
