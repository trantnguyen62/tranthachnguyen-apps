"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Trash2,
  Copy,
  Globe,
  User,
  Timer,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeploymentStream } from "@/components/dashboard/deployment-stream";
import { cn } from "@/lib/utils";

interface DeploymentDetails {
  id: string;
  project: string;
  status: "building" | "ready" | "error" | "queued";
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  createdAt: string;
  duration: string;
  url: string;
  domains: string[];
  environment: "production" | "preview";
  buildLogs: { timestamp: string; message: string; type: string }[];
  metrics: {
    buildTime: string;
    functionSize: string;
    staticAssets: string;
    regions: number;
  };
}

// Mock deployment data
const getMockDeployment = (id: string): DeploymentDetails => ({
  id,
  project: "my-portfolio",
  status: id === "dep-new" ? "building" : "ready",
  branch: "main",
  commit: "a1b2c3d",
  commitMessage: "feat: Add new landing page components",
  author: "John Doe",
  createdAt: "2 hours ago",
  duration: "45s",
  url: `https://${id}.cloudify.app`,
  domains: ["johndoe.com", "www.johndoe.com"],
  environment: "production",
  buildLogs: [],
  metrics: {
    buildTime: "45s",
    functionSize: "2.4 MB",
    staticAssets: "1.8 MB",
    regions: 12,
  },
});

export default function DeploymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [deployment] = useState(() => getMockDeployment(id));
  const [isRedeploying, setIsRedeploying] = useState(false);

  const handleRedeploy = () => {
    setIsRedeploying(true);
    setTimeout(() => setIsRedeploying(false), 2000);
  };

  const statusConfig = {
    building: {
      icon: Loader2,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      label: "Building",
      animate: true,
    },
    ready: {
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      label: "Ready",
      animate: false,
    },
    error: {
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      label: "Error",
      animate: false,
    },
    queued: {
      icon: Clock,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-800",
      label: "Queued",
      animate: false,
    },
  };

  const config = statusConfig[deployment.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/deployments"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deployments
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Deployment
            </h1>
            <Badge
              className={cn(
                "flex items-center gap-1",
                config.bg,
                config.color
              )}
            >
              <StatusIcon
                className={cn("h-3 w-3", config.animate && "animate-spin")}
              />
              {config.label}
            </Badge>
            <Badge variant="outline">
              {deployment.environment}
            </Badge>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-4 w-4" />
              {deployment.branch}
            </div>
            <div className="flex items-center gap-1.5">
              <GitCommit className="h-4 w-4" />
              {deployment.commit}
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {deployment.author}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {deployment.createdAt}
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {deployment.commitMessage}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {deployment.status === "ready" && (
            <Button variant="outline" asChild>
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Visit
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRedeploy}
            disabled={isRedeploying}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRedeploying && "animate-spin")}
            />
            Redeploy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Deployment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Build Time",
            value: deployment.metrics.buildTime,
            icon: Timer,
          },
          {
            label: "Function Size",
            value: deployment.metrics.functionSize,
            icon: Server,
          },
          {
            label: "Static Assets",
            value: deployment.metrics.staticAssets,
            icon: Globe,
          },
          {
            label: "Edge Regions",
            value: deployment.metrics.regions.toString(),
            icon: Globe,
          },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <metric.icon className="h-5 w-5 text-gray-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {metric.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={deployment.status === "building" ? "logs" : "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Build Logs</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Deployment URL */}
          <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Deployment URL
            </h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Globe className="h-5 w-5 text-gray-400" />
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                {deployment.url}
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(deployment.url)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Assigned domains */}
          <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Assigned Domains
            </h3>
            <div className="space-y-2">
              {deployment.domains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <Globe className="h-5 w-5 text-green-500" />
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {domain}
                  </a>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          {deployment.status === "building" ? (
            <DeploymentStream deploymentId={deployment.id} />
          ) : (
            <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Build completed successfully
                </h3>
              </div>
              <div className="font-mono text-sm text-gray-500 dark:text-gray-400 bg-gray-950 p-4 rounded-lg">
                <p>✓ Repository cloned</p>
                <p>✓ Dependencies installed (847 packages)</p>
                <p>✓ Build completed</p>
                <p>✓ Assets optimized</p>
                <p>✓ Deployed to 12 regions</p>
                <p className="text-green-400 mt-2">
                  ✓ Deployment complete in {deployment.duration}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="functions" className="mt-6">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Serverless Functions
            </h3>
            <div className="space-y-3">
              {[
                { name: "/api/hello", runtime: "Node.js 20", size: "12 KB", region: "Global" },
                { name: "/api/users", runtime: "Node.js 20", size: "45 KB", region: "Global" },
                { name: "/api/auth", runtime: "Node.js 20", size: "28 KB", region: "Global" },
              ].map((fn) => (
                <div
                  key={fn.name}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fn.name}
                      </p>
                      <p className="text-sm text-gray-500">{fn.runtime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {fn.size}
                    </p>
                    <p className="text-xs text-gray-500">{fn.region}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="domains" className="mt-6">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Connected Domains
              </h3>
              <Button variant="outline" size="sm">
                Add Domain
              </Button>
            </div>
            <div className="space-y-3">
              {deployment.domains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {domain}
                      </p>
                      <p className="text-sm text-gray-500">SSL active</p>
                    </div>
                  </div>
                  <Badge variant="success">Configured</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
