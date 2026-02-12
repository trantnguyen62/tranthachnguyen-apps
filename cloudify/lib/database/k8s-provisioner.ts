/**
 * Kubernetes-Based Database Provisioner
 *
 * Provisions managed databases as StatefulSets in a K8s cluster.
 * Generates manifests from templates in k8s/databases/ and applies them
 * via kubectl. Used when K3S_ENABLED is set.
 */

import { execFile } from "child_process";
import { readFile, writeFile, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { createLogger } from "@/lib/logging/logger";

const execFileAsync = promisify(execFile);
const log = createLogger("database:k8s");

const NAMESPACE = "cloudify-databases";
const TEMPLATES_DIR = path.join(process.cwd(), "k8s", "databases");

/**
 * Resource limits per plan tier
 */
const PLAN_RESOURCES: Record<
  string,
  { storage: string; memory: string; cpu: string }
> = {
  hobby: { storage: "1Gi", memory: "256Mi", cpu: "250m" },
  pro: { storage: "10Gi", memory: "512Mi", cpu: "500m" },
  enterprise: { storage: "50Gi", memory: "2Gi", cpu: "1" },
};

/**
 * K8s provisioner configuration
 */
export interface K8sProvisionConfig {
  databaseId: string;
  type: "postgresql" | "mysql" | "redis";
  name: string;
  username: string;
  password: string;
  plan: string;
}

/**
 * K8s provisioner result
 */
export interface K8sProvisionResult {
  serviceName: string;
  namespace: string;
  host: string;
  port: number;
}

/**
 * Validate that a database ID is safe for use in K8s resource names.
 */
function validateDatabaseId(databaseId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(databaseId)) {
    throw new Error(`Invalid database ID format: ${databaseId}`);
  }
  if (databaseId.length > 128) {
    throw new Error("Database ID is too long");
  }
}

/**
 * Get K8s resource name for a database
 */
export function getK8sResourceName(databaseId: string): string {
  validateDatabaseId(databaseId);
  return `cloudify-db-${databaseId}`;
}

/**
 * Ensure the cloudify-databases namespace exists
 */
async function ensureNamespace(): Promise<void> {
  try {
    await execFileAsync("kubectl", ["get", "namespace", NAMESPACE]);
  } catch {
    log.info("Creating namespace", { namespace: NAMESPACE });
    await execFileAsync("kubectl", [
      "create",
      "namespace",
      NAMESPACE,
    ]);
  }
}

/**
 * Generate K8s manifests from a template by replacing placeholders.
 */
async function generateManifest(
  type: "postgresql" | "mysql" | "redis",
  config: K8sProvisionConfig
): Promise<string> {
  const templateFile = path.join(TEMPLATES_DIR, `${type}-template.yaml`);
  let template = await readFile(templateFile, "utf-8");

  const resources = PLAN_RESOURCES[config.plan] || PLAN_RESOURCES.hobby;

  // For Redis, the MEMORY_LIMIT in the config needs to be in Redis format (bytes-style)
  // but in the resource limits we use K8s format
  const redisMaxMemory =
    type === "redis" ? convertToRedisMemory(resources.memory) : "";

  const replacements: Record<string, string> = {
    "{{DATABASE_ID}}": config.databaseId,
    "{{DB_NAME}}": config.name,
    "{{DB_USERNAME}}": config.username,
    "{{DB_PASSWORD}}": config.password,
    "{{STORAGE_SIZE}}": resources.storage,
    "{{MEMORY_LIMIT}}": type === "redis" ? redisMaxMemory : resources.memory,
    "{{CPU_LIMIT}}": resources.cpu,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replaceAll(placeholder, value);
  }

  // For Redis, also fix the resource limits section which should use K8s format
  if (type === "redis") {
    // The template has memory limit in resources section that needs K8s format.
    // We handle this by making the template use the Redis format for config
    // and K8s format for the container resources. The template already has
    // {{MEMORY_LIMIT}} in both places, so we need a second pass for the
    // resources section. We solve this by ensuring the template's container
    // resources limits use a separate approach -- the template is designed
    // so that the maxmemory in redis.conf uses the Redis format via the
    // MEMORY_LIMIT placeholder, while we re-patch the container resources.
    // Actually, let's just fix the container resources back to K8s format.
    const containerResourceLine = `              memory: "${redisMaxMemory}"`;
    const k8sResourceLine = `              memory: "${resources.memory}"`;
    // Find the limits section in the container spec (not the redis.conf)
    // The limits appear after "limits:" in the YAML
    const limitsIdx = template.indexOf("            limits:");
    if (limitsIdx !== -1) {
      const afterLimits = template.slice(limitsIdx);
      const fixedAfterLimits = afterLimits.replace(
        containerResourceLine,
        k8sResourceLine
      );
      template = template.slice(0, limitsIdx) + fixedAfterLimits;
    }
  }

  return template;
}

