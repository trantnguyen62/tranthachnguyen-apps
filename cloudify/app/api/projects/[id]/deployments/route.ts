import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/deployments - List deployments for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deployments = await prisma.deployment.findMany({
      where: { projectId: id },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
    });

    const hasMore = deployments.length > limit;
    if (hasMore) deployments.pop();

    return NextResponse.json({
      deployments,
      nextCursor: hasMore ? deployments[deployments.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("Failed to fetch deployments:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/deployments - Create a new deployment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { commitSha, commitMsg, branch } = body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create deployment
    const deployment = await prisma.deployment.create({
      data: {
        projectId: id,
        status: "QUEUED",
        commitSha: commitSha || null,
        commitMsg: commitMsg || null,
        branch: branch || project.repoBranch,
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

    // TODO: Trigger build worker here
    // For now, we'll simulate the build process

    return NextResponse.json(deployment, { status: 201 });
  } catch (error) {
    console.error("Failed to create deployment:", error);
    return NextResponse.json(
      { error: "Failed to create deployment" },
      { status: 500 }
    );
  }
}
