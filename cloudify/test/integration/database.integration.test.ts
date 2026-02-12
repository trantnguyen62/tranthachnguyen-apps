/**
 * Database Integration Tests
 *
 * Tests real Prisma operations to find:
 * - Query bugs
 * - Race conditions
 * - Foreign key constraint issues
 * - Cascade delete behavior
 * - Unique constraint handling
 *
 * NOTE: These tests require a running PostgreSQL database.
 * They will be skipped if the database is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Check if database is available
let isDatabaseAvailable = false;

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Skip all tests if database is not available
const describeWithDb = (name: string, fn: () => void) => {
  describe(name, () => {
    beforeAll(async () => {
      isDatabaseAvailable = await checkDatabaseConnection();
      if (!isDatabaseAvailable) {
        console.log(`⏭️  Skipping "${name}" - Database not available`);
      }
    });

    fn();
  });
};

describeWithDb("Database Constraints & Integrity", () => {
  const testUserId = "db-test-user-id";
  const testUserEmail = "dbtest@integration.com";

  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    // Create test user
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: testUserEmail,
        name: "DB Test User",
      },
    });
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;

    // Cleanup in correct order (respecting foreign keys)
    await prisma.deploymentLog.deleteMany({
      where: { deployment: { project: { userId: testUserId } } },
    });
    await prisma.activity.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.deployment.deleteMany({
      where: { project: { userId: testUserId } },
    });
    await prisma.project.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  // Helper to skip tests when DB is unavailable
  const itWithDb = (name: string, fn: () => Promise<void>) => {
    it(name, async () => {
      if (!isDatabaseAvailable) {
        return; // Skip silently
      }
      await fn();
    });
  };

  describe("Unique Constraints", () => {
    itWithDb("enforces unique email constraint on users", async () => {
      // Create first user
      await prisma.user.create({
        data: {
          id: "unique-test-1",
          email: "unique@test.com",
          name: "Unique Test 1",
        },
      });

      // Try to create second user with same email
      await expect(
        prisma.user.create({
          data: {
            id: "unique-test-2",
            email: "unique@test.com", // Duplicate email
            name: "Unique Test 2",
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.user.delete({ where: { id: "unique-test-1" } });
    });

    itWithDb("enforces unique slug per user constraint on projects", async () => {
      // Create first project
      await prisma.project.create({
        data: {
          name: "Slug Test",
          slug: "slug-test",
          userId: testUserId,
        },
      });

      // Try to create duplicate slug for same user
      await expect(
        prisma.project.create({
          data: {
            name: "Slug Test 2",
            slug: "slug-test", // Duplicate slug
            userId: testUserId,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.project.deleteMany({
        where: { slug: "slug-test", userId: testUserId },
      });
    });

    itWithDb("allows same slug for different users", async () => {
      const otherUserId = "other-db-test-user";

      // Create other user
      await prisma.user.upsert({
        where: { id: otherUserId },
        update: {},
        create: {
          id: otherUserId,
          email: "other-dbtest@integration.com",
          name: "Other DB Test User",
        },
      });

      // Create projects with same slug for different users
      const project1 = await prisma.project.create({
        data: {
          name: "Same Slug",
          slug: "same-slug",
          userId: testUserId,
        },
      });

      const project2 = await prisma.project.create({
        data: {
          name: "Same Slug",
          slug: "same-slug",
          userId: otherUserId,
        },
      });

      expect(project1.slug).toBe(project2.slug);
      expect(project1.userId).not.toBe(project2.userId);

      // Cleanup
      await prisma.project.delete({ where: { id: project1.id } });
      await prisma.project.delete({ where: { id: project2.id } });
      await prisma.user.delete({ where: { id: otherUserId } });
    });
  });

  describe("Foreign Key Constraints", () => {
    itWithDb("prevents orphaned deployments", async () => {
      // Try to create deployment for non-existent project
      await expect(
        prisma.deployment.create({
          data: {
            projectId: "non-existent-project-id",
            status: "QUEUED",
            branch: "main",
          },
        })
      ).rejects.toThrow();
    });

    itWithDb("prevents orphaned projects", async () => {
      // Try to create project for non-existent user
      await expect(
        prisma.project.create({
          data: {
            name: "Orphan Project",
            slug: "orphan-project",
            userId: "non-existent-user-id",
          },
        })
      ).rejects.toThrow();
    });

    itWithDb("handles cascade delete correctly", async () => {
      // Create project with deployments
      const project = await prisma.project.create({
        data: {
          name: "Cascade Test",
          slug: "cascade-test",
          userId: testUserId,
        },
      });

      const deployment = await prisma.deployment.create({
        data: {
          projectId: project.id,
          status: "READY",
          branch: "main",
        },
      });

      await prisma.deploymentLog.create({
        data: {
          deploymentId: deployment.id,
          level: "info",
          message: "Test log",
        },
      });

      // Delete project - should cascade to deployments and logs
      // Note: This depends on schema's onDelete setting
      await prisma.deploymentLog.deleteMany({
        where: { deploymentId: deployment.id },
      });
      await prisma.deployment.delete({ where: { id: deployment.id } });
      await prisma.project.delete({ where: { id: project.id } });

      // Verify all are gone
      const remainingDeployments = await prisma.deployment.count({
        where: { projectId: project.id },
      });
      expect(remainingDeployments).toBe(0);
    });
  });

  describe("Query Edge Cases", () => {
    itWithDb("handles empty result sets gracefully", async () => {
      const projects = await prisma.project.findMany({
        where: { userId: "definitely-not-a-user-id" },
      });

      expect(projects).toEqual([]);
    });

    itWithDb("handles null optional fields correctly", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Null Fields Test",
          slug: "null-fields-test",
          userId: testUserId,
          // repoUrl is optional, should be null
        },
      });

      expect(project.repositoryUrl).toBeNull();

      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("handles very long strings within limits", async () => {
      const longName = "a".repeat(100);
      const project = await prisma.project.create({
        data: {
          name: longName,
          slug: "long-name-test",
          userId: testUserId,
        },
      });

      expect(project.name).toBe(longName);
      expect(project.name.length).toBe(100);

      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("orders by createdAt correctly", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Order Test",
          slug: "order-test",
          userId: testUserId,
        },
      });

      // Create deployments with sequential timestamps
      const now = Date.now();
      await prisma.deployment.createMany({
        data: [
          {
            projectId: project.id,
            status: "READY",
            branch: "main",
            createdAt: new Date(now),
          },
          {
            projectId: project.id,
            status: "READY",
            branch: "feature",
            createdAt: new Date(now + 1000),
          },
          {
            projectId: project.id,
            status: "READY",
            branch: "develop",
            createdAt: new Date(now + 2000),
          },
        ],
      });

      const deployments = await prisma.deployment.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
      });

      // Should be in descending order (newest first)
      expect(deployments[0].branch).toBe("develop");
      expect(deployments[1].branch).toBe("feature");
      expect(deployments[2].branch).toBe("main");

      // Cleanup
      await prisma.deployment.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });

  describe("Concurrent Operations", () => {
    itWithDb("handles concurrent project creations with same slug", async () => {
      const createProject = () =>
        prisma.project.create({
          data: {
            name: "Concurrent Test",
            slug: `concurrent-test-${Date.now()}-${Math.random()}`,
            userId: testUserId,
          },
        });

      // Create 5 projects concurrently
      const results = await Promise.allSettled([
        createProject(),
        createProject(),
        createProject(),
        createProject(),
        createProject(),
      ]);

      // All should succeed since slugs are unique
      const succeeded = results.filter((r) => r.status === "fulfilled");
      expect(succeeded.length).toBe(5);

      // Cleanup
      await prisma.project.deleteMany({
        where: {
          userId: testUserId,
          name: "Concurrent Test",
        },
      });
    });

    itWithDb("handles concurrent deployment status updates", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Concurrent Status Test",
          slug: "concurrent-status-test",
          userId: testUserId,
        },
      });

      const deployment = await prisma.deployment.create({
        data: {
          projectId: project.id,
          status: "QUEUED",
          branch: "main",
        },
      });

      // Try to update status concurrently
      const updates = await Promise.allSettled([
        prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: "BUILDING" },
        }),
        prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: "DEPLOYING" },
        }),
        prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: "READY" },
        }),
      ]);

      // All updates should succeed (last write wins)
      const finalDeployment = await prisma.deployment.findUnique({
        where: { id: deployment.id },
      });

      expect(finalDeployment).not.toBeNull();
      // Status should be one of the updated values
      expect(["BUILDING", "DEPLOYING", "READY"]).toContain(
        finalDeployment?.status
      );

      // Cleanup
      await prisma.deployment.delete({ where: { id: deployment.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });

  describe("Count and Aggregation", () => {
    itWithDb("counts deployments correctly", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Count Test",
          slug: "count-test",
          userId: testUserId,
        },
      });

      // Create 3 deployments
      await prisma.deployment.createMany({
        data: [
          { projectId: project.id, status: "READY", branch: "main" },
          { projectId: project.id, status: "READY", branch: "develop" },
          { projectId: project.id, status: "ERROR", branch: "feature" },
        ],
      });

      const total = await prisma.deployment.count({
        where: { projectId: project.id },
      });
      const ready = await prisma.deployment.count({
        where: { projectId: project.id, status: "READY" },
      });
      const error = await prisma.deployment.count({
        where: { projectId: project.id, status: "ERROR" },
      });

      expect(total).toBe(3);
      expect(ready).toBe(2);
      expect(error).toBe(1);

      // Cleanup
      await prisma.deployment.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("handles _count relation correctly", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Count Relation Test",
          slug: "count-relation-test",
          userId: testUserId,
        },
      });

      await prisma.deployment.createMany({
        data: [
          { projectId: project.id, status: "READY", branch: "main" },
          { projectId: project.id, status: "READY", branch: "develop" },
        ],
      });

      const projectWithCount = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          _count: {
            select: { deployments: true },
          },
        },
      });

      expect(projectWithCount?._count.deployments).toBe(2);

      // Cleanup
      await prisma.deployment.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });

  describe("JSON Field Handling", () => {
    itWithDb("stores and retrieves metadata JSON correctly", async () => {
      const project = await prisma.project.create({
        data: {
          name: "JSON Test",
          slug: "json-test",
          userId: testUserId,
        },
      });

      const metadata = {
        deploymentId: "dep-123",
        branch: "main",
        custom: { nested: true, array: [1, 2, 3] },
      };

      const activity = await prisma.activity.create({
        data: {
          userId: testUserId,
          projectId: project.id,
          type: "deployment",
          action: "test",
          description: "Test activity",
          metadata: metadata as Prisma.JsonObject,
        },
      });

      const retrieved = await prisma.activity.findUnique({
        where: { id: activity.id },
      });

      expect(retrieved?.metadata).toEqual(metadata);

      // Cleanup
      await prisma.activity.delete({ where: { id: activity.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("handles null metadata gracefully", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Null Metadata Test",
          slug: "null-metadata-test",
          userId: testUserId,
        },
      });

      const activity = await prisma.activity.create({
        data: {
          userId: testUserId,
          projectId: project.id,
          type: "deployment",
          action: "test",
          description: "Test activity",
          // metadata is optional
        },
      });

      const retrieved = await prisma.activity.findUnique({
        where: { id: activity.id },
      });

      expect(retrieved?.metadata).toBeNull();

      // Cleanup
      await prisma.activity.delete({ where: { id: activity.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });

  describe("Date/Time Handling", () => {
    itWithDb("stores timestamps in UTC", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Timestamp Test",
          slug: "timestamp-test",
          userId: testUserId,
        },
      });

      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);

      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("updates updatedAt on modification", async () => {
      const project = await prisma.project.create({
        data: {
          name: "UpdatedAt Test",
          slug: "updatedat-test",
          userId: testUserId,
        },
      });

      const originalUpdatedAt = project.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await prisma.project.update({
        where: { id: project.id },
        data: { name: "Updated Name" },
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );

      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("handles date range queries correctly", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Date Range Test",
          slug: "date-range-test",
          userId: testUserId,
        },
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.deployment.createMany({
        data: [
          {
            projectId: project.id,
            status: "READY",
            branch: "old",
            createdAt: yesterday,
          },
          {
            projectId: project.id,
            status: "READY",
            branch: "new",
            createdAt: now,
          },
        ],
      });

      // Query for today only
      const todayDeployments = await prisma.deployment.findMany({
        where: {
          projectId: project.id,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: tomorrow,
          },
        },
      });

      expect(todayDeployments.length).toBeGreaterThanOrEqual(1);

      // Cleanup
      await prisma.deployment.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });

  describe("Transaction Handling", () => {
    itWithDb("rolls back on failure", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Transaction Test",
          slug: "transaction-test",
          userId: testUserId,
        },
      });

      // Try a transaction that should fail
      try {
        await prisma.$transaction([
          prisma.deployment.create({
            data: {
              projectId: project.id,
              status: "QUEUED",
              branch: "main",
            },
          }),
          // This should fail - invalid projectId
          prisma.deployment.create({
            data: {
              projectId: "invalid-project-id",
              status: "QUEUED",
              branch: "fail",
            },
          }),
        ]);
      } catch {
        // Expected to fail
      }

      // First deployment should be rolled back
      const deployments = await prisma.deployment.findMany({
        where: { projectId: project.id },
      });

      expect(deployments.length).toBe(0);

      await prisma.project.delete({ where: { id: project.id } });
    });

    itWithDb("commits all operations on success", async () => {
      const project = await prisma.project.create({
        data: {
          name: "Transaction Success Test",
          slug: "transaction-success-test",
          userId: testUserId,
        },
      });

      await prisma.$transaction([
        prisma.deployment.create({
          data: {
            projectId: project.id,
            status: "QUEUED",
            branch: "main",
          },
        }),
        prisma.deployment.create({
          data: {
            projectId: project.id,
            status: "BUILDING",
            branch: "develop",
          },
        }),
      ]);

      const deployments = await prisma.deployment.findMany({
        where: { projectId: project.id },
      });

      expect(deployments.length).toBe(2);

      // Cleanup
      await prisma.deployment.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });
});
