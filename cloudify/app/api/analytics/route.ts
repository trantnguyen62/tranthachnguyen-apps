import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

// GET /api/analytics - Get analytics data for user's projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const range = searchParams.get("range") || "7d"; // 24h, 7d, 30d

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const where: {
      project: { userId: string };
      projectId?: string;
      createdAt: { gte: Date };
    } = {
      project: { userId: session.user.id },
      createdAt: { gte: startDate },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Get pageviews
    const pageviews = await prisma.analyticsEvent.count({
      where: { ...where, type: "pageview" },
    });

    // Get unique visitors
    const uniqueVisitors = await prisma.analyticsEvent.groupBy({
      by: ["visitorId"],
      where: { ...where, type: "pageview" },
    });

    // Get top pages
    const topPages = await prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { ...where, type: "pageview" },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    });

    // Get referrers
    const referrers = await prisma.analyticsEvent.groupBy({
      by: ["referrer"],
      where: { ...where, type: "pageview", referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    });

    // Get devices
    const devices = await prisma.analyticsEvent.groupBy({
      by: ["device"],
      where: { ...where, type: "pageview", device: { not: null } },
      _count: { device: true },
    });

    // Get countries
    const countries = await prisma.analyticsEvent.groupBy({
      by: ["country"],
      where: { ...where, type: "pageview", country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    });

    // Get browsers
    const browsers = await prisma.analyticsEvent.groupBy({
      by: ["browser"],
      where: { ...where, type: "pageview", browser: { not: null } },
      _count: { browser: true },
    });

    // Get time-series data for the traffic chart
    const allEvents = await prisma.analyticsEvent.findMany({
      where: { ...where, type: "pageview" },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Build time-series buckets
    const timeseries: { label: string; value: number }[] = [];
    if (range === "24h") {
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStart = new Date(hour);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        const count = allEvents.filter(
          (e) => e.createdAt >= hourStart && e.createdAt < hourEnd
        ).length;
        timeseries.push({
          label: hourStart.toLocaleTimeString("en-US", { hour: "numeric" }),
          value: count,
        });
      }
    } else {
      const days = range === "7d" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
        const count = allEvents.filter(
          (e) => e.createdAt >= day && e.createdAt < dayEnd
        ).length;
        timeseries.push({
          label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: count,
        });
      }
    }

    return NextResponse.json({
      range,
      summary: {
        pageviews,
        uniqueVisitors: uniqueVisitors.length,
        avgSessionDuration: 0,
      },
      timeseries,
      topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
      referrers: referrers.map((r) => ({
        source: r.referrer,
        visits: r._count.referrer,
      })),
      devices: devices.map((d) => ({
        type: d.device,
        count: d._count.device,
      })),
      countries: countries.map((c) => ({
        country: c.country,
        visits: c._count.country,
      })),
      browsers: browsers.map((b) => ({
        browser: b.browser,
        count: b._count.browser,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST /api/analytics - Track analytics event (called from client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      type = "pageview",
      path,
      referrer,
      eventName,
      eventData,
      sessionId,
      visitorId,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse user agent
    const userAgent = request.headers.get("user-agent") || "";
    const device = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Get country from headers (if behind proxy/CDN)
    const country =
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country") ||
      null;

    // Create event
    await prisma.analyticsEvent.create({
      data: {
        projectId,
        type,
        path,
        referrer,
        userAgent,
        country,
        device,
        browser,
        os,
        eventName,
        eventData,
        sessionId,
        visitorId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// Helper functions for parsing user agent
function getDeviceType(ua: string): string {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function getBrowser(ua: string): string {
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

function getOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/ios|iphone|ipad/i.test(ua)) return "iOS";
  return "Other";
}
