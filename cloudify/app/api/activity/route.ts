import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

// GET /api/activity - Get user's activity feed
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const cursor = searchParams.get("cursor");
    const projectId = searchParams.get("projectId");

    const where: {
      userId: string;
      projectId?: string;
      id?: { lt: string };
    } = {
      userId: session.user.id,
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
    console.error("Failed to fetch activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
