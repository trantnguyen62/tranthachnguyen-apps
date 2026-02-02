/**
 * Individual Region Admin API
 * GET - Get region details
 * PUT - Update region
 * DELETE - Delete region
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { checkRegionHealth } from "@/lib/failover/health-monitor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/regions/[id] - Get region details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const region = await prisma.region.findUnique({
      where: { id },
      include: {
        healthChecks: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        failoversFrom: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            toRegion: { select: { name: true, displayName: true } },
          },
        },
        failoversTo: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            fromRegion: { select: { name: true, displayName: true } },
          },
        },
        replicationsSource: {
          include: {
            targetRegion: { select: { name: true } },
          },
        },
        replicationsTarget: {
          include: {
            sourceRegion: { select: { name: true } },
          },
        },
      },
    });

    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }

    // Calculate health stats
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentChecks = region.healthChecks.filter(
      (c) => c.createdAt >= oneHourAgo
    );
    const healthyCount = recentChecks.filter((c) => c.status === "healthy").length;
    const uptimePercent = recentChecks.length > 0
      ? Math.round((healthyCount / recentChecks.length) * 100)
      : 100;

    const avgLatency = recentChecks.length > 0
      ? Math.round(
          recentChecks.reduce((sum, c) => sum + c.latency, 0) / recentChecks.length
        )
      : 0;

    return NextResponse.json({
      region: {
        ...region,
        healthStats: {
          uptimePercent,
          avgLatency,
          checksLastHour: recentChecks.length,
          healthyChecks: healthyCount,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch region:", error);
    return NextResponse.json(
      { error: "Failed to fetch region" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/regions/[id] - Update region
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();

    const region = await prisma.region.findUnique({
      where: { id },
    });

    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }

    const {
      displayName,
      endpoint,
      status,
      isPrimary,
      priority,
      maxDeployments,
      latitude,
      longitude,
      country,
      provider,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (endpoint !== undefined) updateData.endpoint = endpoint;
    if (status !== undefined) updateData.status = status;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (priority !== undefined) updateData.priority = priority;
    if (maxDeployments !== undefined) updateData.maxDeployments = maxDeployments;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (country !== undefined) updateData.country = country;
    if (provider !== undefined) updateData.provider = provider;

    // If setting as primary, unset other primary regions
    if (isPrimary === true) {
      await prisma.region.updateMany({
        where: { isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.region.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "admin",
        action: "region.updated",
        description: `Updated region "${region.displayName}"`,
        metadata: {
          regionId: id,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({ region: updated });
  } catch (error) {
    console.error("Failed to update region:", error);
    return NextResponse.json(
      { error: "Failed to update region" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/regions/[id] - Delete region
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const region = await prisma.region.findUnique({
      where: { id },
    });

    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }

    if (region.isPrimary) {
      return NextResponse.json(
        { error: "Cannot delete primary region. Promote another region first." },
        { status: 400 }
      );
    }

    if (region.activeDeployments > 0) {
      return NextResponse.json(
        { error: "Cannot delete region with active deployments" },
        { status: 400 }
      );
    }

    // Delete associated records
    await prisma.regionHealthCheck.deleteMany({ where: { regionId: id } });
    await prisma.dataReplication.deleteMany({
      where: { OR: [{ sourceRegionId: id }, { targetRegionId: id }] },
    });

    // Delete region
    await prisma.region.delete({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "admin",
        action: "region.deleted",
        description: `Deleted region "${region.displayName}"`,
        metadata: { regionId: id, regionName: region.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Region deleted",
    });
  } catch (error) {
    console.error("Failed to delete region:", error);
    return NextResponse.json(
      { error: "Failed to delete region" },
      { status: 500 }
    );
  }
}
