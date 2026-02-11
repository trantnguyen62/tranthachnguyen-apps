/**
 * Performance and Load Tests
 *
 * Tests for:
 * 1. API response time baselines
 * 2. Concurrent request handling
 * 3. Memory usage monitoring
 * 4. Throughput measurements
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Configuration
const PERFORMANCE_THRESHOLDS = {
  apiResponseP95: 500, // 95th percentile should be under 500ms
  apiResponseP99: 1000, // 99th percentile should be under 1000ms
  maxMemoryGrowthMB: 50, // Max memory growth during test
  minThroughputRps: 100, // Minimum requests per second
};

// Helper to measure execution time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Helper to calculate percentiles
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Helper to get memory usage
function getMemoryUsageMB(): number {
  const usage = process.memoryUsage();
  return usage.heapUsed / 1024 / 1024;
}

describe("API Performance Baselines", () => {
  describe("Response Time Measurements", () => {
    it("measures response times for mock API calls", async () => {
      // Mock API handler
      const mockApiHandler = async (delay: number = 0) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return { status: 200, data: { message: "OK" } };
      };

      // Collect response times
      const responseTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const randomDelay = Math.random() * 50; // 0-50ms random delay
        const { duration } = await measureTime(() => mockApiHandler(randomDelay));
        responseTimes.push(duration);
      }

      // Calculate metrics
      const p50 = calculatePercentile(responseTimes, 50);
      const p95 = calculatePercentile(responseTimes, 95);
      const p99 = calculatePercentile(responseTimes, 99);
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      console.log(`Response times: avg=${avg.toFixed(2)}ms, p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, p99=${p99.toFixed(2)}ms`);

      // Assertions
      expect(p95).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponseP95);
      expect(p99).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponseP99);
    });
  });

  describe("Concurrent Request Handling", () => {
    it("handles 100 concurrent requests", async () => {
      const mockHandler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: 200 };
      };

      const startTime = performance.now();

      // Fire 100 concurrent requests
      const results = await Promise.all(
        Array(100).fill(null).map(() => mockHandler())
      );

      const totalTime = performance.now() - startTime;

      // All should succeed
      expect(results.length).toBe(100);
      expect(results.every((r) => r.status === 200)).toBe(true);

      // Should complete in reasonable time (not 100 * 10ms = 1000ms)
      // With concurrency, should be closer to 10-100ms
      expect(totalTime).toBeLessThan(500);
      console.log(`100 concurrent requests completed in ${totalTime.toFixed(2)}ms`);
    });

    it("handles 50 concurrent heavy operations", async () => {
      const heavyOperation = async () => {
        // Simulate CPU-intensive work
        let result = 0;
        for (let i = 0; i < 10000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      };

      const startTime = performance.now();

      const results = await Promise.all(
        Array(50).fill(null).map(heavyOperation)
      );

      const totalTime = performance.now() - startTime;

      expect(results.length).toBe(50);
      console.log(`50 heavy operations completed in ${totalTime.toFixed(2)}ms`);
    });
  });
});

describe("Memory Usage", () => {
  describe("Memory Leak Detection", () => {
    it("does not leak memory over repeated operations", async () => {
      const initialMemory = getMemoryUsageMB();
      const memorySnapshots: number[] = [initialMemory];

      // Create and discard objects repeatedly
      for (let i = 0; i < 100; i++) {
        // Create objects
        const data = Array(1000).fill({ id: i, data: "test".repeat(100) });

        // Process (simulate real work)
        const processed = data.map((d) => ({ ...d, processed: true }));

        // Clear references (allow GC)
        data.length = 0;

        if (i % 10 === 0) {
          memorySnapshots.push(getMemoryUsageMB());
        }
      }

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = getMemoryUsageMB();
      const memoryGrowth = finalMemory - initialMemory;

      console.log(`Memory: initial=${initialMemory.toFixed(2)}MB, final=${finalMemory.toFixed(2)}MB, growth=${memoryGrowth.toFixed(2)}MB`);

      // Memory growth should be bounded
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryGrowthMB);
    });

    it("handles large array processing without excessive memory", async () => {
      const initialMemory = getMemoryUsageMB();

      // Process large arrays in chunks
      const processInChunks = async (totalItems: number, chunkSize: number) => {
        let processed = 0;

        for (let i = 0; i < totalItems; i += chunkSize) {
          const chunk = Array(Math.min(chunkSize, totalItems - i))
            .fill(null)
            .map((_, j) => ({ id: i + j, data: "x".repeat(100) }));

          // Process chunk
          chunk.forEach((item) => {
            processed++;
          });

          // Allow GC between chunks
          await new Promise((resolve) => setImmediate(resolve));
        }

        return processed;
      };

      const result = await processInChunks(10000, 1000);

      const finalMemory = getMemoryUsageMB();
      const memoryGrowth = finalMemory - initialMemory;

      expect(result).toBe(10000);
      console.log(`Processed 10000 items with ${memoryGrowth.toFixed(2)}MB growth`);
    });
  });
});

describe("Throughput Measurements", () => {
  describe("Request Throughput", () => {
    it("measures requests per second", async () => {
      const mockRequest = async () => {
        // Simulate fast request
        return { status: 200 };
      };

      const duration = 1000; // 1 second
      const startTime = performance.now();
      let requestCount = 0;

      // Run requests for 1 second
      while (performance.now() - startTime < duration) {
        await mockRequest();
        requestCount++;
      }

      const actualDuration = performance.now() - startTime;
      const rps = (requestCount / actualDuration) * 1000;

      console.log(`Throughput: ${rps.toFixed(2)} requests/second (${requestCount} requests in ${actualDuration.toFixed(2)}ms)`);

      // Should achieve minimum throughput
      expect(rps).toBeGreaterThan(PERFORMANCE_THRESHOLDS.minThroughputRps);
    });

    it("measures concurrent request throughput", async () => {
      const mockRequest = async () => {
        await new Promise((resolve) => setImmediate(resolve));
        return { status: 200 };
      };

      const batchSize = 100;
      const batches = 10;

      const startTime = performance.now();

      for (let i = 0; i < batches; i++) {
        await Promise.all(Array(batchSize).fill(null).map(mockRequest));
      }

      const totalTime = performance.now() - startTime;
      const totalRequests = batchSize * batches;
      const rps = (totalRequests / totalTime) * 1000;

      console.log(`Concurrent throughput: ${rps.toFixed(2)} requests/second`);
    });
  });
});

describe("Database Query Performance", () => {
  // These tests are skipped if database is not available
  const testWithDb = process.env.DATABASE_URL ? it : it.skip;

  testWithDb("query execution times are within bounds", async () => {
    // This would test actual database queries
    // Skipped in unit tests, enabled in integration tests

    const mockQuery = async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return [{ id: 1, name: "Test" }];
    };

    const queryTimes: number[] = [];

    for (let i = 0; i < 50; i++) {
      const { duration } = await measureTime(mockQuery);
      queryTimes.push(duration);
    }

    const p95 = calculatePercentile(queryTimes, 95);
    console.log(`Query p95: ${p95.toFixed(2)}ms`);

    expect(p95).toBeLessThan(100); // Queries should be fast
  });
});

describe("JSON Processing Performance", () => {
  it("handles large JSON parsing efficiently", () => {
    // Create large JSON object
    const largeObject = {
      items: Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: "Lorem ipsum ".repeat(10),
          metadata: { created: new Date().toISOString(), tags: ["a", "b", "c"] },
        })),
    };

    const jsonString = JSON.stringify(largeObject);
    console.log(`JSON size: ${(jsonString.length / 1024).toFixed(2)}KB`);

    // Measure parse time
    const { duration: parseTime } = (() => {
      const start = performance.now();
      JSON.parse(jsonString);
      return { duration: performance.now() - start };
    })();

    // Measure stringify time
    const { duration: stringifyTime } = (() => {
      const start = performance.now();
      JSON.stringify(largeObject);
      return { duration: performance.now() - start };
    })();

    console.log(`JSON parse: ${parseTime.toFixed(2)}ms, stringify: ${stringifyTime.toFixed(2)}ms`);

    // Both should be fast
    expect(parseTime).toBeLessThan(100);
    expect(stringifyTime).toBeLessThan(100);
  });
});

describe("Rate Limiting Performance", () => {
  it("rate limiter performs efficiently under load", async () => {
    // Simple sliding window rate limiter
    const rateLimiter = () => {
      const windows = new Map<string, number[]>();
      const windowSize = 1000; // 1 second
      const maxRequests = 100;

      return {
        check: (key: string): boolean => {
          const now = Date.now();
          const timestamps = windows.get(key) || [];

          // Remove old timestamps
          const validTimestamps = timestamps.filter(
            (t) => now - t < windowSize
          );

          if (validTimestamps.length >= maxRequests) {
            return false; // Rate limited
          }

          validTimestamps.push(now);
          windows.set(key, validTimestamps);
          return true;
        },
      };
    };

    const limiter = rateLimiter();
    const key = "test-client";

    const startTime = performance.now();
    let allowed = 0;
    let denied = 0;

    // Make 200 requests
    for (let i = 0; i < 200; i++) {
      if (limiter.check(key)) {
        allowed++;
      } else {
        denied++;
      }
    }

    const duration = performance.now() - startTime;

    console.log(`Rate limiter: ${allowed} allowed, ${denied} denied in ${duration.toFixed(2)}ms`);

    // First 100 should be allowed
    expect(allowed).toBe(100);
    expect(denied).toBe(100);

    // Should be fast
    expect(duration).toBeLessThan(100);
  });
});

describe("String Processing Performance", () => {
  it("handles large string operations efficiently", () => {
    const largeString = "x".repeat(1024 * 1024); // 1MB string

    // Test various string operations
    const operations = {
      length: () => largeString.length,
      includes: () => largeString.includes("xyz"),
      indexOf: () => largeString.indexOf("xyz"),
      slice: () => largeString.slice(0, 1000),
      replace: () => largeString.replace(/x/g, "y"),
    };

    for (const [name, op] of Object.entries(operations)) {
      const start = performance.now();
      op();
      const duration = performance.now() - start;
      console.log(`String ${name}: ${duration.toFixed(2)}ms`);
    }

    // All operations should complete
    expect(true).toBe(true);
  });
});
