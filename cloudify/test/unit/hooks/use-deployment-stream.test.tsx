import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDeploymentStream } from "@/hooks/use-deployment-stream";

// Mock EventSource as a class
let mockEventSourceInstance: MockEventSource | null = null;

class MockEventSource {
  url: string;
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    mockEventSourceInstance = this;
  }

  addEventListener(event: string, callback: (event: MessageEvent) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(eventType: string, data: object) {
    const callbacks = this.listeners[eventType] || [];
    callbacks.forEach((cb) =>
      cb({ data: JSON.stringify(data) } as MessageEvent)
    );
  }

  emitError() {
    const callbacks = this.listeners["error"] || [];
    callbacks.forEach((cb) => cb({} as MessageEvent));
  }
}

// @ts-expect-error - Mock EventSource globally
global.EventSource = MockEventSource;

describe("useDeploymentStream hook", () => {
  beforeEach(() => {
    mockEventSourceInstance = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test 44: creates EventSource with correct URL
  it("creates EventSource with correct URL", () => {
    renderHook(() => useDeploymentStream("deploy-123"));

    expect(mockEventSourceInstance?.url).toBe("/api/deployments/deploy-123/stream");
  });

  // Test 45: sets isConnected to true on connected event
  it("sets isConnected to true on connected event", async () => {
    const { result } = renderHook(() => useDeploymentStream("deploy-123"));

    act(() => {
      mockEventSourceInstance?.emit("connected", {
        deploymentId: "deploy-123",
        status: "starting",
      });
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  // Test 46: updates progress on step events
  it("updates progress on step events", async () => {
    const { result } = renderHook(() => useDeploymentStream("deploy-123"));

    act(() => {
      mockEventSourceInstance?.emit("step", {
        step: "build",
        message: "Building...",
        progress: 50,
      });
    });

    await waitFor(() => {
      expect(result.current.progress).toBe(50);
      expect(result.current.currentStep?.step).toBe("build");
    });
  });

  // Test 47: appends logs on log events
  it("appends logs on log events", async () => {
    const { result } = renderHook(() => useDeploymentStream("deploy-123"));

    act(() => {
      mockEventSourceInstance?.emit("log", {
        timestamp: "2024-01-01T00:00:00Z",
        type: "info",
        message: "First log",
      });
      mockEventSourceInstance?.emit("log", {
        timestamp: "2024-01-01T00:00:01Z",
        type: "info",
        message: "Second log",
      });
    });

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0].message).toBe("First log");
      expect(result.current.logs[1].message).toBe("Second log");
    });
  });

  // Test 48: calls onComplete callback when build completes
  it("calls onComplete callback when build completes", async () => {
    const onComplete = vi.fn();
    renderHook(() =>
      useDeploymentStream("deploy-123", { onComplete })
    );

    act(() => {
      mockEventSourceInstance?.emit("complete", {
        deploymentId: "deploy-123",
        status: "ready",
        url: "https://test.example.com",
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ready",
          url: "https://test.example.com",
        })
      );
    });
  });

  // Test 49: closes EventSource on complete event
  it("closes EventSource on complete event", async () => {
    renderHook(() => useDeploymentStream("deploy-123"));

    act(() => {
      mockEventSourceInstance?.emit("complete", {
        deploymentId: "deploy-123",
        status: "ready",
      });
    });

    await waitFor(() => {
      expect(mockEventSourceInstance?.close).toHaveBeenCalled();
    });
  });

  // Test 50: handles EventSource errors gracefully
  it("handles EventSource errors gracefully", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useDeploymentStream("deploy-123", { onError, maxReconnectAttempts: 0 })
    );

    act(() => {
      mockEventSourceInstance?.emit("connected", { status: "starting" });
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      mockEventSourceInstance?.emitError();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(onError).toHaveBeenCalled();
    });
  });

  // Test 51: reset() clears all state
  it("reset() clears all state", async () => {
    const { result } = renderHook(() => useDeploymentStream("deploy-123"));

    act(() => {
      mockEventSourceInstance?.emit("step", { step: "build", message: "Building", progress: 50 });
      mockEventSourceInstance?.emit("log", { timestamp: "now", type: "info", message: "Log" });
    });

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.progress).toBe(50);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.logs).toHaveLength(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.status).toBeNull();
  });
});
