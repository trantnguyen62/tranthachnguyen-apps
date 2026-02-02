/**
 * Deploy API - Creates and triggers deployments
 * Real implementation using K3s and MinIO
 * Supports both session (web UI) and token (CLI) authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireDeployAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { triggerK8sBuild, cancelK8sBuild } from "@/lib/build/k8s-worker";

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
    // Authenticate user (supports both session and API token)
    const authResult = await requireDeployAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json();
    const { projectId, branch, commitSha, commitMsg } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing required field: projectId" },
        { status: 400 }
      );
    }

    // Get project and verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        repoUrl: true,
        repoBranch: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - not project owner" },
        { status: 403 }
      );
    }

    if (!project.repoUrl) {
      return NextResponse.json(
        { error: "Project has no repository URL configured" },
        { status: 400 }
      );
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: "QUEUED",
        branch: branch || project.repoBranch,
        commitSha: commitSha || null,
        commitMsg: commitMsg || null,
      },
    });

    // Log activity
    await prisma.activity.create({
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
    });

    // Trigger build in background
    await triggerBuild(deployment.id);

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        projectId: deployment.projectId,
        status: deployment.status,
        branch: deployment.branch,
        createdAt: deployment.createdAt,
      },
      message: "Deployment created and build triggered",
    });
  } catch (error) {
    console.error("Deployment error:", error);
    return NextResponse.json(
      { error: "Failed to create deployment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deploy - Get deployment(s)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (supports both session and API token)
    const authResult = await requireDeployAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");
    const projectId = searchParams.get("projectId");
    // Handle NaN gracefully by using defaults when parseInt fails
    const parsedLimit = parseInt(searchParams.get("limit") || "20", 10);
    const parsedOffset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.max(1, Math.min(100, isNaN(parsedLimit) ? 20 : parsedLimit));
    const offset = Math.max(0, isNaN(parsedOffset) ? 0 : parsedOffset);

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
        return NextResponse.json(
          { error: "Deployment not found" },
          { status: 404 }
        );
      }

      // Verify ownership
      if (deployment.project.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }

      return NextResponse.json({ deployment });
    }

    // Get deployments for a project
    if (projectId) {
      // Verify project ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });

      if (!project || project.userId !== user.id) {
        return NextResponse.json(
          { error: "Project not found or unauthorized" },
          { status: 404 }
        );
      }

      const [deployments, total] = await Promise.all([
        prisma.deployment.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
          include: {
            project: {
              select: { name: true, slug: true },
            },
          },
        }),
        prisma.deployment.count({ where: { projectId } }),
      ]);

      return NextResponse.json({
        deployments,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + deployments.length < total,
        },
      });
    }

    // Get all user's deployments
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const projectIds = userProjects.map((p) => p.id);

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          project: {
            select: { name: true, slug: true },
          },
        },
      }),
      prisma.deployment.count({
        where: { projectId: { in: projectIds } },
      }),
    ]);

    return NextResponse.json({
      deployments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + deployments.length < total,
      },
    });
  } catch (error) {
    console.error("Get deployments error:", error);
    return NextResponse.json(
      { error: "Failed to get deployments" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deploy - Cancel a deployment
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user (supports both session and API token)
    const authResult = await requireDeployAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");

    if (!deploymentId) {
      return NextResponse.json(
        { error: "Missing deployment ID" },
        { status: 400 }
      );
    }

    // Get deployment and verify ownership
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: { userId: true },
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
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Can only cancel queued or building deployments
    if (!["QUEUED", "BUILDING", "DEPLOYING"].includes(deployment.status)) {
      return NextResponse.json(
        { error: `Cannot cancel deployment with status: ${deployment.status}` },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      message: "Deployment cancelled",
    });
  } catch (error) {
    console.error("Cancel deployment error:", error);
    return NextResponse.json(
      { error: "Failed to cancel deployment" },
      { status: 500 }
    );
  }
}
