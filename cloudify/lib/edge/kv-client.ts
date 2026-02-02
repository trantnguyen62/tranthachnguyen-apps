/**
 * Edge KV Client
 * Redis-backed key-value store for edge functions
 */

import { prisma } from "@/lib/prisma";
import Redis from "ioredis";

// Redis client for caching
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  return redisClient;
}

export interface EdgeKVOptions {
  projectId: string;
  kvName: string;
}

export interface KVGetOptions {
  type?: "text" | "json" | "arrayBuffer";
  cacheTtl?: number;
}

export interface KVPutOptions {
  expirationTtl?: number;
  expiration?: number;
  metadata?: Record<string, unknown>;
}

export interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface KVListResult {
  keys: Array<{
    name: string;
    expiration?: number;
    metadata?: Record<string, unknown>;
  }>;
  cursor?: string;
  complete: boolean;
}

/**
 * Edge KV Store class - similar to Cloudflare KV API
 */
export class EdgeKVStore {
  private projectId: string;
  private kvName: string;
  private kvId: string | null = null;

  constructor(options: EdgeKVOptions) {
    this.projectId = options.projectId;
    this.kvName = options.kvName;
  }

  /**
   * Initialize the KV store
   */
  private async init(): Promise<string> {
    if (this.kvId) return this.kvId;

    const kv = await prisma.edgeKV.findFirst({
      where: {
        projectId: this.projectId,
        slug: this.kvName,
      },
    });

    if (!kv) {
      throw new Error(`KV namespace "${this.kvName}" not found`);
    }

    this.kvId = kv.id;
    return kv.id;
  }

  /**
   * Get a value from the KV store
   */
  async get(key: string, options?: KVGetOptions): Promise<string | null>;
  async get(key: string, options: { type: "json" }): Promise<any | null>;
  async get(key: string, options?: KVGetOptions): Promise<any | null> {
    const kvId = await this.init();
    const redis = getRedisClient();

    // Try Redis cache first
    const cacheKey = `edge-kv:${kvId}:${key}`;
    if (redis && options?.cacheTtl) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
          return options?.type === "json" ? JSON.parse(cached) : cached;
        }
      } catch (e) {
        // Cache miss, continue to DB
      }
    }

    // Get from database
    const entry = await prisma.edgeKVEntry.findUnique({
      where: {
        kvId_key: {
          kvId,
          key,
        },
      },
    });

    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      // Expired, delete and return null
      await prisma.edgeKVEntry.delete({
        where: { id: entry.id },
      });
      return null;
    }

    // Cache in Redis if requested
    if (redis && options?.cacheTtl) {
      await redis.setex(cacheKey, options.cacheTtl, entry.value);
    }

    return options?.type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  /**
   * Get value with metadata
   */
  async getWithMetadata(
    key: string,
    options?: KVGetOptions
  ): Promise<{ value: any | null; metadata: Record<string, unknown> | null }> {
    const kvId = await this.init();

    const entry = await prisma.edgeKVEntry.findUnique({
      where: {
        kvId_key: {
          kvId,
          key,
        },
      },
    });

    if (!entry) return { value: null, metadata: null };

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await prisma.edgeKVEntry.delete({
        where: { id: entry.id },
      });
      return { value: null, metadata: null };
    }

    const value = options?.type === "json" ? JSON.parse(entry.value) : entry.value;
    const metadata = entry.metadata as Record<string, unknown> | null;

    return { value, metadata };
  }

  /**
   * Put a value in the KV store
   */
  async put(
    key: string,
    value: string | ArrayBuffer | ReadableStream | Record<string, unknown>,
    options?: KVPutOptions
  ): Promise<void> {
    const kvId = await this.init();
    const redis = getRedisClient();

    // Serialize value
    const serialized = typeof value === "string"
      ? value
      : JSON.stringify(value);

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (options?.expirationTtl) {
      expiresAt = new Date(Date.now() + options.expirationTtl * 1000);
    } else if (options?.expiration) {
      expiresAt = new Date(options.expiration * 1000);
    }

    // Upsert in database
    await prisma.edgeKVEntry.upsert({
      where: {
        kvId_key: {
          kvId,
          key,
        },
      },
      create: {
        kvId,
        key,
        value: serialized,
        expiresAt,
        metadata: (options?.metadata || undefined) as object | undefined,
      },
      update: {
        value: serialized,
        expiresAt,
        metadata: (options?.metadata || undefined) as object | undefined,
        version: { increment: 1 },
      },
    });

    // Invalidate Redis cache
    if (redis) {
      const cacheKey = `edge-kv:${kvId}:${key}`;
      await redis.del(cacheKey);
    }
  }

  /**
   * Delete a key from the KV store
   */
  async delete(key: string): Promise<void> {
    const kvId = await this.init();
    const redis = getRedisClient();

    await prisma.edgeKVEntry.deleteMany({
      where: {
        kvId,
        key,
      },
    });

    // Invalidate Redis cache
    if (redis) {
      const cacheKey = `edge-kv:${kvId}:${key}`;
      await redis.del(cacheKey);
    }
  }

  /**
   * List keys in the KV store
   */
  async list(options?: KVListOptions): Promise<KVListResult> {
    const kvId = await this.init();

    const limit = options?.limit || 1000;
    const cursor = options?.cursor ? parseInt(options.cursor) : 0;

    const where: any = {
      kvId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (options?.prefix) {
      where.key = { startsWith: options.prefix };
    }

    const entries = await prisma.edgeKVEntry.findMany({
      where,
      select: {
        key: true,
        expiresAt: true,
        metadata: true,
      },
      orderBy: { key: "asc" },
      skip: cursor,
      take: limit + 1, // Fetch one extra to check if there are more
    });

    const hasMore = entries.length > limit;
    const results = hasMore ? entries.slice(0, limit) : entries;

    return {
      keys: results.map((entry) => ({
        name: entry.key,
        expiration: entry.expiresAt ? Math.floor(entry.expiresAt.getTime() / 1000) : undefined,
        metadata: entry.metadata as Record<string, unknown> | undefined,
      })),
      cursor: hasMore ? String(cursor + limit) : undefined,
      complete: !hasMore,
    };
  }
}

/**
 * Create a KV namespace binding for an edge function
 */
export function createKVNamespace(projectId: string, kvName: string): EdgeKVStore {
  return new EdgeKVStore({ projectId, kvName });
}

/**
 * Create an Edge KV store
 */
export async function createEdgeKV(
  projectId: string,
  name: string
): Promise<{ id: string; slug: string }> {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const kv = await prisma.edgeKV.create({
    data: {
      projectId,
      name,
      slug,
    },
  });

  return { id: kv.id, slug: kv.slug };
}

/**
 * Delete an Edge KV store
 */
export async function deleteEdgeKV(kvId: string): Promise<void> {
  await prisma.edgeKVEntry.deleteMany({
    where: { kvId },
  });

  await prisma.edgeKV.delete({
    where: { id: kvId },
  });
}

/**
 * Get KV stats
 */
export async function getKVStats(kvId: string): Promise<{
  keyCount: number;
  totalSize: number;
}> {
  const entries = await prisma.edgeKVEntry.findMany({
    where: {
      kvId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      value: true,
    },
  });

  return {
    keyCount: entries.length,
    totalSize: entries.reduce((sum, e) => sum + e.value.length, 0),
  };
}
