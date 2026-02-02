"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    framework: string;
    repoUrl: string | null;
    updatedAt: string;
    deployments?: {
      id: string;
      status: string;
      url: string | null;
      createdAt: string;
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

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block border border-gray-800 rounded-lg p-5 hover:border-gray-700 hover:bg-gray-900/50 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{frameworkIcons[project.framework] || "○"}</span>
          <div>
            <h3 className="font-semibold text-white">{project.name}</h3>
            <p className="text-sm text-gray-500">{project.slug}.cloudify.app</p>
          </div>
        </div>
        {latestDeployment && (
          <span className={`w-2 h-2 rounded-full ${getStatusColor(latestDeployment.status)}`} />
        )}
      </div>

      {project.repoUrl && (
        <p className="text-sm text-gray-400 mb-3 truncate">{project.repoUrl}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{deploymentCount} deployment{deploymentCount !== 1 ? "s" : ""}</span>
        <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
      </div>

      {latestDeployment?.url && latestDeployment.status === "READY" && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <span className="text-sm text-green-400">● Live</span>
        </div>
      )}
    </Link>
  );
}
