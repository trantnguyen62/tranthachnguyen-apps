"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GitBranch,
  GitCommit,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Eye,
  RotateCcw,
  Trash2,
  Filter,
  ChevronDown,
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
import { cn } from "@/lib/utils";

const deployments = [
  {
    id: "dep-1",
    project: "my-portfolio",
    branch: "main",
    commit: "a1b2c3d",
    commitMessage: "feat: add contact form with validation",
    author: "John Doe",
    status: "ready",
    createdAt: "2 minutes ago",
    duration: "45s",
    url: "my-portfolio-abc123.cloudify.app",
    isProduction: true,
  },
  {
    id: "dep-2",
    project: "ecommerce-store",
    branch: "feature/checkout",
    commit: "e4f5g6h",
    commitMessage: "fix: cart total calculation and tax display",
    author: "Jane Smith",
    status: "building",
    createdAt: "5 minutes ago",
    duration: null,
    url: "ecommerce-store-git-feature-checkout.cloudify.app",
    isProduction: false,
  },
  {
    id: "dep-3",
    project: "blog-app",
    branch: "main",
    commit: "i7j8k9l",
    commitMessage: "docs: update README with deployment instructions",
    author: "John Doe",
    status: "ready",
    createdAt: "1 hour ago",
    duration: "32s",
    url: "blog-app-def456.cloudify.app",
    isProduction: true,
  },
  {
    id: "dep-4",
    project: "api-service",
    branch: "develop",
    commit: "m1n2o3p",
    commitMessage: "refactor: auth middleware for better security",
    author: "Mike Johnson",
    status: "error",
    createdAt: "2 hours ago",
    duration: "1m 23s",
    url: "api-service-git-develop.cloudify.app",
    isProduction: false,
    error: "Build failed: Module not found",
  },
  {
    id: "dep-5",
    project: "my-portfolio",
    branch: "main",
    commit: "q4r5s6t",
    commitMessage: "style: improve responsive design on mobile",
    author: "John Doe",
    status: "ready",
    createdAt: "3 hours ago",
    duration: "38s",
    url: "my-portfolio-ghi789.cloudify.app",
    isProduction: false,
  },
  {
    id: "dep-6",
    project: "ecommerce-store",
    branch: "main",
    commit: "u7v8w9x",
    commitMessage: "feat: add product search functionality",
    author: "Jane Smith",
    status: "ready",
    createdAt: "5 hours ago",
    duration: "52s",
    url: "ecommerce-store-jkl012.cloudify.app",
    isProduction: true,
  },
  {
    id: "dep-7",
    project: "blog-app",
    branch: "feature/comments",
    commit: "y1z2a3b",
    commitMessage: "feat: implement comment system with moderation",
    author: "John Doe",
    status: "canceled",
    createdAt: "6 hours ago",
    duration: null,
    url: "blog-app-git-feature-comments.cloudify.app",
    isProduction: false,
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
  canceled: {
    icon: XCircle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    label: "Canceled",
  },
};

export default function DeploymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const projects = [...new Set(deployments.map((d) => d.project))];

  const filteredDeployments = deployments.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (projectFilter !== "all" && d.project !== projectFilter) return false;
    return true;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Deployments
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600 dark:text-gray-400"
          >
            View and manage all your deployments across projects.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="outline">
            <RefreshCw className="h-4 w-4" />
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
              {statusFilter === "all" ? "All Status" : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
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
              {projectFilter === "all" ? "All Projects" : projectFilter}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setProjectFilter("all")}>
              All Projects
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {projects.map((project) => (
              <DropdownMenuItem key={project} onClick={() => setProjectFilter(project)}>
                {project}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Deployments List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {filteredDeployments.map((deployment, index) => {
          const status = statusConfig[deployment.status as keyof typeof statusConfig];
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
                            href={`/projects/${deployment.project}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
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

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {deployment.commitMessage}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <GitCommit className="h-3 w-3" />
                            {deployment.commit}
                          </span>
                          <span>{deployment.author}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {deployment.createdAt}
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Redeploy
                          </DropdownMenuItem>
                          {deployment.status === "ready" && !deployment.isProduction && (
                            <DropdownMenuItem>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Promote to Production
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 dark:text-red-400">
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
      {filteredDeployments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No deployments found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters or deploy a new project.
          </p>
        </div>
      )}
    </div>
  );
}