/**
 * Convert K8s memory format to Redis maxmemory format.
 * e.g., "256Mi" -> "256mb", "2Gi" -> "2gb"
 */
function convertToRedisMemory(k8sMemory: string): string {
  const match = k8sMemory.match(/^(\d+)(Mi|Gi)$/);
  if (!match) return "256mb";

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "Mi":
      return `${value}mb`;
    case "Gi":
      return `${value}gb`;
    default:
      return `${value}mb`;
  }
}

/**
 * Apply a K8s manifest using kubectl apply.
 * Writes the manifest to a temp file and applies it.
 */
async function applyManifest(manifest: string): Promise<void> {
  const tempFile = path.join(
    tmpdir(),
    `cloudify-db-${randomBytes(8).toString("hex")}.yaml`
  );

  try {
    await writeFile(tempFile, manifest, "utf-8");
    await execFileAsync("kubectl", ["apply", "-f", tempFile]);
  } finally {
    try {
      await unlink(tempFile);
    } catch {
      // Temp file cleanup is best-effort
    }
  }
}

/**
 * Delete K8s resources for a database using kubectl delete.
 */
async function deleteManifest(manifest: string): Promise<void> {
  const tempFile = path.join(
    tmpdir(),
    `cloudify-db-delete-${randomBytes(8).toString("hex")}.yaml`
  );

  try {
    await writeFile(tempFile, manifest, "utf-8");
    await execFileAsync("kubectl", [
      "delete",
      "-f",
      tempFile,
      "--ignore-not-found",
    ]);
  } finally {
    try {
      await unlink(tempFile);
    } catch {
      // Temp file cleanup is best-effort
    }
  }
}

/**
 * Provision a database in K8s by generating and applying manifests.
 */
export async function createK8sDatabase(
  config: K8sProvisionConfig
): Promise<K8sProvisionResult> {
  validateDatabaseId(config.databaseId);

  const resourceName = getK8sResourceName(config.databaseId);

  log.info("Provisioning K8s database", {
    type: config.type,
    databaseId: config.databaseId,
    resourceName,
  });

  // Ensure namespace exists
  await ensureNamespace();

  // Generate manifest from template
  const manifest = await generateManifest(config.type, config);

  // Apply manifest
  await applyManifest(manifest);

  log.info("K8s manifest applied", {
    resourceName,
    type: config.type,
  });

  // Wait for StatefulSet to be ready
  await waitForStatefulSetReady(resourceName);

  const port = getDefaultPort(config.type);
  const host = `${resourceName}.${NAMESPACE}.svc.cluster.local`;

  log.info("K8s database provisioned successfully", {
    type: config.type,
    databaseId: config.databaseId,
    host,
    port,
  });

  return {
    serviceName: resourceName,
    namespace: NAMESPACE,
    host,
    port,
  };
}

/**
 * Wait for a StatefulSet to have at least 1 ready replica.
 */
