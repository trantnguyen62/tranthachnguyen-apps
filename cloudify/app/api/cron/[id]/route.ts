/**
 * Individual Cron Job API
 *
 * GET /api/cron/[id] - Get a specific cron job by ID
 * PATCH /api/cron/[id] - Update a cron job (expression, enabled/disabled, handler)
 * DELETE /api/cron/[id] - Delete a cron job
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { prisma } from "@/lib/prisma";
import {
  validateCronExpression,
  describeCronSchedule,
  parseNextRun,
} from "@/lib/cron/scheduler";

const log = getRouteLogger("cron/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cron/[id] - Get a specific cron job
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
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
        executions: {
          orderBy: { startedAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            duration: true,
            error: true,
            retryAttempt: true,
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

    return ok({
      cronJob: {
        ...cronJob,
        scheduleDescription: describeCronSchedule(cronJob.schedule),
      },
    });
  } catch (error) {
    log.error("Failed to fetch cron job", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch cron job", 500);
  }
}

// PATCH /api/cron/[id] - Update a cron job
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const bodyResult = await parseJsonBody(request);
    if (isParseError(bodyResult)) return bodyResult;
    const body = bodyResult.data as Record<string, unknown>;

    // Fetch existing cron job
    const cronJob = await prisma.cronJob.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
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

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Update schedule if provided
    if (body.schedule && typeof body.schedule === "string") {
      const validation = validateCronExpression(body.schedule);
      if (!validation.valid) {
        return fail("VALIDATION_ERROR", validation.error || "Invalid cron expression", 400);
      }
      updateData.schedule = body.schedule;
      // Recalculate next run time with new schedule
      updateData.nextRunAt = parseNextRun(
        body.schedule,
        (body.timezone as string) || cronJob.timezone
      );
    }

    // Update enabled status if provided
    if (typeof body.enabled === "boolean") {
      updateData.enabled = body.enabled;
      // If re-enabling, recalculate next run time
      if (body.enabled && !cronJob.enabled) {
        const schedule = (updateData.schedule as string) || cronJob.schedule;
        const timezone = (body.timezone as string) || cronJob.timezone;
        updateData.nextRunAt = parseNextRun(schedule, timezone);
      }
    }

    // Update name if provided
    if (body.name && typeof body.name === "string") {
      updateData.name = body.name;
    }

    // Update path (handler) if provided
    if (body.path && typeof body.path === "string") {
      if (!body.path.startsWith("/")) {
        return fail("BAD_REQUEST", "Path must start with /", 400);
      }
      updateData.path = body.path;
    }

    // Update timezone if provided
    if (body.timezone && typeof body.timezone === "string") {
      updateData.timezone = body.timezone;
    }

    // Update timeout if provided
    if (typeof body.timeout === "number") {
      updateData.timeout = Math.min(Math.max(body.timeout, 1), 300);
    }

    // Update retry count if provided
    if (typeof body.retryCount === "number") {
      updateData.retryCount = Math.min(Math.max(body.retryCount, 0), 5);
    }

    if (Object.keys(updateData).length === 0) {
      return fail("BAD_REQUEST", "No valid fields to update", 400);
    }

    const updated = await prisma.cronJob.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: cronJob.projectId,
        type: "cron",
        action: "cron.updated",
        description: `Updated cron job "${updated.name}"`,
        metadata: {
          cronJobId: id,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return ok({
      cronJob: {
        ...updated,
        scheduleDescription: describeCronSchedule(updated.schedule),
      },
    });
  } catch (error) {
    log.error("Failed to update cron job", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to update cron job", 500);
  }
}

// DELETE /api/cron/[id] - Delete a cron job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete the cron job (cascades to executions via Prisma schema)
    await prisma.cronJob.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: cronJob.projectId,
        type: "cron",
        action: "cron.deleted",
        description: `Deleted cron job "${cronJob.name}"`,
        metadata: {
          cronJobId: id,
          schedule: cronJob.schedule,
        },
      },
    });

    return ok({
      success: true,
      message: "Cron job deleted",
    });
  } catch (error) {
    log.error("Failed to delete cron job", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to delete cron job", 500);
  }
}
