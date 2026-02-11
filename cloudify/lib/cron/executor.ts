/**
 * BullMQ-based Cron Job Executor
 *
 * Provides reliable job execution with:
 * - Automatic retries with exponential backoff
 * - Job deduplication
 * - Execution history
 * - Real-time job monitoring
 */

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logging";
import { parseNextRun } from "./scheduler";

const logger = createLogger("cron-executor");

// Redis connection config
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
};

// Queue name
const CRON_QUEUE_NAME = "cloudify-cron-jobs";

// Global instances
let cronQueue: Queue | null = null;
let cronWorker: Worker | null = null;
let queueEvents: QueueEvents | null = null;

export interface CronJobPayload {
  jobId: string;
  projectId: string;
  name: string;
  path: string;
  timeout: number;
  retryCount: number;
}

/**
 * Initialize the cron queue and worker
 */
export async function initializeCronExecutor(): Promise<void> {
  if (cronQueue) {
    logger.warn("Cron executor already initialized");
    return;
  }

  logger.info("Initializing BullMQ cron executor");

  // Create the queue
  cronQueue = new Queue<CronJobPayload>(CRON_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  // Create the worker
  cronWorker = new Worker<CronJobPayload>(
    CRON_QUEUE_NAME,
    async (job: Job<CronJobPayload>) => {
      return await executeJob(job);
    },
    {
      connection: redisConnection,
      concurrency: 10, // Process up to 10 jobs concurrently
      limiter: {
        max: 100,
        duration: 60000, // Max 100 jobs per minute
      },
    }
  );

  // Set up event listeners
  cronWorker.on("completed", (job) => {
    logger.info("Cron job completed", { jobId: job.data.jobId, name: job.data.name });
  });

  cronWorker.on("failed", (job, err) => {
    logger.error("Cron job failed", err, { jobId: job?.data.jobId, name: job?.data.name });
  });

  cronWorker.on("error", (err) => {
    logger.error("Cron worker error", err);
  });

  // Queue events for monitoring
  queueEvents = new QueueEvents(CRON_QUEUE_NAME, { connection: redisConnection });

  logger.info("Cron executor initialized successfully");
}

/**
 * Execute a cron job
 */
async function executeJob(job: Job<CronJobPayload>): Promise<{ status: string; duration: number }> {
  const { jobId, projectId, name, path, timeout } = job.data;
  const startTime = Date.now();

  logger.info("Executing cron job", { jobId, name, path, attempt: job.attemptsMade + 1 });

  // Create execution record
  const execution = await prisma.cronExecution.create({
    data: {
      jobId,
      status: "running",
      startedAt: new Date(),
      retryAttempt: job.attemptsMade,
    },
  });

  try {
    // Get the project's deployment URL
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        deployments: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Build the URL for the job
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If there's an active deployment with a URL, use that
    if (project.deployments[0]?.url) {
      baseUrl = project.deployments[0].url;
    } else if (project.deployments[0]?.siteSlug) {
      baseUrl = `https://${project.deployments[0].siteSlug}.projects.tranthachnguyen.com`;
    }

    const url = new URL(path, baseUrl);

    // Execute with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cloudify-Cron": "true",
        "X-Cloudify-Job-Id": jobId,
        "X-Cloudify-Execution-Id": execution.id,
        "X-Cloudify-Project-Id": projectId,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 500)}`);
    }

    // Update execution as successful
    await prisma.cronExecution.update({
      where: { id: execution.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        duration,
        response: responseText.substring(0, 10000),
      },
    });

    // Update job's last run time
    await prisma.cronJob.update({
      where: { id: jobId },
      data: {
        lastRunAt: new Date(),
        lastStatus: "success",
      },
    });

    return { status: "success", duration };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;

    logger.error("Cron job execution failed", err, { jobId, name });

    // Update execution as failed
    await prisma.cronExecution.update({
      where: { id: execution.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        duration,
        error: err.message,
      },
    });

    // Update job status
    await prisma.cronJob.update({
      where: { id: jobId },
      data: {
        lastRunAt: new Date(),
        lastStatus: "failed",
      },
    });

    // Re-throw to trigger BullMQ retry
    throw error;
  }
}

/**
 * Schedule a cron job for execution
 */
export async function scheduleCronJob(jobId: string): Promise<void> {
  if (!cronQueue) {
    throw new Error("Cron executor not initialized");
  }

  const cronJob = await prisma.cronJob.findUnique({
    where: { id: jobId },
  });

  if (!cronJob || !cronJob.enabled) {
    logger.warn("Cron job not found or disabled", { jobId });
    return;
  }

  const payload: CronJobPayload = {
    jobId: cronJob.id,
    projectId: cronJob.projectId,
    name: cronJob.name,
    path: cronJob.path,
    timeout: cronJob.timeout,
    retryCount: cronJob.retryCount,
  };

  await cronQueue.add(cronJob.name, payload, {
    jobId: `cron-${jobId}-${Date.now()}`,
    attempts: cronJob.retryCount + 1,
  });

  // Update next run time
  const nextRun = parseNextRun(cronJob.schedule, cronJob.timezone);
  await prisma.cronJob.update({
    where: { id: jobId },
    data: { nextRunAt: nextRun },
  });

  logger.info("Cron job scheduled", { jobId, name: cronJob.name, nextRun });
}

/**
 * Process all due cron jobs
 */
export async function processDueCronJobs(): Promise<number> {
  if (!cronQueue) {
    logger.warn("Cron executor not initialized, skipping");
    return 0;
  }

  const now = new Date();

  // Find all enabled jobs that are due
  const dueJobs = await prisma.cronJob.findMany({
    where: {
      enabled: true,
      nextRunAt: {
        lte: now,
      },
    },
  });

  logger.info(`Found ${dueJobs.length} due cron jobs`);

  // Schedule each job
  for (const job of dueJobs) {
    try {
      await scheduleCronJob(job.id);
    } catch (error) {
      logger.error("Failed to schedule cron job", error as Error, { jobId: job.id });
    }
  }

  return dueJobs.length;
}

/**
 * Get queue statistics
 */
export async function getCronQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  if (!cronQueue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    cronQueue.getWaitingCount(),
    cronQueue.getActiveCount(),
    cronQueue.getCompletedCount(),
    cronQueue.getFailedCount(),
    cronQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Shutdown the cron executor
 */
export async function shutdownCronExecutor(): Promise<void> {
  logger.info("Shutting down cron executor");

  if (cronWorker) {
    await cronWorker.close();
    cronWorker = null;
  }

  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }

  if (cronQueue) {
    await cronQueue.close();
    cronQueue = null;
  }

  logger.info("Cron executor shut down");
}

/**
 * Get the cron queue instance
 */
export function getCronQueue(): Queue<CronJobPayload> | null {
  return cronQueue;
}
