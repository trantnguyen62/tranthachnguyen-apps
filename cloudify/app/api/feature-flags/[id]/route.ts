import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/feature-flags/[id] - Get a feature flag
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
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
    console.error("Failed to fetch feature flag:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flag" },
      { status: 500 }
    );
  }
}

// PATCH /api/feature-flags/[id] - Update a feature flag
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
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

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (percentage !== undefined) {
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
        userId: session.user.id,
        projectId: flag.projectId,
        type: "feature_flag",
        action: "updated",
        description: `Updated feature flag "${updated.name}"`,
        metadata: { flagId: id, changes: updateData },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update feature flag:", error);
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}

// DELETE /api/feature-flags/[id] - Delete a feature flag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
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
        userId: session.user.id,
        projectId: flag.projectId,
        type: "feature_flag",
        action: "deleted",
        description: `Deleted feature flag "${flag.name}"`,
        metadata: { flagId: id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feature flag:", error);
    return NextResponse.json(
      { error: "Failed to delete feature flag" },
      { status: 500 }
    );
  }
}
