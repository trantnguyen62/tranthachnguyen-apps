/**
 * Cron Job Execution History API
 *
 * GET /api/cron/[id]/executions - List execution history for a cron job (with pagination)
 */

import { NextRequest } from "next/server";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { prisma } from "@/lib/prisma";
import { ok, fail, parsePaginationParams } from "@/lib/api/response";

const log = getRouteLogger("cron/[id]/executions");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cron/[id]/executions - List execution history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(searchParams);
    const status = searchParams.get("status"); // Optional status filter

    // Verify cron job exists and user has access
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

    // Build where clause
    const baseWhere: Record<string, unknown> = { jobId: id };
    if (status) {
      baseWhere.status = status;
    }

    // Apply cursor (uses startedAt + id for stable ordering)
    const cursorFilter: Record<string, unknown> = {};
    if (cursor) {
      const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString());
      cursorFilter.OR = [
        { startedAt: { lt: new Date(decoded.startedAt) } },
        { startedAt: new Date(decoded.startedAt), id: { lt: decoded.id } },
      ];
    }

    // Fetch executions with pagination
    const [executions, total] = await Promise.all([
      prisma.cronExecution.findMany({
        where: { ...baseWhere, ...cursorFilter },
        orderBy: [{ startedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          duration: true,
          response: true,
          error: true,
          retryAttempt: true,
        },
      }),
      prisma.cronExecution.count({ where: baseWhere }),
    ]);

    const hasMore = executions.length > limit;
    const items = hasMore ? executions.slice(0, limit) : executions;
    const nextCursor = hasMore && items.length > 0
      ? Buffer.from(JSON.stringify({
          id: items[items.length - 1].id,
          startedAt: items[items.length - 1].startedAt,
        })).toString("base64url")
      : undefined;

    return ok(
      { executions: items },
      {
        pagination: {
          cursor: nextCursor,
          hasMore,
          total,
        },
      }
    );
  } catch (error) {
    log.error("Failed to fetch cron executions", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch execution history", 500);
  }
}
