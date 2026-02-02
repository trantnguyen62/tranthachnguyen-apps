import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

// GET /api/usage - Get usage summary
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || getCurrentPeriod();
    const projectId = searchParams.get("projectId");

    // Parse period (format: YYYY-MM)
    const [year, month] = periodParam.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Build where clause for usage records
    const where: {
      userId: string;
      recordedAt: { gte: Date; lte: Date };
      projectId?: string;
    } = {
      userId: session.user.id,
      recordedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Get usage records for the period
    const records = await prisma.usageRecord.findMany({
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
    });

    // Aggregate by type
    const usage: Record<string, number> = {};
    for (const record of records) {
      if (!usage[record.type]) {
        usage[record.type] = 0;
      }
      usage[record.type] += record.value;
    }

    // Get deployment count for the period
    const deploymentCount = await prisma.deployment.count({
      where: {
        project: { userId: session.user.id },
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Define limits (free tier)
    const limits = {
      build_minutes: { limit: 6000, unit: "minutes" },
      bandwidth: { limit: 100 * 1024 * 1024 * 1024, unit: "bytes" }, // 100GB
      requests: { limit: 100000, unit: "count" },
      deployments: { limit: 100, unit: "count" },
    };

    return NextResponse.json({
      period: periodParam,
      usage: {
        build_minutes: usage.build_minutes || 0,
        bandwidth: usage.bandwidth || 0,
        requests: usage.requests || 0,
        deployments: deploymentCount,
      },
      limits,
      records: records.map((r) => ({
        id: r.id,
        type: r.type,
        value: r.value,
        recordedAt: r.recordedAt,
        projectId: r.projectId,
        project: r.project,
        metadata: r.metadata,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Helper to record usage (called from other parts of the app)
export async function recordUsage(
  userId: string,
  type: string,
  value: number,
  projectId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.usageRecord.create({
    data: {
      userId,
      projectId,
      type,
      value,
      metadata: metadata as object,
      recordedAt: new Date(),
    },
  });
}
