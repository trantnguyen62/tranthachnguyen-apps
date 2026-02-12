/**
 * Rate Limiting
 * Token bucket algorithm with sliding window for API rate limiting
 */

import { NextRequest, NextResponse } from "next/server";

// Rate limit configuration by endpoint pattern
export interface RateLimitConfig {
  // Maximum requests per window
  limit: number;
  // Window size in milliseconds
  window: number;
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
    window: 60 * 1000, // 1 minute
    authenticatedLimit: 120,
  },
  // Authentication endpoints (very restrictive to prevent brute force)
  auth: {
    limit: 10,
    window: 60 * 1000,
  },
  // Write operations (deployments, projects)
  write: {
    limit: 30,
    window: 60 * 1000,
    authenticatedLimit: 100,
  },
  // Read operations (more lenient)
  read: {
    limit: 120,
    window: 60 * 1000,
    authenticatedLimit: 300,
  },
  // Analytics ingestion (very high volume)
  analytics: {
    limit: 500,
    window: 60 * 1000,
  },
  // Webhooks (allow bursts)
  webhook: {
    limit: 100,
    window: 60 * 1000,
  },
};

// In-memory store for rate limiting (use Redis in production for distributed systems)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

const MAX_STORE_SIZE = 10000;

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  // Evict oldest entries if store exceeds maximum size
  if (store.size > MAX_STORE_SIZE) {
    const entries = Array.from(store.entries())
      .sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toRemove = entries.slice(0, store.size - MAX_STORE_SIZE);
    for (const [key] of toRemove) {
      store.delete(key);
    }
  }
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

  // Fallback to a default
  return "unknown";
}

/**
 * Check rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpiredEntries();

  const now = Date.now();

  // Handle invalid limits (0 or negative) - block all requests
  if (config.limit <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + config.window,
    };
  }

  const entry = store.get(key);

  // No existing entry or expired
  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.window,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.window,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function rateLimit(
  config: RateLimitConfig = RATE_LIMIT_PRESETS.public
): (
  request: NextRequest,
  isAuthenticated?: boolean
) => NextResponse | null {
  return (request: NextRequest, isAuthenticated = false): NextResponse | null => {
    // Get rate limit key
    const keyGenerator = config.keyGenerator || getClientIdentifier;
    const clientKey = keyGenerator(request);
    const key = `ratelimit:${request.nextUrl.pathname}:${clientKey}`;

    // Use higher limit for authenticated users if configured
    const limit =
      isAuthenticated && config.authenticatedLimit
        ? config.authenticatedLimit
        : config.limit;

    const effectiveConfig = { ...config, limit };
    const result = checkRateLimit(key, effectiveConfig);

    // If rate limited, return 429 response
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

    // Return null to indicate request is allowed
    // The headers should be added to the actual response
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
  const entry = store.get(key);
  if (!entry) return response;

  response.headers.set("X-RateLimit-Limit", String(config.limit));
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, config.limit - entry.count)));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

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
 * Sliding window rate limiter (more accurate but uses more memory)
 */
export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Auto-cleanup every 60 seconds to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    // Allow Node to exit without waiting for this timer
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  check(key: string): { allowed: boolean; remaining: number } {
    // Handle invalid limits (0 or negative) - block all requests
    if (this.config.limit <= 0) {
      return { allowed: false, remaining: 0 };
    }

    const now = Date.now();
    const windowStart = now - this.config.window;

    // Get or create window
    let timestamps = this.windows.get(key) || [];

    // Remove expired timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check limit
    if (timestamps.length >= this.config.limit) {
      this.windows.set(key, timestamps);
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    timestamps.push(now);
    this.windows.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.config.limit - timestamps.length,
    };
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.window;

    for (const [key, timestamps] of this.windows) {
      const filtered = timestamps.filter((ts) => ts > windowStart);
      if (filtered.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filtered);
      }
    }
  }
}

/**
 * IP-based ban list for malicious actors
 */
const banList = new Set<string>();
const banExpiry = new Map<string, number>();

export function banIP(ip: string, durationMs: number = 24 * 60 * 60 * 1000): void {
  // Don't ban if duration is 0 or negative
  if (durationMs <= 0) {
    return;
  }
  banList.add(ip);
  banExpiry.set(ip, Date.now() + durationMs);
}

export function unbanIP(ip: string): void {
  banList.delete(ip);
  banExpiry.delete(ip);
}

export function isIPBanned(ip: string): boolean {
  if (!banList.has(ip)) return false;

  const expiry = banExpiry.get(ip);
  if (expiry && expiry <= Date.now()) {
    banList.delete(ip);
    banExpiry.delete(ip);
    return false;
  }

  return true;
}

/**
 * Check if request should be blocked
 */
export function shouldBlockRequest(request: NextRequest): boolean {
  const ip = getClientIdentifier(request);
  return isIPBanned(ip);
}
