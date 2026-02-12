/**
 * KV Service - Key-Value store operations using Redis
 * Provides Vercel KV-like API for serverless key-value storage
 */

import { prisma } from "@/lib/prisma";
import {
  getRedisClient,
  buildKey,
  KEY_PREFIX,
} from "./redis-client";

export interface KVSetOptions {
  /** Expiration time in seconds */
  ex?: number;
  /** Expiration time in milliseconds */
  px?: number;
  /** Only set if key does not exist */
  nx?: boolean;
  /** Only set if key exists */
  xx?: boolean;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

export interface KVEntry {
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KVListResult {
  keys: string[];
  cursor: string;
  hasMore: boolean;
}

/**
 * Build a Redis key for KV store
 */
function kvKey(storeId: string, key: string): string {
  return buildKey(KEY_PREFIX.KV, storeId, key);
}

/**
 * Build a Redis key for KV metadata
 */
function kvMetaKey(storeId: string, key: string): string {
  return buildKey(KEY_PREFIX.KV_META, storeId, key);
}

/**
 * Get a value from KV store
 */
export async function kvGet(storeId: string, key: string): Promise<string | null> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);

  const value = await redis.get(redisKey);
  return value;
}

/**
 * Get a value with metadata
 */
export async function kvGetWithMetadata(
  storeId: string,
  key: string
): Promise<{ value: string | null; metadata: Record<string, unknown> | null }> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);
  const metaKey = kvMetaKey(storeId, key);

  const [value, metadata] = await Promise.all([
    redis.get(redisKey),
    redis.get(metaKey),
  ]);

  return {
    value,
    metadata: metadata ? JSON.parse(metadata) : null,
  };
}

/**
 * Set a value in KV store
 */
export async function kvSet(
  storeId: string,
  key: string,
  value: string,
  options: KVSetOptions = {}
): Promise<boolean> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);

  // Build SET options object
  let result: string | null;

  if (options.ex && options.nx) {
    result = await redis.set(redisKey, value, "EX", options.ex, "NX");
  } else if (options.ex && options.xx) {
    result = await redis.set(redisKey, value, "EX", options.ex, "XX");
  } else if (options.ex) {
    result = await redis.set(redisKey, value, "EX", options.ex);
  } else if (options.px && options.nx) {
    result = await redis.set(redisKey, value, "PX", options.px, "NX");
  } else if (options.px && options.xx) {
    result = await redis.set(redisKey, value, "PX", options.px, "XX");
  } else if (options.px) {
    result = await redis.set(redisKey, value, "PX", options.px);
  } else if (options.nx) {
    result = await redis.set(redisKey, value, "NX");
  } else if (options.xx) {
    result = await redis.set(redisKey, value, "XX");
  } else {
    result = await redis.set(redisKey, value);
  }

  // When NX or XX is used, Redis returns null on failure (key exists for NX, or
  // key doesn't exist for XX). For regular SET, null means an error.
  if (options.nx || options.xx) {
    if (result === null) {
      return false;
    }
  } else if (result !== "OK" && result !== null) {
    return false;
  }

  // Store metadata if provided
  if (options.metadata) {
    const metaKey = kvMetaKey(storeId, key);
    await redis.set(metaKey, JSON.stringify(options.metadata));

    // Set same expiry on metadata
    if (options.ex) {
      await redis.expire(metaKey, options.ex);
    } else if (options.px) {
      await redis.pexpire(metaKey, options.px);
    }
  }

  // Sync to Postgres for persistence
  await syncToPostgres(storeId, key, value, options);

  return true;
}

/**
 * Delete a key from KV store
 */
export async function kvDelete(storeId: string, key: string): Promise<boolean> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);
  const metaKey = kvMetaKey(storeId, key);

  const deleted = await redis.del(redisKey, metaKey);

  // Remove from Postgres
  try {
    await prisma.kVEntry.deleteMany({
      where: { storeId, key },
    });
  } catch {
    // Ignore if not found
  }

  return deleted > 0;
}

/**
 * Delete multiple keys from KV store using Redis pipeline for efficiency.
 * Used when clearing an entire store to avoid sequential deletions.
 */
export async function kvDeleteMany(storeId: string, keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  for (const key of keys) {
    pipeline.del(kvKey(storeId, key));
    pipeline.del(kvMetaKey(storeId, key));
  }

  const results = await pipeline.exec();

  // Batch delete from Postgres
  await prisma.kVEntry.deleteMany({
    where: {
      storeId,
      key: { in: keys },
    },
  });

  return results ? results.filter(([err, result]) => !err && result).length : 0;
}

/**
 * Check if a key exists
 */
export async function kvExists(storeId: string, key: string): Promise<boolean> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);

  const exists = await redis.exists(redisKey);
  return exists === 1;
}

/**
 * List keys in a store
 */
