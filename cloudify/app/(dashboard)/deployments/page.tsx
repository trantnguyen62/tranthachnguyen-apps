"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  GitBranch,
  MoreHorizontal,
  RefreshCw,
  Eye,
  RotateCcw,
  Trash2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { useToast } from "@/components/notifications/toast";

interface Deployment {
  id: string;
  project: string;
  projectSlug: string;
  projectId: string;
  branch: string;
  commit: string;
  commitMessage: string;
  status: string;
  createdAt: string;
  duration: string | null;
  url: string;
  isProduction: boolean;
  error: string | null;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "building", label: "Building" },
  { value: "ready", label: "Ready" },
  { value: "error", label: "Error" },
  { value: "canceled", label: "Canceled" },
];

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 max-w-[980px]">
      <Skeleton className="h-7 w-40 mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />
      <Skeleton className="h-9 w-96 mb-6" />
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--separator,theme(colors.border))]">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-48 flex-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusDotColor(status: string) {
  switch (status.toLowerCase()) {
    case "ready":
      return "bg-[var(--success,#34C759)]";
    case "building":
      return "bg-[var(--warning,#FF9F0A)] animate-pulse";
    case "error":
    case "failed":
      return "bg-[var(--error,#FF3B30)]";
    case "canceled":
      return "bg-[var(--text-quaternary,theme(colors.muted.foreground))]";
    default:
      return "bg-[var(--text-quaternary,theme(colors.muted.foreground))]";
  }
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();

  const fetchDeployments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (projectFilter !== "all") params.append("projectId", projectFilter);

      const response = await fetch(`/api/deployments?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch deployments");
      }
      const data = await response.json();
      setDeployments(data.deployments || []);
      setProjects(data.projects || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, projectFilter]);

  // Initial fetch + auto-refresh every 10s
  useEffect(() => {
    fetchDeployments();

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDeployments();
      }
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDeployments]);

  async function handleRollback(deploymentId: string) {
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/rollback`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: "success", title: "Rollback complete", message: `Rolled back successfully (${data.rollbackTime}ms)` });
        fetchDeployments();
      } else {
        addToast({ type: "error", title: "Rollback failed", message: data.error || "Could not roll back" });
      }
    } catch {
      addToast({ type: "error", title: "Network error", message: "Could not connect to the server" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRedeploy(deployment: Deployment) {
    setActionLoading(deployment.id);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: deployment.projectId,
          branch: deployment.branch,
          commitSha: deployment.commit,
          commitMsg: `Redeploy: ${deployment.commitMessage}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: "success", title: "Deploy started", message: `Redeployment of ${deployment.project} triggered` });
        fetchDeployments();
      } else {
        addToast({ type: "error", title: "Deploy failed", message: data.error || "Could not trigger redeployment" });
      }
    } catch {
      addToast({ type: "error", title: "Network error", message: "Could not connect to the server" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(deploymentId: string) {
    if (!confirm("Are you sure you want to delete this deployment?")) return;
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`/api/deploy?id=${deploymentId}`, { method: "DELETE" });
      if (res.ok) {
        addToast({ type: "success", title: "Deployment deleted", message: "The deployment has been removed" });
        fetchDeployments();
      } else {
        const data = await res.json();
        addToast({ type: "error", title: "Delete failed", message: data.error || "Could not delete deployment" });
      }
    } catch {
      addToast({ type: "error", title: "Network error", message: "Could not connect to the server" });
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="px-6 py-8 max-w-[980px]">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-6 w-6 text-[var(--error,#FF3B30)] mb-4" />
          <h3 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            Failed to load deployments
          </h3>
          <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5">
            {error}
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const updatedText = lastUpdated
    ? `Updated ${formatTimeAgo(lastUpdated.toISOString())}`
    : "";

  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
          Deployments
        </h1>
      </div>
      <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-8">
        All deployments across your projects.
      </p>

      {/* Filters row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Segmented status filter */}
          <div className="inline-flex items-center rounded-lg border border-[var(--border-primary,theme(colors.border))] bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] p-0.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 text-[13px] font-medium rounded-md transition-all",
                  statusFilter === filter.value
                    ? "bg-[var(--surface-primary,theme(colors.background))] text-[var(--text-primary,theme(colors.foreground))] shadow-sm"
                    : "text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Project filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="text-[13px]">
                {projectFilter === "all"
                  ? "All Projects"
                  : projects.find((p) => p.id === projectFilter)?.name || "Project"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setProjectFilter("all")}>
                All Projects
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projects.map((project) => (
                <DropdownMenuItem key={project.id} onClick={() => setProjectFilter(project.id)}>
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Updated indicator */}
        {updatedText && (
          <span className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
            {updatedText}
          </span>
        )}
      </div>

      {/* Deployments list */}
      {deployments.length > 0 ? (
        <div className="border-t border-[var(--separator,theme(colors.border))]">
          {deployments.map((deployment) => (
            <div
              key={deployment.id}
              className="flex items-center gap-4 py-3 border-b border-[var(--separator,theme(colors.border))] hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors -mx-3 px-3 group"
            >
              {/* Status dot */}
              <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDotColor(deployment.status)}`} />

              {/* Project name + deployment ID */}
              <div className="min-w-[160px]">
                <Link
                  href={`/projects/${deployment.projectSlug}`}
                  className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))] hover:text-[var(--accent,#0071E3)] transition-colors"
                >
                  {deployment.project}
                </Link>
                <p className="text-[11px] font-mono text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
                  {deployment.id.slice(0, 8)}
                </p>
              </div>

              {/* Branch */}
              <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[80px]">
                {deployment.branch}
              </span>

              {/* Commit SHA */}
              <span className="text-[13px] font-mono text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[60px]">
                {deployment.commit?.slice(0, 7)}
              </span>

              {/* Commit message */}
              <span className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] flex-1 truncate">
                {deployment.commitMessage}
              </span>

              {/* Duration */}
              {deployment.duration && (
                <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
                  {deployment.duration}
                </span>
              )}

              {/* Time */}
              <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[60px] text-right">
                {formatTimeAgo(deployment.createdAt)}
              </span>

              {/* Error inline */}
              {deployment.error && (
                <span className="text-[11px] text-[var(--error,#FF3B30)] max-w-[120px] truncate" title={deployment.error}>
                  {deployment.error}
                </span>
              )}

              {/* Three-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleRedeploy(deployment)}
                    disabled={actionLoading === deployment.id}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Redeploy
                  </DropdownMenuItem>
                  {deployment.status === "ready" && (
                    <DropdownMenuItem
                      onClick={() => handleRollback(deployment.id)}
                      disabled={actionLoading === deployment.id}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={`/deployments/${deployment.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Logs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[var(--error,#FF3B30)]"
                    onClick={() => handleDelete(deployment.id)}
                    disabled={actionLoading === deployment.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Chevron */}
              <Link href={`/deployments/${deployment.id}`} className="shrink-0">
                <ChevronRight className="h-4 w-4 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GitBranch className="h-12 w-12 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] mb-4" strokeWidth={1.5} />
          <p className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            No deployments found
          </p>
          <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] max-w-[320px] mb-5">
            {statusFilter !== "all" || projectFilter !== "all"
              ? "No deployments match your current filters."
              : "Push code to your repository to trigger your first deployment."}
          </p>
          {statusFilter !== "all" || projectFilter !== "all" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setProjectFilter("all");
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/new">Deploy Now</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
