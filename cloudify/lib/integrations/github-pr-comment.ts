/**
 * GitHub PR Deploy Preview Comments
 *
 * Posts rich deployment preview comments on GitHub PRs, similar to
 * Vercel and Netlify. When a preview deployment finishes, a comment
 * is posted (or updated) on the PR with:
 * - Preview URL
 * - Build time
 * - Status badge (building / ready / failed)
 * - Deployment metadata (commit, branch)
 *
 * This module is wired into the preview deployment flow via
 * `lib/preview/index.ts`.
 */

import { getOctokitForProject, parseRepoInfo } from "./github-app";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logging";

const logger = createLogger("github-pr-comment");

// Marker used to identify Cloudify bot comments for update-in-place
const COMMENT_MARKER = "<!-- cloudify-deploy-preview -->";

export interface DeployPreviewCommentOptions {
  projectId: string;
  prNumber: number;
  deploymentId: string;
  previewUrl: string;
  status: "building" | "ready" | "error";
  buildTimeMs?: number;
  commitSha?: string;
  branch?: string;
  errorMessage?: string;
}

/**
 * Format build duration into a human-readable string
 */
function formatBuildTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Build the markdown body for the PR comment
 */
function buildCommentBody(options: DeployPreviewCommentOptions): string {
  const {
    status,
    previewUrl,
    buildTimeMs,
    commitSha,
    branch,
    errorMessage,
  } = options;

  const statusIcon: Record<string, string> = {
    building: "&#9889;", // lightning bolt
    ready: "&#9989;",    // green check
    error: "&#10060;",   // red X
  };

  const statusLabel: Record<string, string> = {
    building: "Building",
    ready: "Ready",
    error: "Failed",
  };

  const lines: string[] = [COMMENT_MARKER];

  // Header
  lines.push(`## ${statusIcon[status] || ""} Cloudify Deploy Preview`);
  lines.push("");

  // Status table
  lines.push("| Name | Status | Preview |");
  lines.push("|:-----|:-------|:--------|");

  if (status === "ready") {
    lines.push(
      `| **cloudify** | ${statusLabel[status]} | [Visit Preview](${previewUrl}) |`
    );
  } else if (status === "building") {
    lines.push(
      `| **cloudify** | ${statusLabel[status]}... | Deployment in progress |`
    );
  } else {
    lines.push(
      `| **cloudify** | ${statusLabel[status]} | Build failed |`
    );
  }

  lines.push("");

  // Build details
  if (buildTimeMs && status === "ready") {
    lines.push(`**Built in ${formatBuildTime(buildTimeMs)}**`);
    lines.push("");
  }

  // Metadata
  if (commitSha || branch) {
    lines.push("<details>");
    lines.push("<summary>Deployment details</summary>");
    lines.push("");
    if (commitSha) {
      lines.push(`- **Commit:** \`${commitSha.substring(0, 7)}\``);
    }
    if (branch) {
      lines.push(`- **Branch:** \`${branch}\``);
    }
    if (buildTimeMs) {
      lines.push(`- **Build time:** ${formatBuildTime(buildTimeMs)}`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  // Error message
  if (status === "error" && errorMessage) {
    lines.push("```");
    lines.push(errorMessage.substring(0, 500));
    lines.push("```");
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push(
    "<sub>Deployed with <a href=\"https://cloudify.tranthachnguyen.com\">Cloudify</a></sub>"
  );

  return lines.join("\n");
}

/**
 * Post or update a deploy preview comment on a GitHub PR.
 *
 * If a previous Cloudify comment already exists on the PR, it will be
 * updated in-place (avoiding duplicate comments on re-deploys).
 */
export async function postOrUpdateDeployPreviewComment(
  options: DeployPreviewCommentOptions
): Promise<boolean> {
  const { projectId, prNumber } = options;

  try {
    const octokit = await getOctokitForProject(projectId);
    if (!octokit) {
      logger.warn("No GitHub access for project — skipping PR comment", {
        projectId,
      });
      return false;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.repositoryUrl) {
      logger.warn("Project has no repositoryUrl", { projectId });
      return false;
    }

    const repoInfo = parseRepoInfo(project.repositoryUrl);
    if (!repoInfo) {
      logger.warn("Could not parse repo info from URL", {
        repositoryUrl: project.repositoryUrl,
      });
      return false;
    }

    const commentBody = buildCommentBody(options);

    // Try to find an existing Cloudify comment to update
    const { data: comments } = await octokit.issues.listComments({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      issue_number: prNumber,
      per_page: 100,
    });

    const existingComment = comments.find(
      (c) => c.body?.includes(COMMENT_MARKER)
    );

    if (existingComment) {
      // Update in place
      await octokit.issues.updateComment({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        comment_id: existingComment.id,
        body: commentBody,
      });
      logger.info("Updated existing deploy preview comment", {
        prNumber,
        commentId: existingComment.id,
      });
    } else {
      // Create new comment
      await octokit.issues.createComment({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        issue_number: prNumber,
        body: commentBody,
      });
      logger.info("Created new deploy preview comment", { prNumber });
    }

    return true;
  } catch (error) {
    logger.error("Failed to post deploy preview comment", {
      projectId,
      prNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Remove the Cloudify deploy preview comment from a PR
 * (used when a PR is closed without merging and cleanup is desired)
 */
export async function removeDeployPreviewComment(
  projectId: string,
  prNumber: number
): Promise<boolean> {
  try {
    const octokit = await getOctokitForProject(projectId);
    if (!octokit) return false;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.repositoryUrl) return false;

    const repoInfo = parseRepoInfo(project.repositoryUrl);
    if (!repoInfo) return false;

    const { data: comments } = await octokit.issues.listComments({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      issue_number: prNumber,
      per_page: 100,
    });

    const existingComment = comments.find(
      (c) => c.body?.includes(COMMENT_MARKER)
    );

    if (existingComment) {
      await octokit.issues.deleteComment({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        comment_id: existingComment.id,
      });
      logger.info("Removed deploy preview comment", { prNumber });
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Failed to remove deploy preview comment", {
      projectId,
      prNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
