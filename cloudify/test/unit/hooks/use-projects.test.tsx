import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockProject } from "@/test/factories/project.factory";
import { server } from "@/test/mocks/server";

// Disable MSW for these tests since we use our own fetch mock
beforeAll(() => server.close());
afterAll(() => server.listen({ onUnhandledRequest: "bypass" }));

// Mock fetch before importing hooks
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after setting up mocks
import { useProjects } from "@/hooks/use-projects";

describe("useProjects hook", () => {
  const mockProjects = [
    createMockProject({ id: "proj-1", name: "Project One" }),
    createMockProject({ id: "proj-2", name: "Project Two" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProjects),
    });
  });

  // Test 60: fetches projects on mount
  it("fetches projects on mount", async () => {
    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/projects");
    expect(result.current.projects).toHaveLength(2);
  });

  // Test 61: createProject() adds new project to list
  it("createProject() adds new project to list", async () => {
    const newProject = createMockProject({ id: "proj-new", name: "New Project" });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newProject),
      });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createProject({ name: "New Project" });
    });

    expect(result.current.projects).toContainEqual(
      expect.objectContaining({ id: "proj-new" })
    );
  });

  // Test 62: createProject() errors for duplicate name
  it("createProject() errors for duplicate name", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Project with this name already exists" }),
      });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let errorMessage = "";
    await act(async () => {
      try {
        await result.current.createProject({ name: "Duplicate" });
      } catch (e) {
        errorMessage = (e as Error).message;
      }
    });

    expect(errorMessage).toContain("already exists");
  });

  // Test 63: updateProject() modifies existing project
  it("updateProject() modifies existing project", async () => {
    const updatedProject = { ...mockProjects[0], name: "Updated Name" };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedProject),
      });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateProject("proj-1", { name: "Updated Name" });
    });

    const updated = result.current.projects.find((p) => p.id === "proj-1");
    expect(updated?.name).toBe("Updated Name");
  });

  // Test 64: deleteProject() removes project from list
  it("deleteProject() removes project from list", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteProject("proj-1");
    });

    expect(result.current.projects).not.toContainEqual(
      expect.objectContaining({ id: "proj-1" })
    );
  });

  // Test 65: sets loading state during operations
  it("sets loading state during operations", async () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  // Test 66: sets error state on API failure
  it("sets error state on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  // Test 67: refetch() refreshes project list
  it("refetch() refreshes project list", async () => {
    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCount = mockFetch.mock.calls.length;

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callCount);
    });
  });
});