export async function kvList(
  storeId: string,
  options: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<KVListResult> {
  const redis = getRedisClient();
  const { prefix = "", cursor = "0", limit = 100 } = options;

  const pattern = kvKey(storeId, prefix + "*");
  const prefixLength = KEY_PREFIX.KV.length + storeId.length + 1;

  const [nextCursor, rawKeys] = await redis.scan(
    cursor,
    "MATCH",
    pattern,
    "COUNT",
    limit
  );

  // Strip the prefix from keys
  const keys = rawKeys.map((k: string) => k.slice(prefixLength));

  return {
    keys,
    cursor: nextCursor,
    hasMore: nextCursor !== "0",
  };
}

/**
 * Get multiple keys at once
 */
export async function kvMget(
  storeId: string,
  keys: string[]
): Promise<Map<string, string | null>> {
  const redis = getRedisClient();
  const redisKeys = keys.map((k) => kvKey(storeId, k));

  const values = await redis.mget(...redisKeys);

  const result = new Map<string, string | null>();
  keys.forEach((key, i) => {
    result.set(key, values[i]);
  });

  return result;
}

/**
 * Set multiple keys at once
 */
export async function kvMset(
  storeId: string,
  entries: Array<{ key: string; value: string; options?: KVSetOptions }>
): Promise<boolean> {
  const redis = getRedisClient();

  // Use pipeline for atomic operation
  const pipeline = redis.pipeline();

  for (const entry of entries) {
    const redisKey = kvKey(storeId, entry.key);

    if (entry.options?.ex) {
      pipeline.set(redisKey, entry.value, "EX", entry.options.ex);
    } else {
      pipeline.set(redisKey, entry.value);
    }

    if (entry.options?.metadata) {
      const metaKey = kvMetaKey(storeId, entry.key);
      pipeline.set(metaKey, JSON.stringify(entry.options.metadata));
      if (entry.options?.ex) {
        pipeline.expire(metaKey, entry.options.ex);
      }
    }
  }

  const results = await pipeline.exec();

  // Sync to Postgres
  for (const entry of entries) {
    await syncToPostgres(storeId, entry.key, entry.value, entry.options || {});
  }

  return results?.every(([err]: [Error | null, unknown]) => !err) ?? false;
}

/**
 * Increment a numeric value
 */
export async function kvIncr(
  storeId: string,
  key: string,
  delta: number = 1
): Promise<number> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);

  let newValue: number;
  if (delta === 1) {
    newValue = await redis.incr(redisKey);
  } else {
    newValue = await redis.incrby(redisKey, delta);
  }

  // Sync to Postgres
  await syncToPostgres(storeId, key, String(newValue), {});

  return newValue;
}

/**
 * Get TTL of a key in seconds
 */
export async function kvTtl(storeId: string, key: string): Promise<number> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);

  return redis.ttl(redisKey);
}

/**
 * Set expiration on an existing key
 */
export async function kvExpire(
  storeId: string,
  key: string,
  seconds: number
): Promise<boolean> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);
  const metaKey = kvMetaKey(storeId, key);

  const result = await redis.expire(redisKey, seconds);
  await redis.expire(metaKey, seconds);

  // Update Postgres
  try {
    await prisma.kVEntry.updateMany({
      where: { storeId, key },
      data: {
        expiresAt: new Date(Date.now() + seconds * 1000),
      },
    });
  } catch {
    // Ignore
  }

  return result === 1;
}

/**
 * Remove expiration from a key (make it persistent)
 */
export async function kvPersist(storeId: string, key: string): Promise<boolean> {
  const redis = getRedisClient();
  const redisKey = kvKey(storeId, key);
  const metaKey = kvMetaKey(storeId, key);

  const result = await redis.persist(redisKey);
  await redis.persist(metaKey);

  // Update Postgres
  try {
    await prisma.kVEntry.updateMany({
      where: { storeId, key },
      data: { expiresAt: null },
    });
  } catch {
    // Ignore
  }

  return result === 1;
}

// ============ Sync with Postgres for durability ============

/**
 * Sync a KV entry to Postgres
 */
async function syncToPostgres(
  storeId: string,
  key: string,
  value: string,
  options: KVSetOptions
): Promise<void> {
  try {
    const expiresAt = options.ex
      ? new Date(Date.now() + options.ex * 1000)
      : options.px
      ? new Date(Date.now() + options.px)
      : null;

    await prisma.kVEntry.upsert({
      where: {
        storeId_key: { storeId, key },
      },
      create: {
        storeId,
        key,
        value,
        expiresAt,
        metadata: (options.metadata || {}) as Record<string, string>,
      },
      update: {
        value,
        expiresAt,
        metadata: (options.metadata || {}) as Record<string, string>,
      },
    });
  } catch (error) {
    console.error("Failed to sync KV to Postgres:", error);
    // Don't throw - Redis is the source of truth
  }
}

/**
 * Restore Redis from Postgres (cold start recovery)
 */
export async function restoreFromPostgres(storeId: string): Promise<number> {
  const redis = getRedisClient();
  let restored = 0;

  try {
    const entries = await prisma.kVEntry.findMany({
      where: {
        storeId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    const pipeline = redis.pipeline();

    for (const entry of entries) {
      const redisKey = kvKey(storeId, entry.key);

      if (entry.expiresAt) {
        const ttl = Math.max(
          1,
          Math.floor((entry.expiresAt.getTime() - Date.now()) / 1000)
        );
        pipeline.set(redisKey, entry.value, "EX", ttl);
      } else {
        pipeline.set(redisKey, entry.value);
      }

      if (entry.metadata && Object.keys(entry.metadata as object).length > 0) {
        const metaKey = kvMetaKey(storeId, entry.key);
        pipeline.set(metaKey, JSON.stringify(entry.metadata));
      }

      restored++;
    }

    await pipeline.exec();
    console.log(`Restored ${restored} entries for store ${storeId}`);
  } catch (error) {
    console.error("Failed to restore from Postgres:", error);
  }

  return restored;
}

/**
 * Clean up expired entries from Postgres
 */
export async function cleanExpiredEntries(): Promise<number> {
  try {
    const result = await prisma.kVEntry.deleteMany({
      where: {
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error("Failed to clean expired entries:", error);
    return 0;
  }
}
