"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DeploymentCardProps {
  deployment: {
    id: string;
    status: "QUEUED" | "BUILDING" | "DEPLOYING" | "READY" | "ERROR" | "CANCELLED";
    commitSha: string | null;
    commitMessage: string | null;
    branch: string;
    url: string | null;
    buildTime: number | null;
    createdAt: string;
    finishedAt: string | null;
  };
  projectSlug: string;
}

export function DeploymentCard({ deployment, projectSlug }: DeploymentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "READY":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "ERROR":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "BUILDING":
      case "DEPLOYING":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "QUEUED":
        return "bg-[var(--surface-secondary)] text-[#0070f3] border-blue-500/20";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READY":
        return "✓";
      case "ERROR":
        return "✕";
      case "BUILDING":
      case "DEPLOYING":
        return "●";
      case "QUEUED":
        return "○";
      case "CANCELLED":
        return "⊘";
      default:
        return "?";
    }
  };

  const isInProgress = deployment.status === "QUEUED" || deployment.status === "BUILDING" || deployment.status === "DEPLOYING";

  return (
    <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
              deployment.status
            )} ${isInProgress ? "animate-pulse" : ""}`}
          >
            <span>{getStatusIcon(deployment.status)}</span>
            {deployment.status}
          </span>
          <span className="text-sm text-gray-500">{deployment.branch}</span>
        </div>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}
        </span>
      </div>

      {deployment.commitMessage && (
        <p className="text-sm text-gray-300 mb-2 line-clamp-1">{deployment.commitMessage}</p>
      )}

      {deployment.commitSha && (
        <p className="text-xs text-gray-500 font-mono mb-3">{deployment.commitSha.slice(0, 7)}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        {deployment.url && deployment.status === "READY" ? (
          <a
            href={deployment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0070f3] hover:text-[#0070f3]"
          >
            {deployment.url.replace("https://", "")}
          </a>
        ) : (
          <span className="text-gray-500">—</span>
        )}

        <Link
          href={`/projects/${projectSlug}/deployments/${deployment.id}`}
          className="text-gray-400 hover:text-white"
        >
          View logs →
        </Link>
      </div>

      {deployment.buildTime && (
        <p className="text-xs text-gray-500 mt-2">Build time: {deployment.buildTime}s</p>
      )}
    </div>
  );
}
