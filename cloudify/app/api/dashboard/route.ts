import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { getRouteLogger } from "@/lib/api/logger";
import { withCache } from "@/lib/api/cache-headers";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("dashboard");

// GET /api/dashboard - Aggregated dashboard data
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const userId = user.id;

    // Get current period for usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Run all queries in parallel
    const [projects, recentDeployments, usageRecords, deploymentStats, totalDeploymentCount] = await Promise.all([
      // Get all projects with latest deployment (only fields needed for display)
      prisma.project.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          slug: true,
          framework: true,
          updatedAt: true,
          deployments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              createdAt: true,
              branch: true,
              commitMessage: true,
              siteSlug: true,
            },
          },
          _count: {
            select: { deployments: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),

      // Get recent deployments across all projects (only needed fields)
      prisma.deployment.findMany({
        where: {
          project: { userId },
        },
        select: {
          id: true,
          status: true,
          branch: true,
          commitSha: true,
          commitMessage: true,
          siteSlug: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Get usage records for the current period (only type and value needed)
      prisma.usageRecord.findMany({
        where: {
          userId,
          recordedAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        select: {
          type: true,
          value: true,
        },
      }),

      // Get deployment success rate for uptime calculation
      prisma.deployment.groupBy({
        by: ["status"],
        where: {
          project: { userId },
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: true,
      }),

      // Use _count aggregate instead of computing from full project records
      prisma.deployment.count({
        where: { project: { userId } },
      }),
    ]);

    // Use pre-computed count instead of reducing over all projects
    const totalDeployments = totalDeploymentCount;

    // Aggregate usage by type
    const usage: Record<string, number> = {};
    for (const record of usageRecords) {
      if (!usage[record.type]) {
        usage[record.type] = 0;
      }
      usage[record.type] += record.value;
    }

    // Calculate uptime (deployment success rate)
    const totalDeps = deploymentStats.reduce((sum, s) => sum + s._count, 0);
    const successfulDeps = deploymentStats.find((s) => s.status === "READY")?._count || 0;
    const uptime = totalDeps > 0 ? ((successfulDeps / totalDeps) * 100).toFixed(2) : "100.00";

    // Define limits (free tier)
    const limits = {
      bandwidth: 100 * 1024 * 1024 * 1024, // 100GB in bytes
      buildMinutes: 6000,
      requests: 100000,
    };

    // Format bandwidth
    const bandwidthBytes = usage.bandwidth || 0;
    const bandwidthGB = (bandwidthBytes / (1024 * 1024 * 1024)).toFixed(1);

    // Format projects for the sidebar
    const formattedProjects = projects.slice(0, 3).map((project) => {
      const lastDeployment = project.deployments[0];
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        framework: project.framework || "Next.js",
        status: lastDeployment?.status?.toLowerCase() || "ready",
        lastDeployment: lastDeployment
          ? formatTimeAgo(lastDeployment.createdAt)
          : "No deployments",
      };
    });

    // Format recent deployments
    const formattedDeployments = recentDeployments.map((deployment) => ({
      id: deployment.id,
      project: deployment.project.name,
      projectId: deployment.project.id,
      branch: deployment.branch || "main",
      commit: deployment.commitSha || "",
      commitMessage: deployment.commitMessage || "No commit message",
      status: deployment.status.toLowerCase(),
      time: formatTimeAgo(deployment.createdAt),
      url: deployment.siteSlug
        ? `${deployment.siteSlug}.cloudify.tranthachnguyen.com`
        : `${deployment.project.slug}.cloudify.tranthachnguyen.com`,
    }));

    return withCache(
      ok({
        userName: user.name || user.email?.split("@")[0] || "there",
        stats: {
          projectCount: projects.length,
          deploymentCount: totalDeployments,
          bandwidthUsed: bandwidthGB,
          bandwidthLimit: "100",
          uptime: uptime,
        },
        recentDeployments: formattedDeployments,
        projects: formattedProjects,
        usage: {
          bandwidth: {
            used: bandwidthBytes,
            usedFormatted: `${bandwidthGB} GB`,
            limit: limits.bandwidth,
            limitFormatted: "100 GB",
            percentage: Math.min((bandwidthBytes / limits.bandwidth) * 100, 100),
          },
          buildMinutes: {
            used: usage.build_minutes || 0,
            limit: limits.buildMinutes,
            percentage: Math.min(((usage.build_minutes || 0) / limits.buildMinutes) * 100, 100),
          },
          requests: {
            used: usage.requests || 0,
            usedFormatted: formatNumber(usage.requests || 0),
            limit: limits.requests,
            limitFormatted: "100k",
            percentage: Math.min(((usage.requests || 0) / limits.requests) * 100, 100),
          },
        },
      }),
      { maxAge: 30, staleWhileRevalidate: 60 }
    );
  } catch (error) {
    log.error("Failed to fetch dashboard data", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch dashboard data", 500);
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}
