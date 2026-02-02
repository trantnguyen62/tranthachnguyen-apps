"use client";

import { useState } from "react";
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
  Loader2,
  XCircle,
  Copy,
  RotateCcw,
  Trash2,
  Eye,
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
import { BuildLogs } from "@/components/dashboard/build-logs";
import { EnvVariables } from "@/components/dashboard/env-variables";

// Mock project data
const projectData = {
  name: "my-portfolio",
  description: "Personal portfolio website built with Next.js",
  framework: "Next.js",
  domain: "my-portfolio.cloudify.app",
  customDomain: "johndoe.com",
  gitRepo: "github.com/johndoe/portfolio",
  branch: "main",
  status: "ready" as "ready" | "building" | "error",
  createdAt: "2024-01-15",
  lastDeployment: {
    id: "dep-123",
    status: "ready" as const,
    time: "2 minutes ago",
    duration: "45s",
    commit: "a1b2c3d",
    commitMessage: "feat: add contact form with validation",
  },
};

const deployments = [
  {
    id: "dep-1",
    status: "ready",
    time: "2 minutes ago",
    duration: "45s",
    commit: "a1b2c3d",
    commitMessage: "feat: add contact form",
    branch: "main",
    isProduction: true,
  },
  {
    id: "dep-2",
    status: "ready",
    time: "1 hour ago",
    duration: "38s",
    commit: "e4f5g6h",
    commitMessage: "style: improve responsive design",
    branch: "main",
    isProduction: false,
  },
  {
    id: "dep-3",
    status: "ready",
    time: "3 hours ago",
    duration: "52s",
    commit: "i7j8k9l",
    commitMessage: "docs: update README",
    branch: "main",
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
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectName = params.name as string;
  const [selectedDeployment, setSelectedDeployment] = useState(deployments[0]);

  const project = { ...projectData, name: projectName };
  const status = statusConfig[project.status];
  const StatusIcon = status.icon;

  const copyDomain = () => {
    navigator.clipboard.writeText(project.customDomain || project.domain);
  };

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
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                {project.name}
              </motion.h1>
              <Badge variant={project.status === "ready" ? "success" : "warning"}>
                <StatusIcon className={`h-3 w-3 mr-1 ${project.status === "building" ? "animate-spin" : ""}`} />
                {status.label}
              </Badge>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-1 text-gray-600 dark:text-gray-400"
            >
              {project.description}
            </motion.p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a
                href={`https://${project.customDomain || project.domain}`}
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
                  <Link href={`/projects/${project.name}/settings`}>
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
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Domain</p>
                    <a
                      href={`https://${project.customDomain || project.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600"
                    >
                      {project.customDomain || project.domain}
                    </a>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={copyDomain}>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Repository</p>
                  <a
                    href={`https://${project.gitRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600"
                  >
                    {project.gitRepo}
                  </a>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Deployment</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {project.lastDeployment.time}
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
              <div className="space-y-4">
                {deployments.map((deployment) => {
                  const depStatus = statusConfig[deployment.status as keyof typeof statusConfig];
                  const DepStatusIcon = depStatus.icon;
                  return (
                    <div
                      key={deployment.id}
                      onClick={() => setSelectedDeployment(deployment)}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedDeployment.id === deployment.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${depStatus.bg}`}>
                          <DepStatusIcon className={`h-4 w-4 ${depStatus.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {deployment.commitMessage}
                            </span>
                            {deployment.isProduction && (
                              <Badge variant="default" className="text-xs">Production</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{deployment.commit}</span>
                            <span>{deployment.branch}</span>
                            <span>{deployment.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{deployment.duration}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build Logs Tab */}
        <TabsContent value="logs">
          <BuildLogs
            deploymentId={selectedDeployment.id}
            status={selectedDeployment.status as "building" | "ready" | "error"}
          />
        </TabsContent>

        {/* Environment Tab */}
        <TabsContent value="environment">
          <Card>
            <CardContent className="p-6">
              <EnvVariables projectId={project.name} />
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
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {project.customDomain || project.domain}
                      </p>
                      <p className="text-sm text-gray-500">Primary domain</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
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
              <div className="text-center py-12 text-gray-500">
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
