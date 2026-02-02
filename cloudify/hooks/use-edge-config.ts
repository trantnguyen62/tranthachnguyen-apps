"use client";

import { useState, useEffect, useCallback } from "react";

interface EdgeConfig {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
  items?: EdgeConfigItem[];
}

interface EdgeConfigItem {
  id: string;
  configId: string;
  key: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export function useEdgeConfig(projectId?: string) {
  const [configs, setConfigs] = useState<EdgeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = projectId
        ? `/api/edge-config?projectId=${projectId}`
        : "/api/edge-config";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch edge configs");
      setConfigs(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch edge configs");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const createConfig = async (projectId: string, name: string) => {
    const response = await fetch("/api/edge-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, configName: name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create config");
    }

    const config = await response.json();
    setConfigs((prev) => [config, ...prev]);
    return config;
  };

  const deleteConfig = async (configId: string) => {
    const response = await fetch(`/api/edge-config?configId=${configId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete config");
    setConfigs((prev) => prev.filter((c) => c.id !== configId));
  };

  const getConfig = async (configId: string): Promise<EdgeConfig | null> => {
    const response = await fetch(`/api/edge-config?configId=${configId}`);
    if (!response.ok) return null;
    return response.json();
  };

  const setItem = async (projectId: string, configId: string, key: string, value: unknown) => {
    const response = await fetch("/api/edge-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, configId, key, value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to set item");
    }

    return response.json();
  };

  const deleteItem = async (configId: string, key: string) => {
    const response = await fetch(`/api/edge-config?configId=${configId}&key=${key}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete item");
  };

  return {
    configs,
    loading,
    error,
    createConfig,
    deleteConfig,
    getConfig,
    setItem,
    deleteItem,
    refetch: fetchConfigs,
  };
}
