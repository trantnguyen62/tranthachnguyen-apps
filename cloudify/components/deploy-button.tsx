"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeployButtonProps {
  /** URL of the Git repository to deploy */
  repoUrl: string;
  /** Framework preset (e.g., "nextjs", "react", "vue", "static") */
  framework?: string;
  /** Suggested project name */
  projectName?: string;
  /** Button variant style */
  variant?: "default" | "badge" | "minimal";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Deploy to Cloudify button component.
 *
 * Renders a styled button/badge that links to the project creation flow
 * with pre-filled repository, framework, and project name.
 *
 * Usage:
 *   <DeployButton repoUrl="https://github.com/user/repo" framework="nextjs" />
 *   <DeployButton repoUrl="https://github.com/user/repo" variant="badge" />
 */
export function DeployButton({
  repoUrl,
  framework,
  projectName,
  variant = "default",
  className,
}: DeployButtonProps) {
  const params = new URLSearchParams();
  params.set("repo", repoUrl);
  if (framework) params.set("framework", framework);
  if (projectName) params.set("project", projectName);

  const href = `/new?${params.toString()}`;

  if (variant === "badge") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
          "bg-[#0070f3] text-white hover:bg-[#0060df] transition-colors",
          "shadow-sm hover:shadow-md",
          className
        )}
      >
        <Zap className="h-3 w-3" />
        Deploy to Cloudify
      </Link>
    );
  }

  if (variant === "minimal") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          "text-[#0070f3] hover:text-[#0060df] transition-colors",
          "underline-offset-4 hover:underline",
          className
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        Deploy to Cloudify
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
        "bg-[#0070f3] text-white hover:bg-[#0060df] transition-all",
        "shadow-sm hover:shadow-lg hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2",
        className
      )}
    >
      <Zap className="h-4 w-4" />
      Deploy to Cloudify
    </Link>
  );
}

/**
 * Generate an embeddable deploy button URL for use in README files.
 *
 * Returns a markdown snippet:
 *   [![Deploy to Cloudify](https://cloudify.tranthachnguyen.com/deploy-button.svg)](https://cloudify.tranthachnguyen.com/new?repo=...)
 */
export function getDeployButtonMarkdown(
  repoUrl: string,
  options?: { framework?: string; projectName?: string }
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";
  const params = new URLSearchParams();
  params.set("repo", repoUrl);
  if (options?.framework) params.set("framework", options.framework);
  if (options?.projectName) params.set("project", options.projectName);

  const deployUrl = `${baseUrl}/new?${params.toString()}`;
  const badgeUrl = `${baseUrl}/deploy-button.svg`;

  return `[![Deploy to Cloudify](${badgeUrl})](${deployUrl})`;
}
