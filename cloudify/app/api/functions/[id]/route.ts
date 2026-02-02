import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/functions/[id] - Get function details with invocation stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const fn = await prisma.serverlessFunction.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
      include: {
        invocations: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        _count: {
          select: { invocations: true },
        },
      },
    });

    if (!fn) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    // Calculate stats
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInvocations = fn.invocations.filter(
      (i) => new Date(i.createdAt) > last24h
    );
    const successRate =
      recentInvocations.length > 0
        ? (recentInvocations.filter((i) => i.status === "success").length /
            recentInvocations.length) *
          100
        : 100;
    const avgDuration =
      recentInvocations.length > 0
        ? recentInvocations.reduce((sum, i) => sum + i.duration, 0) /
          recentInvocations.length
        : 0;

    return NextResponse.json({
      ...fn,
      stats: {
        totalInvocations: fn._count.invocations,
        last24hInvocations: recentInvocations.length,
        successRate: Math.round(successRate * 100) / 100,
        avgDuration: Math.round(avgDuration),
      },
    });
  } catch (error) {
    console.error("Failed to fetch function:", error);
    return NextResponse.json(
      { error: "Failed to fetch function" },
      { status: 500 }
    );
  }
}

// PATCH /api/functions/[id] - Update function configuration
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const fn = await prisma.serverlessFunction.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    });

    if (!fn) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    const body = await request.json();
    const { runtime, entrypoint, memory, timeout, regions, envVars } = body;

    const updateData: Record<string, unknown> = {};
    if (runtime) updateData.runtime = runtime;
    if (entrypoint) updateData.entrypoint = entrypoint;
    if (memory) updateData.memory = memory;
    if (timeout) updateData.timeout = timeout;
    if (regions) updateData.regions = regions;
    if (envVars !== undefined) updateData.envVars = envVars;

    const updated = await prisma.serverlessFunction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update function:", error);
    return NextResponse.json(
      { error: "Failed to update function" },
      { status: 500 }
    );
  }
}

// DELETE /api/functions/[id] - Delete a function
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const fn = await prisma.serverlessFunction.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    });

    if (!fn) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    await prisma.serverlessFunction.delete({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId: fn.projectId,
        type: "function",
        action: "deleted",
        description: `Deleted serverless function "${fn.name}"`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete function:", error);
    return NextResponse.json(
      { error: "Failed to delete function" },
      { status: 500 }
    );
  }
}
