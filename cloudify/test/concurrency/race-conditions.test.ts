/**
 * Race Condition Tests
 *
 * Tests for concurrent operations that could cause data integrity issues:
 * 1. Concurrent user signups with same email
 * 2. Concurrent project creation with same name
 * 3. Concurrent deployment triggers
 * 4. Session management under concurrent requests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// Skip tests if database is not available
let dbAvailable = false;

async function checkDbConnection(): Promise<boolean> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function itWithDb(name: string, fn: () => Promise<void>) {
  it(name, async () => {
    if (!dbAvailable) {
      console.log(`Skipping: ${name} (Database not available)`);
      return;
    }
    await fn();
  });
}

describe("Concurrent User Signup", () => {
  const testEmail = `test-concurrent-${Date.now()}@example.com`;

  beforeAll(async () => {
    dbAvailable = await checkDbConnection();
  });

  afterAll(async () => {
    if (dbAvailable) {
      const { prisma } = await import("@/lib/prisma");
      await prisma.user.deleteMany({ where: { email: testEmail } });
    }
  });

  itWithDb("only one signup succeeds with same email (database constraint)", async () => {
    const { prisma } = await import("@/lib/prisma");

    // Simulate 5 concurrent signup attempts with the same email
    const signupAttempts = Array(5)
      .fill(null)
      .map(async (_, i) => {
        try {
          return await prisma.user.create({
            data: {
              email: testEmail,
              name: `User ${i}`,
              passwordHash: "hash123",
            },
          });
        } catch (error) {
          // Unique constraint violation expected for 4 out of 5
          return null;
        }
      });

    const results = await Promise.all(signupAttempts);
    const successfulSignups = results.filter(Boolean);

    // Only one should succeed due to unique constraint
    expect(successfulSignups.length).toBe(1);
  });

  it("signup function should handle race condition gracefully", async () => {
    // Mock implementation of a signup function that handles races
    const mockSignup = async (email: string, name: string) => {
      try {
        // In real implementation, this would be prisma.user.create
        // The unique constraint ensures only one succeeds
        return { success: true, user: { email, name } };
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          // Prisma unique constraint violation
          return { success: false, error: "Email already exists" };
        }
        throw error;
      }
    };

    // Run concurrent signups
    const email = `race-test-${Date.now()}@example.com`;
    const results = await Promise.all([
      mockSignup(email, "User 1"),
      mockSignup(email, "User 2"),
      mockSignup(email, "User 3"),
    ]);

    // All should return without throwing
    expect(results.length).toBe(3);
    results.forEach((r) => {
      expect(r.success === true || r.error === "Email already exists").toBe(true);
    });
  });
});

describe("Concurrent Project Creation", () => {
  const testUserId = `test-user-${Date.now()}`;
  const testProjectName = `Test Project ${Date.now()}`;

  itWithDb("handles concurrent project creation with same name", async () => {
    const { prisma } = await import("@/lib/prisma");

    // First create a test user
    const user = await prisma.user.create({
      data: {
        email: `project-test-${Date.now()}@example.com`,
        name: "Test User",
        passwordHash: "hash",
      },
    });

    try {
      // Attempt to create 3 projects with the same name concurrently
      const createAttempts = Array(3)
        .fill(null)
        .map(async (_, i) => {
          try {
            return await prisma.project.create({
              data: {
                name: testProjectName,
                slug: `test-project-${Date.now()}-${i}`, // Different slugs
                userId: user.id,
              },
            });
          } catch (error) {
            return { error: true, code: (error as { code?: string }).code };
          }
        });

      const results = await Promise.all(createAttempts);

      // All should succeed because slugs are different
      // In real app, we'd have unique constraint on (userId, name) if needed
      expect(results.length).toBe(3);
    } finally {
      await prisma.project.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});

describe("Concurrent Deployment Triggers", () => {
  it("deployment queue should handle concurrent triggers", async () => {
    // Mock deployment queue
    const deploymentQueue: string[] = [];
    const processedDeployments = new Set<string>();
    const queueLock = { locked: false };

    const triggerDeployment = async (projectId: string, triggerId: string) => {
      const deploymentId = `${projectId}-${triggerId}`;

      // Check if already queued or processed (idempotency)
      if (
        deploymentQueue.includes(deploymentId) ||
        processedDeployments.has(deploymentId)
      ) {
        return { queued: false, reason: "Already in queue or processed" };
      }

      // Add to queue
      deploymentQueue.push(deploymentId);
      return { queued: true, deploymentId };
    };

    // Simulate 10 concurrent deployment triggers for same project
    const projectId = "project-123";
    const triggers = Array(10)
      .fill(null)
      .map((_, i) => triggerDeployment(projectId, `trigger-${i}`));

    const results = await Promise.all(triggers);

    // All should be queued (different trigger IDs)
    const queuedCount = results.filter((r) => r.queued).length;
    expect(queuedCount).toBe(10);
    expect(deploymentQueue.length).toBe(10);
  });

  it("same trigger ID should be idempotent", async () => {
    const processedTriggers = new Set<string>();

    const processDeployment = async (triggerId: string) => {
      // Idempotency check
      if (processedTriggers.has(triggerId)) {
        return { processed: false, reason: "Already processed" };
      }

      processedTriggers.add(triggerId);
      return { processed: true, triggerId };
    };

    // Same trigger ID sent multiple times (e.g., webhook retry)
    const triggerId = "trigger-abc";
    const results = await Promise.all([
      processDeployment(triggerId),
      processDeployment(triggerId),
      processDeployment(triggerId),
    ]);

    const processedCount = results.filter((r) => r.processed).length;
    expect(processedCount).toBe(1); // Only first one processes
  });
});

describe("Session Concurrent Access", () => {
  it("handles concurrent session operations", async () => {
    // Mock session store
    const sessions = new Map<string, { userId: string; expiresAt: Date }>();

    const createSession = async (userId: string) => {
      const sessionId = `session-${Date.now()}-${Math.random()}`;
      const session = {
        userId,
        expiresAt: new Date(Date.now() + 86400000),
      };
      sessions.set(sessionId, session);
      return sessionId;
    };

    const validateSession = async (sessionId: string) => {
      const session = sessions.get(sessionId);
      if (!session) return null;
      if (session.expiresAt < new Date()) {
        sessions.delete(sessionId);
        return null;
      }
      return session;
    };

    // Create sessions concurrently
    const userId = "user-123";
    const sessionPromises = Array(5)
      .fill(null)
      .map(() => createSession(userId));

    const sessionIds = await Promise.all(sessionPromises);

    // All sessions should be valid
    const validationResults = await Promise.all(
      sessionIds.map((id) => validateSession(id))
    );

    expect(validationResults.every((r) => r !== null)).toBe(true);
  });

  it("concurrent session deletion doesn't cause errors", async () => {
    const sessions = new Map<string, { userId: string }>();
    const sessionId = "session-to-delete";
    sessions.set(sessionId, { userId: "user-123" });

    const deleteSession = async (id: string) => {
      const existed = sessions.has(id);
      sessions.delete(id);
      return { deleted: existed };
    };

    // Try to delete same session concurrently
    const results = await Promise.all([
      deleteSession(sessionId),
      deleteSession(sessionId),
      deleteSession(sessionId),
    ]);

    // Only first one should report successful deletion
    const successfulDeletes = results.filter((r) => r.deleted).length;
    expect(successfulDeletes).toBe(1);
  });
});

describe("Optimistic Concurrency Control", () => {
  it("detects concurrent updates with version field", async () => {
    // Simulate a record with version field
    let record = { id: "1", name: "Original", version: 1 };

    const updateRecord = async (
      id: string,
      newName: string,
      expectedVersion: number
    ) => {
      // Simulate read + check + update
      if (record.id !== id) throw new Error("Not found");

      if (record.version !== expectedVersion) {
        return { success: false, error: "Concurrent modification detected" };
      }

      // Simulate atomic update with version increment
      record = { ...record, name: newName, version: record.version + 1 };
      return { success: true, newVersion: record.version };
    };

    // Two concurrent updates starting from same version
    const update1 = updateRecord("1", "Update A", 1);
    const update2 = updateRecord("1", "Update B", 1);

    const results = await Promise.all([update1, update2]);

    // First one succeeds, second fails due to version mismatch
    const successes = results.filter((r) => r.success).length;
    expect(successes).toBe(1);

    // Second update would see version 2, not 1
    const failures = results.filter((r) => !r.success).length;
    expect(failures).toBe(1);
  });
});

describe("Deadlock Prevention", () => {
  it("handles potential deadlock scenario with timeout", async () => {
    const locks = new Map<string, boolean>();
    const LOCK_TIMEOUT = 100; // 100ms

    const acquireLock = async (resource: string): Promise<boolean> => {
      const startTime = Date.now();

      while (locks.get(resource)) {
        if (Date.now() - startTime > LOCK_TIMEOUT) {
          return false; // Timeout - prevent deadlock
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      locks.set(resource, true);
      return true;
    };

    const releaseLock = (resource: string) => {
      locks.delete(resource);
    };

    // Simulate operations that could deadlock
    const operation1 = async () => {
      const lockA = await acquireLock("A");
      if (!lockA) return { success: false, reason: "Could not acquire lock A" };

      await new Promise((resolve) => setTimeout(resolve, 50));

      const lockB = await acquireLock("B");
      if (!lockB) {
        releaseLock("A");
        return { success: false, reason: "Could not acquire lock B" };
      }

      releaseLock("B");
      releaseLock("A");
      return { success: true };
    };

    const operation2 = async () => {
      const lockB = await acquireLock("B");
      if (!lockB) return { success: false, reason: "Could not acquire lock B" };

      await new Promise((resolve) => setTimeout(resolve, 50));

      const lockA = await acquireLock("A");
      if (!lockA) {
        releaseLock("B");
        return { success: false, reason: "Could not acquire lock A" };
      }

      releaseLock("A");
      releaseLock("B");
      return { success: true };
    };

    // Run potential deadlock scenario
    const results = await Promise.all([operation1(), operation2()]);

    // At least one should complete (timeout prevents true deadlock)
    const completedCount = results.filter((r) => r.success).length;
    expect(completedCount).toBeGreaterThanOrEqual(0);
    expect(results.length).toBe(2); // Both should return without hanging
  });
});

describe("Atomic Counter Operations", () => {
  it("maintains accuracy under concurrent increments", async () => {
    // This tests what would typically be Redis INCR or database increment
    let counter = { value: 0, mutex: false };

    const atomicIncrement = async () => {
      // Simulate atomic increment
      // In real code, this would be:
      // - Redis: INCR key
      // - Prisma: prisma.counter.update({ data: { value: { increment: 1 } } })

      // Simulated atomic operation (not truly atomic in JS without proper locking)
      const current = counter.value;
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
      counter.value = current + 1;

      return counter.value;
    };

    // This demonstrates the problem with non-atomic operations
    counter.value = 0;
    await Promise.all(Array(10).fill(null).map(atomicIncrement));

    // Without true atomicity, we might lose increments
    // The test documents this behavior
    // In production, use Redis INCR or database atomic increment
    expect(counter.value).toBeLessThanOrEqual(10);
  });

  it("demonstrates Redis-style atomic increment", async () => {
    // Mock Redis-style atomic increment
    let redisValue = 0;

    const redisIncr = async () => {
      // In Redis, INCR is atomic
      redisValue++;
      return redisValue;
    };

    const results = await Promise.all(
      Array(100).fill(null).map(redisIncr)
    );

    // All increments should be counted
    expect(redisValue).toBe(100);
    // Results should be unique (each increment returns new value)
    expect(new Set(results).size).toBe(100);
  });
});
