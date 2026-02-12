import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { DeploymentStatus, Prisma } from "@prisma/client";
import { getRouteLogger } from "@/lib/api/logger";
import { handlePrismaError } from "@/lib/api/error-response";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

// Re-export POST and DELETE from /api/deploy for consolidation
export { POST, DELETE } from "@/app/api/deploy/route";

const log = getRouteLogger("deployments");

// GET /api/deployments - List all deployments for the user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);

    // Build where clause
    const baseWhere: Prisma.DeploymentWhereInput = {
      project: { userId: user.id },
    };

    if (status && status !== "all") {
      baseWhere.status = status.toUpperCase() as DeploymentStatus;
    }

    if (projectId && projectId !== "all") {
      baseWhere.projectId = projectId;
    }

    const where: Prisma.DeploymentWhereInput = {
      ...baseWhere,
      ...cursorWhere,
    };

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
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
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
      prisma.deployment.count({ where: baseWhere }),
    ]);

    const hasMore = deployments.length > limit;
    const items = hasMore ? deployments.slice(0, limit) : deployments;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    // Format deployments for the frontend
    const formattedDeployments = items.map((deployment) => ({
      id: deployment.id,
      project: deployment.project.name,
      projectSlug: deployment.project.slug,
      projectId: deployment.project.id,
      branch: deployment.branch || "main",
      commit: deployment.commitSha?.substring(0, 7) || "unknown",
      commitMessage: deployment.commitMessage || "No commit message",
      status: deployment.status.toLowerCase(),
      createdAt: deployment.createdAt.toISOString(),
      duration: deployment.buildTime ? formatDuration(deployment.buildTime) : null,
      url: deployment.siteSlug
        ? `${deployment.siteSlug}.cloudify.tranthachnguyen.com`
        : `${deployment.project.slug}.cloudify.tranthachnguyen.com`,
      isProduction: deployment.branch === "main" || deployment.branch === "master",
    }));

    // Get unique projects for filter — use Map to deduplicate properly
    const projectMap = new Map<string, { id: string; name: string; slug: string }>();
    items.forEach((d) => projectMap.set(d.project.id, d.project));
    const projects = Array.from(projectMap.values());

    return ok(
      { deployments: formattedDeployments, projects },
      {
        pagination: {
          cursor: nextCursor,
          hasMore,
          total,
        },
      }
    );
  } catch (error) {
    const prismaResp = handlePrismaError(error, "deployment");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to fetch deployments", 500);
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
