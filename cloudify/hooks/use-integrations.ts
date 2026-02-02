"use client";

import { useState, useEffect, useCallback } from "react";

interface Integration {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  type: string;
  name: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationType {
  name: string;
  description: string;
  icon: string;
}

export function useIntegrations(projectId?: string) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableTypes, setAvailableTypes] = useState<Record<string, IntegrationType>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [integrationsRes, typesRes] = await Promise.all([
        fetch(projectId ? `/api/integrations?projectId=${projectId}` : "/api/integrations"),
        fetch("/api/integrations?available=true"),
      ]);

      if (!integrationsRes.ok) throw new Error("Failed to fetch integrations");
      if (!typesRes.ok) throw new Error("Failed to fetch integration types");

      setIntegrations(await integrationsRes.json());
      setAvailableTypes(await typesRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const connectIntegration = async (
    projectId: string,
    type: string,
    config?: Record<string, unknown>,
    credentials?: Record<string, unknown>,
    webhookUrl?: string
  ) => {
    const response = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, type, config, credentials, webhookUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to connect integration");
    }

    const integration = await response.json();
    setIntegrations((prev) => [integration, ...prev]);
    return integration;
  };

  const updateIntegration = async (
    id: string,
    data: { config?: Record<string, unknown>; enabled?: boolean; webhookUrl?: string }
  ) => {
    const response = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update integration");
    }

    const updated = await response.json();
    setIntegrations((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const disconnectIntegration = async (id: string) => {
    const response = await fetch(`/api/integrations?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to disconnect integration");
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleIntegration = async (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) throw new Error("Integration not found");
    return updateIntegration(id, { enabled: !integration.enabled });
  };

  return {
    integrations,
    availableTypes,
    loading,
    error,
    connectIntegration,
    updateIntegration,
    disconnectIntegration,
    toggleIntegration,
    refetch: fetchIntegrations,
  };
}
