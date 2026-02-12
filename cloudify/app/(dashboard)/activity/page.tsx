"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Globe,
  Settings,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Calendar,
  Download,
  ChevronDown,
  Loader2,
  RefreshCw,
  Flag,
  Zap,
  Database,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useActivity } from "@/hooks/use-activity";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
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
  feature_flag: {
    icon: Flag,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  function: {
    icon: Zap,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  storage: {
    icon: Database,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
  },
};

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle2, color: "text-green-500" },
  error: { icon: XCircle, color: "text-red-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  pending: { icon: AlertTriangle, color: "text-[#0070f3]" },
};

export default function ActivityPage() {
  const { activities, loading, error, hasMore, loadMore, refetch } = useActivity({ limit: 50 });
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("all");

  const filteredActivities = activities.filter((activity) => {
    const matchesType = selectedType === "all" || activity.type === selectedType;
    const matchesDate =
      selectedDate === "all" ||
      (selectedDate === "today" && isToday(activity.createdAt)) ||
      (selectedDate === "yesterday" && isYesterday(activity.createdAt));
    return matchesType && matchesDate;
  });

  // Group by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = formatDateGroup(activity.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, typeof activities>);

  function isToday(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isYesterday(dateString: string) {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  function formatDateGroup(dateString: string) {
    const date = new Date(dateString);
    if (isToday(dateString)) return "Today";
    if (isYesterday(dateString)) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Failed to load activity
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <Button variant="secondary" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Activity
          </h1>
          <p className="text-[var(--text-secondary)]">
            Track all actions across your projects and team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const res = await fetch("/api/audit-logs?limit=1000");
                if (!res.ok) throw new Error("Failed to export");
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `activity-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                alert("Failed to export activity logs");
              }
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <Filter className="h-4 w-4" />
              Type: {selectedType === "all" ? "All" : selectedType.replace("_", " ")}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["all", "deployment", "domain", "team", "settings", "security", "feature_flag", "function", "storage"].map(
              (type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setSelectedType(type)}
                >
                  {type === "all" ? "All Types" : type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <Calendar className="h-4 w-4" />
              Date: {selectedDate === "all" ? "All time" : selectedDate}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedDate("all")}>
              All time
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("today")}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("yesterday")}>
              Yesterday
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Activity timeline */}
      {Object.keys(groupedActivities).length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-[var(--border-primary)]">
          <GitBranch className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No activity yet
          </h3>
          <p className="text-[var(--text-secondary)]">
            Activity will appear here as you use the platform.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">
                {date}
              </h3>
              <div className="space-y-4">
                {dateActivities.map((activity, index) => {
                  const config = typeConfig[activity.type] || typeConfig.settings;
                  const TypeIcon = config.icon;
                  const status = (activity.metadata as { status?: string } | null)?.status;
                  const StatusIcon = status && statusConfig[status] ? statusConfig[status].icon : null;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-card rounded-xl border border-[var(--border-primary)]"
                    >
                      <div className={cn("p-2 rounded-lg h-fit", config.bg)}>
                        <TypeIcon className={cn("h-5 w-5", config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[var(--text-primary)]">
                            {activity.action}
                          </span>
                          {StatusIcon && status && (
                            <StatusIcon
                              className={cn(
                                "h-4 w-4",
                                statusConfig[status].color
                              )}
                            />
                          )}
                          {activity.project && (
                            <Badge variant="secondary">{activity.project.name}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">
                              {activity.user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {activity.user?.name && (
                              <span className="font-medium text-[var(--text-secondary)] dark:text-gray-300 mr-1">
                                {activity.user.name}
                              </span>
                            )}
                            {formatTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
