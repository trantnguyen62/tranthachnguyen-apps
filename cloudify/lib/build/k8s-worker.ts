/**
 * K8s Build Worker - Orchestrates builds using K8s Jobs
 * Replaces the Docker-based worker for K3s deployment
 */

import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@prisma/client";
import {
  createBuildJob,
  watchBuildJob,
  cleanupBuildResources,
  generateSiteSlug,
  generateDeploymentUrl,
  K8sBuildConfig,
} from "./k8s-executor";
import { artifactsExist, getArtifactsSize } from "./artifact-manager";
import { deploySite } from "./site-deployer";
import type { LogCallback } from "./executor";
import { sendDeploymentNotification } from "@/lib/notifications";
import { injectAnalyticsIntoMinioBuild } from "@/lib/analytics/inject";

interface BuildContext {
  deploymentId: string;
  projectId: string;
}

/**
 * Add a log entry to the deployment
 */
async function addLog(deploymentId: string, level: string, message: string) {
  await prisma.deploymentLog.create({
    data: {
      deploymentId,
      level,
      message,
    },
  });
}

/**
 * Update deployment status
 */
async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  extras?: {
    url?: string;
    buildTime?: number;
    artifactPath?: string;
    siteSlug?: string;
  }
) {
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status,
      ...extras,
      ...(status === "READY" || status === "ERROR" || status === "CANCELLED"
        ? { finishedAt: new Date() }
        : {}),
    },
  });
}

/**
 * Run the K8s build pipeline
 */
