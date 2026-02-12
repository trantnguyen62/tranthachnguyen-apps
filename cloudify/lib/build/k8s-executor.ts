/**
 * K8s Executor - Creates and manages Kubernetes Jobs for builds
 * Replaces Docker-based executor for K3s deployment
 */

import * as k8s from "@kubernetes/client-node";
import { LogCallback } from "./executor";
import { sanitizeSlug } from "@/lib/security/validation";

// K8s configuration
const BUILD_NAMESPACE = "cloudify-builds";
const SYSTEM_NAMESPACE = "cloudify-system";
const BUILD_TIMEOUT_SECONDS = 600; // 10 minutes
const JOB_TTL_SECONDS = 3600; // 1 hour cleanup

export interface K8sBuildConfig {
  deploymentId: string;
  projectId: string;
  projectSlug: string;
  repoUrl: string;
  branch: string;
  installCmd: string;
  buildCmd: string;
  outputDir: string;
  rootDir: string;
  nodeVersion: string;
  envVars: Record<string, string>;
  siteSlug: string;
}

export interface K8sBuildResult {
  success: boolean;
  jobName: string;
  artifactPath?: string;
  error?: string;
}

// Initialize K8s client
function getK8sClients() {
  const kc = new k8s.KubeConfig();

  // Load from default location (KUBECONFIG env var or ~/.kube/config)
  // In-cluster: uses service account
  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }

  return {
    batchApi: kc.makeApiClient(k8s.BatchV1Api),
    coreApi: kc.makeApiClient(k8s.CoreV1Api),
    watch: new k8s.Watch(kc),
    kc,
  };
}

/**
 * Create a Kubernetes Secret for environment variables
 */
async function createEnvSecret(
  coreApi: k8s.CoreV1Api,
  deploymentId: string,
  envVars: Record<string, string>
): Promise<string> {
  const secretName = `env-vars-${deploymentId}`;

  // Delete existing secret if it exists
  try {
    await coreApi.deleteNamespacedSecret(secretName, BUILD_NAMESPACE);
  } catch {
    // Secret doesn't exist, that's fine
  }

  if (Object.keys(envVars).length === 0) {
    return secretName;
  }

  const secret: k8s.V1Secret = {
    metadata: {
      name: secretName,
      namespace: BUILD_NAMESPACE,
      labels: {
        "cloudify.io/deployment-id": deploymentId,
        "cloudify.io/component": "build-env",
      },
    },
    stringData: envVars,
  };

  await coreApi.createNamespacedSecret(BUILD_NAMESPACE, secret);
  return secretName;
}

/**
 * Create the K8s Job for building
 */
