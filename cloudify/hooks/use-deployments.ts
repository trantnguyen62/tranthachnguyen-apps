"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Deployment {
  id: string;
  projectId: string;
  status: "QUEUED" | "BUILDING" | "DEPLOYING" | "READY" | "ERROR" | "CANCELLED";
  commitSha: string | null;
  commitMessage: string | null;
  branch: string;
  url: string | null;
  buildTime: number | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

interface DeploymentLog {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

interface CreateDeploymentData {
  commitSha?: string;
  commitMessage?: string;
  branch?: string;
}

export function useDeployments(projectId: string) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchDeployments = useCallback(async (cursor?: string) => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const url = new URL(`/api/projects/${projectId}/deployments`, window.location.origin);
      if (cursor) url.searchParams.set("cursor", cursor);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch deployments");
      }

      const envelope = await response.json();
      const data = envelope.data ?? envelope;
      const pagination = envelope.meta?.pagination;

      if (cursor) {
        setDeployments((prev) => [...prev, ...(data.deployments ?? [])]);
      } else {
        setDeployments(data.deployments ?? []);
      }

      setNextCursor(pagination?.cursor ?? null);
      setHasMore(pagination?.hasMore ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const loadMore = () => {
    if (nextCursor) {
      fetchDeployments(nextCursor);
    }
  };

  const createDeployment = async (data: CreateDeploymentData = {}): Promise<Deployment> => {
    const response = await fetch(`/api/projects/${projectId}/deployments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const envelope = await response.json();
      throw new Error(envelope.error?.message || "Failed to create deployment");
    }

    const envelope = await response.json();
    const deployment = envelope.data ?? envelope;
    setDeployments((prev) => [deployment, ...prev]);

    // Trigger the build
    await fetch(`/api/deployments/${deployment.id}/trigger`, {
      method: "POST",
    });

    return deployment;
  };

  const cancelDeployment = async (id: string): Promise<void> => {
    const response = await fetch(`/api/deployments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const envelope = await response.json();
      throw new Error(envelope.error?.message || "Failed to cancel deployment");
    }

    setDeployments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "CANCELLED" as const } : d))
    );
  };

  return {
    deployments,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchDeployments(),
    createDeployment,
    cancelDeployment,
  };
}

export function useDeployment(id: string) {
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeployment = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/deployments/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch deployment");
      }
      const envelope = await response.json();
      setDeployment(envelope.data ?? envelope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeployment();
  }, [fetchDeployment]);

  return { deployment, loading, error, refetch: fetchDeployment };
}

export function useDeploymentLogs(deploymentId: string) {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!deploymentId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/deployments/${deploymentId}/logs`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.done) {
        setStatus(data.status);
        setIsComplete(true);
        eventSource.close();
        return;
      }

      setLogs((prev) => {
        // Avoid duplicates
        if (prev.some((log) => log.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsComplete(true);
    };

    return () => {
      eventSource.close();
    };
  }, [deploymentId]);

  return { logs, status, isComplete };
}
