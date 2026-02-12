import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { triggerBuild } from "@/lib/build/worker";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

const log = getRouteLogger("projects/[id]/deployments");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/deployments - List deployments for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    const deployments = await prisma.deployment.findMany({
      where: { projectId: id, ...cursorWhere },
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const hasMore = deployments.length > limit;
    const items = hasMore ? deployments.slice(0, limit) : deployments;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    return ok(
      { deployments: items },
      {
        pagination: {
          cursor: nextCursor,
          hasMore,
        },
      }
    );
  } catch (error) {
    log.error("Failed to fetch deployments", error);
    return fail("INTERNAL_ERROR", "Failed to fetch deployments", 500);
  }
}

// POST /api/projects/[id]/deployments - Create a new deployment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { commitSha, commitMsg: commitMessage, branch } = body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Create deployment
    const deployment = await prisma.deployment.create({
      data: {
        projectId: id,
        status: "QUEUED",
        commitSha: commitSha || null,
        commitMessage: commitMessage || null,
        branch: branch || project.repositoryBranch,
      },
    });

    // Add initial log
    await prisma.deploymentLog.create({
      data: {
        deploymentId: deployment.id,
        level: "info",
        message: `Deployment queued for ${project.name}`,
      },
    });

    // Trigger build worker to start the deployment
    await triggerBuild(deployment.id);

    return ok(deployment, { status: 201 });
  } catch (error) {
    log.error("Failed to create deployment", error);
    return fail("INTERNAL_ERROR", "Failed to create deployment", 500);
  }
}
