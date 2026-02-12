/**
 * Cron Job API - Get, Update, Delete
 *
 * GET    /api/projects/:id/cron/:jobId - Get a cron job
 * PUT    /api/projects/:id/cron/:jobId - Update a cron job
 * DELETE /api/projects/:id/cron/:jobId - Delete a cron job
 * POST   /api/projects/:id/cron/:jobId/run - Trigger a cron job manually
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { validateCronExpression, describeCronSchedule, parseNextRun } from "@/lib/cron/scheduler";
import { scheduleCronJob } from "@/lib/cron/executor";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("projects/[id]/cron/[jobId]");

interface RouteParams {
  params: Promise<{ id: string; jobId: string }>;
}

/**
 * GET /api/projects/:id/cron/:jobId
 * Get a cron job with execution history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: projectId, jobId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Get cron job with executions
    const cronJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
      include: {
        executions: {
          take: 50,
          orderBy: { startedAt: "desc" },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!cronJob) {
      return fail("NOT_FOUND", "Cron job not found", 404);
    }

    // Calculate success rate
    const successfulExecutions = cronJob.executions.filter(e => e.status === "success").length;
    const totalRecent = cronJob.executions.length;
    const successRate = totalRecent > 0 ? (successfulExecutions / totalRecent) * 100 : 0;

    return ok({
      job: {
        id: cronJob.id,
        name: cronJob.name,
        schedule: cronJob.schedule,
        scheduleDescription: describeCronSchedule(cronJob.schedule),
        path: cronJob.path,
        enabled: cronJob.enabled,
        timezone: cronJob.timezone,
        timeout: cronJob.timeout,
        retryCount: cronJob.retryCount,
        lastRunAt: cronJob.lastRunAt,
        nextRunAt: cronJob.nextRunAt,
        lastStatus: cronJob.lastStatus,
        createdAt: cronJob.createdAt,
        updatedAt: cronJob.updatedAt,
        executions: cronJob.executions,
        totalExecutions: cronJob._count.executions,
        successRate: Math.round(successRate),
      },
    });
  } catch (error) {
    log.error("Failed to get cron job", error);
    return fail("INTERNAL_ERROR", "Failed to get cron job", 500);
  }
}

/**
 * PUT /api/projects/:id/cron/:jobId
 * Update a cron job
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: projectId, jobId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Verify cron job exists
    const existingJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
    });

    if (!existingJob) {
      return fail("NOT_FOUND", "Cron job not found", 404);
    }

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { name, schedule, path, enabled, timezone, timeout, retryCount } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (path !== undefined) {
      if (!path.startsWith("/")) {
        return fail("BAD_REQUEST", "Path must start with /", 400);
      }
      updateData.path = path;
    }
    if (enabled !== undefined) updateData.enabled = enabled;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (timeout !== undefined) updateData.timeout = Math.min(timeout, 300);
    if (retryCount !== undefined) updateData.retryCount = Math.min(retryCount, 5);

    // Validate and update schedule
    if (schedule !== undefined) {
      const validation = validateCronExpression(schedule);
      if (!validation.valid) {
        return fail("VALIDATION_ERROR", `Invalid cron expression: ${validation.error}`, 400);
      }
      updateData.schedule = schedule;
      updateData.nextRunAt = parseNextRun(
        schedule,
        (timezone ?? existingJob.timezone) as string
      );
    }

    // Update the cron job
    const updatedJob = await prisma.cronJob.update({
      where: { id: jobId },
      data: updateData,
    });

    return ok({
      job: {
        id: updatedJob.id,
        name: updatedJob.name,
        schedule: updatedJob.schedule,
        scheduleDescription: describeCronSchedule(updatedJob.schedule),
        path: updatedJob.path,
        enabled: updatedJob.enabled,
        timezone: updatedJob.timezone,
        timeout: updatedJob.timeout,
        retryCount: updatedJob.retryCount,
        nextRunAt: updatedJob.nextRunAt,
        updatedAt: updatedJob.updatedAt,
      },
    });
  } catch (error) {
    log.error("Failed to update cron job", error);
    return fail("INTERNAL_ERROR", "Failed to update cron job", 500);
  }
}

/**
 * DELETE /api/projects/:id/cron/:jobId
 * Delete a cron job
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: projectId, jobId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Verify cron job exists
    const existingJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
    });

    if (!existingJob) {
      return fail("NOT_FOUND", "Cron job not found", 404);
    }

    // Delete the cron job (cascades to executions)
    await prisma.cronJob.delete({
      where: { id: jobId },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete cron job", error);
    return fail("INTERNAL_ERROR", "Failed to delete cron job", 500);
  }
}

/**
 * POST /api/projects/:id/cron/:jobId/run
 * Trigger a cron job manually
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: projectId, jobId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Verify cron job exists
    const cronJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
    });

    if (!cronJob) {
      return fail("NOT_FOUND", "Cron job not found", 404);
    }

    // Schedule the job for immediate execution
    try {
      await scheduleCronJob(jobId);
      return ok({
        message: "Cron job triggered successfully",
        jobId,
      });
    } catch (execError) {
      log.error("Failed to trigger cron job", execError);
      return fail("SERVICE_UNAVAILABLE", "Failed to trigger cron job. BullMQ may not be running.", 503);
    }
  } catch (error) {
    log.error("Failed to trigger cron job", error);
    return fail("INTERNAL_ERROR", "Failed to trigger cron job", 500);
  }
}
