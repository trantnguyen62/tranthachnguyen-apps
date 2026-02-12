/**
 * Individual Database API
 * GET - Get database details
 * DELETE - Delete database
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { deprovisionDatabase } from "@/lib/database/provisioner";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("databases/detail");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/databases/[id] - Get database details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const database = await prisma.managedDatabase.findUnique({
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
        metrics: {
          orderBy: { timestamp: "desc" },
          take: 24, // Last 24 data points
        },
        backups: {
          orderBy: { startedAt: "desc" },
          take: 5,
        },
        migrations: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!database) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (database.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Remove sensitive fields from response
    const { password, ...safeDatabase } = database;

    return NextResponse.json({ database: safeDatabase });
  } catch (error) {
    log.error("Failed to fetch database", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    );
  }
}

// DELETE /api/databases/[id] - Delete database
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const database = await prisma.managedDatabase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!database) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (database.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Start deprovisioning
    await deprovisionDatabase(id);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: database.projectId,
        type: "database",
        action: "database.deleted",
        description: `Deleted ${database.type} database "${database.name}"`,
        metadata: {
          databaseId: id,
          type: database.type,
          provider: database.provider,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database deletion initiated",
    });
  } catch (error) {
    log.error("Failed to delete database", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}

// PATCH /api/databases/[id] - Update database settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const database = await prisma.managedDatabase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!database) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (database.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, plan, connectionLimit } = body;

    // Only allow updating certain fields
    const updateData: Record<string, unknown> = {};

    if (name && typeof name === "string") {
      updateData.name = name;
    }

    if (plan && ["hobby", "pro", "business", "enterprise"].includes(plan)) {
      updateData.plan = plan;
    }

    if (connectionLimit && typeof connectionLimit === "number" && connectionLimit > 0) {
      updateData.connectionLimit = connectionLimit;
    }

    const updated = await prisma.managedDatabase.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        status: true,
        plan: true,
        connectionLimit: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ database: updated });
  } catch (error) {
    log.error("Failed to update database", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    );
  }
}
