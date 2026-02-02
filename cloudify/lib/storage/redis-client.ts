/**
 * Redis Client - Singleton Redis connection for KV store and caching
 */

import Redis from "ioredis";

// Configuration from environment
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || "0", 10);

// Key prefixes for namespacing
export const KEY_PREFIX = {
  KV: "kv:",           // KV store entries: kv:{storeId}:{key}
  KV_META: "kv:meta:", // KV metadata: kv:meta:{storeId}:{key}
  CACHE: "cache:",     // General cache
  SESSION: "session:", // Session data
  RATE: "rate:",       // Rate limiting
};

// Singleton Redis client
let redisClient: Redis | null = null;
let isConnecting = false;

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = new URL(REDIS_URL);

    redisClient = new Redis({
      host: url.hostname,
      port: parseInt(url.port || "6379", 10),
      password: REDIS_PASSWORD || url.password || undefined,
      db: REDIS_DB,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error("Redis connection failed after 10 retries");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on("error", (err: Error) => {
      console.error("Redis error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });

    redisClient.on("ready", () => {
      console.log("Redis ready");
    });
  }

  return redisClient;
}

/**
 * Connect to Redis (call on app startup)
 */
export async function connectRedis(): Promise<boolean> {
  if (isConnecting) {
    return false;
  }

  isConnecting = true;

  try {
    const client = getRedisClient();
    await client.connect();
    isConnecting = false;
    return true;
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    isConnecting = false;
    return false;
  }
}

/**
 * Disconnect from Redis (call on app shutdown)
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Health check for Redis connection
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

/**
 * Build a namespaced key
 */
export function buildKey(prefix: string, ...parts: string[]): string {
  return prefix + parts.join(":");
}

/**
 * Parse a namespaced key
 */
export function parseKey(key: string): { prefix: string; parts: string[] } {
  for (const [name, prefix] of Object.entries(KEY_PREFIX)) {
    if (key.startsWith(prefix)) {
      return {
        prefix,
        parts: key.slice(prefix.length).split(":"),
      };
    }
  }
  return { prefix: "", parts: key.split(":") };
}

// ============ Common Redis Operations ============

/**
 * Get a value with automatic JSON parsing
 */
export async function get<T = string>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);

  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/**
 * Set a value with automatic JSON serialization
 */
export async function set(
  key: string,
  value: unknown,
  options?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }
): Promise<boolean> {
  const client = getRedisClient();
  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  let result: string | null;

  if (options?.ex && options?.nx) {
    result = await client.set(key, serialized, "EX", options.ex, "NX");
  } else if (options?.ex && options?.xx) {
    result = await client.set(key, serialized, "EX", options.ex, "XX");
  } else if (options?.ex) {
    result = await client.set(key, serialized, "EX", options.ex);
  } else if (options?.px && options?.nx) {
    result = await client.set(key, serialized, "PX", options.px, "NX");
  } else if (options?.px && options?.xx) {
    result = await client.set(key, serialized, "PX", options.px, "XX");
  } else if (options?.px) {
    result = await client.set(key, serialized, "PX", options.px);
  } else if (options?.nx) {
    result = await client.set(key, serialized, "NX");
  } else if (options?.xx) {
    result = await client.set(key, serialized, "XX");
  } else {
    result = await client.set(key, serialized);
  }

  return result === "OK";
}

/**
 * Delete one or more keys
 */
export async function del(...keys: string[]): Promise<number> {
  const client = getRedisClient();
  return client.del(...keys);
}

/**
 * Check if a key exists
 */
export async function exists(...keys: string[]): Promise<number> {
  const client = getRedisClient();
  return client.exists(...keys);
}

/**
 * Set expiration on a key
 */
export async function expire(key: string, seconds: number): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.expire(key, seconds);
  return result === 1;
}

/**
 * Get TTL of a key
 */
export async function ttl(key: string): Promise<number> {
  const client = getRedisClient();
  return client.ttl(key);
}

/**
 * Increment a value
 */
export async function incr(key: string): Promise<number> {
  const client = getRedisClient();
  return client.incr(key);
}

/**
 * Increment by a specific amount
 */
export async function incrBy(key: string, increment: number): Promise<number> {
  const client = getRedisClient();
  return client.incrby(key, increment);
}

/**
 * Get multiple keys
 */
export async function mget<T = string>(...keys: string[]): Promise<(T | null)[]> {
  const client = getRedisClient();
  const values = await client.mget(...keys);

  return values.map((value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  });
}

/**
 * Set multiple key-value pairs
 */
export async function mset(pairs: Record<string, unknown>): Promise<boolean> {
  const client = getRedisClient();
  const args: string[] = [];

  for (const [key, value] of Object.entries(pairs)) {
    args.push(key, typeof value === "string" ? value : JSON.stringify(value));
  }

  const result = await client.mset(...args);
  return result === "OK";
}

/**
 * Scan keys matching a pattern
 */
export async function* scanKeys(pattern: string, count: number = 100): AsyncGenerator<string> {
  const client = getRedisClient();
  let cursor = "0";

  do {
    const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", count);
    cursor = nextCursor;

    for (const key of keys) {
      yield key;
    }
  } while (cursor !== "0");
}

/**
 * Get all keys matching a pattern (use with caution on large datasets)
 */
export async function keys(pattern: string): Promise<string[]> {
  const client = getRedisClient();
  return client.keys(pattern);
}
