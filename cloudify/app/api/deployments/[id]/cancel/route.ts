import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("deployments/[id]/cancel");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/deployments/[id]/cancel - Cancel a deployment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if (isAuthError(authResult)) return authResult;
    const session = authResult.user;

    const { id } = await params;

    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!deployment) {
      return fail("NOT_FOUND", "Deployment not found", 404);
    }

    // Verify ownership - prevent IDOR
    if (deployment.project.userId !== session.id) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
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

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to cancel deployment", error);
    return fail("INTERNAL_ERROR", "Failed to cancel deployment", 500);
  }
}
