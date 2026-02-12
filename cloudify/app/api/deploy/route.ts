/**
 * Deploy API - Creates and triggers deployments
 * Real implementation using K3s and MinIO
 * Supports both session (web UI) and token (CLI) authentication
 */

import { NextRequest } from "next/server";
import { requireDeployAccess, isAuthError, requireProjectAccess } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { prisma } from "@/lib/prisma";
import { triggerK8sBuild, cancelK8sBuild } from "@/lib/build/k8s-worker";
import { canDeploy } from "@/lib/billing/metering";
import type { PlanType } from "@/lib/billing/pricing";
import { loggers } from "@/lib/logging/logger";
import { withCache, noCache } from "@/lib/api/cache-headers";
import { handlePrismaError } from "@/lib/api/error-response";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

const log = loggers.deploy;

// Feature flag: use K3s or Docker-based builds
const USE_K3S_BUILDS = process.env.USE_K3S_BUILDS === "true";

// Import the appropriate build trigger
async function triggerBuild(deploymentId: string) {
  if (USE_K3S_BUILDS) {
    return triggerK8sBuild(deploymentId);
  } else {
    // Fall back to Docker-based builds
    const { triggerBuild: triggerDockerBuild } = await import("@/lib/build/worker");
    return triggerDockerBuild(deploymentId);
  }
}

