/**
 * Cron Job API - Get, Update, Delete
 *
 * GET    /api/projects/:id/cron/:jobId - Get a cron job
 * PUT    /api/projects/:id/cron/:jobId - Update a cron job
 * DELETE /api/projects/:id/cron/:jobId - Delete a cron job
 * POST   /api/projects/:id/cron/:jobId/run - Trigger a cron job manually
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";
import { validateCronExpression, describeCronSchedule, parseNextRun } from "@/lib/cron/scheduler";
import { scheduleCronJob } from "@/lib/cron/executor";

interface RouteParams {
  params: Promise<{ id: string; jobId: string }>;
}

/**
 * GET /api/projects/:id/cron/:jobId
 * Get a cron job with execution history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, jobId } = await params;

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
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    // Calculate success rate
    const successfulExecutions = cronJob.executions.filter(e => e.status === "success").length;
    const totalRecent = cronJob.executions.length;
    const successRate = totalRecent > 0 ? (successfulExecutions / totalRecent) * 100 : 0;

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
    console.error("Failed to get cron job:", error);
    return NextResponse.json(
      { error: "Failed to get cron job" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/:id/cron/:jobId
 * Update a cron job
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, jobId } = await params;

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

    // Verify cron job exists
    const existingJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, schedule, path, enabled, timezone, timeout, retryCount } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (path !== undefined) {
      if (!path.startsWith("/")) {
        return NextResponse.json(
          { error: "Path must start with /" },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: `Invalid cron expression: ${validation.error}` },
          { status: 400 }
        );
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

    return NextResponse.json({
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
    console.error("Failed to update cron job:", error);
    return NextResponse.json(
      { error: "Failed to update cron job" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/:id/cron/:jobId
 * Delete a cron job
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, jobId } = await params;

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

    // Verify cron job exists
    const existingJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    // Delete the cron job (cascades to executions)
    await prisma.cronJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete cron job:", error);
    return NextResponse.json(
      { error: "Failed to delete cron job" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/:id/cron/:jobId/run
 * Trigger a cron job manually
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, jobId } = await params;

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

    // Verify cron job exists
    const cronJob = await prisma.cronJob.findFirst({
      where: {
        id: jobId,
        projectId,
      },
    });

    if (!cronJob) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    // Schedule the job for immediate execution
    try {
      await scheduleCronJob(jobId);
      return NextResponse.json({
        message: "Cron job triggered successfully",
        jobId,
      });
    } catch (execError) {
      console.error("Failed to trigger cron job:", execError);
      return NextResponse.json(
        { error: "Failed to trigger cron job. BullMQ may not be running." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Failed to trigger cron job:", error);
    return NextResponse.json(
      { error: "Failed to trigger cron job" },
      { status: 500 }
    );
  }
}
