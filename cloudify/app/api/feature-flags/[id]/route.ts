import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("feature-flags/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/feature-flags/[id] - Get a feature flag
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!flag) {
      return NextResponse.json(
        { error: "Feature flag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(flag);
  } catch (error) {
    log.error("Failed to fetch feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch feature flag" },
      { status: 500 }
    );
  }
}

// PATCH /api/feature-flags/[id] - Update a feature flag
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!flag) {
      return NextResponse.json(
        { error: "Feature flag not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, enabled, percentage, conditions } = body;

    const updateData: {
      name?: string;
      description?: string;
      enabled?: boolean;
      percentage?: number;
      conditions?: object;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 100) {
        return NextResponse.json({ error: "Name must be a string (1-100 chars)" }, { status: 400 });
      }
      updateData.name = name;
    }
    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
      }
      updateData.description = description;
    }
    if (enabled !== undefined) {
      if (typeof enabled !== "boolean") {
        return NextResponse.json({ error: "Enabled must be a boolean" }, { status: 400 });
      }
      updateData.enabled = enabled;
    }
    if (percentage !== undefined) {
      if (typeof percentage !== "number" || isNaN(percentage)) {
        return NextResponse.json({ error: "Percentage must be a number" }, { status: 400 });
      }
      updateData.percentage = Math.min(100, Math.max(0, percentage));
    }
    if (conditions !== undefined) updateData.conditions = conditions;

    const updated = await prisma.featureFlag.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: flag.projectId,
        type: "feature_flag",
        action: "updated",
        description: `Updated feature flag "${updated.name}"`,
        metadata: { flagId: id, changes: updateData },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    log.error("Failed to update feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}

// DELETE /api/feature-flags/[id] - Delete a feature flag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!flag) {
      return NextResponse.json(
        { error: "Feature flag not found" },
        { status: 404 }
      );
    }

    await prisma.featureFlag.delete({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: flag.projectId,
        type: "feature_flag",
        action: "deleted",
        description: `Deleted feature flag "${flag.name}"`,
        metadata: { flagId: id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Failed to delete feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete feature flag" },
      { status: 500 }
    );
  }
}
