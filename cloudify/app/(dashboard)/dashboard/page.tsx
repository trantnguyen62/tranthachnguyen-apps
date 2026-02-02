"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Globe,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    name: "Active Projects",
    value: "12",
    change: "+2 this month",
    icon: Globe,
  },
  {
    name: "Deployments",
    value: "248",
    change: "+48 this week",
    icon: GitBranch,
  },
  {
    name: "Bandwidth Used",
    value: "45.2 GB",
    change: "of 100 GB",
    icon: Activity,
  },
  {
    name: "Uptime",
    value: "99.99%",
    change: "Last 30 days",
    icon: CheckCircle2,
  },
];

const recentDeployments = [
  {
    id: "dep-1",
    project: "my-portfolio",
    branch: "main",
    commit: "feat: add contact form",
    status: "ready",
    time: "2 minutes ago",
    url: "my-portfolio.cloudify.app",
  },
  {
    id: "dep-2",
    project: "ecommerce-store",
    branch: "feature/checkout",
    commit: "fix: cart total calculation",
    status: "building",
    time: "5 minutes ago",
    url: "ecommerce-store-git-feature-checkout.cloudify.app",
  },
  {
    id: "dep-3",
    project: "blog-app",
    branch: "main",
    commit: "docs: update readme",
    status: "ready",
    time: "1 hour ago",
    url: "blog-app.cloudify.app",
  },
  {
    id: "dep-4",
    project: "api-service",
    branch: "develop",
    commit: "refactor: auth middleware",
    status: "error",
    time: "2 hours ago",
    url: "api-service-git-develop.cloudify.app",
  },
];

const projects = [
  {
    id: "proj-1",
    name: "my-portfolio",
    framework: "Next.js",
    domain: "my-portfolio.cloudify.app",
    lastDeployment: "2 minutes ago",
    status: "ready",
  },
  {
    id: "proj-2",
    name: "ecommerce-store",
    framework: "React",
    domain: "ecommerce-store.cloudify.app",
    lastDeployment: "5 minutes ago",
    status: "building",
  },
  {
    id: "proj-3",
    name: "blog-app",
    framework: "Astro",
    domain: "blog-app.cloudify.app",
    lastDeployment: "1 hour ago",
    status: "ready",
  },
];

const statusConfig = {
  ready: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    label: "Ready",
  },
  building: {
    icon: Loader2,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Building",
  },
  error: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Error",
  },
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-gray-600 dark:text-gray-400"
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
        {stats.map((stat, index) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <div className="space-y-4">
                {recentDeployments.map((deployment) => {
                  const status = statusConfig[deployment.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                            <span className="font-medium text-gray-900 dark:text-white">
                              {deployment.project}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {deployment.branch}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {deployment.commit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
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
              <div className="space-y-3">
                {projects.map((project) => {
                  const status = statusConfig[project.status as keyof typeof statusConfig];
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.name}`}
                      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </div>
                        <Badge variant={project.status === "ready" ? "success" : "warning"}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {project.framework} • {project.lastDeployment}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Bandwidth</span>
                  <span className="font-medium text-gray-900 dark:text-white">45.2 / 100 GB</span>
                </div>
                <Progress value={45.2} />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Build Minutes</span>
                  <span className="font-medium text-gray-900 dark:text-white">320 / 6000</span>
                </div>
                <Progress value={5.3} />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Serverless Executions</span>
                  <span className="font-medium text-gray-900 dark:text-white">12.4k / 100k</span>
                </div>
                <Progress value={12.4} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
