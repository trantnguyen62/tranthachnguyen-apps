"use client";

import { useState, useEffect, useCallback } from "react";

interface UsageData {
  build_minutes: number;
  bandwidth: number;
  requests: number;
  deployments: number;
}

interface UsageLimits {
  build_minutes: { limit: number; unit: string };
  bandwidth: { limit: number; unit: string };
  requests: { limit: number; unit: string };
  deployments: { limit: number; unit: string };
}

interface UsageRecord {
  id: string;
  type: string;
  amount: number;
  unit: string;
  recordedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface UsageResponse {
  period: string;
  usage: UsageData;
  limits: UsageLimits;
  records: UsageRecord[];
}

interface UseUsageOptions {
  period?: string;
  projectId?: string;
}

export function useUsage(options: UseUsageOptions = {}) {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.period) params.set("period", options.period);
      if (options.projectId) params.set("projectId", options.projectId);

      const response = await fetch(`/api/usage?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch usage");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage");
    } finally {
      setLoading(false);
    }
  }, [options.period, options.projectId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Calculate percentage for each metric
  const getPercentage = (type: keyof UsageData): number => {
    if (!data) return 0;
    const usage = data.usage[type];
    const limit = data.limits[type]?.limit || 1;
    return Math.min(100, (usage / limit) * 100);
  };

  // Format usage values
  const formatUsage = (type: keyof UsageData): string => {
    if (!data) return "0";
    const value = data.usage[type];

    switch (type) {
      case "bandwidth":
        return formatBytes(value);
      case "build_minutes":
        return `${Math.round(value)} min`;
      default:
        return value.toLocaleString();
    }
  };

  // Format limit values
  const formatLimit = (type: keyof UsageData): string => {
    if (!data) return "0";
    const limit = data.limits[type]?.limit || 0;

    switch (type) {
      case "bandwidth":
        return formatBytes(limit);
      case "build_minutes":
        return `${Math.round(limit)} min`;
      default:
        return limit.toLocaleString();
    }
  };

  return {
    data,
    loading,
    error,
    getPercentage,
    formatUsage,
    formatLimit,
    refetch: fetchUsage,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
