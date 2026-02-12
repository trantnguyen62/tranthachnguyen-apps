import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("feature-flags");

// GET /api/feature-flags - List feature flags for a project
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const flags = await prisma.featureFlag.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, name: true, slug: true } } },
      });

      return NextResponse.json(flags);
    }

    // Get all flags across all user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const projectIds = userProjects.map((p) => p.id);

    const flags = await prisma.featureFlag.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json(flags);
  } catch (error) {
    log.error("Failed to fetch feature flags", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

// POST /api/feature-flags - Create a new feature flag
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const {
      projectId,
      key,
      name,
      description,
      enabled = false,
      percentage = 100,
      conditions,
    } = body;

    if (!projectId || !key || !name) {
      return NextResponse.json(
        { error: "Project ID, key, and name are required" },
        { status: 400 }
      );
    }

    // Validate key format
    if (!/^[a-z0-9_-]+$/i.test(key)) {
      return NextResponse.json(
        { error: "Key must contain only letters, numbers, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check for duplicate key
    const existing = await prisma.featureFlag.findFirst({
      where: { projectId, key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A flag with this key already exists" },
        { status: 400 }
      );
    }

    const flag = await prisma.featureFlag.create({
      data: {
        projectId,
        key,
        name,
        description,
        enabled,
        percentage: Math.min(100, Math.max(0, percentage)),
        conditions,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "feature_flag",
        action: "created",
        description: `Created feature flag "${name}"`,
        metadata: { flagId: flag.id, key },
      },
    });

    return NextResponse.json(flag);
  } catch (error) {
    log.error("Failed to create feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create feature flag" },
      { status: 500 }
    );
  }
}
