/**
 * Cron Job Manual Trigger API
 *
 * POST /api/cron/[id]/trigger - Manually trigger a cron job execution
 */

import { NextRequest } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { prisma } from "@/lib/prisma";
import { executeCronJob } from "@/lib/cron/scheduler";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("cron/[id]/trigger");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/cron/[id]/trigger - Manually trigger a cron job
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const cronJob = await prisma.cronJob.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            userId: true,
          },
        },
      },
    });

    if (!cronJob) {
      return fail("NOT_FOUND", "Cron job not found", 404);
    }

    // Verify ownership
    if (cronJob.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    // Execute the cron job immediately (regardless of enabled status)
    log.info("Manually triggering cron job", { jobId: id, userId: user.id });

    const execution = await executeCronJob({
      id: cronJob.id,
      name: cronJob.name,
      projectId: cronJob.projectId,
      schedule: cronJob.schedule,
      path: cronJob.path,
      enabled: cronJob.enabled,
      timezone: cronJob.timezone,
      lastRun: cronJob.lastRunAt || undefined,
      nextRun: cronJob.nextRunAt || undefined,
      retryCount: cronJob.retryCount,
      timeout: cronJob.timeout,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: cronJob.projectId,
        type: "cron",
        action: "cron.triggered",
        description: `Manually triggered cron job "${cronJob.name}"`,
        metadata: {
          cronJobId: id,
          executionId: execution.id,
          status: execution.status,
        },
      },
    });

    return ok({
      execution: {
        id: execution.id,
        jobId: execution.jobId,
        status: execution.status,
        startedAt: execution.startedAt,
        finishedAt: execution.finishedAt,
        duration: execution.duration,
        response: execution.response,
        error: execution.error,
      },
    });
  } catch (error) {
    log.error("Failed to trigger cron job", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to trigger cron job", 500);
  }
}
