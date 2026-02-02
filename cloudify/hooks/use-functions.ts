"use client";

import { useState, useEffect, useCallback } from "react";

interface ServerlessFunction {
  id: string;
  projectId: string;
  name: string;
  runtime: string;
  entrypoint: string;
  memory: number;
  timeout: number;
  regions: string[];
  envVars: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    invocations: number;
  };
  invocations24h?: number;
  avgDuration?: number;
  errorRate?: number;
  status?: "healthy" | "degraded" | "error";
}

export function useFunctions(projectId?: string) {
  const [functions, setFunctions] = useState<ServerlessFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = projectId
        ? `/api/functions?projectId=${projectId}`
        : "/api/functions";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch functions");
      }
      const data = await response.json();
      setFunctions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch functions");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  const createFunction = async (data: {
    projectId: string;
    name: string;
    runtime?: string;
    entrypoint?: string;
    memory?: number;
    timeout?: number;
    regions?: string[];
  }) => {
    const response = await fetch("/api/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create function");
    }

    const fn = await response.json();
    setFunctions((prev) => [fn, ...prev]);
    return fn;
  };

  const updateFunction = async (id: string, data: Partial<ServerlessFunction>) => {
    const response = await fetch(`/api/functions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update function");
    }

    const updated = await response.json();
    setFunctions((prev) => prev.map((f) => (f.id === id ? updated : f)));
    return updated;
  };

  const deleteFunction = async (id: string) => {
    const response = await fetch(`/api/functions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete function");
    }

    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    functions,
    loading,
    error,
    createFunction,
    updateFunction,
    deleteFunction,
    refetch: fetchFunctions,
  };
}
