"use client";

import { useState, useEffect, useCallback } from "react";

interface AnalyticsSummary {
  pageviews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface Referrer {
  source: string;
  visits: number;
}

interface DeviceStats {
  type: string;
  count: number;
}

interface CountryStats {
  country: string;
  visits: number;
}

interface BrowserStats {
  browser: string;
  count: number;
}

interface TimeseriesPoint {
  label: string;
  value: number;
}

interface AnalyticsData {
  range: string;
  summary: AnalyticsSummary;
  timeseries: TimeseriesPoint[];
  topPages: TopPage[];
  referrers: Referrer[];
  devices: DeviceStats[];
  countries: CountryStats[];
  browsers: BrowserStats[];
}

interface UseAnalyticsOptions {
  projectId?: string;
  range?: "24h" | "7d" | "30d";
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.projectId) params.set("projectId", options.projectId);
      if (options.range) params.set("range", options.range);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [options.projectId, options.range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
