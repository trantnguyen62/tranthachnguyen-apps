"use client";

import { useState, useEffect, useCallback } from "react";

interface VitalsSummary {
  [metric: string]: {
    avg: number;
    p75: number;
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

interface SlowestPage {
  url: string;
  avgLCP: number;
}

interface DeviceBreakdown {
  device: string;
  count: number;
}

interface VitalsData {
  range: string;
  summary: VitalsSummary;
  slowestPages: SlowestPage[];
  deviceBreakdown: DeviceBreakdown[];
  totalMeasurements: number;
}

interface UseVitalsOptions {
  projectId?: string;
  range?: "24h" | "7d" | "30d";
  url?: string;
}

export function useVitals(options: UseVitalsOptions = {}) {
  const [data, setData] = useState<VitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVitals = useCallback(async () => {
    if (!options.projectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("projectId", options.projectId);
      if (options.range) params.set("range", options.range);
      if (options.url) params.set("url", options.url);

      const response = await fetch(`/api/vitals?${params}`);
      if (!response.ok) throw new Error("Failed to fetch vitals");
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vitals");
    } finally {
      setLoading(false);
    }
  }, [options.projectId, options.range, options.url]);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  // Helper to get score color
  const getScoreColor = (metric: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      FCP: { good: 1800, poor: 3000 },
      INP: { good: 200, poor: 500 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return "gray";

    if (value <= threshold.good) return "green";
    if (value <= threshold.poor) return "yellow";
    return "red";
  };

  // Helper to format metric value
  const formatMetricValue = (metric: string, value: number): string => {
    if (metric === "CLS") {
      return value.toFixed(3);
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return `${Math.round(value)}ms`;
  };

  return {
    data,
    loading,
    error,
    getScoreColor,
    formatMetricValue,
    refetch: fetchVitals,
  };
}
