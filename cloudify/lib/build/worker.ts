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
import { promises as fs } from "fs";
import { captureDeploymentError, trackDeployment } from "@/lib/integrations/sentry";
import { loggers } from "@/lib/logging/logger";
import { sendDeploymentNotification } from "@/lib/notifications";
import { injectAnalyticsIntoLocalBuild } from "@/lib/analytics/inject";
import { uploadArtifact, ensureBucket } from "./artifact-manager";

const log = loggers.build;
const REPOS_DIR = "/data/repos";

/**
 * Simple MIME type lookup by file extension.
 * Covers the most common web asset types served by deployed sites.
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".map": "application/json",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".webmanifest": "application/manifest+json",
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Recursively upload all files from a local directory to MinIO.
 * This is used when K3s mode is enabled so the site deployer
 * init container can fetch artifacts from MinIO.
 */
async function uploadArtifactsToMinio(
  artifactPath: string,
  siteSlug: string,
  onLog: LogCallback
): Promise<void> {
  await ensureBucket("cloudify-builds");

  const files = await getFilesRecursive(artifactPath);
  let uploaded = 0;

  for (const filePath of files) {
    const relativePath = path.relative(artifactPath, filePath);
    const content = await fs.readFile(filePath);
    const contentType = getContentType(filePath);

    await uploadArtifact(siteSlug, relativePath, content, contentType);
    uploaded++;

    // Log progress every 50 files
    if (uploaded % 50 === 0) {
      await onLog("info", `Uploaded ${uploaded}/${files.length} files...`);
    }
  }

  await onLog("info", `Uploaded ${uploaded} files to object storage`);
}

/**
 * Recursively list all files in a directory
 */
