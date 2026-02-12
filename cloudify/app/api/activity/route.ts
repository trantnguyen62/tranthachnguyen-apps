import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

const log = getRouteLogger("activity");

// GET /api/activity - Get user's activity feed
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);
    const projectId = searchParams.get("projectId");

    const baseWhere: Record<string, unknown> = {
      userId: user.id,
    };

    if (projectId) {
      baseWhere.projectId = projectId;
    }

    const activities = await prisma.activity.findMany({
      where: { ...baseWhere, ...cursorWhere },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    return ok(
      { activities: items },
      {
        pagination: {
          cursor: nextCursor,
          hasMore,
        },
      }
    );
  } catch (error) {
    log.error("Failed to fetch activity", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch activity", 500);
  }
}
