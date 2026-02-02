/**
 * Instant Rollback System
 *
 * Allows instant rollback to any previous successful deployment.
 * Works by:
 * 1. Keeping all deployment artifacts in MinIO
 * 2. Updating the "active" deployment pointer
 * 3. Updating nginx/ingress routing
 * 4. Zero-downtime atomic switchover
 */

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logging";
import { updateNginxConfig } from "@/lib/domains/nginx";

const logger = createLogger("rollback");

export interface RollbackResult {
  success: boolean;
  previousDeploymentId: string;
  newActiveDeploymentId: string;
  rollbackTime: number;
  error?: string;
}

/**
 * Get rollback history for a project
 */
export async function getRollbackHistory(projectId: string) {
  const deployments = await prisma.deployment.findMany({
    where: {
      projectId,
      status: "READY",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      commitSha: true,
      commitMessage: true,
      branch: true,
      createdAt: true,
      buildTime: true,
      url: true,
      siteSlug: true,
      isActive: true,
    },
  });

  return deployments;
}

/**
 * Get the currently active deployment for a project
 */
export async function getActiveDeployment(projectId: string) {
  return prisma.deployment.findFirst({
    where: {
      projectId,
      isActive: true,
      status: "READY",
    },
  });
}

/**
 * Perform instant rollback to a specific deployment
 */
export async function rollbackToDeployment(
  projectId: string,
  targetDeploymentId: string,
  userId: string
): Promise<RollbackResult> {
  const startTime = performance.now();

  logger.info("Starting rollback", { projectId, targetDeploymentId });

  try {
    // 1. Verify target deployment exists and is valid
    const targetDeployment = await prisma.deployment.findFirst({
      where: {
        id: targetDeploymentId,
        projectId,
        status: "READY",
      },
      include: {
        project: true,
      },
    });

    if (!targetDeployment) {
      throw new Error("Target deployment not found or not in READY state");
    }

    // 2. Get current active deployment
    const currentActive = await getActiveDeployment(projectId);

    if (currentActive?.id === targetDeploymentId) {
      throw new Error("Target deployment is already active");
    }

    // 3. Perform atomic switchover in a transaction
    await prisma.$transaction(async (tx) => {
      // Deactivate all deployments for this project
      await tx.deployment.updateMany({
        where: { projectId },
        data: { isActive: false },
      });

      // Activate the target deployment
      await tx.deployment.update({
        where: { id: targetDeploymentId },
        data: {
          isActive: true,
          promotedAt: new Date(),
          promotedBy: userId,
        },
      });

      // Log the rollback activity
      await tx.activity.create({
        data: {
          type: "ROLLBACK",
          action: "rollback",
          description: `Rolled back to deployment ${targetDeployment.commitSha?.substring(0, 7) || targetDeploymentId.substring(0, 8)}`,
          userId,
          projectId,
          metadata: {
            fromDeploymentId: currentActive?.id,
            toDeploymentId: targetDeploymentId,
            fromCommit: currentActive?.commitSha,
            toCommit: targetDeployment.commitSha,
          },
        },
      });
    });

    // 4. Update nginx/ingress routing (if using custom domains)
    try {
      await updateNginxConfig();
    } catch (nginxError) {
      logger.warn("Nginx update failed (may not be configured)", { error: nginxError });
    }

    const rollbackTime = Math.round(performance.now() - startTime);

    logger.info("Rollback completed", {
      projectId,
      targetDeploymentId,
      rollbackTime,
    });

    return {
      success: true,
      previousDeploymentId: currentActive?.id || "",
      newActiveDeploymentId: targetDeploymentId,
      rollbackTime,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Rollback failed", err, { projectId, targetDeploymentId });

    return {
      success: false,
      previousDeploymentId: "",
      newActiveDeploymentId: "",
      rollbackTime: Math.round(performance.now() - startTime),
      error: err.message,
    };
  }
}

/**
 * Promote a deployment to production (same as rollback but clearer intent)
 */
export async function promoteDeployment(
  projectId: string,
  deploymentId: string,
  userId: string
): Promise<RollbackResult> {
  return rollbackToDeployment(projectId, deploymentId, userId);
}

/**
 * Quick rollback to the previous deployment
 */
export async function rollbackToPrevious(
  projectId: string,
  userId: string
): Promise<RollbackResult> {
  // Get the two most recent READY deployments
  const deployments = await prisma.deployment.findMany({
    where: {
      projectId,
      status: "READY",
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  if (deployments.length < 2) {
    return {
      success: false,
      previousDeploymentId: "",
      newActiveDeploymentId: "",
      rollbackTime: 0,
      error: "No previous deployment available for rollback",
    };
  }

  // Find the one that's not currently active
  const currentActive = deployments.find((d) => d.isActive);
  const previousDeployment = deployments.find((d) => !d.isActive);

  if (!previousDeployment) {
    return {
      success: false,
      previousDeploymentId: "",
      newActiveDeploymentId: "",
      rollbackTime: 0,
      error: "No previous deployment found",
    };
  }

  return rollbackToDeployment(projectId, previousDeployment.id, userId);
}

/**
 * Check if a deployment can be rolled back to
 */
export async function canRollback(deploymentId: string): Promise<{
  canRollback: boolean;
  reason?: string;
}> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    select: {
      status: true,
      artifactPath: true,
      isActive: true,
    },
  });

  if (!deployment) {
    return { canRollback: false, reason: "Deployment not found" };
  }

  if (deployment.status !== "READY") {
    return { canRollback: false, reason: "Deployment is not in READY state" };
  }

  if (deployment.isActive) {
    return { canRollback: false, reason: "Deployment is already active" };
  }

  if (!deployment.artifactPath) {
    return { canRollback: false, reason: "Deployment artifacts not available" };
  }

  return { canRollback: true };
}
