import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("activity");

// GET /api/activity - Get user's activity feed
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const cursor = searchParams.get("cursor");
    const projectId = searchParams.get("projectId");

    const where: {
      userId: string;
      projectId?: string;
      id?: { lt: string };
    } = {
      userId: user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (cursor) {
      where.id = { lt: cursor };
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, -1) : activities;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      activities: items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    log.error("Failed to fetch activity", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
