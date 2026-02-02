/**
 * Speed Insights API
 * GET - Get speed insights summary
 * POST - Record speed insight data
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import {
  recordSpeedInsight,
  getSpeedInsightsSummary,
  getPathPerformance,
  getResourceBreakdown,
} from "@/lib/analytics/speed-insights";

// POST /api/analytics/speed-insights - Record speed insight (from SDK)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, ...data } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Record the insight
    await recordSpeedInsight({
      projectId,
      url: data.url || "",
      path: data.path || new URL(data.url || "http://localhost").pathname,
      ...data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record speed insight:", error);
    return NextResponse.json(
      { error: "Failed to record data" },
      { status: 500 }
    );
  }
}

// GET /api/analytics/speed-insights - Get speed insights summary
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const path = searchParams.get("path") || undefined;
    const device = searchParams.get("device") || undefined;
    const view = searchParams.get("view") || "summary";
    const range = searchParams.get("range") || "24h";

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
        OR: [
          { userId: user.id },
          {
            teamProjects: {
              some: {
                team: {
                  members: {
                    some: { userId: user.id },
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "1h":
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get data based on view
    switch (view) {
      case "paths":
        const pathData = await getPathPerformance(projectId, {
          startDate,
          endDate: now,
          limit: 50,
        });
        return NextResponse.json({ paths: pathData });

      case "resources":
        const resourceData = await getResourceBreakdown(projectId, {
          path,
          startDate,
          endDate: now,
        });
        return NextResponse.json({ resources: resourceData });

      case "summary":
      default:
        const summary = await getSpeedInsightsSummary(projectId, {
          path,
          device,
          startDate,
          endDate: now,
        });
        return NextResponse.json({ summary });
    }
  } catch (error) {
    console.error("Failed to get speed insights:", error);
    return NextResponse.json(
      { error: "Failed to get data" },
      { status: 500 }
    );
  }
}