async function waitForStatefulSetReady(
  name: string,
  timeoutMs: number = 120000
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 3000;

  log.info("Waiting for StatefulSet readiness", { name, timeoutMs });

  while (Date.now() - startTime < timeoutMs) {
    try {
      const { stdout } = await execFileAsync("kubectl", [
        "get",
        "statefulset",
        name,
        "-n",
        NAMESPACE,
        "-o",
        "jsonpath={.status.readyReplicas}",
      ]);

      const readyReplicas = parseInt(stdout.trim(), 10);
      if (readyReplicas >= 1) {
        log.info("StatefulSet is ready", { name, readyReplicas });
        return;
      }
    } catch {
      // StatefulSet may not exist yet
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    `StatefulSet ${name} did not become ready within ${timeoutMs}ms`
  );
}

/**
 * Remove a K8s database by deleting all associated resources.
 */
export async function removeK8sDatabase(
  databaseId: string,
  type: "postgresql" | "mysql" | "redis"
): Promise<void> {
  validateDatabaseId(databaseId);

  const resourceName = getK8sResourceName(databaseId);

  log.info("Removing K8s database", {
    databaseId,
    resourceName,
    type,
  });

  // Generate the manifest so we can delete the exact resources
  try {
    const config: K8sProvisionConfig = {
      databaseId,
      type,
      name: "placeholder",
      username: "placeholder",
      password: "placeholder",
      plan: "hobby",
    };
    const manifest = await generateManifest(type, config);
    await deleteManifest(manifest);
  } catch (error) {
    // If template-based deletion fails, fall back to label-based deletion
    log.warn("Template-based deletion failed, using label selector", {
      error: error instanceof Error ? error.message : String(error),
    });

    await deleteByLabel(databaseId);
  }

  log.info("K8s database removed", { databaseId, resourceName });
}

/**
 * Fall back to deleting resources by label selector.
 */
async function deleteByLabel(databaseId: string): Promise<void> {
  const labelSelector = `cloudify/database-id=${databaseId}`;
  const resourceTypes = [
    "statefulset",
    "service",
    "secret",
    "configmap",
    "pvc",
  ];

  for (const resourceType of resourceTypes) {
    try {
      await execFileAsync("kubectl", [
        "delete",
        resourceType,
        "-n",
        NAMESPACE,
        "-l",
        labelSelector,
        "--ignore-not-found",
      ]);
    } catch (error) {
      log.warn(`Failed to delete ${resourceType} by label`, {
        databaseId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Get pod metrics for a K8s-hosted database.
 */
export async function getK8sDatabaseMetrics(databaseId: string): Promise<{
  cpuPercent: number;
  memoryUsageMB: number;
  memoryLimitMB: number;
  podStatus: string;
  restarts: number;
}> {
  validateDatabaseId(databaseId);

  const resourceName = getK8sResourceName(databaseId);
  const labelSelector = `cloudify/database-id=${databaseId}`;

  // Get pod status
  const { stdout: podJson } = await execFileAsync("kubectl", [
    "get",
    "pods",
    "-n",
    NAMESPACE,
    "-l",
    labelSelector,
    "-o",
    "json",
  ]);

  const podData = JSON.parse(podJson);
  const pod = podData.items?.[0];

  if (!pod) {
    throw new Error(`No pod found for database ${databaseId}`);
  }

  const podStatus = pod.status?.phase || "Unknown";
  const restarts =
    pod.status?.containerStatuses?.[0]?.restartCount || 0;

  // Try to get resource usage via kubectl top
  let cpuPercent = 0;
  let memoryUsageMB = 0;
  let memoryLimitMB = 0;

  try {
    const { stdout: topOutput } = await execFileAsync("kubectl", [
      "top",
      "pod",
      pod.metadata.name,
      "-n",
      NAMESPACE,
      "--no-headers",
    ]);

    const parts = topOutput.trim().split(/\s+/);
    // Format: NAME CPU(cores) MEMORY(bytes)
    if (parts.length >= 3) {
      // CPU: "5m" (millicores) -> percentage (assuming 1 core = 100%)
      const cpuStr = parts[1];
      const cpuMillicores = parseInt(cpuStr.replace("m", ""), 10) || 0;
      cpuPercent = cpuMillicores / 10; // 1000m = 100%

      // Memory: "128Mi" -> MB
      const memStr = parts[2];
      memoryUsageMB = parseK8sMemoryToMB(memStr);
    }
  } catch {
    // metrics-server may not be available
    log.warn("kubectl top not available", { resourceName });
  }

  // Get memory limit from the container spec
  try {
    const { stdout: limitJson } = await execFileAsync("kubectl", [
      "get",
      "statefulset",
      resourceName,
      "-n",
      NAMESPACE,
      "-o",
      "jsonpath={.spec.template.spec.containers[0].resources.limits.memory}",
    ]);
    memoryLimitMB = parseK8sMemoryToMB(limitJson.trim());
  } catch {
    // Best-effort
  }

  return {
    cpuPercent,
    memoryUsageMB,
    memoryLimitMB,
    podStatus,
    restarts,
  };
}

/**
 * Check if a K8s database pod is running.
 */
export async function isK8sDatabaseRunning(
  databaseId: string
): Promise<boolean> {
  validateDatabaseId(databaseId);

  try {
    const { stdout } = await execFileAsync("kubectl", [
      "get",
      "pods",
      "-n",
      NAMESPACE,
      "-l",
      `cloudify/database-id=${databaseId}`,
      "-o",
      "jsonpath={.items[0].status.phase}",
    ]);
    return stdout.trim() === "Running";
  } catch {
    return false;
  }
}

/**
 * Parse K8s memory format to MB.
 * e.g., "256Mi" -> 256, "2Gi" -> 2048, "128974848" (bytes) -> ~123
 */
function parseK8sMemoryToMB(memStr: string): number {
  if (!memStr) return 0;

  // Handle suffixed values
  const match = memStr.match(/^(\d+)(Ki|Mi|Gi|Ti)?$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2] || "";

    switch (unit) {
      case "Ki":
        return value / 1024;
      case "Mi":
        return value;
      case "Gi":
        return value * 1024;
      case "Ti":
        return value * 1024 * 1024;
      default:
        // Bare number = bytes
        return value / (1024 * 1024);
    }
  }

  return 0;
}

/**
 * Get default port for database type
 */
function getDefaultPort(type: "postgresql" | "mysql" | "redis"): number {
  switch (type) {
    case "postgresql":
      return 5432;
    case "mysql":
      return 3306;
    case "redis":
      return 6379;
  }
}

/**
 * Generate secure database credentials (matches docker-provisioner pattern)
 */
export function generateK8sCredentials(): {
  username: string;
  password: string;
} {
  const username = `cloudify_${randomBytes(4).toString("hex")}`;
  const password = randomBytes(32).toString("hex");
  return { username, password };
}
