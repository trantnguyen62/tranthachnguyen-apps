/**
 * Edge Functions API
 * GET - List edge functions for a project
 * POST - Create a new edge function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { validateEdgeFunctionCode } from "@/lib/edge/runtime";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("edge-functions");

// GET /api/edge-functions - List edge functions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const functions = await prisma.edgeFunction.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        runtime: true,
        regions: true,
        memory: true,
        timeout: true,
        enabled: true,
        routes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { invocations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get invocation stats for the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const functionsWithStats = await Promise.all(
      functions.map(async (fn) => {
        const [successCount, errorCount, avgDuration] = await Promise.all([
          prisma.edgeInvocation.count({
            where: {
              functionId: fn.id,
              status: "success",
              createdAt: { gte: oneDayAgo },
            },
          }),
          prisma.edgeInvocation.count({
            where: {
              functionId: fn.id,
              status: { not: "success" },
              createdAt: { gte: oneDayAgo },
            },
          }),
          prisma.edgeInvocation.aggregate({
            where: {
              functionId: fn.id,
              createdAt: { gte: oneDayAgo },
            },
            _avg: { duration: true },
          }),
        ]);

        return {
          ...fn,
          stats: {
            invocations24h: successCount + errorCount,
            successRate: successCount + errorCount > 0
              ? Math.round((successCount / (successCount + errorCount)) * 100)
              : 100,
            avgDuration: Math.round(avgDuration._avg.duration || 0),
          },
        };
      })
    );

    return NextResponse.json({ functions: functionsWithStats });
  } catch (error) {
    log.error("Failed to fetch edge functions", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch edge functions" },
      { status: 500 }
    );
  }
}

// POST /api/edge-functions - Create edge function
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, name, code, routes, runtime, regions, memory, timeout, envVars } = body;

    if (!projectId || !name || !code) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, name, code" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Validate code
    const validation = validateEdgeFunctionCode(code);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid code", details: validation.errors },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check for existing function with same name
    const existing = await prisma.edgeFunction.findFirst({
      where: {
        projectId,
        slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An edge function with this name already exists" },
        { status: 409 }
      );
    }

    // Check plan limits
    const functionCount = await prisma.edgeFunction.count({
      where: { projectId },
    });

    const limits: Record<string, number> = {
      free: 2,
      pro: 10,
      team: 50,
      enterprise: 200,
    };

    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    const maxFunctions = limits[userPlan?.plan || "free"] || 2;
    if (functionCount >= maxFunctions) {
      return NextResponse.json(
        { error: `Edge function limit reached for your plan (${maxFunctions})` },
        { status: 403 }
      );
    }

    // Create function
    const edgeFunction = await prisma.edgeFunction.create({
      data: {
        projectId,
        name,
        slug,
        code,
        routes: routes || [],
        runtime: runtime || "edge-runtime",
        regions: regions || ["global"],
        memory: memory || 128,
        timeout: timeout || 30,
        enabled: true,
        envVars: envVars || undefined,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "edge_function",
        action: "edge_function.created",
        description: `Created edge function "${name}"`,
        metadata: {
          functionId: edgeFunction.id,
          routes,
        },
      },
    });

    return NextResponse.json(
      { function: edgeFunction },
      { status: 201 }
    );
  } catch (error) {
    log.error("Failed to create edge function", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create edge function" },
      { status: 500 }
    );
  }
}
