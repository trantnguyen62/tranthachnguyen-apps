/**
 * Real-time Analytics API
 * Server-Sent Events for live analytics dashboard
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/realtime - SSE stream for real-time analytics
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return new Response("Project ID required", { status: 400 });
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const initialData = await getRealtimeData(projectId);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
      );

      // Poll for updates every 5 seconds
      const interval = setInterval(async () => {
        if (!isActive) {
          clearInterval(interval);
          return;
        }

        try {
          const data = await getRealtimeData(projectId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          console.error("Real-time analytics error:", error);
        }
      }, 5000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        isActive = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Get real-time analytics data
 */
async function getRealtimeData(projectId: string) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Active visitors (sessions in last 5 minutes)
  const activeVisitors = await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      projectId,
      createdAt: { gte: fiveMinutesAgo },
      sessionId: { not: null },
    },
  });

  // Recent pageviews
  const recentPageviews = await prisma.analyticsEvent.findMany({
    where: {
      projectId,
      type: "pageview",
      createdAt: { gte: thirtyMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      path: true,
      device: true,
      browser: true,
      referrer: true,
      createdAt: true,
    },
  });

  // Top pages (last hour)
  const topPages = await prisma.analyticsEvent.groupBy({
    by: ["path"],
    where: {
      projectId,
      type: "pageview",
      createdAt: { gte: oneHourAgo },
      path: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Pageviews per minute (last 30 minutes)
  const pageviewsPerMinute = await prisma.$queryRaw<
    Array<{ minute: Date; count: bigint }>
  >`
    SELECT
      date_trunc('minute', "createdAt") as minute,
      COUNT(*) as count
    FROM "AnalyticsEvent"
    WHERE "projectId" = ${projectId}
      AND "type" = 'pageview'
      AND "createdAt" >= ${thirtyMinutesAgo}
    GROUP BY date_trunc('minute', "createdAt")
    ORDER BY minute DESC
  `;

  // Device breakdown (last hour)
  const deviceBreakdown = await prisma.analyticsEvent.groupBy({
    by: ["device"],
    where: {
      projectId,
      createdAt: { gte: oneHourAgo },
      device: { not: null },
    },
    _count: { id: true },
  });

  // Top referrers (last hour)
  const topReferrers = await prisma.analyticsEvent.groupBy({
    by: ["referrer"],
    where: {
      projectId,
      createdAt: { gte: oneHourAgo },
      AND: [
        { referrer: { not: null } },
        { referrer: { not: "" } },
      ],
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  return {
    timestamp: now.toISOString(),
    activeVisitors: activeVisitors.length,
    recentPageviews: recentPageviews.map((p) => ({
      id: p.id,
      path: p.path,
      device: p.device,
      browser: p.browser,
      referrer: p.referrer,
      time: p.createdAt.toISOString(),
    })),
    topPages: topPages.map((p) => ({
      path: p.path,
      views: p._count.id,
    })),
    pageviewsTimeline: pageviewsPerMinute.map((p) => ({
      minute: p.minute,
      count: Number(p.count),
    })),
    devices: deviceBreakdown.map((d) => ({
      device: d.device,
      count: d._count.id,
    })),
    referrers: topReferrers.map((r) => ({
      referrer: r.referrer,
      count: r._count.id,
    })),
  };
}
