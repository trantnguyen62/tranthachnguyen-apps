/**
 * Redis-based server-side cache helper.
 *
 * Provides a simple cached() wrapper for expensive queries.
 * Falls back gracefully to direct fetching if Redis is unavailable.
 */

import { getRedisClient, KEY_PREFIX } from "@/lib/storage/redis-client";

/**
 * Fetch data with Redis caching.
 *
 * @param key - Cache key (will be prefixed with "cache:")
 * @param ttlSeconds - Time-to-live in seconds
 * @param fetcher - Function that fetches the data on cache miss
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const redis = getRedisClient();
    const cacheKey = KEY_PREFIX.CACHE + key;

    // Try cache first
    const cachedValue = await redis.get(cacheKey);
    if (cachedValue) {
      return JSON.parse(cachedValue) as T;
    }

    // Cache miss -- fetch and store
    const data = await fetcher();
    await redis.set(cacheKey, JSON.stringify(data), "EX", ttlSeconds);
    return data;
  } catch {
    // Redis unavailable -- fall back to direct fetch
    return fetcher();
  }
}

/**
 * Invalidate cache entries matching a pattern.
 *
 * @param pattern - Glob pattern (e.g., "user:123:*")
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(KEY_PREFIX.CACHE + pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable -- ignore
  }
}

/**
 * Invalidate a single cache key.
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(KEY_PREFIX.CACHE + key);
  } catch {
    // Redis unavailable -- ignore
  }
}
