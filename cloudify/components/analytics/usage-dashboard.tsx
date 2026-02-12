"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface UsageStats {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: Record<string, {
    used: number;
    limit: number;
    percentage: number;
    count: number;
  }>;
  dailyUsage: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  totals: {
    deployments: number;
    functionInvocations: number;
    edgeInvocations: number;
    storageBytes: number;
  };
  limits: Record<string, number>;
  plan: string;
}

interface UsageDashboardProps {
  projectId?: string;
  className?: string;
}

export function UsageDashboard({ projectId, className }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period });
        if (projectId) params.append("projectId", projectId);

        const response = await fetch(`/api/analytics/usage-stats?${params}`);
        if (!response.ok) throw new Error("Failed to fetch usage stats");

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [projectId, period]);

  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8 text-red-500", className)}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Usage Overview
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)} Plan
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                period === p
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {p === "day" ? "24h" : p === "week" ? "7d" : "30d"}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Deployments"
          value={stats.totals.deployments}
          icon="🚀"
        />
        <StatCard
          title="Function Invocations"
          value={stats.totals.functionInvocations}
          icon="⚡"
        />
        <StatCard
          title="Edge Invocations"
          value={stats.totals.edgeInvocations}
          icon="🌐"
        />
        <StatCard
          title="Storage Used"
          value={formatBytes(stats.totals.storageBytes)}
          icon="💾"
        />
      </div>

      {/* Usage meters */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Resource Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(stats.summary).map(([key, data]) => (
            <UsageMeter
              key={key}
              label={formatLabel(key)}
              used={data.used}
              limit={data.limit}
              percentage={data.percentage}
              unit={getUnit(key)}
            />
          ))}
        </div>
      </div>

      {/* Daily chart placeholder */}
      {stats.dailyUsage.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Daily Breakdown
          </h3>
          <div className="h-48 flex items-end gap-1">
            {stats.dailyUsage.map((day, index) => {
              const total = Object.entries(day)
                .filter(([k]) => k !== "date")
                .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0);
              const maxTotal = Math.max(
                ...stats.dailyUsage.map((d) =>
                  Object.entries(d)
                    .filter(([k]) => k !== "date")
                    .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0)
                )
              );
              const height = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-card rounded-lg p-4 border border-[var(--border-primary)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-[var(--text-secondary)]">{title}</span>
      </div>
      <div className="text-2xl font-semibold text-[var(--text-primary)]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  percentage,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  percentage: number;
  unit: string;
}) {
  const isOverLimit = percentage >= 100;
  const isNearLimit = percentage >= 80;

  return (
    <div className="bg-card rounded-lg p-4 border border-[var(--border-primary)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          {formatValue(used, unit)} / {limit === Infinity ? "∞" : formatValue(limit, unit)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOverLimit
              ? "bg-red-500"
              : isNearLimit
              ? "bg-yellow-500"
              : "bg-green-500"
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-right">
        <span
          className={cn(
            isOverLimit
              ? "text-red-500"
              : isNearLimit
              ? "text-yellow-500"
              : "text-[var(--text-secondary)]"
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatLabel(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getUnit(key: string): string {
  const units: Record<string, string> = {
    build_minutes: "min",
    bandwidth: "bytes",
    requests: "",
    function_invocations: "",
    blob_storage: "bytes",
    deployments: "",
  };
  return units[key] || "";
}

function formatValue(value: number, unit: string): string {
  if (unit === "bytes") return formatBytes(value);
  if (unit === "min") return `${value.toLocaleString()} min`;
  return value.toLocaleString();
}

export default UsageDashboard;
