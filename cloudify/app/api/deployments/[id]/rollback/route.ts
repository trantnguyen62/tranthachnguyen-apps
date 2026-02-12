/**
 * Deployment Rollback API
 *
 * POST /api/deployments/[id]/rollback - Rollback to this deployment
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { rollbackToDeployment, canRollback } from "@/lib/deployments/rollback";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("deployments/[id]/rollback");

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const deploymentId = id;

    // Get deployment and verify ownership
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
            name: true,
          },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    if (deployment.project.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to rollback this deployment" },
        { status: 403 }
      );
    }

    // Check if rollback is possible
    const { canRollback: allowed, reason } = await canRollback(deploymentId);
    if (!allowed) {
      return NextResponse.json(
        { error: reason || "Cannot rollback to this deployment" },
        { status: 400 }
      );
    }

    // Perform rollback
    const result = await rollbackToDeployment(
      deployment.project.id,
      deploymentId,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Rollback failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to deployment ${deploymentId}`,
      rollbackTime: result.rollbackTime,
      previousDeploymentId: result.previousDeploymentId,
      newActiveDeploymentId: result.newActiveDeploymentId,
    });
  } catch (error) {
    log.error("Rollback error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if deployment can be rolled back to
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const result = await canRollback(id);
    return NextResponse.json(result);
  } catch (error) {
    log.error("Rollback check error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
