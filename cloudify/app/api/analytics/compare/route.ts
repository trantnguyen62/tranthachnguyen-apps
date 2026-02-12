/**
 * Project Comparison API
 * GET - Compare analytics across multiple projects
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("analytics/compare");

// GET /api/analytics/compare - Compare projects
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectIds = searchParams.get("projectIds")?.split(",") || [];
    const metric = searchParams.get("metric") || "lcp";
    const period = searchParams.get("period") || "week"; // day, week, month

    if (projectIds.length === 0) {
      return NextResponse.json(
        { error: "At least one projectId is required" },
        { status: 400 }
      );
    }

    if (projectIds.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 projects can be compared" },
        { status: 400 }
      );
    }

    // Verify all projects belong to user
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (projects.length !== projectIds.length) {
      return NextResponse.json(
        { error: "One or more projects not found" },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "week":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get comparison data for each project
    const comparisons = await Promise.all(
      projects.map(async (project) => {
        // Get speed insights
        const insights = await prisma.speedInsight.findMany({
          where: {
            projectId: project.id,
            createdAt: { gte: startDate },
          },
          select: {
            [metric]: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        });

        // Calculate percentiles
        const values = insights
          .map((i) => i[metric as keyof typeof i] as number)
          .filter((v) => v !== null && v !== undefined)
          .sort((a, b) => a - b);

        const percentiles = calculatePercentiles(values);

        // Group by day
        const byDay = groupByDay(insights as unknown as Array<{ createdAt: Date } & Record<string, unknown>>, metric);

        // Get deployment stats
        const deploymentStats = await prisma.deployment.aggregate({
          where: {
            projectId: project.id,
            createdAt: { gte: startDate },
            status: "READY",
          },
          _count: true,
          _avg: { buildTime: true },
        });

        // Get error count
        const errorCount = await prisma.deployment.count({
          where: {
            projectId: project.id,
            createdAt: { gte: startDate },
            status: "ERROR",
          },
        });

        return {
          project: {
            id: project.id,
            name: project.name,
            slug: project.slug,
          },
          metric,
          percentiles,
          trend: byDay,
          sampleCount: values.length,
          deployments: {
            total: deploymentStats._count,
            avgBuildTime: Math.round(deploymentStats._avg.buildTime || 0),
            errorCount,
            successRate: deploymentStats._count > 0
              ? Math.round(((deploymentStats._count - errorCount) / deploymentStats._count) * 100)
              : 100,
          },
        };
      })
    );

    // Calculate ranking
    const ranked = [...comparisons].sort((a, b) => {
      const aValue = a.percentiles.p50 ?? Infinity;
      const bValue = b.percentiles.p50 ?? Infinity;
      return aValue - bValue; // Lower is better for most metrics
    });

    return NextResponse.json({
      period: {
        start: startDate,
        end: now,
        label: period,
      },
      metric,
      comparisons,
      ranking: ranked.map((c, index) => ({
        rank: index + 1,
        projectId: c.project.id,
        projectName: c.project.name,
        value: c.percentiles.p50,
      })),
      summary: {
        bestProject: ranked[0]?.project.name,
        bestValue: ranked[0]?.percentiles.p50,
        worstProject: ranked[ranked.length - 1]?.project.name,
        worstValue: ranked[ranked.length - 1]?.percentiles.p50,
        averageValue: Math.round(
          comparisons.reduce((sum, c) => sum + (c.percentiles.p50 || 0), 0) / comparisons.length
        ),
      },
    });
  } catch (error) {
    log.error("Failed to compare projects", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to compare projects" },
      { status: 500 }
    );
  }
}

function calculatePercentiles(values: number[]): {
  p50: number | null;
  p75: number | null;
  p90: number | null;
  p99: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
} {
  if (values.length === 0) {
    return { p50: null, p75: null, p90: null, p99: null, min: null, max: null, avg: null };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  return {
    p50: sorted[Math.floor(n * 0.5)],
    p75: sorted[Math.floor(n * 0.75)],
    p90: sorted[Math.floor(n * 0.9)],
    p99: sorted[Math.floor(n * 0.99)],
    min: sorted[0],
    max: sorted[n - 1],
    avg: Math.round(values.reduce((sum, v) => sum + v, 0) / n),
  };
}

function groupByDay(
  insights: Array<{ createdAt: Date } & Record<string, unknown>>,
  metric: string
): Array<{ date: string; value: number | null; count: number }> {
  const byDay: Record<string, { sum: number; count: number }> = {};

  for (const insight of insights) {
    const day = insight.createdAt.toISOString().split("T")[0];
    const value = insight[metric] as number | null;

    if (value !== null && value !== undefined) {
      if (!byDay[day]) {
        byDay[day] = { sum: 0, count: 0 };
      }
      byDay[day].sum += value;
      byDay[day].count++;
    }
  }

  return Object.entries(byDay)
    .map(([date, data]) => ({
      date,
      value: data.count > 0 ? Math.round(data.sum / data.count) : null,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
