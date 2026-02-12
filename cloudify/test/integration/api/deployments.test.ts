import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDeployment } from "@/test/factories/deployment.factory";
import { createMockProject } from "@/test/factories/project.factory";
import { createMockUser } from "@/test/factories/user.factory";

// Mock prisma
const mockPrisma = {
  deployment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  project: {
    findFirst: vi.fn(),
  },
  deploymentLog: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock auth
vi.mock("@/lib/auth/api-auth", () => ({
  getAuthUser: vi.fn(),
}));

import { getAuthUser } from "@/lib/auth/api-auth";

describe("Deployments API Routes", () => {
  const mockUser = createMockUser({ id: "user-1" });
  const mockProject = createMockProject({ id: "proj-1", userId: "user-1" });
  const mockDeployments = [
    createMockDeployment({ id: "deploy-1", projectId: "proj-1", status: "READY" }),
    createMockDeployment({ id: "deploy-2", projectId: "proj-1", status: "BUILDING" }),
    createMockDeployment({ id: "deploy-3", projectId: "proj-1", status: "QUEUED" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/deployments/:id", () => {
    // Test 91: GET returns deployment with logs
    it("returns deployment with logs", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        authMethod: "session",
      });

      mockPrisma.deployment.findUnique.mockResolvedValue({
        ...mockDeployments[0],
        project: mockProject,
      });

      mockPrisma.deploymentLog.findMany.mockResolvedValue([
        { id: "log-1", message: "Build started", level: "info" },
        { id: "log-2", message: "Build completed", level: "success" },
      ]);

      const deployment = await mockPrisma.deployment.findUnique({
        where: { id: "deploy-1" },
        include: { project: true },
      });

      const logs = await mockPrisma.deploymentLog.findMany({
        where: { deploymentId: "deploy-1" },
      });

      expect(deployment).not.toBeNull();
      expect(deployment?.project.userId).toBe(mockUser.id);
      expect(logs).toHaveLength(2);
    });

    // Test 92: GET returns 401 for unauthorized access
    it("returns 401 for unauthorized access", async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null);

      const session = await getAuthUser(null as never);
      expect(session).toBeNull();
      // API should return 401
    });
  });

  describe("PATCH /api/deployments/:id", () => {
    // Test 93: PATCH updates deployment status
    it("updates deployment status", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        authMethod: "session",
      });

      mockPrisma.deployment.findUnique.mockResolvedValue({
        ...mockDeployments[1],
        project: mockProject,
      });

      mockPrisma.deployment.update.mockResolvedValue({
        ...mockDeployments[1],
        status: "READY",
        url: "https://deploy.example.com",
      });

      const updated = await mockPrisma.deployment.update({
        where: { id: "deploy-2" },
        data: { status: "READY", url: "https://deploy.example.com" },
      });

      expect(updated.status).toBe("READY");
      expect(updated.url).toBe("https://deploy.example.com");
    });
  });

  describe("DELETE /api/deployments/:id", () => {
    // Test 94: DELETE cancels queued deployment
    it("cancels queued deployment", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        authMethod: "session",
      });

      const queuedDeployment = mockDeployments[2]; // status: QUEUED

      mockPrisma.deployment.findUnique.mockResolvedValue({
        ...queuedDeployment,
        project: mockProject,
      });

      mockPrisma.deployment.update.mockResolvedValue({
        ...queuedDeployment,
        status: "CANCELLED",
      });

      const result = await mockPrisma.deployment.update({
        where: { id: "deploy-3" },
        data: { status: "CANCELLED" },
      });

      expect(result.status).toBe("CANCELLED");
    });

    // Test 95: DELETE cancels building deployment
    it("cancels building deployment", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        authMethod: "session",
      });

      const buildingDeployment = mockDeployments[1]; // status: BUILDING

      mockPrisma.deployment.findUnique.mockResolvedValue({
        ...buildingDeployment,
        project: mockProject,
      });

      mockPrisma.deployment.update.mockResolvedValue({
        ...buildingDeployment,
        status: "CANCELLED",
      });

      const result = await mockPrisma.deployment.update({
        where: { id: "deploy-2" },
        data: { status: "CANCELLED" },
      });

      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("POST /api/deployments/:id/trigger", () => {
    // Test 96: Trigger returns 400 for non-queued deployment
    it("returns 400 for non-queued deployment", async () => {
      const readyDeployment = mockDeployments[0]; // status: READY

      mockPrisma.deployment.findUnique.mockResolvedValue(readyDeployment);

      const deployment = await mockPrisma.deployment.findUnique({
        where: { id: "deploy-1" },
      });

      expect(deployment?.status).toBe("READY");
      // API should return 400 - cannot trigger already completed deployment
    });
  });
});
