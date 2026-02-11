/**
 * Cron Jobs API - List and Create
 *
 * GET  /api/projects/:id/cron - List all cron jobs
 * POST /api/projects/:id/cron - Create a new cron job
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";
import { validateCronExpression, describeCronSchedule, parseNextRun } from "@/lib/cron/scheduler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id/cron
 * List all cron jobs for a project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get cron jobs with execution stats
    const cronJobs = await prisma.cronJob.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        executions: {
          take: 5,
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            duration: true,
            error: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    // Format response with human-readable schedule descriptions
    const jobs = cronJobs.map((job) => ({
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      scheduleDescription: describeCronSchedule(job.schedule),
      path: job.path,
      enabled: job.enabled,
      timezone: job.timezone,
      timeout: job.timeout,
      retryCount: job.retryCount,
      lastRunAt: job.lastRunAt,
      nextRunAt: job.nextRunAt,
      lastStatus: job.lastStatus,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      recentExecutions: job.executions,
      totalExecutions: job._count.executions,
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Failed to list cron jobs:", error);
    return NextResponse.json(
      { error: "Failed to list cron jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/:id/cron
 * Create a new cron job
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, schedule, path, enabled = true, timezone = "UTC", timeout = 60, retryCount = 0 } = body;

    // Validate required fields
    if (!name || !schedule || !path) {
      return NextResponse.json(
        { error: "Missing required fields: name, schedule, path" },
        { status: 400 }
      );
    }

    // Validate cron expression
    const validation = validateCronExpression(schedule);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid cron expression: ${validation.error}` },
        { status: 400 }
      );
    }

    // Validate path starts with /
    if (!path.startsWith("/")) {
      return NextResponse.json(
        { error: "Path must start with /" },
        { status: 400 }
      );
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
        enabled,
        timezone,
        timeout: Math.min(timeout, 300), // Max 5 minutes
        retryCount: Math.min(retryCount, 5), // Max 5 retries
        nextRunAt,
      },
    });

    return NextResponse.json({
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
        nextRunAt: cronJob.nextRunAt,
        createdAt: cronJob.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create cron job:", error);
    return NextResponse.json(
      { error: "Failed to create cron job" },
      { status: 500 }
    );
  }
}