async function getFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getFilesRecursive(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

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

    // Send deployment started notification (non-blocking)
    try {
      await sendDeploymentNotification("started", {
        userId: project.userId,
        projectId,
        projectName: project.name,
        deploymentId,
        branch: deployment?.branch || project.repositoryBranch,
      });
    } catch (notifError) {
      log.error("Failed to send deployment started notification", notifError);
    }

    // Generate site slug for this deployment
    const siteSlug = generateSiteSlug(project.slug, deploymentId);
    const workDir = path.join(REPOS_DIR, deploymentId);

    // Step 1: Clone repository
    if (project.repositoryUrl) {
      const cloneSuccess = await cloneRepo(
        project.repositoryUrl,
        project.repositoryBranch,
        workDir,
        onLog
      );

      if (!cloneSuccess) {
        await addLog(deploymentId, "error", "Failed to clone repository");
        await updateDeploymentStatus(deploymentId, "ERROR");
        try {
          await sendDeploymentNotification("failure", {
            userId: project.userId,
            projectId,
            projectName: project.name,
            deploymentId,
            error: "Failed to clone repository",
          });
        } catch (notifError) {
          log.error("Failed to send deployment failure notification", notifError);
        }
        return;
      }
    } else {
      await addLog(deploymentId, "error", "No repository URL configured");
      await updateDeploymentStatus(deploymentId, "ERROR");
      try {
        await sendDeploymentNotification("failure", {
          userId: project.userId,
          projectId,
          projectName: project.name,
          deploymentId,
          error: "No repository URL configured",
        });
      } catch (notifError) {
        log.error("Failed to send deployment failure notification", notifError);
      }
      return;
    }

    // Step 2: Install dependencies (skip if no install command)
    if (project.installCommand && project.installCommand.trim()) {
      const installSuccess = await runInstall(
        workDir,
        project.installCommand,
        project.nodeVersion,
        onLog,
        projectId
      );

      if (!installSuccess) {
        await addLog(deploymentId, "error", "Failed to install dependencies");
        await cleanupRepo(workDir, onLog);
        await updateDeploymentStatus(deploymentId, "ERROR");
        try {
          await sendDeploymentNotification("failure", {
            userId: project.userId,
            projectId,
            projectName: project.name,
            deploymentId,
            error: "Failed to install dependencies",
          });
        } catch (notifError) {
          log.error("Failed to send deployment failure notification", notifError);
        }
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

    if (project.buildCommand && project.buildCommand.trim()) {
      const buildSuccess = await executeBuild(
        workDir,
        project.buildCommand,
        project.nodeVersion,
        envVars,
        onLog,
        projectId
      );

      if (!buildSuccess) {
        await addLog(deploymentId, "error", "Build failed");
        await cleanupRepo(workDir, onLog);
        await updateDeploymentStatus(deploymentId, "ERROR");
        try {
          await sendDeploymentNotification("failure", {
            userId: project.userId,
            projectId,
            projectName: project.name,
            deploymentId,
            error: "Build failed",
          });
        } catch (notifError) {
          log.error("Failed to send deployment failure notification", notifError);
        }
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
      project.outputDirectory,
      siteSlug,
      onLog
    );

    if (!copySuccess) {
      await addLog(deploymentId, "error", "Failed to deploy build artifacts");
      await cleanupRepo(workDir, onLog);
      await updateDeploymentStatus(deploymentId, "ERROR");
      try {
        await sendDeploymentNotification("failure", {
          userId: project.userId,
          projectId,
          projectName: project.name,
          deploymentId,
          error: "Failed to deploy build artifacts",
        });
      } catch (notifError) {
        log.error("Failed to send deployment failure notification", notifError);
      }
      return;
    }

    // Step 5: Inject analytics tracking script into index.html
    try {
      const injected = await injectAnalyticsIntoLocalBuild(artifactPath, projectId);
      if (injected) {
        await addLog(deploymentId, "info", "Analytics tracking script injected");
      }
    } catch (analyticsError) {
      // Non-fatal: log but don't fail the deployment
      await addLog(deploymentId, "warn", "Failed to inject analytics script (non-fatal)");
      log.warn("Analytics injection failed", {
        error: analyticsError instanceof Error ? analyticsError.message : String(analyticsError),
      });
    }

    // Step 6: Upload artifacts to MinIO for K3s site serving
    const useK3s = process.env.USE_K3S_BUILDS === "true" || process.env.K3S_ENABLED === "true";
    if (useK3s) {
      try {
        await addLog(deploymentId, "info", "Uploading artifacts to object storage...");
        await uploadArtifactsToMinio(artifactPath, siteSlug, onLog);
        await addLog(deploymentId, "success", "Artifacts uploaded to object storage");
      } catch (uploadError) {
        await addLog(deploymentId, "error", `Failed to upload artifacts: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`);
        await cleanupRepo(workDir, onLog);
        await updateDeploymentStatus(deploymentId, "ERROR");
        try {
          await sendDeploymentNotification("failure", {
            userId: project.userId,
            projectId,
            projectName: project.name,
            deploymentId,
            error: "Failed to upload build artifacts to object storage",
          });
        } catch (notifError) {
          log.error("Failed to send deployment failure notification", notifError);
        }
        return;
      }
    }

    // Cleanup working directory
    await cleanupRepo(workDir, onLog);

    // Finish
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    const deploymentUrl = generateDeploymentUrl(siteSlug);

    if (useK3s) {
      await addLog(deploymentId, "info", "K3s mode: Artifacts stored in MinIO for site serving");
    } else {
      await addLog(deploymentId, "warn", "Docker mode: Site served locally only. For production DNS, enable K3s builds.");
    }
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

    // Send deployment success notification (non-blocking)
    try {
      await sendDeploymentNotification("success", {
        userId: project.userId,
        projectId,
        projectName: project.name,
        deploymentId,
        branch: deployment?.branch || project.repositoryBranch,
        url: deploymentUrl,
        duration: buildTime,
      });
    } catch (notifError) {
      log.error("Failed to send deployment success notification", notifError);
    }

    // Track deployment in Sentry (non-blocking)
    trackDeployment({
      projectName: project.name,
      deploymentId,
      version: deploymentId.slice(0, 8),
      environment: isPreview ? "preview" : "production",
      commitSha: deployment?.branch || undefined,
      repoUrl: project.repositoryUrl || undefined,
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

    // Send deployment failure notification (non-blocking)
    try {
      // Attempt to get project info for the notification
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
      log.error("Failed to send deployment failure notification", notifError);
    }

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

/**
 * Trigger a build via the Redis-based build queue.
 *
 * Replaces the previous fire-and-forget pattern with a proper
 * queue that enforces concurrency limits and priority ordering.
 */
export async function triggerBuild(
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

// Keep the old function name for backwards compatibility
export const runBuild = runBuildPipeline;
