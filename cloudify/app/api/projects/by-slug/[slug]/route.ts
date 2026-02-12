import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("projects/by-slug");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/projects/by-slug/[slug] - Get a project by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { slug } = await params;

    const project = await prisma.project.findFirst({
      where: {
        slug,
        userId: user.id,
      },
      include: {
        deployments: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            branch: true,
            commitSha: true,
            commitMessage: true,
            createdAt: true,
            finishedAt: true,
            buildTime: true,
            siteSlug: true,
          },
        },
        envVariables: {
          select: {
            id: true,
            key: true,
            isSecret: true,
            target: true,
            createdAt: true,
          },
        },
        domains: {
          select: {
            id: true,
            domain: true,
            verified: true,
            sslStatus: true,
          },
        },
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Format deployments with calculated duration
    const formattedDeployments = project.deployments.map((d) => ({
      id: d.id,
      status: d.status.toLowerCase(),
      branch: d.branch || "main",
      commit: d.commitSha?.substring(0, 7) || "unknown",
      commitMessage: d.commitMessage || "No commit message",
      time: formatTimeAgo(d.createdAt),
      duration: d.buildTime ? formatDuration(d.buildTime) : null,
      isProduction: d.branch === "main" || d.branch === "master",
      url: d.siteSlug
        ? `${d.siteSlug}.cloudify.tranthachnguyen.com`
        : `${project.slug}.cloudify.tranthachnguyen.com`,
    }));

    return ok({
      ...project,
      deployments: formattedDeployments,
      lastDeployment: formattedDeployments[0] || null,
    });
  } catch (error) {
    log.error("Failed to fetch project", error);
    return fail("INTERNAL_ERROR", "Failed to fetch project", 500);
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
