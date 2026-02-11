"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  GitBranch,
  Clock,
  Cpu,
  MemoryStick,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Terminal,
  Rocket,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SystemMetrics {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
  };
  deployments: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    recent: DeploymentInfo[];
  };
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
  cicd: {
    lastDeployment: string | null;
    lastCommit: string | null;
    branch: string | null;
    buildNumber: string | null;
  };
}

interface ServiceStatus {
  status: "operational" | "degraded" | "down";
  latency?: number;
  error?: string;
  lastChecked: string;
}

interface DeploymentInfo {
  id: string;
  projectName: string;
  status: string;
  createdAt: string;
  duration?: number;
  commit?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: "All Systems Operational",
    color: "text-green-500",
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Performance Degraded",
    color: "text-yellow-500",
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  unhealthy: {
    icon: XCircle,
    label: "System Issues Detected",
    color: "text-red-500",
    bg: "bg-red-500",
    bgLight: "bg-red-50 dark:bg-red-900/20",
  },
};

const serviceStatusConfig = {
  operational: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  down: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
};

const deploymentStatusConfig: Record<string, { color: string; bg: string }> = {
  READY: { color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  ERROR: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
  BUILDING: { color: "text-[#0070f3]", bg: "bg-secondary" },
  DEPLOYING: { color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  QUEUED: { color: "text-gray-600", bg: "bg-secondary" },
  CANCELLED: { color: "text-muted-foreground", bg: "bg-secondary" },
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/monitoring");
      if (!response.ok) throw new Error("Failed to fetch metrics");
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="h-12 w-12 text-red-500" />
          <div>
            <p className="font-semibold text-foreground">Failed to load metrics</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={fetchMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const config = statusConfig[metrics.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Platform Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time health status and metrics for Cloudify
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "border-green-500 text-green-600")}
          >
            <Activity className={cn("h-4 w-4 mr-2", autoRefresh && "animate-pulse")} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("p-6 rounded-xl border", config.bgLight)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full", config.bg, "bg-opacity-20")}>
              <StatusIcon className={cn("h-8 w-8", config.color)} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {config.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                Version {metrics.version} • {metrics.environment} • Node {metrics.system.nodeVersion}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Uptime: {formatUptime(metrics.uptime)}
            </div>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Updated {formatRelativeTime(lastUpdated.toISOString())}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics.services).map(([name, service], index) => {
          const sConfig = serviceStatusConfig[service.status];
          const Icon = sConfig.icon;
          const serviceIcon = {
            api: Server,
            database: Database,
            redis: HardDrive,
            storage: Box,
          }[name] || Server;
          const ServiceIcon = serviceIcon;

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium capitalize text-foreground">
                    {name}
                  </span>
                </div>
                <Icon className={cn("h-5 w-5", sConfig.color)} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={cn(sConfig.bg, sConfig.color, "capitalize")}>
                    {service.status}
                  </Badge>
                </div>
                {service.latency !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="text-foreground">{service.latency}ms</span>
                  </div>
                )}
                {service.error && (
                  <p className="text-xs text-red-500 mt-2 truncate" title={service.error}>
                    {service.error}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Rocket className="h-5 w-5 text-[#0070f3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {metrics.deployments.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Deployments</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {metrics.deployments.successful}
              </p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {metrics.deployments.failed}
              </p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Loader2 className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {metrics.deployments.pending}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CI/CD Status */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Platform CI/CD
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Branch</span>
              <Badge variant="outline">{metrics.cicd.branch || "main"}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Last Commit</span>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {metrics.cicd.lastCommit?.substring(0, 7) || "N/A"}
              </code>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Build Number</span>
              <span className="text-foreground">
                {metrics.cicd.buildNumber || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Last Deployment</span>
              <span className="text-foreground">
                {metrics.cicd.lastDeployment
                  ? formatRelativeTime(metrics.cicd.lastDeployment)
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            System Resources
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  Heap Memory
                </span>
                <span className="text-sm text-foreground">
                  {metrics.system.memoryUsage.heapUsed} / {metrics.system.memoryUsage.heapTotal} MB
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all"
                  style={{
                    width: `${(metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">RSS Memory</span>
                <span className="text-sm text-foreground">
                  {metrics.system.memoryUsage.rss} MB
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((metrics.system.memoryUsage.rss / 512) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span className="text-foreground capitalize">
                  {metrics.system.platform}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="p-6 bg-card rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Recent Deployments
        </h3>
        {metrics.deployments.recent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No deployments yet
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {metrics.deployments.recent.map((deployment, index) => {
                const dConfig = deploymentStatusConfig[deployment.status] || {
                  color: "text-gray-600",
                  bg: "bg-gray-100",
                };
                return (
                  <motion.div
                    key={deployment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", dConfig.bg)}>
                        <GitBranch className={cn("h-4 w-4", dConfig.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {deployment.projectName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {deployment.commit && (
                            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                              {deployment.commit.substring(0, 7)}
                            </code>
                          )}
                          <span>{formatRelativeTime(deployment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {deployment.duration && (
                        <span className="text-sm text-muted-foreground">
                          {deployment.duration}s
                        </span>
                      )}
                      <Badge className={cn(dConfig.bg, dConfig.color)}>
                        {deployment.status}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* External Links */}
      <div className="flex items-center gap-4 text-sm">
        <a
          href="https://grafana.tranthachnguyen.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Globe className="h-4 w-4" />
          Grafana Dashboard
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href="https://prometheus.tranthachnguyen.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Activity className="h-4 w-4" />
          Prometheus Metrics
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
