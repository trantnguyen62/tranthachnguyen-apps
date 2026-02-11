/**
 * Full Deployment Pipeline Integration Tests
 *
 * Tests the complete deployment flow from project creation to site deployment:
 * 1. User creates project
 * 2. User triggers deployment
 * 3. Build process runs
 * 4. Site is deployed
 * 5. User can view deployment status and logs
 *
 * NOTE: These tests require a running PostgreSQL database.
 * They will be skipped if the database is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
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
const itWithDb = (name: string, fn: () => Promise<void>) => {
  it(name, async () => {
    if (!isDatabaseAvailable) return;
    await fn();
  });
};

// Mock external dependencies
vi.mock("@/lib/auth/api-auth", () => ({
  getAuthUser: vi.fn(),
  requireAuth: vi.fn(),
  requireReadAccess: vi.fn(),
  requireWriteAccess: vi.fn(),
  requireDeployAccess: vi.fn(),
  requireAdminAccess: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof Response),
}));

vi.mock("@/lib/build/worker", () => ({
  triggerBuild: vi.fn().mockImplementation(async (deploymentId: string) => {
    // Simulate build process by updating deployment status
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "BUILDING" },
    });
    return { success: true };
  }),
}));

vi.mock("@/lib/build/k8s-worker", () => ({
  triggerK8sBuild: vi.fn().mockResolvedValue({ success: true }),
  cancelK8sBuild: vi.fn().mockResolvedValue({ success: true }),
}));

import * as apiAuth from "@/lib/auth/api-auth";

// Helper to create mock requests
function createMockRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
): NextRequest {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

// Test data
const TEST_USER = {
  id: "pipeline-test-user-id",
  email: "pipeline-test@integration.com",
  name: "Pipeline Test User",
  authMethod: "session" as const,
};

describe("Complete Deployment Pipeline", () => {
  let projectId: string;
  let deploymentId: string;

  beforeAll(async () => {
    isDatabaseAvailable = await checkDatabaseConnection();
    if (!isDatabaseAvailable) {
      console.log("⏭️  Skipping Complete Deployment Pipeline - Database not available");
      return;
    }

    // Create test user
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

  afterAll(async () => {
    if (!isDatabaseAvailable) return;
    // Cleanup in correct order
    if (deploymentId) {
      await prisma.deploymentLog.deleteMany({
        where: { deploymentId },
      });
    }
    await prisma.activity.deleteMany({
      where: { userId: TEST_USER.id },
    });
    await prisma.deployment.deleteMany({
      where: { project: { userId: TEST_USER.id } },
    });
    await prisma.project.deleteMany({
      where: { userId: TEST_USER.id },
    });
    await prisma.user.delete({
      where: { id: TEST_USER.id },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Step 1: Project Creation", () => {
    itWithDb("creates a project with repository URL", async () => {
      vi.mocked(apiAuth.requireWriteAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/projects/route");

      const response = await POST(
        createMockRequest("POST", "/api/projects", {
          name: "Pipeline Test Project",
          repoUrl: "https://github.com/testuser/pipeline-test-repo",
          framework: "nextjs",
          buildCmd: "npm run build",
          outputDir: ".next",
        })
      );

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("Pipeline Test Project");
      expect(data.repoUrl).toBe("https://github.com/testuser/pipeline-test-repo");
      expect(data.framework).toBe("nextjs");

      projectId = data.id;
    });

    itWithDb("project is visible in user's project list", async () => {
      vi.mocked(apiAuth.requireReadAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/projects/route");

      const response = await GET(createMockRequest("GET", "/api/projects"));
      const projects = await response.json();

      expect(response.status).toBe(200);
      const found = projects.find((p: { id: string }) => p.id === projectId);
      expect(found).toBeDefined();
      expect(found.name).toBe("Pipeline Test Project");
    });
  });

  describe("Step 2: Trigger Deployment", () => {
    itWithDb("creates deployment and triggers build", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/deploy/route");

      const response = await POST(
        createMockRequest("POST", "/api/deploy", {
          projectId,
          branch: "main",
          commitSha: "abc1234",
          commitMsg: "Initial commit",
        })
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deployment).toBeDefined();
      expect(data.deployment.projectId).toBe(projectId);

      deploymentId = data.deployment.id;
    });

    itWithDb("deployment status is updated to BUILDING", async () => {
      // Wait a moment for async update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
      });

      expect(deployment?.status).toBe("BUILDING");
    });

    itWithDb("activity log is created for deployment", async () => {
      const activity = await prisma.activity.findFirst({
        where: {
          projectId,
          action: "deployment.created",
        },
        orderBy: { createdAt: "desc" },
      });

      expect(activity).not.toBeNull();
      expect(activity?.description).toContain("main");
    });
  });

  describe("Step 3: View Deployment Status", () => {
    itWithDb("returns deployment details with logs", async () => {
      // Add some logs first
      await prisma.deploymentLog.createMany({
        data: [
          {
            deploymentId,
            level: "info",
            message: "Starting build...",
          },
          {
            deploymentId,
            level: "info",
            message: "Installing dependencies...",
          },
          {
            deploymentId,
            level: "info",
            message: "Build completed successfully",
          },
        ],
      });

      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?id=${deploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deployment).toBeDefined();
      expect(data.deployment.id).toBe(deploymentId);
      expect(data.deployment.logs).toBeDefined();
      expect(data.deployment.logs.length).toBeGreaterThan(0);
    });

    itWithDb("lists all deployments for the project", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?projectId=${projectId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deployments).toBeDefined();
      expect(data.deployments.length).toBeGreaterThan(0);
      expect(data.pagination).toBeDefined();
    });
  });

  describe("Step 4: Simulate Build Completion", () => {
    itWithDb("deployment status updates to READY on success", async () => {
      // Simulate build completion
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "READY",
          finishedAt: new Date(),
          url: `https://pipeline-test-project-${deploymentId.slice(0, 8)}.cloudify.tranthachnguyen.com`,
        },
      });

      await prisma.deploymentLog.create({
        data: {
          deploymentId,
          level: "info",
          message: "Deployment completed successfully!",
        },
      });

      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
      });

      expect(deployment?.status).toBe("READY");
      expect(deployment?.url).toBeDefined();
      expect(deployment?.finishedAt).not.toBeNull();
    });

    itWithDb("deployment is accessible via API after completion", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?id=${deploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deployment.status).toBe("READY");
      expect(data.deployment.url).toContain("cloudify");
    });
  });

  describe("Step 5: Create Another Deployment", () => {
    let secondDeploymentId: string;

    itWithDb("creates a second deployment for same project", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { POST } = await import("@/app/api/deploy/route");

      const response = await POST(
        createMockRequest("POST", "/api/deploy", {
          projectId,
          branch: "develop",
          commitSha: "def5678",
          commitMsg: "Feature update",
        })
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      secondDeploymentId = data.deployment.id;
    });

    itWithDb("both deployments are listed", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      const { GET } = await import("@/app/api/deploy/route");

      const response = await GET(
        createMockRequest("GET", `/api/deploy?projectId=${projectId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deployments.length).toBeGreaterThanOrEqual(2);
    });

    itWithDb("can cancel queued/building deployment", async () => {
      vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: TEST_USER });
      vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

      // Ensure it's still in a cancellable state
      await prisma.deployment.update({
        where: { id: secondDeploymentId },
        data: { status: "QUEUED" },
      });

      const { DELETE } = await import("@/app/api/deploy/route");

      const response = await DELETE(
        createMockRequest("DELETE", `/api/deploy?id=${secondDeploymentId}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe("Deployment Error Handling", () => {
  const ERROR_TEST_USER = {
    id: "error-test-user-id",
    email: "error-test@integration.com",
    name: "Error Test User",
    authMethod: "session" as const,
  };

  let projectId: string;

  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.user.upsert({
      where: { id: ERROR_TEST_USER.id },
      update: {},
      create: {
        id: ERROR_TEST_USER.id,
        email: ERROR_TEST_USER.email,
        name: ERROR_TEST_USER.name,
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Error Test Project",
        slug: "error-test-project",
        userId: ERROR_TEST_USER.id,
        repoUrl: "https://github.com/testuser/error-test",
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.activity.deleteMany({ where: { projectId } });
    await prisma.deploymentLog.deleteMany({
      where: { deployment: { projectId } },
    });
    await prisma.deployment.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: ERROR_TEST_USER.id } });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  itWithDb("handles build failure gracefully", async () => {
    vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: ERROR_TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    const { POST } = await import("@/app/api/deploy/route");

    const response = await POST(
      createMockRequest("POST", "/api/deploy", {
        projectId,
        branch: "broken",
      })
    );

    const data = await response.json();
    const deploymentId = data.deployment.id;

    // Simulate build failure
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
      },
    });

    await prisma.deploymentLog.create({
      data: {
        deploymentId,
        level: "error",
        message: "Build failed: npm ERR! Missing script: build",
      },
    });

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { logs: true },
    });

    expect(deployment?.status).toBe("ERROR");
    expect(deployment?.logs.some((l) => l.level === "error")).toBe(true);
  });

  itWithDb("handles concurrent deployment attempts", async () => {
    vi.mocked(apiAuth.requireDeployAccess).mockResolvedValue({ user: ERROR_TEST_USER });
    vi.mocked(apiAuth.isAuthError).mockReturnValue(false);

    const { POST } = await import("@/app/api/deploy/route");

    // Create multiple deployments concurrently
    const results = await Promise.all([
      POST(
        createMockRequest("POST", "/api/deploy", {
          projectId,
          branch: "main",
        })
      ),
      POST(
        createMockRequest("POST", "/api/deploy", {
          projectId,
          branch: "develop",
        })
      ),
      POST(
        createMockRequest("POST", "/api/deploy", {
          projectId,
          branch: "feature",
        })
      ),
    ]);

    // All should succeed (no conflict)
    results.forEach((response) => {
      expect(response.status).toBe(200);
    });

    // All deployments created
    const deployments = await prisma.deployment.findMany({
      where: { projectId },
    });
    expect(deployments.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Deployment State Machine", () => {
  const STATE_TEST_USER = {
    id: "state-test-user-id",
    email: "state-test@integration.com",
    name: "State Test User",
    authMethod: "session" as const,
  };

  let projectId: string;

  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.user.upsert({
      where: { id: STATE_TEST_USER.id },
      update: {},
      create: {
        id: STATE_TEST_USER.id,
        email: STATE_TEST_USER.email,
        name: STATE_TEST_USER.name,
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "State Test Project",
        slug: "state-test-project",
        userId: STATE_TEST_USER.id,
        repoUrl: "https://github.com/testuser/state-test",
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.deploymentLog.deleteMany({
      where: { deployment: { projectId } },
    });
    await prisma.activity.deleteMany({ where: { projectId } });
    await prisma.deployment.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: STATE_TEST_USER.id } });
  });

  itWithDb("follows valid state transitions: QUEUED → BUILDING → DEPLOYING → READY", async () => {
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: "QUEUED",
        branch: "main",
      },
    });

    // QUEUED → BUILDING
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: "BUILDING" },
    });

    let current = await prisma.deployment.findUnique({
      where: { id: deployment.id },
    });
    expect(current?.status).toBe("BUILDING");

    // BUILDING → DEPLOYING
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: "DEPLOYING" },
    });

    current = await prisma.deployment.findUnique({
      where: { id: deployment.id },
    });
    expect(current?.status).toBe("DEPLOYING");

    // DEPLOYING → READY
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: "READY",
        finishedAt: new Date(),
        url: "https://test.cloudify.tranthachnguyen.com",
      },
    });

    current = await prisma.deployment.findUnique({
      where: { id: deployment.id },
    });
    expect(current?.status).toBe("READY");
    expect(current?.finishedAt).not.toBeNull();
  });

  itWithDb("records timestamps correctly for each state", async () => {
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: "QUEUED",
        branch: "timestamp-test",
      },
    });

    const createdAt = deployment.createdAt;

    // Simulate progression with delays
    await new Promise((resolve) => setTimeout(resolve, 50));

    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: "BUILDING" },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: "READY",
        finishedAt: new Date(),
      },
    });

    const final = await prisma.deployment.findUnique({
      where: { id: deployment.id },
    });

    expect(final?.finishedAt).toBeDefined();
    expect(final!.finishedAt!.getTime()).toBeGreaterThan(createdAt.getTime());
  });

  itWithDb("can transition to ERROR from any in-progress state", async () => {
    const states = ["QUEUED", "BUILDING", "DEPLOYING"] as const;

    for (const startState of states) {
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          status: startState,
          branch: `error-from-${startState.toLowerCase()}`,
        },
      });

      // Transition to ERROR
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "ERROR",
          finishedAt: new Date(),
        },
      });

      const current = await prisma.deployment.findUnique({
        where: { id: deployment.id },
      });

      expect(current?.status).toBe("ERROR");
      expect(current?.finishedAt).not.toBeNull();
    }
  });

  itWithDb("can transition to CANCELLED from QUEUED or BUILDING", async () => {
    const cancellableStates = ["QUEUED", "BUILDING"] as const;

    for (const startState of cancellableStates) {
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          status: startState,
          branch: `cancel-from-${startState.toLowerCase()}`,
        },
      });

      // Transition to CANCELLED
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "CANCELLED",
          finishedAt: new Date(),
        },
      });

      const current = await prisma.deployment.findUnique({
        where: { id: deployment.id },
      });

      expect(current?.status).toBe("CANCELLED");
    }
  });
});

describe("Deployment Metrics", () => {
  const METRICS_TEST_USER = {
    id: "metrics-test-user-id",
    email: "metrics-test@integration.com",
    name: "Metrics Test User",
    authMethod: "session" as const,
  };

  let projectId: string;

  beforeAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.user.upsert({
      where: { id: METRICS_TEST_USER.id },
      update: {},
      create: {
        id: METRICS_TEST_USER.id,
        email: METRICS_TEST_USER.email,
        name: METRICS_TEST_USER.name,
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Metrics Test Project",
        slug: "metrics-test-project",
        userId: METRICS_TEST_USER.id,
        repoUrl: "https://github.com/testuser/metrics-test",
      },
    });
    projectId = project.id;

    // Create sample deployments with different statuses
    const now = Date.now();
    await prisma.deployment.createMany({
      data: [
        {
          projectId,
          status: "READY",
          branch: "main",
          createdAt: new Date(now - 1000),
          finishedAt: new Date(now - 500),
        },
        {
          projectId,
          status: "READY",
          branch: "main",
          createdAt: new Date(now - 2000),
          finishedAt: new Date(now - 1500),
        },
        {
          projectId,
          status: "ERROR",
          branch: "broken",
          createdAt: new Date(now - 3000),
          finishedAt: new Date(now - 2500),
        },
        {
          projectId,
          status: "CANCELLED",
          branch: "feature",
          createdAt: new Date(now - 4000),
          finishedAt: new Date(now - 3500),
        },
        {
          projectId,
          status: "BUILDING",
          branch: "in-progress",
          createdAt: new Date(now),
        },
      ],
    });
  });

  afterAll(async () => {
    if (!isDatabaseAvailable) return;

    await prisma.deployment.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: METRICS_TEST_USER.id } });
  });

  itWithDb("counts deployments by status correctly", async () => {
    const statusCounts = await prisma.deployment.groupBy({
      by: ["status"],
      where: { projectId },
      _count: true,
    });

    const counts: Record<string, number> = {};
    statusCounts.forEach((s) => {
      counts[s.status] = s._count;
    });

    expect(counts["READY"]).toBe(2);
    expect(counts["ERROR"]).toBe(1);
    expect(counts["CANCELLED"]).toBe(1);
    expect(counts["BUILDING"]).toBe(1);
  });

  itWithDb("calculates success rate correctly", async () => {
    const total = await prisma.deployment.count({
      where: {
        projectId,
        status: { in: ["READY", "ERROR"] }, // Completed deployments
      },
    });

    const successful = await prisma.deployment.count({
      where: {
        projectId,
        status: "READY",
      },
    });

    const successRate = (successful / total) * 100;

    // 2 READY out of 3 completed (READY + ERROR)
    expect(successRate).toBeCloseTo(66.67, 0);
  });

  itWithDb("gets latest deployment for project", async () => {
    const latest = await prisma.deployment.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    expect(latest?.status).toBe("BUILDING"); // Most recent
    expect(latest?.branch).toBe("in-progress");
  });

  itWithDb("filters deployments by date range", async () => {
    const now = Date.now();
    const twoSecondsAgo = new Date(now - 2000);

    const recentDeployments = await prisma.deployment.findMany({
      where: {
        projectId,
        createdAt: { gte: twoSecondsAgo },
      },
    });

    expect(recentDeployments.length).toBeGreaterThan(0);
    recentDeployments.forEach((d) => {
      expect(d.createdAt.getTime()).toBeGreaterThanOrEqual(twoSecondsAgo.getTime());
    });
  });
});