/**
 * POST /api/deploy - Create a new deployment
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDeployAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, branch, commitSha, commitMsg: commitMessage, clean } = body;

    if (!projectId) {
      return fail("VALIDATION_MISSING_FIELD", "Missing required field: projectId", 400);
    }

    // Project-scoped RBAC: require developer+ to deploy
    const accessResult = await requireProjectAccess(request, projectId, "developer");
    if (isAuthError(accessResult)) {
      return accessResult;
    }

    // Get project details with owner plan in a single query
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        repositoryUrl: true,
        repositoryBranch: true,
        user: { select: { plan: true } },
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    if (!project.repositoryUrl) {
      return fail("BAD_REQUEST", "Project has no repository URL configured", 400);
    }

    // Check plan limits -- use project owner's plan (team members deploy under owner's quota)
    const projectOwnerId = project.userId;
    const ownerPlan = (project.user?.plan || "free") as PlanType;
    const deployAllowed = await canDeploy(projectOwnerId, ownerPlan);
    if (!deployAllowed) {
      return fail("PAYMENT_REQUIRED", "Deployment limit reached for your plan. Upgrade to continue deploying.", 402);
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: "QUEUED",
        branch: branch || project.repositoryBranch,
        commitSha: commitSha || null,
        commitMessage: commitMessage || null,
      },
    });

    // Log activity (non-blocking - don't fail deployment if logging fails)
    prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "deployment",
        action: "deployment.created",
        description: `Created deployment from branch ${deployment.branch}`,
        metadata: {
          deploymentId: deployment.id,
          branch: deployment.branch,
        },
      },
    }).catch((err: unknown) => log.error("Failed to log deploy activity", err as Error));

    // Clean build cache if requested
    if (clean) {
      const cacheDir = `/data/cache/${projectId}`;
      const { promises: fs } = await import("fs");
      await fs.rm(cacheDir, { recursive: true, force: true }).catch(() => {});
      log.info("Cleared build cache", { projectId });
    }

    // Trigger build in background (don't await - respond immediately)
    triggerBuild(deployment.id).catch(async (err: unknown) => {
      log.error("Build trigger failed", err as Error);
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: "ERROR", finishedAt: new Date() },
      }).catch((e: unknown) => log.error("Failed to mark deployment as errored", e as Error));
    });

    return noCache(ok({
      id: deployment.id,
      projectId: deployment.projectId,
      status: deployment.status,
      branch: deployment.branch,
      createdAt: deployment.createdAt,
    }, { status: 201 }));
  } catch (error) {
    const prismaResp = handlePrismaError(error, "deployment");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to create deployment", 500);
  }
}

/**
 * GET /api/deploy - Get deployment(s)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDeployAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");
    const projectId = searchParams.get("projectId");
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);

    // Get single deployment by ID
    if (deploymentId) {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              userId: true,
            },
          },
          logs: {
            orderBy: { timestamp: "desc" },
            take: 100,
          },
        },
      });

      if (!deployment) {
        return fail("NOT_FOUND", "Deployment not found", 404);
      }

      // Project-scoped RBAC: viewer+ can read deployments
      const accessResult = await requireProjectAccess(request, deployment.project.id, "viewer");
      if (isAuthError(accessResult)) {
        return accessResult;
      }

      return withCache(ok(deployment), { maxAge: 5, staleWhileRevalidate: 15 });
    }

    // Get deployments for a project
    if (projectId) {
      // Project-scoped RBAC: viewer+ can read
      const accessResult = await requireProjectAccess(request, projectId, "viewer");
      if (isAuthError(accessResult)) {
        return accessResult;
      }

      const [deployments, total] = await Promise.all([
        prisma.deployment.findMany({
          where: { projectId, ...cursorWhere },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limit + 1,
          select: {
            id: true,
            status: true,
            branch: true,
            commitSha: true,
            commitMessage: true,
            siteSlug: true,
            buildTime: true,
            createdAt: true,
            finishedAt: true,
            isActive: true,
            isPreview: true,
            prNumber: true,
            project: {
              select: { name: true, slug: true },
            },
          },
        }),
        prisma.deployment.count({ where: { projectId } }),
      ]);

      const hasMore = deployments.length > limit;
      const items = hasMore ? deployments.slice(0, limit) : deployments;
      const nextCursor = hasMore && items.length > 0
        ? encodeCursor(items[items.length - 1])
        : undefined;

      return withCache(
        ok(items, {
          pagination: {
            cursor: nextCursor,
            hasMore,
            total,
          },
        }),
        { maxAge: 10, staleWhileRevalidate: 30 }
      );
    }

    // Get all user's deployments (owned + team projects)
    const [ownedProjects, teamProjects] = await Promise.all([
      prisma.project.findMany({
        where: { userId: user.id },
        select: { id: true },
      }),
      prisma.teamProject.findMany({
        where: {
          team: { members: { some: { userId: user.id } } },
        },
        select: { projectId: true },
      }),
    ]);

    const projectIds = [
      ...new Set([
        ...ownedProjects.map((p) => p.id),
        ...teamProjects.map((tp) => tp.projectId),
      ]),
    ];

    const allWhere = { projectId: { in: projectIds }, ...cursorWhere };

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where: allWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: {
          id: true,
          status: true,
          branch: true,
          commitSha: true,
          commitMessage: true,
          siteSlug: true,
          buildTime: true,
          createdAt: true,
          finishedAt: true,
          isActive: true,
          isPreview: true,
          prNumber: true,
          project: {
            select: { name: true, slug: true },
          },
        },
      }),
      prisma.deployment.count({
        where: { projectId: { in: projectIds } },
      }),
    ]);

    const hasMore = deployments.length > limit;
    const items = hasMore ? deployments.slice(0, limit) : deployments;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    return withCache(
      ok(items, {
        pagination: {
          cursor: nextCursor,
          hasMore,
          total,
        },
      }),
      { maxAge: 10, staleWhileRevalidate: 30 }
    );
  } catch (error) {
    const prismaResp = handlePrismaError(error, "deployment");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to get deployments", 500);
  }
}

/**
 * DELETE /api/deploy - Cancel a deployment
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireDeployAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");

    if (!deploymentId) {
      return fail("VALIDATION_MISSING_FIELD", "Missing deployment ID", 400);
    }

    // Get deployment
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: { userId: true, id: true },
        },
      },
    });

    if (!deployment) {
      return fail("NOT_FOUND", "Deployment not found", 404);
    }

    // Project-scoped RBAC: developer+ to cancel
    const accessResult = await requireProjectAccess(request, deployment.project.id, "developer");
    if (isAuthError(accessResult)) {
      return accessResult;
    }

    // Can only cancel queued or building deployments
    if (!["QUEUED", "BUILDING", "DEPLOYING"].includes(deployment.status)) {
      return fail("BAD_REQUEST", `Cannot cancel deployment with status: ${deployment.status}`, 400);
    }

    // Cancel the build
    if (USE_K3S_BUILDS) {
      await cancelK8sBuild(deploymentId);
    } else {
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: "CANCELLED",
          finishedAt: new Date(),
        },
      });
    }

    return noCache(ok({ cancelled: true, deploymentId }));
  } catch (error) {
    const prismaResp = handlePrismaError(error, "deployment");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to cancel deployment", 500);
  }
}
