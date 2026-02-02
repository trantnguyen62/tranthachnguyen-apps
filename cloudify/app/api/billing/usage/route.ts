/**
 * Billing Usage API
 * Get detailed usage information and history
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import {
  getUsageWithLimits,
  getDailyUsage,
  calculateOverageCharges,
  UsageType,
} from "@/lib/billing/metering";
import { PlanType } from "@/lib/billing/pricing";

/**
 * GET /api/billing/usage - Get usage details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as UsageType | null;
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Get user's plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = (user.plan || "free") as PlanType;

    // Get usage with limits
    const usageWithLimits = await getUsageWithLimits(session.user.id, plan);

    // Get overage charges
    const overageCharges = await calculateOverageCharges(session.user.id, plan);

    // Get daily breakdown if type is specified
    let dailyBreakdown: Array<{ date: string; value: number }> | null = null;
    if (type) {
      dailyBreakdown = await getDailyUsage(session.user.id, type, days);
    }

    // Get usage by project
    const projectUsage = await prisma.usageRecord.groupBy({
      by: ["projectId"],
      where: {
        userId: session.user.id,
        recordedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        value: true,
      },
    });

    // Get project names for the usage data
    const projectIds = projectUsage
      .filter((p): p is typeof p & { projectId: string } => p.projectId !== null)
      .map((p) => p.projectId);

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, slug: true },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const usageByProject = projectUsage
      .filter((p): p is typeof p & { projectId: string } => p.projectId !== null)
      .map((p) => ({
        projectId: p.projectId,
        projectName: projectMap.get(p.projectId)?.name || "Unknown",
        projectSlug: projectMap.get(p.projectId)?.slug || "unknown",
        totalUsage: p._sum.value || 0,
      }));

    return NextResponse.json({
      summary: usageWithLimits.usage,
      limits: usageWithLimits.limits,
      percentages: usageWithLimits.percentages,
      exceeded: usageWithLimits.exceeded,
      overageCharges: {
        buildMinutes: overageCharges.buildMinutes,
        bandwidth: overageCharges.bandwidth,
        functionInvocations: overageCharges.functionInvocations,
        total: overageCharges.total,
      },
      dailyBreakdown,
      usageByProject,
      billingPeriod: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
    });
  } catch (error) {
    console.error("Failed to get usage:", error);
    return NextResponse.json(
      { error: "Failed to get usage" },
      { status: 500 }
    );
  }
}