export async function runK8sBuildPipeline(context: BuildContext): Promise<void> {
  const { deploymentId, projectId } = context;
  const startTime = Date.now();

  // Create log callback that writes to database
  const onLog: LogCallback = async (level, message) => {
    await addLog(deploymentId, level, message);
  };

  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        envVariables: {
          where: { target: "production" },
        },
      },
    });

    if (!project) {
      await onLog("error", "Project not found");
      await updateDeploymentStatus(deploymentId, "ERROR");
      return;
    }

    if (!project.repositoryUrl) {
      await onLog("error", "No repository URL configured");
      await updateDeploymentStatus(deploymentId, "ERROR");
      return;
    }

    // Get deployment to get branch info
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    const branch = deployment?.branch || project.repositoryBranch;

    // Start building
    await updateDeploymentStatus(deploymentId, "BUILDING");
    await onLog("info", "=== K8s Build Pipeline Started ===");
    await onLog("info", `Project: ${project.name}`);
    await onLog("info", `Framework: ${project.framework}`);
    await onLog("info", `Node.js version: ${project.nodeVersion}`);
    await onLog("info", `Branch: ${branch}`);

    // Send deployment started notification (non-blocking)
    try {
      await sendDeploymentNotification("started", {
        userId: project.userId,
        projectId,
        projectName: project.name,
        deploymentId,
        branch,
      });
    } catch (notifError) {
      console.error("Failed to send deployment started notification:", notifError);
    }

    // Generate site slug for this deployment
    const siteSlug = generateSiteSlug(project.slug, deploymentId);
    await onLog("info", `Site slug: ${siteSlug}`);

    // Prepare environment variables
    const envVars: Record<string, string> = {};
    for (const envVar of project.envVariables) {
      envVars[envVar.key] = envVar.value;
    }

    if (project.envVariables.length > 0) {
      await onLog("info", `Loaded ${project.envVariables.length} environment variables`);
    }

    // Build configuration
    const buildConfig: K8sBuildConfig = {
      deploymentId,
      projectId,
      projectSlug: project.slug,
      repoUrl: project.repositoryUrl,
      branch,
      installCmd: project.installCommand,
      buildCmd: project.buildCommand,
      outputDir: project.outputDirectory,
      rootDir: project.rootDirectory,
      nodeVersion: project.nodeVersion,
      envVars,
      siteSlug,
    };

    // Create K8s build job
    await onLog("info", "Creating K8s build job...");
    const { jobName, success: jobCreated } = await createBuildJob(buildConfig, onLog);

    if (!jobCreated) {
      await onLog("error", "Failed to create K8s build job");
      await updateDeploymentStatus(deploymentId, "ERROR");
      try {
        await sendDeploymentNotification("failure", {
          userId: project.userId,
          projectId,
          projectName: project.name,
          deploymentId,
          error: "Failed to create K8s build job",
        });
      } catch (notifError) {
        console.error("Failed to send deployment failure notification:", notifError);
      }
      return;
    }

    // Watch the job for completion
    await onLog("info", "Waiting for build to complete...");
    const buildSuccess = await watchBuildJob(jobName, deploymentId, onLog);

    if (!buildSuccess) {
      await onLog("error", "Build failed");
      await cleanupBuildResources(deploymentId, onLog);
      await updateDeploymentStatus(deploymentId, "ERROR");
      try {
        await sendDeploymentNotification("failure", {
          userId: project.userId,
          projectId,
          projectName: project.name,
          deploymentId,
          branch,
          error: "Build failed",
        });
      } catch (notifError) {
        console.error("Failed to send deployment failure notification:", notifError);
      }
      return;
    }

    // Verify artifacts were uploaded to MinIO
    await onLog("info", "Verifying build artifacts...");
    await updateDeploymentStatus(deploymentId, "DEPLOYING");

    // Wait a bit for MinIO upload to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const hasArtifacts = await artifactsExist(siteSlug);
    if (!hasArtifacts) {
      await onLog("error", "Build artifacts not found in MinIO");
      await cleanupBuildResources(deploymentId, onLog);
      await updateDeploymentStatus(deploymentId, "ERROR");
      try {
        await sendDeploymentNotification("failure", {
          userId: project.userId,
          projectId,
          projectName: project.name,
          deploymentId,
          branch,
          error: "Build artifacts not found in MinIO",
        });
      } catch (notifError) {
        console.error("Failed to send deployment failure notification:", notifError);
      }
      return;
    }

    const artifactsSize = await getArtifactsSize(siteSlug);
    await onLog("info", `Build artifacts: ${formatBytes(artifactsSize)}`);

    // Inject analytics tracking script into index.html
    try {
      const injected = await injectAnalyticsIntoMinioBuild(siteSlug, projectId);
      if (injected) {
        await onLog("info", "Analytics tracking script injected");
      }
    } catch (analyticsError) {
      // Non-fatal: log but don't fail the deployment
      await onLog("warn", "Failed to inject analytics script (non-fatal)");
      console.warn("Analytics injection failed:", analyticsError);
    }

    // Create site deployment in K8s (also creates DNS record)
    await onLog("info", "Creating site deployment in K3s...");
    const { success: siteDeployed, error: siteError, url: siteUrl } = await deploySite({
      siteSlug,
      projectId,
      deploymentId,
    });

    if (!siteDeployed) {
      await onLog("error", `Failed to deploy site: ${siteError}`);
      await cleanupBuildResources(deploymentId, onLog);
      await updateDeploymentStatus(deploymentId, "ERROR");
      try {
        await sendDeploymentNotification("failure", {
          userId: project.userId,
          projectId,
          projectName: project.name,
          deploymentId,
          branch,
          error: `Failed to deploy site: ${siteError}`,
        });
      } catch (notifError) {
        console.error("Failed to send deployment failure notification:", notifError);
      }
      return;
    }

    await onLog("success", "Site deployment created successfully");

    // Cleanup build resources
    await cleanupBuildResources(deploymentId, onLog);

    // Calculate build time
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    // Use URL from deploySite (which creates DNS record) or fallback
    const deploymentUrl = siteUrl || generateDeploymentUrl(siteSlug);

    await onLog("success", `Deployment ready at: ${deploymentUrl}`);
    await onLog("info", `Total build time: ${buildTime}s`);

    await updateDeploymentStatus(deploymentId, "READY", {
      url: deploymentUrl,
      buildTime,
      artifactPath: `minio://cloudify-builds/${siteSlug}`,
      siteSlug,
    });

    // Send deployment success notification (non-blocking)
    try {
      await sendDeploymentNotification("success", {
        userId: project.userId,
        projectId,
        projectName: project.name,
        deploymentId,
        branch,
        url: deploymentUrl,
        duration: buildTime,
      });
    } catch (notifError) {
      console.error("Failed to send deployment success notification:", notifError);
    }
  } catch (error) {
    console.error("Build pipeline error:", error);
    await onLog(
      "error",
      `Build failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    await updateDeploymentStatus(deploymentId, "ERROR");

    // Send deployment failure notification (non-blocking)
    try {
      const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true, name: true },
      });
      if (proj) {
        await sendDeploymentNotification("failure", {
          userId: proj.userId,
          projectId,
          projectName: proj.name,
          deploymentId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (notifError) {
      console.error("Failed to send deployment failure notification:", notifError);
    }
  }
}

/**
 * Trigger a build (public API).
 *
 * Enqueues the build into the Redis-based build queue instead of
 * running it as a fire-and-forget background task.
 */
export async function triggerK8sBuild(
  deploymentId: string,
  options?: { isPreview?: boolean }
): Promise<void> {
  const { enqueueBuild } = await import("./queue");

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    select: { projectId: true },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  const priority = options?.isPreview ? "low" : "high";
  await enqueueBuild(deploymentId, deployment.projectId, priority);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Cancel a running build
 */
export async function cancelK8sBuild(deploymentId: string): Promise<void> {
  const onLog: LogCallback = async (level, message) => {
    await addLog(deploymentId, level, message);
  };

  await onLog("info", "Cancelling build...");
  await cleanupBuildResources(deploymentId, onLog);
  await updateDeploymentStatus(deploymentId, "CANCELLED");
  await onLog("info", "Build cancelled");
}