export async function createBuildJob(
  config: K8sBuildConfig,
  onLog: LogCallback
): Promise<{ jobName: string; success: boolean }> {
  const { batchApi, coreApi } = getK8sClients();
  const jobName = `build-${config.deploymentId.slice(0, 20)}`;

  await onLog("info", `Creating K8s build job: ${jobName}`);

  // Create env secret
  const envSecretName = await createEnvSecret(
    coreApi,
    config.deploymentId,
    config.envVars
  );

  // Build script that runs in the container
  const buildScript = `
set -e
echo "=== Cloudify Build Started ==="
echo "Deployment ID: ${config.deploymentId}"
echo "Site Slug: ${config.siteSlug}"
echo "Branch: ${config.branch}"
echo "Node Version: ${config.nodeVersion}"
echo ""

# Clone repository
echo ">>> Cloning repository..."
git clone --depth 1 --branch "${config.branch}" "${config.repoUrl}" /workspace/repo
cd /workspace/repo

# Navigate to root directory if specified
if [ "${config.rootDir}" != "./" ] && [ -n "${config.rootDir}" ]; then
  echo ">>> Changing to root directory: ${config.rootDir}"
  cd "${config.rootDir}"
fi

# Install dependencies
echo ""
echo ">>> Installing dependencies..."
${config.installCmd}

# Run build
echo ""
echo ">>> Running build..."
NODE_ENV=production ${config.buildCmd}

# Copy output to artifacts directory
echo ""
echo ">>> Copying build output..."
mkdir -p /workspace/artifacts
if [ -d "${config.outputDir}" ]; then
  cp -r ${config.outputDir}/* /workspace/artifacts/
  echo "Build artifacts copied successfully"
else
  echo "ERROR: Output directory '${config.outputDir}' not found!"
  ls -la
  exit 1
fi

# Create completion marker
touch /workspace/artifacts/.build-complete
echo ""
echo "=== Build Completed Successfully ==="
`;

  // Upload script for MinIO
  const uploadScript = `
echo "Waiting for build to complete..."
while [ ! -f /workspace/artifacts/.build-complete ]; do
  sleep 2
done

echo "Uploading artifacts to MinIO..."
mc alias set minio http://minio.${SYSTEM_NAMESPACE}:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
mc mb --ignore-existing minio/cloudify-builds
mc cp -r /workspace/artifacts/ minio/cloudify-builds/${config.siteSlug}/

echo "Upload complete! Artifacts at: cloudify-builds/${config.siteSlug}/"
`;

  const job: k8s.V1Job = {
    metadata: {
      name: jobName,
      namespace: BUILD_NAMESPACE,
      labels: {
        "cloudify.io/component": "build",
        "cloudify.io/deployment-id": config.deploymentId,
        "cloudify.io/project-id": config.projectId,
        "cloudify.io/site-slug": config.siteSlug,
      },
    },
    spec: {
      backoffLimit: 0, // No retries
      ttlSecondsAfterFinished: JOB_TTL_SECONDS,
      activeDeadlineSeconds: BUILD_TIMEOUT_SECONDS,
      template: {
        metadata: {
          labels: {
            "cloudify.io/component": "build-pod",
            "cloudify.io/deployment-id": config.deploymentId,
          },
        },
        spec: {
          restartPolicy: "Never",

          // Init container: Clone and build
          initContainers: [
            {
              name: "build",
              image: `node:${config.nodeVersion}-slim`,
              command: ["/bin/bash", "-c"],
              args: [buildScript],
              env: [
                { name: "NODE_ENV", value: "production" },
                { name: "CI", value: "true" },
              ],
              envFrom: Object.keys(config.envVars).length > 0
                ? [{ secretRef: { name: envSecretName, optional: true } }]
                : undefined,
              volumeMounts: [
                { name: "workspace", mountPath: "/workspace" },
              ],
              resources: {
                requests: { memory: "512Mi", cpu: "500m" },
                limits: { memory: "2Gi", cpu: "2" },
              },
            },
          ],

          // Main container: Upload to MinIO
          containers: [
            {
              name: "uploader",
              image: "minio/mc:latest",
              command: ["/bin/sh", "-c"],
              args: [uploadScript],
              env: [
                {
                  name: "MINIO_ACCESS_KEY",
                  valueFrom: {
                    secretKeyRef: {
                      name: "minio-credentials",
                      key: "root-user",
                    },
                  },
                },
                {
                  name: "MINIO_SECRET_KEY",
                  valueFrom: {
                    secretKeyRef: {
                      name: "minio-credentials",
                      key: "root-password",
                    },
                  },
                },
              ],
              volumeMounts: [
                { name: "workspace", mountPath: "/workspace" },
              ],
              resources: {
                requests: { memory: "64Mi", cpu: "50m" },
                limits: { memory: "256Mi", cpu: "200m" },
              },
            },
          ],

          volumes: [
            {
              name: "workspace",
              emptyDir: { sizeLimit: "5Gi" },
            },
          ],
        },
      },
    },
  };

  try {
    // Delete existing job if it exists
    try {
      await batchApi.deleteNamespacedJob(
        jobName,
        BUILD_NAMESPACE,
        undefined,
        undefined,
        undefined,
        undefined,
        "Background"
      );
      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch {
      // Job doesn't exist, that's fine
    }

    await batchApi.createNamespacedJob(BUILD_NAMESPACE, job);
    await onLog("info", `Build job created: ${jobName}`);
    return { jobName, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await onLog("error", `Failed to create build job: ${message}`);
    return { jobName, success: false };
  }
}

/**
 * Watch a build job and stream logs
 */
export async function watchBuildJob(
  jobName: string,
  deploymentId: string,
  onLog: LogCallback
): Promise<boolean> {
  const { batchApi, coreApi } = getK8sClients();

  await onLog("info", `Watching build job: ${jobName}`);

  return new Promise(async (resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        onLog("error", "Build timed out").then(() => resolve(false));
      }
    }, BUILD_TIMEOUT_SECONDS * 1000);

    // Poll for job status
    const checkInterval = setInterval(async () => {
      try {
        const response = await batchApi.readNamespacedJob(
          jobName,
          BUILD_NAMESPACE
        );
        const job = response.body;

        if (job.status?.succeeded && job.status.succeeded > 0) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            await onLog("success", "Build job completed successfully");
            resolve(true);
          }
        } else if (job.status?.failed && job.status.failed > 0) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            await onLog("error", "Build job failed");
            resolve(false);
          }
        }
      } catch (error) {
        // Job might not exist yet or API error - continue polling
        console.error("Error checking job status:", error);
      }
    }, 5000); // Check every 5 seconds

    // Also try to stream logs from the build container
    try {
      // Wait for pod to be created
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const podsResponse = await coreApi.listNamespacedPod(
        BUILD_NAMESPACE,
        undefined,
        undefined,
        undefined,
        undefined,
        `cloudify.io/deployment-id=${deploymentId}`
      );

      const pod = podsResponse.body.items[0];
      if (pod?.metadata?.name) {
        await streamPodLogs(coreApi, pod.metadata.name, "build", onLog);
      }
    } catch {
      // Log streaming is optional, don't fail the build
      await onLog("info", "Log streaming unavailable, polling for status...");
    }
  });
}

