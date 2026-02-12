"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  GitBranch,
  Globe,
  Settings,
  MoreHorizontal,
  RefreshCw,
  Copy,
  RotateCcw,
  Trash2,
  Eye,
  AlertCircle,
  Code,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildLogs } from "@/components/dashboard/build-logs";
import { EnvVariables } from "@/components/dashboard/env-variables";
import { getStatusConfig } from "@/lib/utils/status-config";

interface Deployment {
  id: string;
  status: string;
  branch: string;
  commit: string;
  commitMessage: string;
  time: string;
  duration: string | null;
  isProduction: boolean;
  url: string;
}

interface Domain {
  id: string;
  domain: string;
  isPrimary: boolean;
  verified: boolean;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  framework: string | null;
  repositoryUrl: string | null;
  repositoryBranch: string | null;
  createdAt: string;
  deployments: Deployment[];
  lastDeployment: Deployment | null;
  domains: Domain[];
}

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 max-w-[980px]">
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-96 mb-8" />
      <Skeleton className="h-10 w-96 mb-6" />
      <div className="space-y-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--separator,theme(colors.border))]">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-48 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectSlug = params.name as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [snippetCopied, setSnippetCopied] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/by-slug/${projectSlug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Project not found");
          }
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data);
        if (data.deployments?.length > 0) {
          setSelectedDeployment(data.deployments[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectSlug]);

  const copyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="px-6 py-8 max-w-[980px]">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-6 w-6 text-[var(--warning,theme(colors.yellow.500))] mb-4" />
          <h3 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            {error === "Project not found" ? "Project not found" : "Something went wrong"}
          </h3>
          <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5">
            {error || "Could not load project details."}
          </p>
          <Button variant="secondary" asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  const primaryDomain = project.domains?.find((d) => d.isPrimary)?.domain || `${project.slug}.cloudify.tranthachnguyen.com`;
  const lastCommit = project.lastDeployment?.commit?.slice(0, 7);
  const lastBranch = project.lastDeployment?.branch || project.repositoryBranch || "main";
  const lastTime = project.lastDeployment?.time || "No deployments";

  // Status dot color
  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "bg-[var(--success,#34C759)]";
      case "building":
        return "bg-[var(--warning,#FF9F0A)] animate-pulse";
      case "error":
      case "failed":
        return "bg-[var(--error,#FF3B30)]";
      default:
        return "bg-[var(--text-quaternary,theme(colors.muted.foreground))]";
    }
  };

  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors mb-6"
      >
        &larr; Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
          {project.name}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <a href={`https://${primaryDomain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Visit
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${project.slug}/settings`}>
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="default" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Redeploy
          </Button>
        </div>
      </div>

      {/* Metadata line */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-8">
        <span>{project.framework || "Next.js"}</span>
        <span className="text-[var(--text-quaternary,theme(colors.muted.foreground/40))]">&middot;</span>
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          {lastBranch}
        </span>
        {lastCommit && (
          <>
            <span className="text-[var(--text-quaternary,theme(colors.muted.foreground/40))]">&middot;</span>
            <span className="font-mono">{lastCommit}</span>
          </>
        )}
        <span className="text-[var(--text-quaternary,theme(colors.muted.foreground/40))]">&middot;</span>
        <span>Updated {lastTime}</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deployments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="logs">Build Logs</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>

        {/* Deployments Tab */}
        <TabsContent value="deployments">
          {project.deployments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GitBranch className="h-12 w-12 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] mb-4" strokeWidth={1.5} />
              <p className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
                No deployments yet
              </p>
              <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] max-w-[280px]">
                Push to your repository to trigger a deployment.
              </p>
            </div>
          ) : (
            <div className="border-t border-[var(--separator,theme(colors.border))]">
              {project.deployments.map((deployment) => (
                <Link
                  key={deployment.id}
                  href={`/deployments/${deployment.id}`}
                  className="flex items-center gap-4 py-3 border-b border-[var(--separator,theme(colors.border))] hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors -mx-3 px-3 group"
                >
                  {/* Status dot */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDotColor(deployment.status)}`} />

                  {/* Commit message */}
                  <span className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))] min-w-[180px] truncate">
                    {deployment.commitMessage || "Deployment"}
                  </span>

                  {/* Branch */}
                  <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[80px]">
                    {deployment.branch}
                  </span>

                  {/* Commit SHA */}
                  <span className="text-[13px] font-mono text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[70px]">
                    {deployment.commit?.slice(0, 7)}
                  </span>

                  {/* Duration */}
                  {deployment.duration && (
                    <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
                      {deployment.duration}
                    </span>
                  )}

                  {/* Time */}
                  <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] text-right flex-1">
                    {deployment.time}
                  </span>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Build Logs Tab */}
        <TabsContent value="logs">
          {selectedDeployment ? (
            <BuildLogs
              deploymentId={selectedDeployment.id}
              status={selectedDeployment.status as "building" | "ready" | "error"}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                No deployment selected
              </p>
            </div>
          )}
        </TabsContent>

        {/* Environment Tab */}
        <TabsContent value="environment">
          <EnvVariables projectId={project.id} />
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <div className="space-y-3">
            {project.domains && project.domains.length > 0 ? (
              project.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between py-3 border-b border-[var(--separator,theme(colors.border))]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${domain.verified ? "bg-[var(--success,#34C759)]" : "bg-[var(--warning,#FF9F0A)]"}`} />
                    <div>
                      <p className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                        {domain.domain}
                      </p>
                      <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                        {domain.isPrimary ? "Primary domain" : "Custom domain"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
                    {domain.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between py-3 border-b border-[var(--separator,theme(colors.border))]">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full shrink-0 bg-[var(--success,#34C759)]" />
                  <div>
                    <p className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                      {primaryDomain}
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">Default domain</p>
                  </div>
                </div>
                <span className="text-[13px] text-[var(--success,#34C759)]">Active</span>
              </div>
            )}
            <Button variant="secondary" size="sm">
              <Globe className="h-3.5 w-3.5" />
              Add Domain
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
