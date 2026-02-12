/**
 * Billing Usage API
 * Get detailed usage information and history
 */

import { NextRequest } from "next/server";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import {
  getUsageWithLimits,
  getDailyUsage,
  calculateOverageCharges,
  UsageType,
} from "@/lib/billing/metering";
import { PlanType } from "@/lib/billing/pricing";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("billing/usage");

/**
 * GET /api/billing/usage - Get usage details
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user: authUser } = authResult;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as UsageType | null;
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Get user's plan
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { plan: true },
    });

    if (!user) {
      return fail("NOT_FOUND", "User not found", 404);
    }

    const plan = (user.plan || "free") as PlanType;

    // Get usage with limits
    const usageWithLimits = await getUsageWithLimits(authUser.id, plan);

    // Get overage charges
    const overageCharges = await calculateOverageCharges(authUser.id, plan);

    // Get daily breakdown if type is specified
    let dailyBreakdown: Array<{ date: string; value: number }> | null = null;
    if (type) {
      dailyBreakdown = await getDailyUsage(authUser.id, type, days);
    }

    // Get usage by project
    const projectUsage = await prisma.usageRecord.groupBy({
      by: ["projectId"],
      where: {
        userId: authUser.id,
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

    return ok({
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
    log.error("Failed to get usage", error);
    return fail("INTERNAL_ERROR", "Failed to get usage", 500);
  }
}
