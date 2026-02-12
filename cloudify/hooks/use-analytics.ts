"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const opts = optionsRef.current;
      const params = new URLSearchParams();
      if (opts.projectId) params.set("projectId", opts.projectId);
      if (opts.range) params.set("range", opts.range);

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
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [options.projectId, options.range, fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
