"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GitBranch,
  GitCommit,
  Clock,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Eye,
  RotateCcw,
  Trash2,
  Filter,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/utils/status-config";
import { formatTimeAgo } from "@/lib/utils/format-time";

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

function LoadingSkeleton() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-96 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleRollback(deploymentId: string) {
    setActionLoading(deploymentId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/rollback`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: "success", text: `Rolled back successfully (${data.rollbackTime}ms)` });
        fetchDeployments();
      } else {
        setActionMessage({ type: "error", text: data.error || "Rollback failed" });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  }

  async function handleRedeploy(deployment: Deployment) {
    setActionLoading(deployment.id);
    setActionMessage(null);
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
        setActionMessage({ type: "success", text: "Redeployment triggered" });
        fetchDeployments();
      } else {
        setActionMessage({ type: "error", text: data.error || "Redeploy failed" });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  }

  async function handleDelete(deploymentId: string) {
    if (!confirm("Are you sure you want to delete this deployment?")) return;
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`/api/deploy?id=${deploymentId}`, { method: "DELETE" });
      if (res.ok) {
        setActionMessage({ type: "success", text: "Deployment cancelled" });
        fetchDeployments();
      } else {
        const data = await res.json();
        setActionMessage({ type: "error", text: data.error || "Delete failed" });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  }

  async function fetchDeployments() {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDeployments();
  }, [statusFilter, projectFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeployments();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Failed to load deployments</h3>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground"
          >
            Deployments
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-muted-foreground"
          >
            View and manage all your deployments across projects.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 mb-6"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "All Status" : getStatusConfig(statusFilter).label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter("ready")}>
              Ready
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("building")}>
              Building
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("error")}>
              Error
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("canceled")}>
              Canceled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {projectFilter === "all"
                ? "All Projects"
                : projects.find((p) => p.id === projectFilter)?.name || projectFilter}
              <ChevronDown className="h-4 w-4" />
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
      </motion.div>

      {/* Action Message */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm",
            actionMessage.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          )}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {actionMessage.text}
        </motion.div>
      )}

      {/* Deployments List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {deployments.map((deployment, index) => {
          const status = getStatusConfig(deployment.status);
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={deployment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={cn("p-2 rounded-lg mt-1", status.bg)}>
                        <StatusIcon
                          className={cn(
                            "h-5 w-5",
                            status.color,
                            deployment.status === "building" && "animate-spin"
                          )}
                        />
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <Link
                            href={`/projects/${deployment.projectSlug}`}
                            className="font-semibold text-foreground hover:text-[#0070f3] dark:hover:text-[#0070f3]"
                          >
                            {deployment.project}
                          </Link>
                          {deployment.isProduction && (
                            <Badge variant="default" className="text-xs">
                              Production
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            <GitBranch className="h-3 w-3 mr-1" />
                            {deployment.branch}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {deployment.commitMessage}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitCommit className="h-3 w-3" />
                            {deployment.commit}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(deployment.createdAt)}
                          </span>
                          {deployment.duration && (
                            <span>Duration: {deployment.duration}</span>
                          )}
                        </div>

                        {deployment.error && (
                          <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                            {deployment.error}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {deployment.status === "ready" && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://${deployment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Visit
                          </a>
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/deployments/${deployment.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Logs
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRedeploy(deployment)}
                            disabled={actionLoading === deployment.id}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Redeploy
                          </DropdownMenuItem>
                          {deployment.status === "ready" && !deployment.isProduction && (
                            <DropdownMenuItem
                              onClick={() => handleRollback(deployment.id)}
                              disabled={actionLoading === deployment.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Promote to Production
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDelete(deployment.id)}
                            disabled={actionLoading === deployment.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state */}
      {deployments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No deployments found
          </h3>
          <p className="text-muted-foreground">
            {statusFilter !== "all" || projectFilter !== "all"
              ? "Try adjusting your filters or deploy a new project."
              : "Deploy your first project to see deployments here."}
          </p>
          <Button asChild className="mt-4">
            <Link href="/new">Create Project</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
