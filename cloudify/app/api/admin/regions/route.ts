/**
 * Admin Regions API
 * GET - List all regions with health status
 * POST - Create a new region
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getAllRegionHealth, checkRegionHealth } from "@/lib/failover/health-monitor";

// GET /api/admin/regions - List regions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    // Check admin access
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    if (userData?.plan !== "enterprise" && userData?.plan !== "team") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all regions with health data
    const regions = await prisma.region.findMany({
      include: {
        healthChecks: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            failoversFrom: true,
            failoversTo: true,
          },
        },
      },
      orderBy: [
        { isPrimary: "desc" },
        { priority: "asc" },
      ],
    });

    // Get replication status
    const replications = await prisma.dataReplication.findMany({
      include: {
        sourceRegion: { select: { name: true } },
        targetRegion: { select: { name: true } },
      },
    });

    const regionsWithHealth = regions.map((region) => ({
      id: region.id,
      name: region.name,
      displayName: region.displayName,
      endpoint: region.endpoint,
      status: region.status,
      isPrimary: region.isPrimary,
      priority: region.priority,
      maxDeployments: region.maxDeployments,
      activeDeployments: region.activeDeployments,
      latitude: region.latitude,
      longitude: region.longitude,
      country: region.country,
      provider: region.provider,
      lastHealthCheck: region.lastHealthCheck,
      latestHealth: region.healthChecks[0] || null,
      failoverCount: region._count.failoversFrom + region._count.failoversTo,
    }));

    return NextResponse.json({
      regions: regionsWithHealth,
      replications,
    });
  } catch (error) {
    console.error("Failed to fetch regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

// POST /api/admin/regions - Create region
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    // Check admin access
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    if (userData?.plan !== "enterprise") {
      return NextResponse.json(
        { error: "Enterprise admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      displayName,
      endpoint,
      priority,
      maxDeployments,
      latitude,
      longitude,
      country,
      provider,
    } = body;

    if (!name || !displayName || !endpoint) {
      return NextResponse.json(
        { error: "Missing required fields: name, displayName, endpoint" },
        { status: 400 }
      );
    }

    // Check for existing region
    const existing = await prisma.region.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Region with this name already exists" },
        { status: 409 }
      );
    }

    // Create region
    const region = await prisma.region.create({
      data: {
        name,
        displayName,
        endpoint,
        priority: priority || 100,
        maxDeployments: maxDeployments || 1000,
        latitude,
        longitude,
        country,
        provider,
        status: "healthy",
      },
    });

    // Run initial health check
    try {
      await checkRegionHealth(region.id);
    } catch (e) {
      console.warn(`Initial health check failed for region ${name}`);
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "admin",
        action: "region.created",
        description: `Created region "${displayName}" (${name})`,
        metadata: { regionId: region.id },
      },
    });

    return NextResponse.json({ region }, { status: 201 });
  } catch (error) {
    console.error("Failed to create region:", error);
    return NextResponse.json(
      { error: "Failed to create region" },
      { status: 500 }
    );
  }
}
