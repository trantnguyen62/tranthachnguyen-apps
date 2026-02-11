"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Globe,
  Settings,
  MoreHorizontal,
  RefreshCw,
  Clock,
  CheckCircle2,
  Copy,
  RotateCcw,
  Trash2,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  repoUrl: string | null;
  repoBranch: string | null;
  createdAt: string;
  deployments: Deployment[];
  lastDeployment: Deployment | null;
  domains: Domain[];
}

function LoadingSkeleton() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-96 mb-4" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
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
      <div className="p-8">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Failed to load project</h3>
                <p className="text-sm text-red-500">{error || "Project not found"}</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectStatus = project.lastDeployment?.status || "ready";
  const status = getStatusConfig(projectStatus);
  const StatusIcon = status.icon;
  const primaryDomain = project.domains?.find((d) => d.isPrimary)?.domain || `${project.slug}.cloudify.tranthachnguyen.com`;
  const gitRepo = project.repoUrl || "";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-foreground"
              >
                {project.name}
              </motion.h1>
              <Badge variant={projectStatus === "ready" ? "success" : "warning"}>
                <StatusIcon className={`h-3 w-3 mr-1 ${projectStatus === "building" ? "animate-spin" : ""}`} />
                {status.label}
              </Badge>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-1 text-muted-foreground"
            >
              {project.framework || "Next.js"} project
            </motion.p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a
                href={`https://${primaryDomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Visit
              </a>
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4" />
              Redeploy
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.slug}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick info cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Domain */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-[#0070f3]" />
                  <div>
                    <p className="text-sm text-muted-foreground">Domain</p>
                    <a
                      href={`https://${primaryDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-[#0070f3]"
                    >
                      {primaryDomain}
                    </a>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyDomain(primaryDomain)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Git */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Repository</p>
                  {gitRepo ? (
                    <a
                      href={gitRepo.startsWith("http") ? gitRepo : `https://${gitRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-[#0070f3]"
                    >
                      {gitRepo.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <p className="font-medium text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last deployment */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Deployment</p>
                  <p className="font-medium text-foreground">
                    {project.lastDeployment?.time || "No deployments"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deployments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="logs">Build Logs</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Deployments Tab */}
        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
              {project.deployments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No deployments yet</p>
                  <p className="text-sm">Push to your repository to trigger a deployment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.deployments.map((deployment) => {
                    const depStatus = getStatusConfig(deployment.status);
                    const DepStatusIcon = depStatus.icon;
                    return (
                      <div
                        key={deployment.id}
                        onClick={() => setSelectedDeployment(deployment)}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedDeployment?.id === deployment.id
                            ? "border-foreground bg-secondary"
                            : "border-border hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${depStatus.bg}`}>
                            <DepStatusIcon className={`h-4 w-4 ${depStatus.color} ${deployment.status === "building" ? "animate-spin" : ""}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {deployment.commitMessage}
                              </span>
                              {deployment.isProduction && (
                                <Badge variant="default" className="text-xs">Production</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-mono">{deployment.commit}</span>
                              <span>{deployment.branch}</span>
                              <span>{deployment.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{deployment.duration}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
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
                              <DropdownMenuItem>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Redeploy
                              </DropdownMenuItem>
                              {!deployment.isProduction && (
                                <DropdownMenuItem>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Promote to Production
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build Logs Tab */}
        <TabsContent value="logs">
          {selectedDeployment ? (
            <BuildLogs
              deploymentId={selectedDeployment.id}
              status={selectedDeployment.status as "building" | "ready" | "error"}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No deployment selected
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Environment Tab */}
        <TabsContent value="environment">
          <Card>
            <CardContent className="p-6">
              <EnvVariables projectId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.domains && project.domains.length > 0 ? (
                  project.domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 ${domain.verified ? "text-green-600" : "text-muted-foreground"}`} />
                        <div>
                          <p className="font-medium text-foreground">
                            {domain.domain}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {domain.isPrimary ? "Primary domain" : "Custom domain"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={domain.verified ? "success" : "warning"}>
                        {domain.verified ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-foreground">
                          {primaryDomain}
                        </p>
                        <p className="text-sm text-muted-foreground">Default domain</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                )}
                <Button variant="outline">
                  <Globe className="h-4 w-4" />
                  Add Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Analytics data would be displayed here</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/analytics">View Full Analytics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
