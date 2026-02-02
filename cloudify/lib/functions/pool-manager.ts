/**
 * Pool Manager - Manages warm container pools for faster cold starts
 * Uses Redis for coordination in multi-instance deployments
 */

import { spawn, ChildProcess } from "child_process";
import { Runtime } from "./executor";

// Configuration
const POOL_SIZE_DEFAULT = 2;
const POOL_SIZE_MAX = 10;
const CONTAINER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds

// Runtime to Docker image mapping
const RUNTIME_IMAGES: Record<Runtime, string> = {
  nodejs18: "node:18-alpine",
  nodejs20: "node:20-alpine",
  "python3.9": "python:3.9-alpine",
  "python3.10": "python:3.10-alpine",
  "python3.11": "python:3.11-alpine",
  "python3.12": "python:3.12-alpine",
};

interface WarmContainer {
  id: string;
  containerId: string;
  runtime: Runtime;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
}

// In-memory pool (use Redis for distributed deployments)
const containerPools: Map<Runtime, WarmContainer[]> = new Map();
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the pool manager
 */
export async function initializePoolManager(): Promise<void> {
  console.log("Initializing function pool manager...");

  // Pre-warm pools for common runtimes
  await warmPool("nodejs20", POOL_SIZE_DEFAULT);

  // Start health check
  startHealthCheck();

  console.log("Pool manager initialized");
}

/**
 * Warm up a pool for a specific runtime
 */
export async function warmPool(runtime: Runtime, count: number = POOL_SIZE_DEFAULT): Promise<void> {
  const targetCount = Math.min(count, POOL_SIZE_MAX);
  const currentPool = containerPools.get(runtime) || [];
  const availableCount = currentPool.filter((c) => !c.inUse).length;

  const toCreate = Math.max(0, targetCount - availableCount);

  console.log(`Warming pool for ${runtime}: creating ${toCreate} containers`);

  const promises: Promise<WarmContainer | null>[] = [];
  for (let i = 0; i < toCreate; i++) {
    promises.push(createWarmContainer(runtime));
  }

  const containers = await Promise.all(promises);
  const validContainers = containers.filter((c): c is WarmContainer => c !== null);

  const pool = containerPools.get(runtime) || [];
  pool.push(...validContainers);
  containerPools.set(runtime, pool);

  console.log(`Pool for ${runtime} now has ${pool.length} containers`);
}

/**
 * Create a warm container
 */
