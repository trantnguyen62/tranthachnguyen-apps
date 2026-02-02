import { prisma } from "@/lib/prisma";

/**
 * Create a preview deployment for a pull request
 */
export async function createPreviewDeployment(
  projectId: string,
  prNumber: number,
  branch: string,
  commitSha: string,
  commitMsg?: string
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

  // Create new preview deployment
  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      branch,
      commitSha,
      commitMsg: commitMsg || `PR #${prNumber}`,
      status: "QUEUED",
      siteSlug: generatePreviewSlug(projectId, prNumber),
    },
  });

  return deployment;
}

/**
 * Generate a unique slug for preview deployments
 */
function generatePreviewSlug(projectId: string, prNumber: number): string {
  const prefix = projectId.substring(0, 8);
  return `preview-${prefix}-pr-${prNumber}`;
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
  commitMsg?: string
) {
  switch (action) {
    case "opened":
    case "synchronize":
    case "reopened":
      // Create or update preview deployment
      return createPreviewDeployment(projectId, prNumber, branch, commitSha, commitMsg);

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

  // TODO: Also clean up the actual deployment files
  return toDelete.length;
}
