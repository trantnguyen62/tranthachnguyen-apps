/**
 * Cron Jobs API
 *
 * GET /api/cron - List all cron jobs for user's projects
 * POST /api/cron - Create a new cron job
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import {
  validateCronExpression,
  describeCronSchedule,
  parseNextRun,
} from "@/lib/cron/scheduler";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("cron");

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Get all cron jobs for user's projects
    const where = projectId
      ? { projectId, project: { userId: user.id } }
      : { project: { userId: user.id } };

    const cronJobs = await prisma.cronJob.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
        executions: {
          orderBy: { startedAt: "desc" },
          take: 5,
          select: {
            id: true,
            status: true,
            startedAt: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add human-readable descriptions
    const jobsWithDescriptions = cronJobs.map((job) => ({
      ...job,
      scheduleDescription: describeCronSchedule(job.schedule),
    }));

    return ok({ cronJobs: jobsWithDescriptions });
  } catch (error) {
    log.error("Error fetching cron jobs", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, name, schedule, path, timezone = "UTC", timeout = 60 } = body;

    // Validate required fields
    if (!projectId || !name || !schedule || !path) {
      return fail("VALIDATION_MISSING_FIELD", "Missing required fields: projectId, name, schedule, path", 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found or you don't have access", 404);
    }

    // Validate cron expression
    const validation = validateCronExpression(schedule);
    if (!validation.valid) {
      return fail("VALIDATION_ERROR", validation.error || "Invalid cron expression", 400);
    }

    // Validate path
    if (!path.startsWith("/")) {
      return fail("BAD_REQUEST", "Path must start with /", 400);
    }

    // Calculate next run time
    const nextRunAt = parseNextRun(schedule, timezone);

    // Create the cron job
    const cronJob = await prisma.cronJob.create({
      data: {
        projectId,
        name,
        schedule,
        path,
        timezone,
        timeout: Math.min(Math.max(timeout, 1), 300), // 1-300 seconds
        nextRunAt,
        enabled: true,
      },
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return ok({
      cronJob: {
        ...cronJob,
        scheduleDescription: describeCronSchedule(schedule),
      },
    });
  } catch (error) {
    log.error("Error creating cron job", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Internal server error", 500);
  }
}
