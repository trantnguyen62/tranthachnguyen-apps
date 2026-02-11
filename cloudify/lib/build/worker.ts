import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@prisma/client";
import {
  cloneRepo,
  runInstall,
  runBuild as executeBuild,
  copyOutput,
  cleanupRepo,
  generateSiteSlug,
  generateDeploymentUrl,
  LogCallback,
} from "./executor";
import path from "path";
import { captureDeploymentError, trackDeployment } from "@/lib/integrations/sentry";
import { loggers } from "@/lib/logging/logger";

const log = loggers.build;
const REPOS_DIR = "/data/repos";

interface BuildContext {
  deploymentId: string;
  projectId: string;
}

async function addLog(deploymentId: string, level: string, message: string) {
  await prisma.deploymentLog.create({
    data: {
      deploymentId,
      level,
      message,
    },
  });
}

async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  extras?: { url?: string; buildTime?: number; artifactPath?: string; siteSlug?: string }
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

export async function runBuildPipeline(context: BuildContext): Promise<void> {
  const { deploymentId, projectId } = context;
  const startTime = Date.now();

  // Create log callback that writes to database
  const onLog: LogCallback = async (level, message) => {
    await addLog(deploymentId, level, message);
  };

  try {
    // Get deployment to check if preview
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: { isPreview: true, branch: true },
    });

    const isPreview = deployment?.isPreview ?? false;
    const envTarget = isPreview ? "preview" : "production";

    // Get project details with environment-specific variables
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        envVariables: {
          where: {
            target: { in: [envTarget, "production"] },
          },
        },
      },
    });

    if (!project) {
      await addLog(deploymentId, "error", "Project not found");
      await updateDeploymentStatus(deploymentId, "ERROR");
      return;
    }

    // Start building
    await updateDeploymentStatus(deploymentId, "BUILDING");
    await addLog(deploymentId, "info", `Build started${isPreview ? " (preview)" : ""}`);
    await addLog(deploymentId, "info", `Framework: ${project.framework}`);
    await addLog(deploymentId, "info", `Node.js version: ${project.nodeVersion}`);

    // Generate site slug for this deployment
    const siteSlug = generateSiteSlug(project.slug, deploymentId);
    const workDir = path.join(REPOS_DIR, deploymentId);

    // Step 1: Clone repository
    if (project.repoUrl) {
      const cloneSuccess = await cloneRepo(
        project.repoUrl,
        project.repoBranch,
        workDir,
        onLog
      );

      if (!cloneSuccess) {
        await addLog(deploymentId, "error", "Failed to clone repository");
        await updateDeploymentStatus(deploymentId, "ERROR");
        return;
      }
    } else {
      await addLog(deploymentId, "error", "No repository URL configured");
      await updateDeploymentStatus(deploymentId, "ERROR");
      return;
    }

    // Step 2: Install dependencies (skip if no install command)
    if (project.installCmd && project.installCmd.trim()) {
      const installSuccess = await runInstall(
        workDir,
        project.installCmd,
        project.nodeVersion,
        onLog,
        projectId
      );

      if (!installSuccess) {
        await addLog(deploymentId, "error", "Failed to install dependencies");
        await cleanupRepo(workDir, onLog);
        await updateDeploymentStatus(deploymentId, "ERROR");
        return;
      }
    } else {
      await addLog(deploymentId, "info", "Skipping install step (no install command)");
    }

    // Step 3: Set up environment variables and run build (skip if no build command)
    const envVars: Record<string, string> = {};
    for (const envVar of project.envVariables) {
      envVars[envVar.key] = envVar.value;
    }

    if (project.envVariables.length > 0) {
      await addLog(deploymentId, "info", `Setting up ${project.envVariables.length} environment variables`);
    }

    if (project.buildCmd && project.buildCmd.trim()) {
      const buildSuccess = await executeBuild(
        workDir,
        project.buildCmd,
        project.nodeVersion,
        envVars,
        onLog,
        projectId
      );

      if (!buildSuccess) {
        await addLog(deploymentId, "error", "Build failed");
        await cleanupRepo(workDir, onLog);
        await updateDeploymentStatus(deploymentId, "ERROR");
        return;
      }
    } else {
      await addLog(deploymentId, "info", "Skipping build step (no build command)");
    }

    // Step 4: Deploy - copy output to serving directory
    await updateDeploymentStatus(deploymentId, "DEPLOYING");
    await addLog(deploymentId, "info", "Deploying build artifacts...");

    const { success: copySuccess, artifactPath } = await copyOutput(
      workDir,
      project.outputDir,
      siteSlug,
      onLog
    );

    if (!copySuccess) {
      await addLog(deploymentId, "error", "Failed to deploy build artifacts");
      await cleanupRepo(workDir, onLog);
      await updateDeploymentStatus(deploymentId, "ERROR");
      return;
    }

    // Cleanup working directory
    await cleanupRepo(workDir, onLog);

    // Finish
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    const deploymentUrl = generateDeploymentUrl(siteSlug);

    // Note: Docker-based builds don't create K8s deployments or DNS records
    // For production deployments with DNS, use K3s mode (USE_K3S_BUILDS=true)
    await addLog(deploymentId, "warn", "Docker mode: Site served locally only. For production DNS, enable K3s builds.");
    await addLog(deploymentId, "success", `Deployment ready at: ${deploymentUrl}`);
    await addLog(deploymentId, "info", `Total build time: ${buildTime}s`);

    // Deactivate previous active deployment for this project
    await prisma.deployment.updateMany({
      where: {
        projectId,
        isActive: true,
        id: { not: deploymentId },
      },
      data: { isActive: false },
    });

    await updateDeploymentStatus(deploymentId, "READY", {
      url: deploymentUrl,
      buildTime,
      artifactPath,
      siteSlug,
    });

    // Mark this deployment as the active one
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { isActive: true },
    });

    // Track deployment in Sentry (non-blocking)
    trackDeployment({
      projectName: project.name,
      deploymentId,
      version: deploymentId.slice(0, 8),
      environment: isPreview ? "preview" : "production",
      commitSha: deployment?.branch || undefined,
      repoUrl: project.repoUrl || undefined,
      url: deploymentUrl,
      startedAt: new Date(startTime),
      finishedAt: new Date(),
    }).catch(() => {});
  } catch (error) {
    log.error("Build pipeline failed", error, { deploymentId, projectId });
    await addLog(
      deploymentId,
      "error",
      `Build failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    await updateDeploymentStatus(deploymentId, "ERROR");

    // Report to Sentry (non-blocking)
    if (error instanceof Error) {
      captureDeploymentError(error, {
        projectId,
        projectName: projectId,
        deploymentId,
        buildStep: "pipeline",
      }).catch(() => {});
    }
  }
}

// API endpoint to trigger build
export async function triggerBuild(deploymentId: string): Promise<void> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    select: { projectId: true },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  // Run build in background (fire and forget)
  runBuildPipeline({
    deploymentId,
    projectId: deployment.projectId,
  }).catch(console.error);
}

// Keep the old function name for backwards compatibility
export const runBuild = runBuildPipeline;
