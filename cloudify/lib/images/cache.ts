/**
 * Image Cache Management
 *
 * Handles caching of optimized images in Redis and MinIO
 */

import { createHash } from "crypto";
import { createLogger } from "@/lib/logging";

const logger = createLogger("image-cache");

// Cache TTLs
export const CACHE_TTL = {
  memory: 5 * 60, // 5 minutes in-memory
  redis: 24 * 60 * 60, // 24 hours in Redis
  cdn: 31536000, // 1 year for CDN (Cache-Control max-age)
};

// In-memory LRU cache for hot images
const memoryCache = new Map<string, { data: Buffer; timestamp: number }>();
const MAX_MEMORY_CACHE_SIZE = 100; // Max 100 images in memory
const MAX_MEMORY_CACHE_BYTES = 100 * 1024 * 1024; // 100MB max

let currentMemoryCacheBytes = 0;

/**
 * Generate a cache key for an optimized image
 */
export function generateImageCacheKey(
  source: string,
  width?: number,
  height?: number,
  quality?: number,
  format?: string
): string {
  const params = [
    source,
    width ? `w${width}` : "",
    height ? `h${height}` : "",
    quality ? `q${quality}` : "",
    format || "auto",
  ]
    .filter(Boolean)
    .join("-");

  return `img:${createHash("sha256").update(params).digest("hex").substring(0, 24)}`;
}

/**
 * Get image from memory cache
 */
export function getFromMemoryCache(key: string): Buffer | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL.memory * 1000) {
    currentMemoryCacheBytes -= entry.data.length;
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store image in memory cache
 */
export function setInMemoryCache(key: string, data: Buffer): void {
  // Don't cache images larger than 5MB
  if (data.length > 5 * 1024 * 1024) {
    return;
  }

  // Evict old entries if we're over the limit
  while (
    (memoryCache.size >= MAX_MEMORY_CACHE_SIZE ||
      currentMemoryCacheBytes + data.length > MAX_MEMORY_CACHE_BYTES) &&
    memoryCache.size > 0
  ) {
    // Remove oldest entry
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      const entry = memoryCache.get(oldestKey);
      if (entry) {
        currentMemoryCacheBytes -= entry.data.length;
      }
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, { data, timestamp: Date.now() });
  currentMemoryCacheBytes += data.length;

  logger.debug("Cached image in memory", {
    key,
    size: data.length,
    totalCached: memoryCache.size,
    totalBytes: currentMemoryCacheBytes,
  });
}

/**
 * Clear the memory cache
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
  currentMemoryCacheBytes = 0;
  logger.info("Memory cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memoryEntries: number;
  memoryBytes: number;
  maxMemoryBytes: number;
} {
  return {
    memoryEntries: memoryCache.size,
    memoryBytes: currentMemoryCacheBytes,
    maxMemoryBytes: MAX_MEMORY_CACHE_BYTES,
  };
}

/**
 * Generate CDN-friendly cache control headers
 */
export function getCacheControlHeaders(options: {
  public?: boolean;
  maxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  immutable?: boolean;
}): Record<string, string> {
  const {
    public: isPublic = true,
    maxAge = CACHE_TTL.cdn,
    staleWhileRevalidate = 60,
    staleIfError = 86400,
    immutable = true,
  } = options;

  const directives: string[] = [];

  directives.push(isPublic ? "public" : "private");
  directives.push(`max-age=${maxAge}`);

  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (staleIfError > 0) {
    directives.push(`stale-if-error=${staleIfError}`);
  }

  if (immutable) {
    directives.push("immutable");
  }

  return {
    "Cache-Control": directives.join(", "),
    Vary: "Accept",
  };
}

/**
 * Generate ETag for an image
 */
export function generateETag(buffer: Buffer): string {
  const hash = createHash("md5").update(buffer).digest("hex");
  return `"${hash}"`;
}

/**
 * Check if the request can be served with 304 Not Modified
 */
export function shouldReturn304(
  requestHeaders: Headers,
  etag: string,
  lastModified?: Date
): boolean {
  // Check If-None-Match header
  const ifNoneMatch = requestHeaders.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return true;
  }

  // Check If-Modified-Since header
  const ifModifiedSince = requestHeaders.get("if-modified-since");
  if (ifModifiedSince && lastModified) {
    const sinceDate = new Date(ifModifiedSince);
    if (lastModified <= sinceDate) {
      return true;
    }
  }

  return false;
}

/**
 * Purge cached images for a project
 * Used when deployments change
 */
export async function purgeProjectCache(projectId: string): Promise<number> {
  let purgedCount = 0;

  // Purge memory cache entries for this project
  for (const key of memoryCache.keys()) {
    if (key.includes(projectId)) {
      const entry = memoryCache.get(key);
      if (entry) {
        currentMemoryCacheBytes -= entry.data.length;
      }
      memoryCache.delete(key);
      purgedCount++;
    }
  }

  logger.info("Purged project image cache", { projectId, purgedCount });
  return purgedCount;
}
