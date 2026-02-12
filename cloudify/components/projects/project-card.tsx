"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  RotateCcw,
  ScrollText,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    framework: string;
    repositoryUrl: string | null;
    updatedAt: string;
    deployments?: {
      id: string;
      status: string;
      url: string | null;
      createdAt: string;
      commitSha?: string;
      branch?: string;
    }[];
    _count?: { deployments: number };
  };
}

const frameworkIcons: Record<string, string> = {
  nextjs: "▲",
  react: "⚛",
  vue: "◆",
  svelte: "◈",
  nuxt: "◇",
  astro: "✦",
  remix: "◉",
  gatsby: "◎",
  angular: "◉",
  other: "○",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const latestDeployment = project.deployments?.[0];
  const deploymentCount = project._count?.deployments || 0;
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [redeployMsg, setRedeployMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "READY":
        return "bg-green-500";
      case "ERROR":
        return "bg-red-500";
      case "BUILDING":
      case "DEPLOYING":
        return "bg-yellow-500 animate-pulse";
      case "QUEUED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "READY":
        return "Live";
      case "ERROR":
        return "Error";
      case "BUILDING":
        return "Building...";
      case "DEPLOYING":
        return "Deploying...";
      case "QUEUED":
        return "Queued";
      default:
        return "";
    }
  };

  const handleRedeploy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!latestDeployment || isRedeploying) return;

    setIsRedeploying(true);
    setRedeployMsg(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          branch: latestDeployment.branch || "main",
          commitSha: latestDeployment.commitSha,
          commitMsg: "Redeploy from project card",
        }),
      });

      if (res.ok) {
        setRedeployMsg({ type: "success", text: "Redeploying..." });
      } else {
        const data = await res.json();
        setRedeployMsg({
          type: "error",
          text: data.error || "Redeploy failed",
        });
      }
    } catch {
      setRedeployMsg({ type: "error", text: "Network error" });
    } finally {
      setIsRedeploying(false);
      setTimeout(() => setRedeployMsg(null), 3000);
    }
  };

  const liveUrl = latestDeployment?.url
    ? `https://${latestDeployment.url}`
    : `https://${project.slug}.cloudify.app`;

  return (
    <div className="border border-gray-800 rounded-lg p-5 hover:border-gray-700 hover:bg-gray-900/50 transition-all">
      {/* Top section: clickable project link */}
      <Link href={`/projects/${project.slug}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {frameworkIcons[project.framework] || "○"}
            </span>
            <div>
              <h3 className="font-semibold text-white">{project.name}</h3>
              <p className="text-sm text-gray-500">
                {project.slug}.cloudify.app
              </p>
            </div>
          </div>
          {latestDeployment && (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  latestDeployment.status
                )}`}
              />
              <span className="text-xs text-gray-400">
                {getStatusLabel(latestDeployment.status)}
              </span>
            </div>
          )}
        </div>

        {project.repositoryUrl && (
          <p className="text-sm text-gray-400 mb-3 truncate">
            {project.repositoryUrl}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {deploymentCount} deployment{deploymentCount !== 1 ? "s" : ""}
          </span>
          <span>
            {formatDistanceToNow(new Date(project.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </Link>

      {/* Quick Actions Bar */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Redeploy Button */}
          <button
            onClick={handleRedeploy}
            disabled={isRedeploying || !latestDeployment}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redeploy latest"
          >
            {isRedeploying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            Redeploy
          </button>

          {/* View Logs Button */}
          <Link
            href={
              latestDeployment
                ? `/deployments/${latestDeployment.id}`
                : `/projects/${project.slug}`
            }
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-md transition-colors"
            title="View deployment logs"
          >
            <ScrollText className="h-3 w-3" />
            Logs
          </Link>
        </div>

        {/* Visit Site Button */}
        {latestDeployment?.status === "READY" && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40 rounded-md transition-colors"
            title="Visit live site"
          >
            <ExternalLink className="h-3 w-3" />
            Visit Site
          </a>
        )}
      </div>

      {/* Redeploy feedback message */}
      {redeployMsg && (
        <div
          className={`mt-2 text-xs px-2 py-1 rounded ${
            redeployMsg.type === "success"
              ? "bg-green-900/20 text-green-400"
              : "bg-red-900/20 text-red-400"
          }`}
        >
          {redeployMsg.text}
        </div>
      )}
    </div>
  );
}
