"use client";

import { useState, useEffect, useCallback } from "react";

interface FeatureFlag {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  percentage: number;
  conditions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function useFeatureFlags(projectId?: string) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = projectId
        ? `/api/feature-flags?projectId=${projectId}`
        : "/api/feature-flags";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch feature flags");
      }
      const data = await response.json();
      setFlags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feature flags");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const createFlag = async (data: {
    key: string;
    name: string;
    description?: string;
    enabled?: boolean;
    percentage?: number;
    conditions?: Record<string, unknown>;
  }): Promise<FeatureFlag> => {
    if (!projectId) throw new Error("Project ID is required");

    const response = await fetch("/api/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, projectId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create feature flag");
    }

    const newFlag = await response.json();
    setFlags((prev) => [newFlag, ...prev]);
    return newFlag;
  };

  const updateFlag = async (
    flagId: string,
    data: Partial<{
      name: string;
      description: string;
      enabled: boolean;
      percentage: number;
      conditions: Record<string, unknown>;
    }>
  ): Promise<FeatureFlag> => {
    const response = await fetch(`/api/feature-flags/${flagId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update feature flag");
    }

    const updated = await response.json();
    setFlags((prev) => prev.map((f) => (f.id === flagId ? updated : f)));
    return updated;
  };

  const deleteFlag = async (flagId: string): Promise<void> => {
    const response = await fetch(`/api/feature-flags/${flagId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete feature flag");
    }

    setFlags((prev) => prev.filter((f) => f.id !== flagId));
  };

  const toggleFlag = async (flagId: string): Promise<FeatureFlag> => {
    const flag = flags.find((f) => f.id === flagId);
    if (!flag) throw new Error("Flag not found");
    return updateFlag(flagId, { enabled: !flag.enabled });
  };

  return {
    flags,
    loading,
    error,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleFlag,
    refetch: fetchFlags,
  };
}
