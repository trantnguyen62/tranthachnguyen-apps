import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { triggerBuild } from "@/lib/build/worker";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("deployments/[id]/trigger");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/deployments/[id]/trigger - Trigger build for a deployment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Verify deployment ownership
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

    if (deployment.project.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only trigger if queued
    if (deployment.status !== "QUEUED") {
      return NextResponse.json(
        { error: "Deployment is not in queued state" },
        { status: 400 }
      );
    }

    // Trigger the build
    await triggerBuild(id);

    return NextResponse.json({ success: true, message: "Build triggered" });
  } catch (error) {
    log.error("Failed to trigger build", error);
    return NextResponse.json(
      { error: "Failed to trigger build" },
      { status: 500 }
    );
  }
}
