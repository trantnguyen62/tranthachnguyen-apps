import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { DeploymentStatus, Prisma } from "@prisma/client";
import { getRouteLogger } from "@/lib/api/logger";

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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    // Build where clause
    const where: Prisma.DeploymentWhereInput = {
      project: { userId: user.id },
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase() as DeploymentStatus;
    }

    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

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
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.deployment.count({ where }),
    ]);

    // Format deployments for the frontend
    const formattedDeployments = deployments.map((deployment) => ({
      id: deployment.id,
      project: deployment.project.name,
      projectSlug: deployment.project.slug,
      projectId: deployment.project.id,
      branch: deployment.branch || "main",
      commit: deployment.commitSha?.substring(0, 7) || "unknown",
      commitMessage: deployment.commitMsg || "No commit message",
      status: deployment.status.toLowerCase(),
      createdAt: deployment.createdAt.toISOString(),
      duration: deployment.buildTime ? formatDuration(deployment.buildTime) : null,
      url: deployment.siteSlug
        ? `${deployment.siteSlug}.cloudify.tranthachnguyen.com`
        : `${deployment.project.slug}.cloudify.tranthachnguyen.com`,
      isProduction: deployment.branch === "main" || deployment.branch === "master",
    }));

    // Get unique projects for filter
    const projects = [...new Set(deployments.map((d) => d.project))].map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
    }));

    return NextResponse.json({
      deployments: formattedDeployments,
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    log.error("Failed to fetch deployments", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
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
