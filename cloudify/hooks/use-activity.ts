"use client";

import { useState, useEffect, useCallback } from "react";

interface Activity {
  id: string;
  userId: string;
  projectId: string | null;
  type: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface UseActivityOptions {
  projectId?: string;
  limit?: number;
}

export function useActivity(options: UseActivityOptions = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivities = useCallback(
    async (cursor?: string) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.limit) params.set("limit", options.limit.toString());
        if (options.projectId) params.set("projectId", options.projectId);
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(`/api/activity?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch activity");
        }

        const envelope = await response.json();
        const data = envelope.data ?? envelope;
        const pagination = envelope.meta?.pagination;

        if (cursor) {
          setActivities((prev) => [...prev, ...(data.activities ?? [])]);
        } else {
          setActivities(data.activities ?? []);
        }

        setNextCursor(pagination?.cursor ?? null);
        setHasMore(pagination?.hasMore ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch activity");
      } finally {
        setLoading(false);
      }
    },
    [options.limit, options.projectId]
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) {
      fetchActivities(nextCursor);
    }
  }, [nextCursor, loading, fetchActivities]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchActivities(),
  };
}
