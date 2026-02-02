/**
 * Region Health Check API
 * POST - Trigger a health check for a region
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { checkRegionHealth } from "@/lib/failover/health-monitor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/regions/[id]/health - Trigger health check
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

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

    // Run health check
    const result = await checkRegionHealth(id);

    return NextResponse.json({
      region: region.name,
      health: result,
    });
  } catch (error) {
    console.error("Failed to check region health:", error);
    return NextResponse.json(
      { error: "Failed to check region health" },
      { status: 500 }
    );
  }
}
