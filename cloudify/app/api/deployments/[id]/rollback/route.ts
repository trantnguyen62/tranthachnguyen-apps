/**
 * Deployment Rollback API
 *
 * POST /api/deployments/[id]/rollback - Rollback to this deployment
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import { rollbackToDeployment, canRollback } from "@/lib/deployments/rollback";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (deployment.project.userId !== session.user.id) {
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
      session.user.id
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
    console.error("Rollback error:", error);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await canRollback(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Rollback check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
