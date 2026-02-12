"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  GitBranch,
  Globe,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Settings,
  Trash2,
  Copy,
  AlertCircle,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusConfig } from "@/lib/utils/status-config";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { useToast } from "@/components/notifications/toast";

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  framework: string;
  repositoryUrl?: string;
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
  nextjs: "\u25B2",
  "Next.js": "\u25B2",
  react: "\u269B\uFE0F",
  React: "\u269B\uFE0F",
  vue: "\uD83D\uDC9A",
  Vue: "\uD83D\uDC9A",
  astro: "\uD83D\uDE80",
  Astro: "\uD83D\uDE80",
  nodejs: "\uD83D\uDFE2",
  "Node.js": "\uD83D\uDFE2",
  docusaurus: "\uD83E\uDD96",
  Docusaurus: "\uD83E\uDD96",
  svelte: "\uD83D\uDD25",
  Svelte: "\uD83D\uDD25",
  gatsby: "\uD83D\uDC9C",
  Gatsby: "\uD83D\uDC9C",
  nuxt: "\uD83D\uDC9A",
  Nuxt: "\uD83D\uDC9A",
  remix: "\uD83D\uDCBF",
  Remix: "\uD83D\uDCBF",
};

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 max-w-[980px]">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="border-t border-[var(--separator,theme(colors.border))]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3.5 border-b border-[var(--separator,theme(colors.border))]">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-40 flex-1" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { addToast } = useToast();

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
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
        addToast({ type: "success", title: "Project deleted", message: `"${projectName}" has been removed` });
      } else {
        const data = await res.json();
        addToast({ type: "error", title: "Delete failed", message: data.error || "Failed to delete project" });
      }
    } catch {
      addToast({ type: "error", title: "Network error", message: "Could not connect to the server" });
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleCloneProject(projectId: string, projectName: string) {
    setActionInProgress(projectId);
    try {
      addToast({ type: "info", title: "Cloning project", message: `Creating a copy of "${projectName}"...` });
      const res = await fetch("/api/projects/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const cloned = await res.json();
        setProjects((prev) => [cloned, ...prev]);
        addToast({ type: "success", title: "Project cloned", message: `Created "${cloned.name}" successfully` });
      } else {
        const data = await res.json();
        addToast({ type: "error", title: "Clone failed", message: data.error || "Failed to clone project" });
      }
    } catch {
      addToast({ type: "error", title: "Network error", message: "Could not connect to the server" });
    } finally {
      setActionInProgress(null);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="px-6 py-8 max-w-[980px]">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-6 w-6 text-[var(--warning,theme(colors.yellow.500))] mb-4" />
          <h3 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            Something went wrong
          </h3>
          <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5">
            We could not load your projects.
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
          Projects
        </h1>
        <div className="flex items-center gap-3">
          {/* Search - inline in header */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary,theme(colors.muted.foreground/70))]" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`pl-9 h-9 transition-all duration-200 ${searchFocused ? "w-80" : "w-60"}`}
            />
          </div>
          <Button variant="default" asChild>
            <Link href="/new">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Project list - default to list view */}
      {filteredProjects.length > 0 ? (
        <div className="border-t border-[var(--separator,theme(colors.border))]">
          {filteredProjects.map((project) => {
            const lastDeployment = project.deployments[0];
            const domain = `${project.slug}.cloudify.tranthachnguyen.com`;
            const branch = lastDeployment?.branch || "main";
            const lastDeploymentTime = lastDeployment
              ? formatTimeAgo(lastDeployment.createdAt)
              : "No deployments";

            return (
              <div
                key={project.id}
                className="flex items-center gap-4 h-14 border-b border-[var(--separator,theme(colors.border))] hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors -mx-3 px-3 group"
              >
                {/* Framework icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] text-base shrink-0">
                  {frameworkIcons[project.framework] || "\uD83D\uDCE6"}
                </div>

                {/* Project name */}
                <Link
                  href={`/projects/${project.slug}`}
                  className="text-[16px] font-semibold text-[var(--text-primary,theme(colors.foreground))] hover:text-[var(--accent,#0071E3)] transition-colors min-w-[160px]"
                >
                  {project.name}
                </Link>

                {/* Branch */}
                <span className="flex items-center gap-1 text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[80px]">
                  <GitBranch className="h-3 w-3" />
                  {branch}
                </span>

                {/* Domain */}
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--accent,#0071E3)] transition-colors flex-1 truncate"
                >
                  {domain}
                </a>

                {/* Deployment count */}
                <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[100px]">
                  {project._count.deployments} deployments
                </span>

                {/* Updated time */}
                <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[100px] text-right">
                  Updated {lastDeploymentTime}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="h-8 w-8 text-[var(--text-tertiary,theme(colors.muted.foreground/70))] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
                    <DropdownMenuItem onClick={() => handleCloneProject(project.id, project.name)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-[var(--error,#FF3B30)]"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderPlus className="h-12 w-12 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] mb-4" strokeWidth={1.5} />
          <p className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            {searchQuery ? "No projects found" : "No projects yet"}
          </p>
          <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5 max-w-[280px]">
            {searchQuery
              ? "Try adjusting your search query."
              : "Create your first project to start deploying."}
          </p>
          <Button variant="default" onClick={() => searchQuery ? setSearchQuery("") : window.location.assign("/new")}>
            {searchQuery ? "Clear Search" : "New Project"}
          </Button>
        </div>
      )}
    </div>
  );
}