async function createWarmContainer(runtime: Runtime): Promise<WarmContainer | null> {
  const image = RUNTIME_IMAGES[runtime];
  const containerId = `cloudify-warm-${runtime}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Create a paused container ready to execute code
    const args = [
      "create",
      "--name", containerId,
      "--network", "none",
      "--memory", "256m",
      "--cpus", "0.5",
      "--read-only",
      "--tmpfs", "/tmp:size=100m",
      image,
      "sleep", "infinity", // Keep container alive
    ];

    await runDockerCommand(args);

    // Start the container
    await runDockerCommand(["start", containerId]);

    return {
      id: containerId,
      containerId,
      runtime,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      inUse: false,
    };
  } catch (error) {
    console.error(`Failed to create warm container for ${runtime}:`, error);
    return null;
  }
}

/**
 * Get a container from the pool
 */
export async function getContainer(runtime: Runtime): Promise<WarmContainer | null> {
  const pool = containerPools.get(runtime) || [];

  // Find an available container
  const available = pool.find((c) => !c.inUse);

  if (available) {
    available.inUse = true;
    available.lastUsedAt = Date.now();
    console.log(`Returning warm container ${available.containerId} for ${runtime}`);
    return available;
  }

  // No available container, create a new one
  console.log(`No warm containers available for ${runtime}, creating cold container`);
  const newContainer = await createWarmContainer(runtime);

  if (newContainer) {
    newContainer.inUse = true;
    pool.push(newContainer);
    containerPools.set(runtime, pool);
    return newContainer;
  }

  return null;
}

/**
 * Release a container back to the pool
 */
export async function releaseContainer(container: WarmContainer): Promise<void> {
  const pool = containerPools.get(container.runtime) || [];
  const poolContainer = pool.find((c) => c.id === container.id);

  if (poolContainer) {
    poolContainer.inUse = false;
    poolContainer.lastUsedAt = Date.now();
    console.log(`Released container ${container.containerId} back to pool`);

    // Reset container state for reuse
    try {
      // Kill any running processes inside the container
      await runDockerCommand(["exec", container.containerId, "pkill", "-9", "-f", "."]).catch(() => {});
    } catch {
      // Container might be in a bad state, remove it
      await destroyContainer(container);
    }
  }
}

/**
 * Destroy a container
 */
export async function destroyContainer(container: WarmContainer): Promise<void> {
  try {
    await runDockerCommand(["rm", "-f", container.containerId]);
    console.log(`Destroyed container ${container.containerId}`);

    // Remove from pool
    const pool = containerPools.get(container.runtime) || [];
    const index = pool.findIndex((c) => c.id === container.id);
    if (index !== -1) {
      pool.splice(index, 1);
      containerPools.set(container.runtime, pool);
    }
  } catch (error) {
    console.error(`Failed to destroy container ${container.containerId}:`, error);
  }
}

/**
 * Execute code in a container
 */
export async function executeInContainer(
  container: WarmContainer,
  code: string,
  wrapperFile: string,
  timeout: number
): Promise<{ success: boolean; output?: string; error?: string }> {
  // Copy code to container
  const codeBase64 = Buffer.from(code).toString("base64");
  const copyCmd = `echo "${codeBase64}" | base64 -d > /tmp/${wrapperFile}`;

  try {
    await runDockerCommand(["exec", container.containerId, "sh", "-c", copyCmd]);

    // Execute the code
    const runCmd = container.runtime.startsWith("nodejs") ? "node" : "python";
    const result = await runDockerCommandWithOutput(
      ["exec", container.containerId, runCmd, `/tmp/${wrapperFile}`],
      timeout
    );

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Execution failed",
    };
  }
}

/**
 * Start health check for pools
 */
function startHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    const now = Date.now();

    for (const [runtime, pool] of containerPools) {
      // Remove idle containers
      const toRemove = pool.filter(
        (c) => !c.inUse && now - c.lastUsedAt > CONTAINER_IDLE_TIMEOUT
      );

      for (const container of toRemove) {
        await destroyContainer(container);
      }

      // Check health of remaining containers
      for (const container of pool) {
        if (container.inUse) continue;

        try {
          await runDockerCommand(["exec", container.containerId, "echo", "health"]);
        } catch {
          // Container is unhealthy, remove it
          await destroyContainer(container);
        }
      }

      // Ensure minimum pool size
      const available = pool.filter((c) => !c.inUse).length;
      if (available < POOL_SIZE_DEFAULT) {
        warmPool(runtime, POOL_SIZE_DEFAULT - available).catch(console.error);
      }
    }
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Stop the pool manager
 */
export async function stopPoolManager(): Promise<void> {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  // Destroy all containers
  for (const [, pool] of containerPools) {
    for (const container of pool) {
      await destroyContainer(container);
    }
  }

  containerPools.clear();
  console.log("Pool manager stopped");
}

/**
 * Get pool statistics
 */
export function getPoolStats(): Record<Runtime, { total: number; available: number; inUse: number }> {
  const stats: Record<string, { total: number; available: number; inUse: number }> = {};

  for (const [runtime, pool] of containerPools) {
    const inUse = pool.filter((c) => c.inUse).length;
    stats[runtime] = {
      total: pool.length,
      available: pool.length - inUse,
      inUse,
    };
  }

  return stats as Record<Runtime, { total: number; available: number; inUse: number }>;
}

// Helper functions
async function runDockerCommand(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("docker", args);
    let stderr = "";

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `Exit code: ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function runDockerCommandWithOutput(
  args: string[],
  timeout: number
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    let output = "";
    let errorOutput = "";
    let killed = false;

    const proc: ChildProcess = spawn("docker", args);

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, timeout);

    proc.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        resolve({ success: false, error: "Execution timed out" });
      } else if (code !== 0) {
        resolve({ success: false, error: errorOutput || `Exit code: ${code}` });
      } else {
        resolve({ success: true, output });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({ success: false, error: err.message });
    });
  });
}