/**
 * Stream logs from a pod container
 */
async function streamPodLogs(
  coreApi: k8s.CoreV1Api,
  podName: string,
  containerName: string,
  onLog: LogCallback
): Promise<void> {
  try {
    const response = await coreApi.readNamespacedPodLog(
      podName,
      BUILD_NAMESPACE,
      containerName,
      true // follow
    );

    const lines = (response.body as string).split("\n");
    for (const line of lines) {
      if (line.trim()) {
        await onLog("info", line);
      }
    }
  } catch (error) {
    // Log streaming failed, that's okay
    console.error("Log streaming error:", error);
  }
}

/**
 * Clean up build resources
 */
export async function cleanupBuildResources(
  deploymentId: string,
  onLog: LogCallback
): Promise<void> {
  const { batchApi, coreApi } = getK8sClients();
  const jobName = `build-${deploymentId.slice(0, 20)}`;
  const secretName = `env-vars-${deploymentId}`;

  try {
    // Delete job
    await batchApi.deleteNamespacedJob(
      jobName,
      BUILD_NAMESPACE,
      undefined,
      undefined,
      undefined,
      undefined,
      "Background"
    );
    await onLog("info", `Cleaned up build job: ${jobName}`);
  } catch {
    // Job might already be deleted
  }

  try {
    // Delete env secret
    await coreApi.deleteNamespacedSecret(secretName, BUILD_NAMESPACE);
    await onLog("info", `Cleaned up env secret: ${secretName}`);
  } catch {
    // Secret might already be deleted
  }
}

/**
 * Get build job status
 */
export async function getBuildJobStatus(
  deploymentId: string
): Promise<{ status: "pending" | "running" | "succeeded" | "failed"; message?: string }> {
  const { batchApi } = getK8sClients();
  const jobName = `build-${deploymentId.slice(0, 20)}`;

  try {
    const response = await batchApi.readNamespacedJob(jobName, BUILD_NAMESPACE);
    const job = response.body;

    if (job.status?.succeeded && job.status.succeeded > 0) {
      return { status: "succeeded" };
    } else if (job.status?.failed && job.status.failed > 0) {
      return { status: "failed", message: "Build job failed" };
    } else if (job.status?.active && job.status.active > 0) {
      return { status: "running" };
    } else {
      return { status: "pending" };
    }
  } catch {
    return { status: "pending", message: "Job not found" };
  }
}

/**
 * Generate site slug from project slug.
 *
 * For production deploys (no deploymentId), returns the bare project slug.
 * For preview deploys, appends a short deployment ID prefix to create a
 * unique slug (e.g. "my-project-abc1234").
 */
export function generateSiteSlug(projectSlug: string, deploymentId?: string): string {
  if (deploymentId) {
    return sanitizeSlug(`${projectSlug}-${deploymentId.substring(0, 7)}`);
  }
  return sanitizeSlug(projectSlug);
}

/**
 * Generate deployment URL
 * Uses non-wildcard subdomain pattern for free Cloudflare SSL
 */
export function generateDeploymentUrl(siteSlug: string): string {
  const baseDomain = process.env.BASE_DOMAIN || "tranthachnguyen.com";
  return `https://${siteSlug}.${baseDomain}`;
}
