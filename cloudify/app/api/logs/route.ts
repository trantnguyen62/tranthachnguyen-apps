import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

// GET /api/logs - Get aggregated logs from all deployments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const cursor = searchParams.get("cursor");

    // Build query conditions
    const where: {
      deployment: {
        project: {
          userId: string;
          id?: string;
        };
      };
      level?: string;
      message?: { contains: string; mode: "insensitive" };
      timestamp?: { lt: Date };
    } = {
      deployment: {
        project: {
          userId: session.user.id,
        },
      },
    };

    if (projectId) {
      where.deployment.project.id = projectId;
    }

    if (level && level !== "all") {
      where.level = level;
    }

    if (search) {
      where.message = { contains: search, mode: "insensitive" };
    }

    // Use timestamp-based cursor for reliable pagination
    // Cursor format: ISO date string
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.timestamp = { lt: cursorDate };
      }
    }

    const logs = await prisma.deploymentLog.findMany({
      where,
      include: {
        deployment: {
          select: {
            id: true,
            siteSlug: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit + 1,
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, -1) : logs;
    // Use ISO timestamp as cursor for reliable sorting
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].timestamp.toISOString()
      : null;

    // Transform logs to include source info
    const transformedLogs = items.map((log) => ({
      id: log.id,
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
      source: log.deployment.project.slug,
      projectId: log.deployment.project.id,
      projectName: log.deployment.project.name,
      deploymentId: log.deployment.id,
    }));

    return NextResponse.json({
      logs: transformedLogs,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
