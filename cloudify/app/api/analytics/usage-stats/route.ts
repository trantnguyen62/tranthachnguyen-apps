/**
 * Usage Stats API
 * GET - Get usage statistics for billing and dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";

// GET /api/analytics/usage-stats - Get usage statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const period = searchParams.get("period") || "month"; // day, week, month, year

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build where clause
    const whereClause: any = {
      userId: user.id,
      recordedAt: { gte: startDate },
    };

    if (projectId) {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      whereClause.projectId = projectId;
    }

    // Get aggregated usage by type
    const usageByType = await prisma.usageRecord.groupBy({
      by: ["type"],
      where: whereClause,
      _sum: { value: true },
      _count: true,
    });

    // Get daily breakdown
    const usageRecords = await prisma.usageRecord.findMany({
      where: whereClause,
      orderBy: { recordedAt: "asc" },
    });

    // Aggregate by day
    const dailyUsage = aggregateByDay(usageRecords);

    // Get plan limits
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    const limits = getPlanLimits(userData?.plan || "free");

    // Calculate usage percentages
    const usageSummary = usageByType.reduce((acc, item) => {
      const total = item._sum.value || 0;
      const limit = limits[item.type as keyof typeof limits] || Infinity;
      acc[item.type] = {
        used: total,
        limit,
        percentage: limit > 0 ? Math.min(100, (total / limit) * 100) : 0,
        count: item._count,
      };
      return acc;
    }, {} as Record<string, { used: number; limit: number; percentage: number; count: number }>);

    // Get deployment count
    const deploymentCount = await prisma.deployment.count({
      where: {
        project: { userId: user.id },
        ...(projectId && { projectId }),
        createdAt: { gte: startDate },
      },
    });

    // Get function invocation count
    const invocationCount = await prisma.functionInvocation.count({
      where: {
        function: {
          project: { userId: user.id },
          ...(projectId && { projectId }),
        },
        createdAt: { gte: startDate },
      },
    });

    // Get edge function invocation count
    const edgeInvocationCount = await prisma.edgeInvocation.count({
      where: {
        function: {
          projectId: projectId || undefined,
        },
        createdAt: { gte: startDate },
      },
    });

    // Get storage usage
    const storageUsage = await prisma.blob.aggregate({
      where: {
        store: {
          project: { userId: user.id },
          ...(projectId && { projectId }),
        },
      },
      _sum: { size: true },
    });

    return NextResponse.json({
      period: {
        start: startDate,
        end: now,
        label: period,
      },
      summary: usageSummary,
      dailyUsage,
      totals: {
        deployments: deploymentCount,
        functionInvocations: invocationCount,
        edgeInvocations: edgeInvocationCount,
        storageBytes: storageUsage._sum.size || 0,
      },
      limits,
      plan: userData?.plan || "free",
    });
  } catch (error) {
    console.error("Failed to fetch usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 }
    );
  }
}

function aggregateByDay(records: Array<{ type: string; value: number; recordedAt: Date }>) {
  const byDay: Record<string, Record<string, number>> = {};

  for (const record of records) {
    const day = record.recordedAt.toISOString().split("T")[0];
    if (!byDay[day]) {
      byDay[day] = {};
    }
    byDay[day][record.type] = (byDay[day][record.type] || 0) + record.value;
  }

  return Object.entries(byDay)
    .map(([date, usage]) => ({ date, ...usage }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getPlanLimits(plan: string): Record<string, number> {
  const limits: Record<string, Record<string, number>> = {
    free: {
      build_minutes: 100,
      bandwidth: 100 * 1024 * 1024 * 1024, // 100 GB
      requests: 100000,
      function_invocations: 10000,
      blob_storage: 1 * 1024 * 1024 * 1024, // 1 GB
      deployments: 100,
    },
    pro: {
      build_minutes: 1000,
      bandwidth: 1024 * 1024 * 1024 * 1024, // 1 TB
      requests: 1000000,
      function_invocations: 100000,
      blob_storage: 100 * 1024 * 1024 * 1024, // 100 GB
      deployments: 1000,
    },
    team: {
      build_minutes: 5000,
      bandwidth: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
      requests: 10000000,
      function_invocations: 1000000,
      blob_storage: 500 * 1024 * 1024 * 1024, // 500 GB
      deployments: 5000,
    },
    enterprise: {
      build_minutes: Infinity,
      bandwidth: Infinity,
      requests: Infinity,
      function_invocations: Infinity,
      blob_storage: Infinity,
      deployments: Infinity,
    },
  };

  return limits[plan] || limits.free;
}
