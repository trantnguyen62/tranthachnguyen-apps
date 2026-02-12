"use client";

import { useState, useEffect } from "react";
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
  MoreHorizontal,
  ExternalLink,
  Settings,
  Trash2,
  Copy,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/utils/status-config";
import { formatTimeAgo } from "@/lib/utils/format-time";

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  framework: string;
  repoUrl?: string;
  deployments: Array<{
    id: string;
    status: string;
    createdAt: string;
    branch?: string;
  }>;
  _count: {
    deployments: number;
  };
  createdAt: string;
  updatedAt: string;
}

const frameworkIcons: Record<string, string> = {
  nextjs: "▲",
  "Next.js": "▲",
  react: "⚛️",
  React: "⚛️",
  vue: "💚",
  Vue: "💚",
  astro: "🚀",
  Astro: "🚀",
  nodejs: "🟢",
  "Node.js": "🟢",
  docusaurus: "🦖",
  Docusaurus: "🦖",
  svelte: "🔥",
  Svelte: "🔥",
  gatsby: "💜",
  Gatsby: "💜",
  nuxt: "💚",
  Nuxt: "💚",
  remix: "💿",
  Remix: "💿",
};

function LoadingSkeleton() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <Skeleton className="h-10 w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="flex justify-between pt-4 border-t">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      // Support both paginated and legacy array responses
      setProjects(Array.isArray(data) ? data : data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function handleDeleteProject(projectId: string, projectName: string) {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) return;
    setActionInProgress(projectId);
    try {
      const res = await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setActionMessage({ type: "success", text: `Project "${projectName}" deleted` });
      } else {
        const data = await res.json();
        setActionMessage({ type: "error", text: data.error || "Failed to delete project" });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" });
    } finally {
      setActionInProgress(null);
    }
    setTimeout(() => setActionMessage(null), 4000);
  }

  async function handleCloneProject(projectId: string, projectName: string) {
    setActionInProgress(projectId);
    try {
      setActionMessage({ type: "success", text: `Cloning "${projectName}"...` });
      const res = await fetch("/api/projects/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const cloned = await res.json();
        setProjects((prev) => [cloned, ...prev]);
        setActionMessage({ type: "success", text: `Project cloned as "${cloned.name}"` });
      } else {
        const data = await res.json();
        setActionMessage({ type: "error", text: data.error || "Failed to clone project" });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error" });
    } finally {
      setActionInProgress(null);
    }
    setTimeout(() => setActionMessage(null), 4000);
  }

  useEffect(() => {
    fetchProjects();
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
                <h3 className="font-semibold">Failed to load projects</h3>
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

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

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
            Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-muted-foreground"
          >
            Manage your deployed projects and applications.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="default" asChild>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 && (
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
            const lastDeployment = project.deployments[0];
            const projectStatus = lastDeployment?.status?.toLowerCase() || "ready";
            const status = getStatusConfig(projectStatus);
            const StatusIcon = status.icon;
            const domain = `${project.slug}.cloudify.tranthachnguyen.com`;
            const branch = lastDeployment?.branch || "main";
            const lastDeploymentTime = lastDeployment
              ? formatTimeAgo(lastDeployment.createdAt)
              : "No deployments";

            if (viewMode === "list") {
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
                          {frameworkIcons[project.framework] || "📦"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/projects/${project.slug}`}
                              className="font-semibold text-foreground hover:text-[#0070f3] dark:hover:text-[#0070f3]"
                            >
                              {project.name}
                            </Link>
                            <Badge variant={projectStatus === "ready" ? "success" : projectStatus === "error" || projectStatus === "failed" ? "error" : "warning"}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {project.description || `${project.framework} project`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-foreground">
                            {domain}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {project._count.deployments} deployments
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
                              <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Visit
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.slug}/settings`}>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCloneProject(project.id, project.name)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDeleteProject(project.id, project.name)}
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
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
                            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.slug}/settings`}>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCloneProject(project.id, project.name)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteProject(project.id, project.name)}
                          >
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
                          href={`/projects/${project.slug}`}
                          className="font-semibold text-foreground hover:text-[#0070f3] dark:hover:text-[#0070f3]"
                        >
                          {project.name}
                        </Link>
                        <div className={`p-1 rounded-full ${status.bg}`}>
                          <StatusIcon
                            className={`h-3 w-3 ${status.color} ${
                              projectStatus === "building" ? "animate-spin" : ""
                            }`}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || `${project.framework} project`}
                      </p>
                    </div>

                    {/* Domain */}
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`https://${domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0070f3] hover:underline"
                      >
                        {domain}
                      </a>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GitBranch className="h-4 w-4" />
                        {branch}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {lastDeploymentTime}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No projects found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try adjusting your search query"
              : "Get started by importing your first project"}
          </p>
          {!searchQuery && (
            <Button variant="default" asChild>
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
