"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GitBranch,
  Globe,
  Settings,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Package,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---- Types ----

/** Shape of an activity from the API (matches Prisma Activity model) */
interface ApiActivity {
  id: string;
  userId: string;
  projectId: string | null;
  teamId: string | null;
  type: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/** Normalized activity for rendering */
interface NormalizedActivity {
  id: string;
  type: string;
  action: string;
  description: string;
  user: {
    name: string;
    image?: string;
    initials: string;
  };
  timestamp: string;
  status?: "success" | "error" | "warning";
  link?: string;
}

// ---- Config ----

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  deployment: {
    icon: GitBranch,
    color: "text-[var(--text-primary)]",
    bg: "bg-[var(--surface-secondary)]",
  },
  domain: {
    icon: Globe,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  team: {
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  settings: {
    icon: Settings,
    color: "text-[var(--text-secondary)]",
    bg: "bg-[var(--surface-secondary)]",
  },
  security: {
    icon: Shield,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  project: {
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  env_var: {
    icon: Key,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  function: {
    icon: Zap,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
};

const DEFAULT_TYPE_CONFIG = {
  icon: Settings,
  color: "text-[var(--text-secondary)]",
  bg: "bg-[var(--surface-secondary)]",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
};

// ---- Helpers ----

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString();
}

function inferStatus(
  action: string,
  type: string
): "success" | "error" | "warning" | undefined {
  const a = action.toLowerCase();
  if (
    a.includes("failed") ||
    a.includes("error") ||
    a.includes("deleted") ||
    a.includes("removed")
  ) {
    return "error";
  }
  if (a.includes("warning") || a.includes("expired")) {
    return "warning";
  }
  if (
    a.includes("deployed") ||
    a.includes("verified") ||
    a.includes("created") ||
    a.includes("completed") ||
    a.includes("success") ||
    a.includes("enabled") ||
    a.includes("added") ||
    a.includes("invited")
  ) {
    return "success";
  }
  return undefined;
}

function inferLink(type: string, projectSlug?: string): string | undefined {
  if (type === "deployment" && projectSlug) {
    return `/projects/${projectSlug}`;
  }
  if (type === "domain") return "/domains";
  if (type === "team") return "/settings/team";
  return undefined;
}

function normalizeApiActivity(api: ApiActivity): NormalizedActivity {
  const userName = api.user?.name || api.user?.email || "Unknown";
  return {
    id: api.id,
    type: api.type,
    action: api.description,
    description: api.project ? `Project: ${api.project.name}` : api.action,
    user: {
      name: userName,
      image: api.user?.image || undefined,
      initials: getInitials(userName),
    },
    timestamp: formatRelativeTime(api.createdAt),
    status: inferStatus(api.action, api.type),
    link: inferLink(api.type, api.project?.slug),
  };
}

// ---- Component ----

interface ActivityFeedProps {
  /** Pass activities directly (skips API fetch) */
  activities?: NormalizedActivity[];
  /** Project ID to filter activities (optional) */
  projectId?: string;
  /** Maximum items to display */
  maxItems?: number;
  /** Show header with title and "View all" link */
  showHeader?: boolean;
  /** Auto-refresh interval in ms (default: 30000, set to 0 to disable) */
  refreshInterval?: number;
}

export function ActivityFeed({
  activities: activitiesProp,
  projectId,
  maxItems = 10,
  showHeader = true,
  refreshInterval = 30000,
}: ActivityFeedProps) {
  const [fetchedActivities, setFetchedActivities] = useState<
    NormalizedActivity[]
  >([]);
  const [isLoading, setIsLoading] = useState(!activitiesProp);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivities = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setIsLoading(true);
        else setIsRefreshing(true);

        const params = new URLSearchParams();
        params.set("limit", String(maxItems));
        if (projectId) params.set("projectId", projectId);

        const res = await fetch(`/api/activity?${params}`);
        if (res.ok) {
          const data = await res.json();
          const items: ApiActivity[] = data.activities || data;
          setFetchedActivities(items.map(normalizeApiActivity));
        } else {
          if (showLoader) setFetchedActivities([]);
        }
      } catch {
        if (showLoader) setFetchedActivities([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [maxItems, projectId]
  );

  useEffect(() => {
    if (activitiesProp) return;
    fetchActivities(true);
  }, [activitiesProp, fetchActivities]);

  // Auto-refresh
  useEffect(() => {
    if (activitiesProp || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchActivities(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [activitiesProp, refreshInterval, fetchActivities]);

  const activities = activitiesProp || fetchedActivities;
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">Recent Activity</h3>
          <div className="flex items-center gap-2">
            {!activitiesProp && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => fetchActivities(false)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn(
                    "h-3 w-3 mr-1",
                    isRefreshing && "animate-spin"
                  )}
                />
                Refresh
              </Button>
            )}
            <Link
              href="/activity"
              className="text-sm text-[#0070f3] hover:text-[#0070f3]"
            >
              View all
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 animate-pulse">
              <div className="p-2 rounded-lg bg-[var(--surface-secondary)] h-8 w-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--surface-secondary)] rounded w-1/3" />
                <div className="h-3 bg-[var(--surface-secondary)] rounded w-2/3" />
                <div className="h-3 bg-[var(--surface-secondary)] rounded w-1/4" />
              </div>
            </div>
          ))
        ) : displayedActivities.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">
            No recent activity
          </p>
        ) : null}

        {!isLoading &&
          displayedActivities.map((activity, index) => {
            const config =
              TYPE_CONFIG[activity.type] || DEFAULT_TYPE_CONFIG;
            const TypeIcon = config.icon;
            const StatusIcon = activity.status
              ? STATUS_ICONS[activity.status]
              : null;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4"
              >
                {/* Icon */}
                <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                  <TypeIcon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)]">
                      {activity.action}
                    </span>
                    {StatusIcon && (
                      <StatusIcon
                        className={cn(
                          "h-4 w-4",
                          STATUS_COLORS[activity.status!]
                        )}
                      />
                    )}
                  </div>
                  {activity.link ? (
                    <Link
                      href={activity.link}
                      className="text-sm text-[var(--text-secondary)] hover:text-[#0070f3] dark:hover:text-[#0070f3]"
                    >
                      {activity.description}
                    </Link>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={activity.user.image} />
                      <AvatarFallback className="text-[10px]">
                        {activity.user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {activity.user.name} · {activity.timestamp}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
