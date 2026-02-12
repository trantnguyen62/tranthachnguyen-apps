import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError, requireProjectAccess } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("deployments/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/deployments/[id] - Get deployment details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;

    const { id } = await params;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
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
          orderBy: { timestamp: "asc" },
          take: 500,
        },
      },
    });

    if (!deployment) {
      return fail("NOT_FOUND", "Deployment not found", 404);
    }

    // Project-scoped RBAC: viewer+ can read
    const accessResult = await requireProjectAccess(request, deployment.project.id, "viewer");
    if (isAuthError(accessResult)) {
      return accessResult;
    }

    return ok(deployment);
  } catch (error) {
    log.error("Failed to fetch deployment", error);
    return fail("INTERNAL_ERROR", "Failed to fetch deployment", 500);
  }
}

// PATCH /api/deployments/[id] - Update deployment status (for build worker)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;

    const { id } = await params;
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { status, url, buildTime } = body;

    // Validate status if provided
    const validStatuses = ["QUEUED", "BUILDING", "DEPLOYING", "READY", "ERROR", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return fail("VALIDATION_ERROR", `Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    // Validate url if provided
    if (url !== undefined && typeof url !== "string") {
      return fail("VALIDATION_ERROR", "URL must be a string", 400);
    }

    // Validate buildTime if provided
    if (buildTime !== undefined && (typeof buildTime !== "number" || buildTime < 0)) {
      return fail("VALIDATION_ERROR", "buildTime must be a non-negative number", 400);
    }

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true, id: true },
        },
      },
    });

    if (!deployment) {
      return fail("NOT_FOUND", "Deployment not found", 404);
    }

    // Project-scoped RBAC: developer+ to update deployments
    const accessResult = await requireProjectAccess(request, deployment.project.id, "developer");
    if (isAuthError(accessResult)) {
      return accessResult;
    }

    const updated = await prisma.deployment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(url && { url }),
        ...(buildTime !== undefined && { buildTime }),
        ...(status === "READY" || status === "ERROR" ? { finishedAt: new Date() } : {}),
      },
    });

    return ok(updated);
  } catch (error) {
    log.error("Failed to update deployment", error);
    return fail("INTERNAL_ERROR", "Failed to update deployment", 500);
  }
}

// DELETE /api/deployments/[id] - Cancel deployment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;

    const { id } = await params;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
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

    // Only cancel if in progress
    if (deployment.status === "QUEUED" || deployment.status === "BUILDING" || deployment.status === "DEPLOYING") {
      await prisma.deployment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          finishedAt: new Date(),
        },
      });

      await prisma.deploymentLog.create({
        data: {
          deploymentId: id,
          level: "warn",
          message: "Deployment cancelled by user",
        },
      });
    }

    return ok({ cancelled: true, deploymentId: id });
  } catch (error) {
    log.error("Failed to cancel deployment", error);
    return fail("INTERNAL_ERROR", "Failed to cancel deployment", 500);
  }
}
