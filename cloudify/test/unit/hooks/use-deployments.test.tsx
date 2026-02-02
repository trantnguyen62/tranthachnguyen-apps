import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockDeployment } from "@/test/factories/deployment.factory";
import { server } from "@/test/mocks/server";

// Disable MSW for these tests since we use our own fetch mock
beforeAll(() => server.close());
afterAll(() => server.listen({ onUnhandledRequest: "bypass" }));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { useDeployments } from "@/hooks/use-deployments";

describe("useDeployments hook", () => {
  const mockDeployments = [
    createMockDeployment({ id: "deploy-1", status: "READY" }),
    createMockDeployment({ id: "deploy-2", status: "BUILDING" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ deployments: mockDeployments, nextCursor: null }),
    });
  });

  // Test 52: fetches deployments on mount
  it("fetches deployments on mount", async () => {
    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/projects/proj-1/deployments")
    );
    expect(result.current.deployments).toHaveLength(2);
  });

  // Test 53: handles pagination with cursor
  it("handles pagination with cursor", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        deployments: [mockDeployments[0]],
        nextCursor: "cursor-123",
      }),
    });

    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
  });

  // Test 54: loadMore() fetches next page
  it("loadMore() fetches next page", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          deployments: [mockDeployments[0]],
          nextCursor: "cursor-123",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          deployments: [mockDeployments[1]],
          nextCursor: null,
        }),
      });

    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.deployments).toHaveLength(2);
    });
  });

  // Test 55: createDeployment() adds new deployment to list
  it("createDeployment() adds new deployment to list", async () => {
    const newDeployment = createMockDeployment({ id: "deploy-new", status: "QUEUED" });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deployments: mockDeployments, nextCursor: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newDeployment),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createDeployment({ branch: "main" });
    });

    expect(result.current.deployments[0].id).toBe("deploy-new");
  });

  // Test 56: createDeployment() triggers build after creation
  it("createDeployment() triggers build after creation", async () => {
    const newDeployment = createMockDeployment({ id: "deploy-trigger" });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deployments: [], nextCursor: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newDeployment),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createDeployment();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/deployments/deploy-trigger/trigger",
      expect.objectContaining({ method: "POST" })
    );
  });

  // Test 57: cancelDeployment() updates status to CANCELLED
  it("cancelDeployment() updates status to CANCELLED", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deployments: mockDeployments, nextCursor: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.cancelDeployment("deploy-1");
    });

    const cancelled = result.current.deployments.find((d) => d.id === "deploy-1");
    expect(cancelled?.status).toBe("CANCELLED");
  });

  // Test 58: sets error state on fetch failure
  it("sets error state on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useDeployments("proj-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch deployments");
  });

  // Test 59: refetch() refreshes deployment list
  it("refetch() refreshes deployment list", async () => {
    const { result } = renderHook(() => useDeployments("proj-1"));

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
