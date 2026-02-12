/**
 * Individual Edge Function API
 * GET - Get function details
 * PUT - Update function
 * DELETE - Delete function
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { validateEdgeFunctionCode } from "@/lib/edge/runtime";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("edge-functions/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/edge-functions/[id] - Get function details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const edgeFunction = await prisma.edgeFunction.findUnique({
      where: { id },
      include: {
        invocations: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            status: true,
            duration: true,
            memory: true,
            region: true,
            requestPath: true,
            statusCode: true,
            country: true,
            error: true,
            createdAt: true,
          },
        },
      },
    });

    if (!edgeFunction) {
      return fail("NOT_FOUND", "Edge function not found", 404);
    }

    // Verify ownership through project
    const project = await prisma.project.findFirst({
      where: {
        id: edgeFunction.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    // Calculate stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stats24h, stats7d] = await Promise.all([
      prisma.edgeInvocation.aggregate({
        where: {
          functionId: id,
          createdAt: { gte: oneDayAgo },
        },
        _count: true,
        _avg: { duration: true, memory: true },
      }),
      prisma.edgeInvocation.aggregate({
        where: {
          functionId: id,
          createdAt: { gte: oneWeekAgo },
        },
        _count: true,
        _avg: { duration: true, memory: true },
      }),
    ]);

    // Get error rate
    const [errors24h, errors7d] = await Promise.all([
      prisma.edgeInvocation.count({
        where: {
          functionId: id,
          status: { not: "success" },
          createdAt: { gte: oneDayAgo },
        },
      }),
      prisma.edgeInvocation.count({
        where: {
          functionId: id,
          status: { not: "success" },
          createdAt: { gte: oneWeekAgo },
        },
      }),
    ]);

    return ok({
      function: edgeFunction,
      stats: {
        last24h: {
          invocations: stats24h._count,
          avgDuration: Math.round(stats24h._avg.duration || 0),
          avgMemory: Math.round(stats24h._avg.memory || 0),
          errorRate: stats24h._count > 0
            ? Math.round((errors24h / stats24h._count) * 100)
            : 0,
        },
        last7d: {
          invocations: stats7d._count,
          avgDuration: Math.round(stats7d._avg.duration || 0),
          avgMemory: Math.round(stats7d._avg.memory || 0),
          errorRate: stats7d._count > 0
            ? Math.round((errors7d / stats7d._count) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    log.error("Failed to fetch edge function", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch edge function", 500);
  }
}

// PUT /api/edge-functions/[id] - Update function
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const edgeFunction = await prisma.edgeFunction.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!edgeFunction) {
      return fail("NOT_FOUND", "Edge function not found", 404);
    }

    if (edgeFunction.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { name, code, routes, runtime, regions, memory, timeout, enabled, envVars } = body;

    // Validate code if provided
    if (code) {
      const validation = validateEdgeFunctionCode(code);
      if (!validation.valid) {
        return fail("VALIDATION_ERROR", "Invalid code", 400, { details: validation.errors });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 100) {
        return fail("VALIDATION_ERROR", "Name must be between 1 and 100 characters", 400);
      }
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100);
    }
    if (code !== undefined) updateData.code = code;
    if (routes !== undefined) updateData.routes = routes;
    if (runtime !== undefined) updateData.runtime = runtime;
    if (regions !== undefined) updateData.regions = regions;
    if (memory !== undefined) updateData.memory = Math.min(256, Math.max(64, memory));
    if (timeout !== undefined) updateData.timeout = Math.min(30, Math.max(1, timeout));
    if (enabled !== undefined) updateData.enabled = enabled;
    if (envVars !== undefined) updateData.envVars = envVars;

    const updated = await prisma.edgeFunction.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: edgeFunction.projectId,
        type: "edge_function",
        action: "edge_function.updated",
        description: `Updated edge function "${updated.name}"`,
        metadata: {
          functionId: id,
          changes: Object.keys(updateData),
        },
      },
    });

    return ok({ function: updated });
  } catch (error) {
    log.error("Failed to update edge function", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to update edge function", 500);
  }
}

// DELETE /api/edge-functions/[id] - Delete function
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const edgeFunction = await prisma.edgeFunction.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!edgeFunction) {
      return fail("NOT_FOUND", "Edge function not found", 404);
    }

    if (edgeFunction.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    // Delete invocations first
    await prisma.edgeInvocation.deleteMany({
      where: { functionId: id },
    });

    // Delete the function
    await prisma.edgeFunction.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: edgeFunction.projectId,
        type: "edge_function",
        action: "edge_function.deleted",
        description: `Deleted edge function "${edgeFunction.name}"`,
        metadata: {
          functionId: id,
        },
      },
    });

    return ok({
      success: true,
      message: "Edge function deleted",
    });
  } catch (error) {
    log.error("Failed to delete edge function", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to delete edge function", 500);
  }
}
