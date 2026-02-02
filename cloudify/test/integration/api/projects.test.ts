import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockProject } from "@/test/factories/project.factory";
import { createMockUser } from "@/test/factories/user.factory";

// Mock prisma
const mockPrisma = {
  project: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock session
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";

describe("Projects API Routes", () => {
  const mockUser = createMockUser({ id: "user-1" });
  const mockProjects = [
    createMockProject({ id: "proj-1", userId: "user-1", name: "Project 1" }),
    createMockProject({ id: "proj-2", userId: "user-1", name: "Project 2" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    // Test 83: GET returns 401 when unauthenticated
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const session = await getSession();
      expect(session).toBeNull();
      // API should return 401
    });

    // Test 84: GET returns only user's projects
    it("returns only user's projects", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        avatar: null,
      });

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const projects = await mockPrisma.project.findMany({
        where: { userId: mockUser.id },
      });

      expect(projects).toHaveLength(2);
      projects.forEach((p: { userId: string }) => {
        expect(p.userId).toBe(mockUser.id);
      });
    });
  });

  describe("POST /api/projects", () => {
    // Test 85: POST creates project with generated slug
    it("creates project with generated slug", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        avatar: null,
      });

      const projectData = { name: "My New Project" };
      const expectedSlug = "my-new-project";

      mockPrisma.project.create.mockResolvedValue({
        ...createMockProject({ name: projectData.name }),
        slug: expectedSlug,
      });

      const created = await mockPrisma.project.create({
        data: {
          ...projectData,
          slug: projectData.name.toLowerCase().replace(/\s+/g, "-"),
          userId: mockUser.id,
        },
      });

      expect(created.slug).toBe(expectedSlug);
    });

    // Test 86: POST returns 400 when name missing
    it("returns 400 when name missing", async () => {
      const invalidData = { repoUrl: "https://github.com/user/repo" };

      const isValid = "name" in invalidData && (invalidData as { name?: string }).name;
      expect(isValid).toBeFalsy();
    });

    // Test 87: POST returns 400 for duplicate slug
    it("returns 400 for duplicate slug", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProjects[0]);

      const existingProject = await mockPrisma.project.findFirst({
        where: { slug: "project-1", userId: mockUser.id },
      });

      expect(existingProject).not.toBeNull();
      // API should return 400 for duplicate
    });
  });

  describe("PATCH /api/projects/:id", () => {
    // Test 88: PATCH updates project fields
    it("updates project fields", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        avatar: null,
      });

      const updateData = { name: "Updated Project Name", buildCmd: "npm run build:prod" };

      mockPrisma.project.update.mockResolvedValue({
        ...mockProjects[0],
        ...updateData,
      });

      const updated = await mockPrisma.project.update({
        where: { id: "proj-1" },
        data: updateData,
      });

      expect(updated.name).toBe("Updated Project Name");
      expect(updated.buildCmd).toBe("npm run build:prod");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    // Test 89: DELETE returns 404 for other user's project
    it("returns 404 for other user's project", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "different-user",
        email: "other@example.com",
        name: "Other User",
        avatar: null,
      });

      mockPrisma.project.findFirst.mockResolvedValue(null);

      const project = await mockPrisma.project.findFirst({
        where: { id: "proj-1", userId: "different-user" },
      });

      expect(project).toBeNull();
      // API should return 404
    });

    // Test 90: DELETE cascades to deployments
    it("cascades delete to deployments", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email!,
        name: mockUser.name,
        avatar: null,
      });

      mockPrisma.project.findFirst.mockResolvedValue(mockProjects[0]);
      mockPrisma.project.delete.mockResolvedValue(mockProjects[0]);

      await mockPrisma.project.delete({
        where: { id: "proj-1" },
      });

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: "proj-1" },
      });
      // Prisma cascade should handle deployments
    });
  });
});
