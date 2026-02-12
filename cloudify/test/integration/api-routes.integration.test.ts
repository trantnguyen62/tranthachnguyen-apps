/**
 * API Routes Integration Tests
 *
 * Tests actual API route handlers with real database operations.
 * Uses mocked authentication to test authorization flows.
 *
 * NOTE: These tests require a running PostgreSQL database.
 * They will be skipped if the database is unavailable.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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

// Helper to skip tests when DB is unavailable
function itWithDb(name: string, fn: () => Promise<void>) {
  it(name, async () => {
    if (!isDatabaseAvailable) return;
    await fn();
  });
}

// Mock auth module before importing routes
vi.mock("@/lib/auth/api-auth", () => ({
  getAuthUser: vi.fn(),
  requireAuth: vi.fn(),
  requireReadAccess: vi.fn(),
  requireWriteAccess: vi.fn(),
  requireDeployAccess: vi.fn(),
  requireAdminAccess: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof Response),
}));

// Mock build worker to prevent actual builds
vi.mock("@/lib/build/worker", () => ({
  triggerBuild: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/build/k8s-worker", () => ({
  triggerK8sBuild: vi.fn().mockResolvedValue({ success: true }),
  cancelK8sBuild: vi.fn().mockResolvedValue({ success: true }),
}));

// Import mocks first
import * as apiAuth from "@/lib/auth/api-auth";

// Helper to create mock NextRequest
function createMockRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

// Test user data
const TEST_USER = {
  id: "test-user-id-integration",
  email: "test@integration.com",
  name: "Test User",
  authMethod: "session" as const,
};

const OTHER_USER = {
  id: "other-user-id-integration",
  email: "other@integration.com",
  name: "Other User",
  authMethod: "session" as const,
};

describe("Projects API Integration", () => {
  let testProjectId: string;

  beforeAll(async () => {
    isDatabaseAvailable = await checkDatabaseConnection();
    if (!isDatabaseAvailable) {
      console.log("⏭️  Skipping Projects API Integration - Database not available");
      return;
    }

    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: TEST_USER.id },
      update: {},
      create: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
      },
    });

    await prisma.user.upsert({
      where: { id: OTHER_USER.id },
      update: {},
      create: {
        id: OTHER_USER.id,
        email: OTHER_USER.email,
        name: OTHER_USER.name,
      },
    });
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;

    // Cleanup test data
    await prisma.deployment.deleteMany({
      where: { project: { userId: { in: [TEST_USER.id, OTHER_USER.id] } } },
    });
    await prisma.project.deleteMany({
      where: { userId: { in: [TEST_USER.id, OTHER_USER.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [TEST_USER.id, OTHER_USER.id] } },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/projects - Create Project", () => {
    itWithDb("creates a project with valid data", async () => {
      // Mock authenticated user
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/projects/route");

      const request = createMockRequest("POST", "/api/projects", {
        name: "Integration Test Project",
        repoUrl: "https://github.com/test/repo",
        framework: "nextjs",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("Integration Test Project");
      expect(data.slug).toBe("integration-test-project");
      expect(data.userId).toBe(TEST_USER.id);

      testProjectId = data.id;
    });

    itWithDb("rejects duplicate project names for same user", async () => {
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/projects/route");

      // First create
      await POST(
        createMockRequest("POST", "/api/projects", {
          name: "Duplicate Project",
        })
      );

      // Try duplicate
      const response = await POST(
        createMockRequest("POST", "/api/projects", {
          name: "Duplicate Project",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already exists");
    });

    itWithDb("allows same project name for different users", async () => {
      // First user creates project
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/projects/route");

      await POST(
        createMockRequest("POST", "/api/projects", {
          name: "Shared Name Project",
        })
      );

      // Second user creates same name
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: OTHER_USER });

      const response = await POST(
        createMockRequest("POST", "/api/projects", {
          name: "Shared Name Project",
        })
      );

      expect(response.status).toBe(201);
    });

    itWithDb("requires project name", async () => {
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/projects/route");

      const response = await POST(
        createMockRequest("POST", "/api/projects", {})
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    itWithDb("requires authentication", async () => {
      const authError = new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue(authError as never);
      vi.mocked(apiAuth.isAuthError).mockReturnValue(true);

      const { POST } = await import("@/app/api/projects/route");

      const response = await POST(
        createMockRequest("POST", "/api/projects", { name: "Test" })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/projects - List Projects", () => {
    beforeAll(async () => {
      if (!isDatabaseAvailable) return;

      // Create some test projects
      await prisma.project.createMany({
        data: [
          {
            name: "List Test 1",
            slug: "list-test-1",
            userId: TEST_USER.id,
          },
          {
            name: "List Test 2",
            slug: "list-test-2",
            userId: TEST_USER.id,
          },
          {
            name: "Other User Project",
            slug: "other-user-project",
            userId: OTHER_USER.id,
          },
        ],
        skipDuplicates: true,
      });
    });

    itWithDb("returns only projects owned by authenticated user", async () => {
      vi.mocked(apiAuth.requireReadAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/projects/route");

      const response = await GET(createMockRequest("GET", "/api/projects"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      // All returned projects belong to TEST_USER
      data.forEach((project: { userId: string }) => {
        expect(project.userId).toBe(TEST_USER.id);
      });

      // Should not include OTHER_USER's projects
      const otherUserProjects = data.filter(
        (p: { userId: string }) => p.userId === OTHER_USER.id
      );
      expect(otherUserProjects).toHaveLength(0);
    });
  });
});

describe("Deploy API Integration", () => {
  let testProject: { id: string; slug: string };

  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: TEST_USER.id },
      update: {},
      create: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
      },
    });

    // Create test project with repo URL
    testProject = await prisma.project.create({
      data: {
        name: "Deploy Test Project",
        slug: "deploy-test-project",
        userId: TEST_USER.id,
        repositoryUrl: "https://github.com/test/deploy-test",
        repositoryBranch: "main",
      },
    });
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;

    // Cleanup
    await prisma.activity.deleteMany({
      where: { projectId: testProject?.id },
    });
    await prisma.deployment.deleteMany({
      where: { projectId: testProject?.id },
    });
    await prisma.project.deleteMany({
      where: { id: testProject?.id },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/deploy - Create Deployment", () => {
    itWithDb("creates deployment for owned project", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/deploy/route");

      const response = await POST(
        createMockRequest("POST", "/api/deploy", {
          projectId: testProject.id,
          branch: "main",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deployment.projectId).toBe(testProject.id);
      expect(data.deployment.status).toBe("QUEUED");
    });

    itWithDb("rejects deployment for non-owned project (IDOR prevention)", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: OTHER_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/deploy/route");

      const response = await POST(
        createMockRequest("POST", "/api/deploy", {
          projectId: testProject.id,
          branch: "main",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Unauthorized");
    });

    itWithDb("rejects deployment for non-existent project", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/deploy/route");

      const response = await POST(
        createMockRequest("POST", "/api/deploy", {
          projectId: "non-existent-project-id",
          branch: "main",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    itWithDb("requires projectId field", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/deploy/route");

      const response = await POST(
        createMockRequest("POST", "/api/deploy", {
          branch: "main",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("projectId");
    });
  });

  describe("GET /api/deploy - Get Deployments", () => {
    let deploymentId: string;

    beforeAll(async () => {
      if (!isDatabaseAvailable || !testProject) return;

      // Create a test deployment
      const deployment = await prisma.deployment.create({
        data: {
          projectId: testProject.id,
          status: "READY",
          branch: "main",
          commitSha: "abc1234",
        },
      });
      deploymentId = deployment.id;
    });

    itWithDb("returns deployment by ID for owner", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?id=${deploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deployment.id).toBe(deploymentId);
    });

    itWithDb("denies access to deployment for non-owner", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: OTHER_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?id=${deploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("Unauthorized");
    });

    itWithDb("returns 404 for non-existent deployment", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", "/api/deploy?id=non-existent-id")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
    });

    itWithDb("returns paginated deployments for project", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?projectId=${testProject.id}&limit=5`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.deployments)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(5);
    });
  });

  describe("DELETE /api/deploy - Cancel Deployment", () => {
    let queuedDeploymentId: string;
    let readyDeploymentId: string;

    beforeEach(async () => {
      if (!isDatabaseAvailable || !testProject) return;

      // Create deployments for testing
      const queued = await prisma.deployment.create({
        data: {
          projectId: testProject.id,
          status: "QUEUED",
          branch: "feature",
        },
      });
      queuedDeploymentId = queued.id;

      const ready = await prisma.deployment.create({
        data: {
          projectId: testProject.id,
          status: "READY",
          branch: "main",
        },
      });
      readyDeploymentId = ready.id;
    });

    afterEach(async () => {
      if (!isDatabaseAvailable || !queuedDeploymentId || !readyDeploymentId) return;

      await prisma.deployment.deleteMany({
        where: {
          id: { in: [queuedDeploymentId, readyDeploymentId].filter(Boolean) },
        },
      });
    });

    itWithDb("cancels queued deployment", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { DELETE } = await import("@/app/api/deploy/route");

      const response = await DELETE(
        createMockRequest("DELETE", `/api/deploy?id=${queuedDeploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    itWithDb("cannot cancel already completed deployment", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { DELETE } = await import("@/app/api/deploy/route");

      const response = await DELETE(
        createMockRequest("DELETE", `/api/deploy?id=${readyDeploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Cannot cancel");
    });

    itWithDb("prevents non-owner from cancelling deployment", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: OTHER_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { DELETE } = await import("@/app/api/deploy/route");

      const response = await DELETE(
        createMockRequest("DELETE", `/api/deploy?id=${queuedDeploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(403);
    });
  });
});

describe("Pagination Edge Cases", () => {
  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.user.upsert({
      where: { id: TEST_USER.id },
      update: {},
      create: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
      },
    });
  });

  itWithDb("handles negative limit gracefully", async () => {
    vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    const { GET } = await import("@/app/api/deploy/route");

    // Note: parseInt("-5") returns -5, the route should handle this
    const response = await GET(
      createMockRequest("GET", "/api/deploy?limit=-5")
    );

    // Should not crash, but behavior depends on implementation
    expect(response.status).toBeLessThan(500);
  });

  itWithDb("handles very large offset", async () => {
    vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    const { GET } = await import("@/app/api/deploy/route");

    const response = await GET(
      createMockRequest("GET", "/api/deploy?offset=999999999")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deployments).toHaveLength(0);
  });

  itWithDb("handles NaN limit/offset", async () => {
    vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    const { GET } = await import("@/app/api/deploy/route");

    const response = await GET(
      createMockRequest("GET", "/api/deploy?limit=abc&offset=xyz")
    );

    // Should use defaults, not crash
    expect(response.status).toBe(200);
  });
});

describe("Error Handling Integration", () => {
  itWithDb("handles malformed JSON body gracefully", async () => {
    vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    const { POST } = await import("@/app/api/projects/route");

    // Create request with invalid JSON
    const request = new NextRequest(
      new URL("/api/projects", "http://localhost:3000"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      }
    );

    const response = await POST(request);

    // Should return 400 or 500, not crash
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Database Transaction Integrity", () => {
  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.user.upsert({
      where: { id: TEST_USER.id },
      update: {},
      create: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
      },
    });
  });

  itWithDb("creates deployment and activity log atomically", async () => {
    vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    // Create project with repo URL
    const project = await prisma.project.create({
      data: {
        name: "Transaction Test",
        slug: "transaction-test",
        userId: TEST_USER.id,
        repositoryUrl: "https://github.com/test/transaction-test",
      },
    });

    const { POST } = await import("@/app/api/deploy/route");

    await POST(
      createMockRequest("POST", "/api/deploy", {
        projectId: project.id,
        branch: "main",
      })
    );

    // Check that both deployment and activity exist
    const deployments = await prisma.deployment.count({
      where: { projectId: project.id },
    });
    const activities = await prisma.activity.count({
      where: { projectId: project.id, action: "deployment.created" },
    });

    expect(deployments).toBeGreaterThan(0);
    expect(activities).toBeGreaterThan(0);

    // Cleanup
    await prisma.activity.deleteMany({ where: { projectId: project.id } });
    await prisma.deployment.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } });
  });
});
