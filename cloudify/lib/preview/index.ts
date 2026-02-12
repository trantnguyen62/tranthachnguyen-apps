import { prisma } from "@/lib/prisma";
import { deleteArtifacts } from "@/lib/build/artifact-manager";
import { postOrUpdateDeployPreviewComment } from "@/lib/integrations/github-pr-comment";

/**
 * Create a preview deployment for a pull request
 */
export async function createPreviewDeployment(
  projectId: string,
  prNumber: number,
  branch: string,
  commitSha: string,
  commitMessage?: string
) {
  // Check if a preview deployment already exists for this PR
  const existingDeployment = await prisma.deployment.findFirst({
    where: {
      projectId,
      branch,
      status: { in: ["QUEUED", "BUILDING", "READY"] },
    },
    orderBy: { createdAt: "desc" },
  });

  // If there's an existing deployment in progress, cancel it
  if (existingDeployment && existingDeployment.status !== "READY") {
    await prisma.deployment.update({
      where: { id: existingDeployment.id },
      data: { status: "CANCELLED" },
    });
  }

  // Get project slug for human-readable preview URLs
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });

  // Create new preview deployment
  const siteSlug = generatePreviewSlug(project?.slug || projectId.substring(0, 8), prNumber);
  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      branch,
      commitSha,
      commitMessage: commitMessage || `PR #${prNumber}`,
      status: "QUEUED",
      siteSlug,
    },
  });

  // Post a "building" comment on the PR (fire-and-forget)
  postOrUpdateDeployPreviewComment({
    projectId,
    prNumber,
    deploymentId: deployment.id,
    previewUrl: getPreviewUrl(siteSlug),
    status: "building",
    commitSha,
    branch,
  }).catch(() => {
    // Non-critical — log already handled inside the function
  });

  return deployment;
}

/**
 * Generate a unique slug for preview deployments.
 * Uses the project slug + PR number for human-readable preview URLs.
 * e.g., "my-app-pr-42.cloudify.tranthachnguyen.com"
 */
function generatePreviewSlug(projectSlug: string, prNumber: number): string {
  return `${projectSlug}-pr-${prNumber}`;
}

/**
 * Get the preview URL for a deployment
 */
export function getPreviewUrl(siteSlug: string): string {
  const baseUrl = process.env.PREVIEW_BASE_URL || "https://preview.cloudify.tranthachnguyen.com";
  return `${baseUrl}/${siteSlug}`;
}

/**
 * Handle GitHub PR events for preview deployments
 */
export async function handlePullRequestEvent(
  action: string,
  prNumber: number,
  projectId: string,
  branch: string,
  commitSha: string,
  commitMessage?: string
) {
  switch (action) {
    case "opened":
    case "synchronize":
    case "reopened":
      // Create or update preview deployment
      return createPreviewDeployment(projectId, prNumber, branch, commitSha, commitMessage);

    case "closed":
      // Cancel any running preview deployments for this PR
      await prisma.deployment.updateMany({
        where: {
          projectId,
          branch,
          status: { in: ["QUEUED", "BUILDING"] },
        },
        data: { status: "CANCELLED" },
      });
      return null;

    default:
      return null;
  }
}

/**
 * List all preview deployments for a project
 */
export async function getPreviewDeployments(projectId: string) {
  return prisma.deployment.findMany({
    where: {
      projectId,
      siteSlug: { startsWith: "preview-" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/**
 * Notify the PR when a preview deployment completes (success or failure).
 *
 * Call this from the build pipeline when a preview deployment finishes.
 * It will update the existing PR comment with the final status, preview
 * URL, and build time.
 */
export async function onPreviewDeployComplete(
  projectId: string,
  prNumber: number,
  deploymentId: string,
  status: "ready" | "error",
  buildTimeMs?: number,
  errorMessage?: string
) {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment?.siteSlug) return;

  await postOrUpdateDeployPreviewComment({
    projectId,
    prNumber,
    deploymentId,
    previewUrl: getPreviewUrl(deployment.siteSlug),
    status,
    buildTimeMs,
    commitSha: deployment.commitSha ?? undefined,
    branch: deployment.branch ?? undefined,
    errorMessage,
  });
}

/**
 * Clean up old preview deployments
 * Keeps the last N deployments and removes older ones
 */
export async function cleanupPreviewDeployments(
  projectId: string,
  keepCount: number = 10
) {
  const allPreviews = await prisma.deployment.findMany({
    where: {
      projectId,
      siteSlug: { startsWith: "preview-" },
      status: "READY",
    },
    orderBy: { createdAt: "desc" },
  });

  if (allPreviews.length <= keepCount) return;

  const toDelete = allPreviews.slice(keepCount);
  const idsToDelete = toDelete.map((d) => d.id);

  await prisma.deployment.updateMany({
    where: { id: { in: idsToDelete } },
    data: { status: "CANCELLED" },
  });

  // Clean up the actual deployment files from storage
  for (const deployment of toDelete) {
    if (deployment.siteSlug) {
      try {
        await deleteArtifacts(deployment.siteSlug);
        console.log(`Cleaned up artifacts for deployment: ${deployment.siteSlug}`);
      } catch (error) {
        console.error(`Failed to clean up artifacts for ${deployment.siteSlug}:`, error);
        // Continue with other cleanups even if one fails
      }
    }
  }

  return toDelete.length;
}
