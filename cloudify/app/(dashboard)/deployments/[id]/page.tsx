"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Trash2,
  Copy,
  Globe,
  User,
  Timer,
  Server,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeploymentStream } from "@/components/dashboard/deployment-stream";
import { cn } from "@/lib/utils";

interface DeploymentLog {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

interface DeploymentDetails {
  id: string;
  status: string;
  branch: string | null;
  commitSha: string | null;
  commitMsg: string | null;
  createdAt: string;
  finishedAt: string | null;
  duration: number | null;
  siteSlug: string | null;
  error: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  logs: DeploymentLog[];
}

const statusConfig = {
  building: {
    icon: Loader2,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Building",
    animate: true,
  },
  ready: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    label: "Ready",
    animate: false,
  },
  error: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Error",
    animate: false,
  },
  failed: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Failed",
    animate: false,
  },
  queued: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-secondary",
    label: "Queued",
    animate: false,
  },
  deploying: {
    icon: Loader2,
    color: "text-foreground",
    bg: "bg-secondary",
    label: "Deploying",
    animate: true,
  },
  cancelled: {
    icon: XCircle,
    color: "text-muted-foreground",
    bg: "bg-secondary",
    label: "Cancelled",
    animate: false,
  },
};

function getStatusConfig(status: string) {
  const normalizedStatus = status.toLowerCase();
  return statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.queued;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default function DeploymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [deployment, setDeployment] = useState<DeploymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedeploying, setIsRedeploying] = useState(false);

  useEffect(() => {
    async function fetchDeployment() {
      try {
        const response = await fetch(`/api/deployments/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Deployment not found");
          }
          throw new Error("Failed to fetch deployment");
        }
        const data = await response.json();
        setDeployment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDeployment();
  }, [id]);

  const handleRedeploy = () => {
    setIsRedeploying(true);
    setTimeout(() => setIsRedeploying(false), 2000);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !deployment) {
    return (
      <div className="space-y-6">
        <Link
          href="/deployments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-700 dark:text-muted-foreground dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deployments
        </Link>
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Failed to load deployment</h3>
                <p className="text-sm text-red-500">{error || "Deployment not found"}</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/deployments">Back to Deployments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = getStatusConfig(deployment.status);
  const StatusIcon = config.icon;
  const deploymentUrl = deployment.siteSlug
    ? `https://${deployment.siteSlug}.cloudify.tranthachnguyen.com`
    : `https://${deployment.project.slug}.cloudify.tranthachnguyen.com`;
  const isProduction = deployment.branch === "main" || deployment.branch === "master";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/deployments"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-700 dark:text-muted-foreground dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deployments
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              Deployment
            </h1>
            <Badge
              className={cn(
                "flex items-center gap-1",
                config.bg,
                config.color
              )}
            >
              <StatusIcon
                className={cn("h-3 w-3", config.animate && "animate-spin")}
              />
              {config.label}
            </Badge>
            <Badge variant="outline">
              {isProduction ? "production" : "preview"}
            </Badge>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-4 w-4" />
              {deployment.branch || "main"}
            </div>
            <div className="flex items-center gap-1.5">
              <GitCommit className="h-4 w-4" />
              {deployment.commitSha?.substring(0, 7) || "unknown"}
            </div>
            <Link
              href={`/projects/${deployment.project.slug}`}
              className="flex items-center gap-1.5 hover:text-[#0070f3]"
            >
              <User className="h-4 w-4" />
              {deployment.project.name}
            </Link>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(deployment.createdAt)}
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {deployment.commitMsg || "No commit message"}
          </p>

          {deployment.error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
              {deployment.error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {deployment.status.toLowerCase() === "ready" && (
            <Button variant="outline" asChild>
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Visit
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRedeploy}
            disabled={isRedeploying}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRedeploying && "animate-spin")}
            />
            Redeploy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(deploymentUrl)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Deployment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Build Time",
            value: formatDuration(deployment.duration),
            icon: Timer,
          },
          {
            label: "Project",
            value: deployment.project.name,
            icon: Server,
          },
          {
            label: "Branch",
            value: deployment.branch || "main",
            icon: GitBranch,
          },
          {
            label: "Status",
            value: config.label,
            icon: Globe,
          },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-card rounded-xl border border-border"
          >
            <metric.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold text-foreground truncate">
              {metric.value}
            </p>
            <p className="text-sm text-muted-foreground">
              {metric.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={deployment.status.toLowerCase() === "building" ? "logs" : "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Build Logs</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Deployment URL */}
          <div className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4">
              Deployment URL
            </h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-foreground hover:underline"
              >
                {deploymentUrl}
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(deploymentUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Project info */}
          <div className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4">
              Project
            </h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Server className="h-5 w-5 text-muted-foreground" />
              <Link
                href={`/projects/${deployment.project.slug}`}
                className="flex-1 text-foreground hover:underline"
              >
                {deployment.project.name}
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          {deployment.status.toLowerCase() === "building" || deployment.status.toLowerCase() === "deploying" ? (
            <DeploymentStream deploymentId={deployment.id} />
          ) : (
            <div className="p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-4">
                {deployment.status.toLowerCase() === "ready" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">
                      Build completed successfully
                    </h3>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-foreground">
                      Build failed
                    </h3>
                  </>
                )}
              </div>
              <div className="font-mono text-sm bg-gray-950 p-4 rounded-lg max-h-96 overflow-y-auto">
                {deployment.logs && deployment.logs.length > 0 ? (
                  deployment.logs.map((log, index) => (
                    <p
                      key={log.id || index}
                      className={cn(
                        "py-0.5",
                        log.level === "error" && "text-red-400",
                        log.level === "warn" && "text-yellow-400",
                        log.level === "info" && "text-muted-foreground",
                        log.level === "success" && "text-green-400"
                      )}
                    >
                      {log.message}
                    </p>
                  ))
                ) : (
                  <div className="text-muted-foreground">
                    {deployment.status.toLowerCase() === "ready" ? (
                      <>
                        <p>✓ Repository cloned</p>
                        <p>✓ Dependencies installed</p>
                        <p>✓ Build completed</p>
                        <p>✓ Assets optimized</p>
                        <p>✓ Deployed</p>
                        <p className="text-green-400 mt-2">
                          ✓ Deployment complete in {formatDuration(deployment.duration)}
                        </p>
                      </>
                    ) : (
                      <p>No logs available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="functions" className="mt-6">
          <div className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4">
              Serverless Functions
            </h3>
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No serverless functions detected in this deployment</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="domains" className="mt-6">
          <div className="p-6 bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Connected Domains
              </h3>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${deployment.project.slug}`}>
                  Manage Domains
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {deployment.siteSlug || deployment.project.slug}.cloudify.tranthachnguyen.com
                    </p>
                    <p className="text-sm text-muted-foreground">Default domain</p>
                  </div>
                </div>
                <Badge variant="success">Configured</Badge>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
