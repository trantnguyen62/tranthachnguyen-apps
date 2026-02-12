import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("functions");

// GET /api/functions - List serverless functions (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    // Get user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    const functions = await prisma.serverlessFunction.findMany({
      where: projectId
        ? { projectId }
        : { projectId: { in: projectIds } },
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { invocations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get invocation stats for each function
    const functionsWithStats = await Promise.all(
      functions.map(async (fn) => {
        const recentInvocations = await prisma.functionInvocation.findMany({
          where: {
            functionId: fn.id,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { status: true, duration: true },
        });

        const total = recentInvocations.length;
        const successful = recentInvocations.filter((i) => i.status === "success").length;
        const avgDuration = total > 0
          ? Math.round(recentInvocations.reduce((sum, i) => sum + i.duration, 0) / total)
          : 0;
        const errorRate = total > 0 ? ((total - successful) / total) * 100 : 0;

        return {
          ...fn,
          invocations24h: total,
          avgDuration,
          errorRate: Math.round(errorRate * 100) / 100,
          status: errorRate > 5 ? "degraded" : errorRate > 0 ? "healthy" : "healthy",
        };
      })
    );

    return NextResponse.json(functionsWithStats);
  } catch (error) {
    log.error("Failed to fetch functions", error);
    return NextResponse.json(
      { error: "Failed to fetch functions" },
      { status: 500 }
    );
  }
}

// POST /api/functions - Create a new serverless function
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const {
      projectId,
      name,
      runtime = "nodejs20",
      entrypoint = "api/index.js",
      memory = 128,
      timeout = 10,
      regions = ["iad1"],
      envVars,
    } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Project ID and name are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const fn = await prisma.serverlessFunction.create({
      data: {
        projectId,
        name,
        runtime,
        entrypoint,
        memory,
        timeout,
        regions,
        envVars,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "function",
        action: "created",
        description: `Created serverless function "${name}"`,
        metadata: { functionId: fn.id },
      },
    });

    return NextResponse.json(fn);
  } catch (error) {
    log.error("Failed to create function", error);
    return NextResponse.json(
      { error: "Failed to create function" },
      { status: 500 }
    );
  }
}
