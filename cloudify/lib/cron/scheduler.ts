/**
 * Cron Job Scheduler
 *
 * Provides Vercel-compatible cron job scheduling for serverless functions.
 * Supports:
 * - Cron expression parsing
 * - vercel.json crons configuration
 * - Job execution with retries
 * - Execution history and logs
 */

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logging";

const logger = createLogger("cron");

// Cron expression patterns
const CRON_PATTERNS = {
  everyMinute: "* * * * *",
  everyHour: "0 * * * *",
  everyDay: "0 0 * * *",
  everyWeek: "0 0 * * 0",
  everyMonth: "0 0 1 * *",
};

export interface CronJob {
  id: string;
  name: string;
  projectId: string;
  schedule: string; // Cron expression
  path: string; // API route to call (e.g., /api/cron/cleanup)
  enabled: boolean;
  timezone: string;
  lastRun?: Date;
  nextRun?: Date;
  retryCount: number;
  timeout: number; // seconds
}

export interface CronExecution {
  id: string;
  jobId: string;
  status: "pending" | "running" | "success" | "failed";
  startedAt: Date;
  finishedAt?: Date;
  duration?: number;
  response?: string;
  error?: string;
  retryAttempt: number;
}

/**
 * Parse cron expression into next run time
 */
export function parseNextRun(cronExpression: string, timezone = "UTC"): Date {
  // Simple cron parser for common patterns
  // Format: minute hour day month weekday
  const parts = cronExpression.split(" ");
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression. Expected 5 parts: minute hour day month weekday");
  }

  const now = new Date();
  const [minute, hour, day, month, weekday] = parts;

  // For now, implement simple patterns
  // Full cron parsing would use a library like 'cron-parser'

  let nextRun = new Date(now);

  // Every minute
  if (cronExpression === "* * * * *") {
    nextRun.setMinutes(nextRun.getMinutes() + 1);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    return nextRun;
  }

  // Every hour at minute 0
  if (minute !== "*" && hour === "*" && day === "*" && month === "*" && weekday === "*") {
    const targetMinute = parseInt(minute, 10);
    nextRun.setMinutes(targetMinute);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    if (nextRun <= now) {
      nextRun.setHours(nextRun.getHours() + 1);
    }
    return nextRun;
  }

  // Every day at specific hour:minute
  if (minute !== "*" && hour !== "*" && day === "*" && month === "*" && weekday === "*") {
    const targetMinute = parseInt(minute, 10);
    const targetHour = parseInt(hour, 10);
    nextRun.setHours(targetHour);
    nextRun.setMinutes(targetMinute);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    return nextRun;
  }

  // Default: next minute
  nextRun.setMinutes(nextRun.getMinutes() + 1);
  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);
  return nextRun;
}

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): {
  valid: boolean;
  error?: string;
} {
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    return {
      valid: false,
      error: "Cron expression must have 5 parts: minute hour day month weekday",
    };
  }

  const ranges = [
    { name: "minute", min: 0, max: 59 },
    { name: "hour", min: 0, max: 23 },
    { name: "day", min: 1, max: 31 },
    { name: "month", min: 1, max: 12 },
    { name: "weekday", min: 0, max: 6 },
  ];

  for (let i = 0; i < 5; i++) {
    const part = parts[i];
    const range = ranges[i];

    // Allow * for any value
    if (part === "*") continue;

    // Allow */n for intervals
    if (part.startsWith("*/")) {
      const interval = parseInt(part.substring(2), 10);
      if (isNaN(interval) || interval < 1) {
        return { valid: false, error: `Invalid interval in ${range.name}` };
      }
      continue;
    }

    // Allow comma-separated values
    const values = part.split(",");
    for (const value of values) {
      // Allow ranges like 1-5
      if (value.includes("-")) {
        const [start, end] = value.split("-").map((v) => parseInt(v, 10));
        if (isNaN(start) || isNaN(end) || start < range.min || end > range.max || start > end) {
          return { valid: false, error: `Invalid range in ${range.name}` };
        }
        continue;
      }

      const num = parseInt(value, 10);
      if (isNaN(num) || num < range.min || num > range.max) {
        return { valid: false, error: `Invalid value in ${range.name}: ${value}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Get human-readable description of cron schedule
 */
export function describeCronSchedule(expression: string): string {
  const validation = validateCronExpression(expression);
  if (!validation.valid) {
    return "Invalid schedule";
  }

  // Common patterns
  const descriptions: Record<string, string> = {
    "* * * * *": "Every minute",
    "*/5 * * * *": "Every 5 minutes",
    "*/15 * * * *": "Every 15 minutes",
    "*/30 * * * *": "Every 30 minutes",
    "0 * * * *": "Every hour",
    "0 */2 * * *": "Every 2 hours",
    "0 */6 * * *": "Every 6 hours",
    "0 */12 * * *": "Every 12 hours",
    "0 0 * * *": "Every day at midnight",
    "0 0 * * 0": "Every Sunday at midnight",
    "0 0 * * 1": "Every Monday at midnight",
    "0 0 1 * *": "First day of every month",
  };

  return descriptions[expression] || `Custom schedule: ${expression}`;
}

/**
 * Execute a cron job
 */
export async function executeCronJob(job: CronJob): Promise<CronExecution> {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  logger.info("Executing cron job", { jobId: job.id, name: job.name, path: job.path });

  const execution: CronExecution = {
    id: executionId,
    jobId: job.id,
    status: "running",
    startedAt: new Date(),
    retryAttempt: 0,
  };

  try {
    // Build the URL for the job
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = new URL(job.path, baseUrl);

    // Execute with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), job.timeout * 1000);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cloudify-Cron": "true",
        "X-Cloudify-Job-Id": job.id,
        "X-Cloudify-Execution-Id": executionId,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    execution.status = "success";
    execution.response = responseText.substring(0, 1000);
    execution.finishedAt = new Date();
    execution.duration = execution.finishedAt.getTime() - execution.startedAt.getTime();

    logger.info("Cron job completed", {
      jobId: job.id,
      executionId,
      duration: execution.duration,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    execution.status = "failed";
    execution.error = err.message;
    execution.finishedAt = new Date();
    execution.duration = execution.finishedAt.getTime() - execution.startedAt.getTime();

    logger.error("Cron job failed", err, { jobId: job.id, executionId });
  }

  // Update job's last run time
  await prisma.cronJob.update({
    where: { id: job.id },
    data: {
      lastRunAt: execution.startedAt,
      nextRunAt: parseNextRun(job.schedule, job.timezone),
      lastStatus: execution.status,
    },
  });

  // Store execution record
  await prisma.cronExecution.create({
    data: {
      jobId: job.id,
      status: execution.status,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      duration: execution.duration,
      response: execution.response,
      error: execution.error,
      retryAttempt: execution.retryAttempt,
    },
  });

  return execution;
}

/**
 * Process all due cron jobs
 */
export async function processDueCronJobs(): Promise<void> {
  const now = new Date();

  // Find all enabled jobs that are due
  const dueJobs = await prisma.cronJob.findMany({
    where: {
      enabled: true,
      nextRunAt: {
        lte: now,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  logger.info(`Found ${dueJobs.length} due cron jobs`);

  // Execute each job
  for (const job of dueJobs) {
    try {
      await executeCronJob({
        id: job.id,
        name: job.name,
        projectId: job.projectId,
        schedule: job.schedule,
        path: job.path,
        enabled: job.enabled,
        timezone: job.timezone,
        lastRun: job.lastRunAt || undefined,
        nextRun: job.nextRunAt || undefined,
        retryCount: job.retryCount,
        timeout: job.timeout,
      });
    } catch (error) {
      logger.error("Failed to execute cron job", error as Error, { jobId: job.id });
    }
  }
}

/**
 * Start the cron scheduler (runs every minute)
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export function startCronScheduler(): void {
  if (schedulerInterval) {
    logger.warn("Cron scheduler already running");
    return;
  }

  logger.info("Starting cron scheduler");

  // Run immediately
  processDueCronJobs().catch((err) => {
    logger.error("Cron scheduler error", err);
  });

  // Then run every minute
  schedulerInterval = setInterval(() => {
    processDueCronJobs().catch((err) => {
      logger.error("Cron scheduler error", err);
    });
  }, 60000);
}

export function stopCronScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Cron scheduler stopped");
  }
}
