"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  GitBranch,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  Settings,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const projects = [
  {
    id: "proj-1",
    name: "my-portfolio",
    description: "Personal portfolio website built with Next.js",
    framework: "Next.js",
    domain: "my-portfolio.cloudify.app",
    customDomain: "johndoe.com",
    gitRepo: "github.com/johndoe/portfolio",
    branch: "main",
    lastDeployment: "2 minutes ago",
    status: "ready",
    deployments: 48,
  },
  {
    id: "proj-2",
    name: "ecommerce-store",
    description: "Full-stack e-commerce platform",
    framework: "React",
    domain: "ecommerce-store.cloudify.app",
    gitRepo: "github.com/johndoe/ecommerce",
    branch: "main",
    lastDeployment: "5 minutes ago",
    status: "building",
    deployments: 124,
  },
  {
    id: "proj-3",
    name: "blog-app",
    description: "Personal blog with MDX support",
    framework: "Astro",
    domain: "blog-app.cloudify.app",
    customDomain: "blog.johndoe.com",
    gitRepo: "github.com/johndoe/blog",
    branch: "main",
    lastDeployment: "1 hour ago",
    status: "ready",
    deployments: 67,
  },
  {
    id: "proj-4",
    name: "api-service",
    description: "REST API backend service",
    framework: "Node.js",
    domain: "api-service.cloudify.app",
    gitRepo: "github.com/johndoe/api",
    branch: "develop",
    lastDeployment: "2 hours ago",
    status: "error",
    deployments: 89,
  },
  {
    id: "proj-5",
    name: "mobile-app-landing",
    description: "Landing page for mobile app",
    framework: "Vue",
    domain: "mobile-app-landing.cloudify.app",
    gitRepo: "github.com/johndoe/mobile-landing",
    branch: "main",
    lastDeployment: "3 hours ago",
    status: "ready",
    deployments: 23,
  },
  {
    id: "proj-6",
    name: "documentation-site",
    description: "Product documentation website",
    framework: "Docusaurus",
    domain: "documentation-site.cloudify.app",
    customDomain: "docs.acme.com",
    gitRepo: "github.com/acme/docs",
    branch: "main",
    lastDeployment: "1 day ago",
    status: "ready",
    deployments: 156,
  },
];

const frameworkIcons: Record<string, string> = {
  "Next.js": "▲",
  React: "⚛️",
  Vue: "💚",
  Astro: "🚀",
  "Node.js": "🟢",
  Docusaurus: "🦖",
};

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

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600 dark:text-gray-400"
          >
            Manage your deployed projects and applications.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="primary" asChild>
            <Link href="/new">
              <Plus className="h-4 w-4" />
              Add New
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between gap-4 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Projects Grid/List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}
      >
        {filteredProjects.map((project, index) => {
          const status = statusConfig[project.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          if (viewMode === "list") {
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-2xl">
                        {frameworkIcons[project.framework] || "📦"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${project.name}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {project.name}
                          </Link>
                          <Badge variant={project.status === "ready" ? "success" : project.status === "error" ? "error" : "warning"}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {project.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {project.customDomain || project.domain}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {project.deployments} deployments
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.name}/settings`}>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
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
            );
          }

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow group">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-2xl">
                      {frameworkIcons[project.framework] || "📦"}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.name}/settings`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Project info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/projects/${project.name}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {project.name}
                      </Link>
                      <div className={`p-1 rounded-full ${status.bg}`}>
                        <StatusIcon
                          className={`h-3 w-3 ${status.color} ${
                            project.status === "building" ? "animate-spin" : ""
                          }`}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Domain */}
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a
                      href={`https://${project.customDomain || project.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {project.customDomain || project.domain}
                    </a>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <GitBranch className="h-4 w-4" />
                      {project.branch}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      {project.lastDeployment}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery
              ? "Try adjusting your search query"
              : "Get started by importing your first project"}
          </p>
          {!searchQuery && (
            <Button variant="primary" asChild>
              <Link href="/new">
                <Plus className="h-4 w-4" />
                Import Project
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
