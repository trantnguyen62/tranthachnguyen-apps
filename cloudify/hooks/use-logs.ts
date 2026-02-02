"use client";

import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  projectId: string;
  projectName: string;
  deploymentId: string;
}

interface UseLogsOptions {
  projectId?: string;
  level?: string;
  search?: string;
  limit?: number;
}

export function useLogs(options: UseLogsOptions = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(
    async (cursor?: string) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.projectId) params.set("projectId", options.projectId);
        if (options.level && options.level !== "all") params.set("level", options.level);
        if (options.search) params.set("search", options.search);
        if (options.limit) params.set("limit", options.limit.toString());
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(`/api/logs?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch logs");
        }

        const data = await response.json();

        if (cursor) {
          setLogs((prev) => [...prev, ...data.logs]);
        } else {
          setLogs(data.logs);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    },
    [options.projectId, options.level, options.search, options.limit]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) {
      fetchLogs(nextCursor);
    }
  }, [nextCursor, loading, fetchLogs]);

  return {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchLogs(),
  };
}
