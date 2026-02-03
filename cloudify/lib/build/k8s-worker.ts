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

    if (!project.repoUrl) {
      await onLog("error", "No repository URL configured");
      await updateDeploymentStatus(deploymentId, "ERROR");
      return;
    }

    // Get deployment to get branch info
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    const branch = deployment?.branch || project.repoBranch;

    // Start building
    await updateDeploymentStatus(deploymentId, "BUILDING");
    await onLog("info", "=== K8s Build Pipeline Started ===");
    await onLog("info", `Project: ${project.name}`);
    await onLog("info", `Framework: ${project.framework}`);
    await onLog("info", `Node.js version: ${project.nodeVersion}`);
    await onLog("info", `Branch: ${branch}`);

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
      repoUrl: project.repoUrl,
      branch,
      installCmd: project.installCmd,
      buildCmd: project.buildCmd,
      outputDir: project.outputDir,
      rootDir: project.rootDir,
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
      return;
    }

    // Watch the job for completion
    await onLog("info", "Waiting for build to complete...");
    const buildSuccess = await watchBuildJob(jobName, deploymentId, onLog);

    if (!buildSuccess) {
      await onLog("error", "Build failed");
      await cleanupBuildResources(deploymentId, onLog);
      await updateDeploymentStatus(deploymentId, "ERROR");
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
      return;
    }

    const artifactsSize = await getArtifactsSize(siteSlug);
    await onLog("info", `Build artifacts: ${formatBytes(artifactsSize)}`);

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
  } catch (error) {
    console.error("Build pipeline error:", error);
    await onLog(
      "error",
      `Build failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    await updateDeploymentStatus(deploymentId, "ERROR");
  }
}

/**
 * Trigger a build (public API)
 */
export async function triggerK8sBuild(deploymentId: string): Promise<void> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    select: { projectId: true },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  // Run build in background (fire and forget)
  runK8sBuildPipeline({
    deploymentId,
    projectId: deployment.projectId,
  }).catch(console.error);
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
