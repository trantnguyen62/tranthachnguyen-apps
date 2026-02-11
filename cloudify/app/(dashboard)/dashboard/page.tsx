"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Globe,
  Activity,
  Clock,
  CheckCircle2,
  Plus,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusConfig } from "@/lib/utils/status-config";

interface DashboardData {
  stats: {
    projectCount: number;
    deploymentCount: number;
    bandwidthUsed: string;
    bandwidthLimit: string;
    uptime: string;
  };
  recentDeployments: Array<{
    id: string;
    project: string;
    projectId: string;
    branch: string;
    commit: string;
    status: string;
    time: string;
    url: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    framework: string;
    status: string;
    lastDeployment: string;
  }>;
  usage: {
    bandwidth: {
      used: number;
      usedFormatted: string;
      limit: number;
      limitFormatted: string;
      percentage: number;
    };
    buildMinutes: {
      used: number;
      limit: number;
      percentage: number;
    };
    requests: {
      used: number;
      usedFormatted: string;
      limit: number;
      limitFormatted: string;
      percentage: number;
    };
  };
}

function LoadingSkeleton() {
  return (
    <div className="p-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-9 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

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
                <h3 className="font-semibold">Failed to load dashboard</h3>
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

  if (!data) {
    return null;
  }

  const stats = [
    {
      name: "Active Projects",
      value: data.stats.projectCount.toString(),
      change: "Total projects",
      icon: Globe,
    },
    {
      name: "Deployments",
      value: data.stats.deploymentCount.toString(),
      change: "All time",
      icon: GitBranch,
    },
    {
      name: "Bandwidth Used",
      value: `${data.stats.bandwidthUsed} GB`,
      change: `of ${data.stats.bandwidthLimit} GB`,
      icon: Activity,
    },
    {
      name: "Uptime",
      value: `${data.stats.uptime}%`,
      change: "Last 30 days",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-muted-foreground"
        >
          Welcome back! Here&apos;s what&apos;s happening with your projects.
        </motion.p>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        {stats.map((stat) => (
          <Card key={stat.name} className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <stat.icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.name}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Deployments */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Deployments</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/deployments">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentDeployments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No deployments yet</p>
                  <p className="text-sm">Create a project to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentDeployments.map((deployment) => {
                    const status = getStatusConfig(deployment.status);
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${status.bg}`}>
                            <StatusIcon
                              className={`h-4 w-4 ${status.color} ${
                                deployment.status === "building" ? "animate-spin" : ""
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {deployment.project}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {deployment.branch}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {deployment.commit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {deployment.time}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={`https://${deployment.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Projects */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/new">
                  <Plus className="h-4 w-4" />
                  Import Project
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/domains">
                  <Globe className="h-4 w-4" />
                  Add Domain
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <GitBranch className="h-4 w-4" />
                  Connect Git
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.projects.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Globe className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/new">Create your first project</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.projects.map((project) => {
                    const status = getStatusConfig(project.status);
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="block p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-foreground">
                            {project.name}
                          </div>
                          <Badge variant={project.status === "ready" ? "success" : "warning"}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {project.framework} • {project.lastDeployment}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Bandwidth", used: data.usage.bandwidth.usedFormatted, limit: data.usage.bandwidth.limitFormatted, pct: data.usage.bandwidth.percentage },
                { label: "Build Minutes", used: String(data.usage.buildMinutes.used), limit: String(data.usage.buildMinutes.limit), pct: data.usage.buildMinutes.percentage },
                { label: "Serverless Executions", used: data.usage.requests.usedFormatted, limit: data.usage.requests.limitFormatted, pct: data.usage.requests.percentage },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-medium ${item.pct >= 90 ? "text-red-600 dark:text-red-400" : item.pct >= 75 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"}`}>
                      {item.used} / {item.limit}
                    </span>
                  </div>
                  <Progress
                    value={item.pct}
                    className={item.pct >= 90 ? "[&>div]:bg-red-500" : item.pct >= 75 ? "[&>div]:bg-yellow-500" : ""}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
