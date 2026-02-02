import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/deployments/[id]/cancel - Cancel a deployment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Verify ownership - prevent IDOR
    if (deployment.project.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cancel deployment:", error);
    return NextResponse.json(
      { error: "Failed to cancel deployment" },
      { status: 500 }
    );
  }
}
