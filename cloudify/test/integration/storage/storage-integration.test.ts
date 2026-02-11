/**
 * Storage Integration Tests
 * Tests blob storage and KV store against real MinIO and Redis services
 * Skips gracefully if services are not available
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

// Track if services are available
let minioAvailable = false;
let redisAvailable = false;

// Test data
const TEST_STORE_ID = `test-store-${Date.now()}`;
const TEST_PATHNAME = "test/integration/file.txt";
const TEST_CONTENT = "Integration test content: Hello, World!";

// Helper to skip tests if service not available
function itWithMinio(name: string, fn: () => Promise<void>) {
  it(name, async () => {
    if (!minioAvailable) {
      console.log(`Skipping: ${name} (MinIO not available)`);
      return;
    }
    await fn();
  });
}

function itWithRedis(name: string, fn: () => Promise<void>) {
  it(name, async () => {
    if (!redisAvailable) {
      console.log(`Skipping: ${name} (Redis not available)`);
      return;
    }
    await fn();
  });
}

describe("Storage Integration Tests", () => {
  beforeAll(async () => {
    // Check MinIO availability
    try {
      const { healthCheck } = await import("@/lib/build/artifact-manager");
      minioAvailable = await healthCheck();
      console.log(`MinIO available: ${minioAvailable}`);
    } catch (error) {
      console.log("MinIO not available:", error);
      minioAvailable = false;
    }

    // Check Redis availability
    try {
      const { redisHealthCheck } = await import("@/lib/storage/redis-client");
      redisAvailable = await redisHealthCheck();
      console.log(`Redis available: ${redisAvailable}`);
    } catch (error) {
      console.log("Redis not available:", error);
      redisAvailable = false;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (minioAvailable) {
      try {
        const { deleteStore } = await import("@/lib/storage/blob-service");
        await deleteStore(TEST_STORE_ID);
      } catch {
        // Ignore cleanup errors
      }
    }

    if (redisAvailable) {
      try {
        const { getRedisClient } = await import("@/lib/storage/redis-client");
        const redis = getRedisClient();
        const keys = await redis.keys(`kv:${TEST_STORE_ID}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("Blob Storage Integration", () => {
    itWithMinio("uploads and downloads blob correctly", async () => {
      const { uploadBlob, downloadBlobAsBuffer } = await import(
        "@/lib/storage/blob-service"
      );

      // Upload
      const result = await uploadBlob(TEST_STORE_ID, TEST_PATHNAME, TEST_CONTENT, {
        contentType: "text/plain",
      });

      expect(result.pathname).toBe(TEST_PATHNAME);
      expect(result.size).toBe(TEST_CONTENT.length);
      expect(result.contentType).toBe("text/plain");

      // Download
      const downloaded = await downloadBlobAsBuffer(TEST_STORE_ID, TEST_PATHNAME);
      expect(downloaded?.toString()).toBe(TEST_CONTENT);
    });

    itWithMinio("handles large file upload (1MB)", async () => {
      const { uploadBlob, getStorageUsed } = await import(
        "@/lib/storage/blob-service"
      );

      const largeContent = "x".repeat(1024 * 1024); // 1MB
      const pathname = "test/large-file.bin";

      const result = await uploadBlob(TEST_STORE_ID, pathname, largeContent);

      expect(result.size).toBe(1024 * 1024);

      // Verify storage calculation
      const used = await getStorageUsed(TEST_STORE_ID);
      expect(used).toBeGreaterThanOrEqual(1024 * 1024);
    });

    itWithMinio("lists blobs with pagination", async () => {
      const { uploadBlob, listBlobs } = await import("@/lib/storage/blob-service");

      // Upload multiple files
      for (let i = 0; i < 5; i++) {
        await uploadBlob(TEST_STORE_ID, `list-test/file${i}.txt`, `content ${i}`);
      }

      // List with limit
      const result = await listBlobs(TEST_STORE_ID, { prefix: "list-test/", limit: 3 });

      expect(result.blobs.length).toBeLessThanOrEqual(3);
    });

    itWithMinio("generates presigned URLs", async () => {
      const { uploadBlob, getUploadUrl, getDownloadUrl } = await import(
        "@/lib/storage/blob-service"
      );

      await uploadBlob(TEST_STORE_ID, "presigned-test.txt", "test");

      const uploadUrl = await getUploadUrl(TEST_STORE_ID, "new-file.txt");
      expect(uploadUrl.url).toContain("X-Amz-Signature");
      expect(uploadUrl.expiresAt).toBeInstanceOf(Date);

      const downloadUrl = await getDownloadUrl(TEST_STORE_ID, "presigned-test.txt");
      expect(downloadUrl?.url).toContain("X-Amz-Signature");
    });

    itWithMinio("copies blob between paths", async () => {
      const { uploadBlob, copyBlob, getBlobInfo } = await import(
        "@/lib/storage/blob-service"
      );

      await uploadBlob(TEST_STORE_ID, "copy-source.txt", "copy me");

      const copied = await copyBlob(
        TEST_STORE_ID,
        "copy-source.txt",
        TEST_STORE_ID,
        "copy-dest.txt"
      );

      expect(copied).not.toBeNull();
      expect(copied?.pathname).toBe("copy-dest.txt");

      const destInfo = await getBlobInfo(TEST_STORE_ID, "copy-dest.txt");
      expect(destInfo).not.toBeNull();
    });

    itWithMinio("deletes blob correctly", async () => {
      const { uploadBlob, deleteBlob, getBlobInfo } = await import(
        "@/lib/storage/blob-service"
      );

      await uploadBlob(TEST_STORE_ID, "delete-me.txt", "temporary");

      const deleted = await deleteBlob(TEST_STORE_ID, "delete-me.txt");
      expect(deleted).toBe(true);

      const info = await getBlobInfo(TEST_STORE_ID, "delete-me.txt");
      expect(info).toBeNull();
    });

    itWithMinio("returns null for non-existent blob", async () => {
      const { downloadBlob, getBlobInfo } = await import(
        "@/lib/storage/blob-service"
      );

      const download = await downloadBlob(TEST_STORE_ID, "does-not-exist.txt");
      expect(download).toBeNull();

      const info = await getBlobInfo(TEST_STORE_ID, "does-not-exist.txt");
      expect(info).toBeNull();
    });
  });

  describe("KV Store Integration", () => {
    itWithRedis("sets and gets value correctly", async () => {
      const { kvSet, kvGet } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "test-key", "test-value");
      const value = await kvGet(TEST_STORE_ID, "test-key");

      expect(value).toBe("test-value");
    });

    itWithRedis("handles TTL correctly", async () => {
      const { kvSet, kvGet, kvTtl } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "ttl-key", "expires-soon", { ex: 10 });

      const ttl = await kvTtl(TEST_STORE_ID, "ttl-key");
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);

      const value = await kvGet(TEST_STORE_ID, "ttl-key");
      expect(value).toBe("expires-soon");
    });

    itWithRedis("NX option prevents overwrite", async () => {
      const { kvSet, kvGet } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "nx-key", "original");
      const result = await kvSet(TEST_STORE_ID, "nx-key", "new-value", { nx: true });

      expect(result).toBe(false);
      const value = await kvGet(TEST_STORE_ID, "nx-key");
      expect(value).toBe("original");
    });

    itWithRedis("XX option requires existing key", async () => {
      const { kvSet, kvGet } = await import("@/lib/storage/kv-service");

      const result = await kvSet(TEST_STORE_ID, "xx-nonexistent", "value", { xx: true });
      expect(result).toBe(false);

      const value = await kvGet(TEST_STORE_ID, "xx-nonexistent");
      expect(value).toBeNull();
    });

    itWithRedis("increments value atomically", async () => {
      const { kvSet, kvIncr, kvGet } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "counter", "0");

      const result1 = await kvIncr(TEST_STORE_ID, "counter");
      expect(result1).toBe(1);

      const result2 = await kvIncr(TEST_STORE_ID, "counter", 5);
      expect(result2).toBe(6);

      const value = await kvGet(TEST_STORE_ID, "counter");
      expect(value).toBe("6");
    });

    itWithRedis("handles batch operations with mget/mset", async () => {
      const { kvMset, kvMget } = await import("@/lib/storage/kv-service");

      await kvMset(TEST_STORE_ID, [
        { key: "batch1", value: "value1" },
        { key: "batch2", value: "value2" },
        { key: "batch3", value: "value3" },
      ]);

      const values = await kvMget(TEST_STORE_ID, ["batch1", "batch2", "batch3", "missing"]);

      expect(values.get("batch1")).toBe("value1");
      expect(values.get("batch2")).toBe("value2");
      expect(values.get("batch3")).toBe("value3");
      expect(values.get("missing")).toBeNull();
    });

    itWithRedis("deletes key correctly", async () => {
      const { kvSet, kvDelete, kvExists } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "delete-key", "value");
      expect(await kvExists(TEST_STORE_ID, "delete-key")).toBe(true);

      await kvDelete(TEST_STORE_ID, "delete-key");
      expect(await kvExists(TEST_STORE_ID, "delete-key")).toBe(false);
    });

    itWithRedis("lists keys with prefix", async () => {
      const { kvSet, kvList } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "list:a", "1");
      await kvSet(TEST_STORE_ID, "list:b", "2");
      await kvSet(TEST_STORE_ID, "other:c", "3");

      const result = await kvList(TEST_STORE_ID, { prefix: "list:" });

      // Keys should contain list:a and list:b
      expect(result.keys.some(k => k.includes("list:"))).toBe(true);
    });

    itWithRedis("handles metadata correctly", async () => {
      const { kvSet, kvGetWithMetadata } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "meta-key", "value", {
        metadata: { author: "test", version: 1 },
      });

      const result = await kvGetWithMetadata(TEST_STORE_ID, "meta-key");

      expect(result.value).toBe("value");
      expect(result.metadata).toEqual({ author: "test", version: 1 });
    });

    itWithRedis("expire and persist work correctly", async () => {
      const { kvSet, kvExpire, kvPersist, kvTtl } = await import(
        "@/lib/storage/kv-service"
      );

      await kvSet(TEST_STORE_ID, "expire-key", "value");

      // Set expiration
      await kvExpire(TEST_STORE_ID, "expire-key", 100);
      let ttl = await kvTtl(TEST_STORE_ID, "expire-key");
      expect(ttl).toBeGreaterThan(0);

      // Remove expiration
      await kvPersist(TEST_STORE_ID, "expire-key");
      ttl = await kvTtl(TEST_STORE_ID, "expire-key");
      expect(ttl).toBe(-1); // -1 means no expiry
    });
  });

  describe("Concurrent Operations", () => {
    itWithRedis("handles concurrent increments correctly", async () => {
      const { kvSet, kvIncr, kvGet } = await import("@/lib/storage/kv-service");

      await kvSet(TEST_STORE_ID, "concurrent-counter", "0");

      // Run 10 concurrent increments
      const promises = Array(10)
        .fill(null)
        .map(() => kvIncr(TEST_STORE_ID, "concurrent-counter"));

      await Promise.all(promises);

      const value = await kvGet(TEST_STORE_ID, "concurrent-counter");
      expect(parseInt(value || "0")).toBe(10);
    });

    itWithMinio("handles concurrent uploads", async () => {
      const { uploadBlob, listBlobs } = await import("@/lib/storage/blob-service");

      // Upload 5 files concurrently
      const uploads = Array(5)
        .fill(null)
        .map((_, i) =>
          uploadBlob(TEST_STORE_ID, `concurrent/file${i}.txt`, `content ${i}`)
        );

      await Promise.all(uploads);

      const result = await listBlobs(TEST_STORE_ID, { prefix: "concurrent/" });
      expect(result.blobs.length).toBe(5);
    });

    itWithRedis("NX flag prevents race condition duplicates", async () => {
      const { kvSet, kvGet } = await import("@/lib/storage/kv-service");

      // Delete key first to ensure clean state
      const { kvDelete } = await import("@/lib/storage/kv-service");
      await kvDelete(TEST_STORE_ID, "race-key");

      // Try to set same key concurrently with NX
      const attempts = Array(10)
        .fill(null)
        .map((_, i) =>
          kvSet(TEST_STORE_ID, "race-key", `value-${i}`, { nx: true })
        );

      const results = await Promise.all(attempts);

      // Only one should succeed
      const successCount = results.filter(Boolean).length;
      expect(successCount).toBe(1);

      // Value should be from the successful attempt
      const value = await kvGet(TEST_STORE_ID, "race-key");
      expect(value).toMatch(/^value-\d$/);
    });
  });

  describe("Error Handling", () => {
    itWithMinio("handles invalid content type gracefully", async () => {
      const { uploadBlob, getBlobInfo } = await import("@/lib/storage/blob-service");

      // Upload with unusual content type
      const result = await uploadBlob(TEST_STORE_ID, "weird-type.txt", "data", {
        contentType: "application/x-custom-type",
      });

      expect(result.contentType).toBe("application/x-custom-type");
    });

    itWithRedis("handles JSON-like strings correctly", async () => {
      const { kvSet, kvGet } = await import("@/lib/storage/kv-service");

      const jsonString = '{"this":"is a string, not parsed"}';
      await kvSet(TEST_STORE_ID, "json-string", jsonString);

      const value = await kvGet(TEST_STORE_ID, "json-string");
      expect(value).toBe(jsonString);
    });
  });
});
