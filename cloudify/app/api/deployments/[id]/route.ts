import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/deployments/[id] - Get deployment details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        },
      },
    });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Verify ownership
    if (deployment.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(deployment);
  } catch (error) {
    console.error("Failed to fetch deployment:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployment" },
      { status: 500 }
    );
  }
}

// PATCH /api/deployments/[id] - Update deployment status (for build worker)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, url, buildTime } = body;

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

    if (deployment.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.deployment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(url && { url }),
        ...(buildTime && { buildTime }),
        ...(status === "READY" || status === "ERROR" ? { finishedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update deployment:", error);
    return NextResponse.json(
      { error: "Failed to update deployment" },
      { status: 500 }
    );
  }
}

// DELETE /api/deployments/[id] - Cancel deployment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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

    if (deployment.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
