/**
 * Build Queue - Redis-based priority queue for build jobs.
 *
 * Replaces the fire-and-forget pattern in triggerBuild / triggerK8sBuild
 * with a proper queue that enforces concurrency limits.
 *
 * Queue keys:
 *   build:queue:high   - production deployments (FIFO via Redis list)
 *   build:queue:low    - preview deployments (FIFO via Redis list)
 *   build:active       - set of currently-running deployment IDs
 *   build:job:{id}     - JSON metadata for each queued job
 *
 * Concurrency is configured via the BUILD_CONCURRENCY env var (default: 3).
 * Production deploys are always dequeued before preview deploys.
 */

import { getRedisClient } from "@/lib/storage/redis-client";

const QUEUE_HIGH = "build:queue:high";
const QUEUE_LOW = "build:queue:low";
const ACTIVE_SET = "build:active";
const JOB_PREFIX = "build:job:";

/** Maximum number of builds running at the same time. */
const BUILD_CONCURRENCY = parseInt(
  process.env.BUILD_CONCURRENCY || "3",
  10
);

/** Auto-expire job metadata after 30 minutes. */
const JOB_TTL_SECONDS = 30 * 60;

export type BuildPriority = "high" | "low";

export interface BuildJob {
  deploymentId: string;
  projectId: string;
  priority: BuildPriority;
  enqueuedAt: number;
}

/**
 * Add a build to the queue.
 *
 * @param deploymentId - The deployment to build
 * @param projectId    - The owning project
 * @param priority     - "high" for production, "low" for preview
 */
export async function enqueueBuild(
  deploymentId: string,
  projectId: string,
  priority: BuildPriority = "high"
): Promise<void> {
  const redis = getRedisClient();

  const job: BuildJob = {
    deploymentId,
    projectId,
    priority,
    enqueuedAt: Date.now(),
  };

  // Store the job payload with a TTL
  await redis.set(
    `${JOB_PREFIX}${deploymentId}`,
    JSON.stringify(job),
    "EX",
    JOB_TTL_SECONDS
  );

  // Push to the appropriate priority queue (FIFO: rpush + lpop)
  const queue = priority === "high" ? QUEUE_HIGH : QUEUE_LOW;
  await redis.rpush(queue, deploymentId);
}

/**
 * Try to dequeue the next build job, respecting concurrency limits.
 *
 * Returns null if the concurrency limit is reached or no jobs are queued.
 */
export async function dequeueBuild(): Promise<BuildJob | null> {
  const redis = getRedisClient();

  // Check concurrency
  const activeCount = await redis.scard(ACTIVE_SET);
  if (activeCount >= BUILD_CONCURRENCY) {
    return null;
  }

  // Try high-priority queue first, then low
  let deploymentId = await redis.lpop(QUEUE_HIGH);
  if (!deploymentId) {
    deploymentId = await redis.lpop(QUEUE_LOW);
  }

  if (!deploymentId) {
    return null;
  }

  // Load job data
  const raw = await redis.get(`${JOB_PREFIX}${deploymentId}`);
  if (!raw) {
    // Job expired or was removed -- try next
    return dequeueBuild();
  }

  // Mark as active
  await redis.sadd(ACTIVE_SET, deploymentId);

  return JSON.parse(raw) as BuildJob;
}

/**
 * Mark a build as completed (success or failure) and remove from active set.
 */
export async function completeBuild(deploymentId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.srem(ACTIVE_SET, deploymentId);
  await redis.del(`${JOB_PREFIX}${deploymentId}`);
}

/**
 * Get the number of active builds.
 */
export async function getActiveBuildCount(): Promise<number> {
  const redis = getRedisClient();
  return redis.scard(ACTIVE_SET);
}

/**
 * Get the total number of queued builds (both priorities).
 */
export async function getQueueLength(): Promise<number> {
  const redis = getRedisClient();
  const [high, low] = await Promise.all([
    redis.llen(QUEUE_HIGH),
    redis.llen(QUEUE_LOW),
  ]);
  return high + low;
}

/**
 * Remove a job from the queue (e.g., when a deployment is cancelled).
 */
export async function removeFromQueue(deploymentId: string): Promise<boolean> {
  const redis = getRedisClient();

  // Remove from both queues (it can only be in one, but this is safe)
  const removedHigh = await redis.lrem(QUEUE_HIGH, 1, deploymentId);
  const removedLow = await redis.lrem(QUEUE_LOW, 1, deploymentId);
  await redis.del(`${JOB_PREFIX}${deploymentId}`);

  return removedHigh > 0 || removedLow > 0;
}

/**
 * Process the build queue continuously.
 *
 * Calls `buildFn` for each dequeued job. `completeBuild` is called
 * automatically after `buildFn` settles (success or failure).
 *
 * @param buildFn - The function that actually runs a build
 * @param pollIntervalMs - How often to poll when idle (default 2 000 ms)
 */
export function processBuildQueue(
  buildFn: (job: BuildJob) => Promise<void>,
  pollIntervalMs = 2000
): { stop: () => void } {
  let running = true;

  async function loop() {
    while (running) {
      const job = await dequeueBuild();

      if (job) {
        // Run build; completeBuild is always called via finally
        buildFn(job)
          .catch((err) => {
            console.error(
              `Build failed for deployment ${job.deploymentId}:`,
              err
            );
          })
          .finally(() => {
            completeBuild(job.deploymentId).catch(console.error);
          });

        // Immediately try to dequeue more (may hit concurrency limit)
        continue;
      }

      // Nothing to do -- wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  loop().catch(console.error);

  return {
    stop() {
      running = false;
    },
  };
}
