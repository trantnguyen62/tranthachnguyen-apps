/**
 * Admin Failover API
 * GET - Get failover status and history
 * POST - Trigger manual failover
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import {
  getFailoverStatus,
  getFailoverHistory,
  executeFailover,
  rollbackFailover,
  cancelFailover,
} from "@/lib/failover/failover-manager";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("admin/failover");

// GET /api/admin/failover - Get status and history
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

    const [status, history] = await Promise.all([
      getFailoverStatus(),
      getFailoverHistory(20),
    ]);

    // Get primary region
    const primaryRegion = await prisma.region.findFirst({
      where: { isPrimary: true },
      select: { id: true, name: true, displayName: true, status: true },
    });

    // Get available failover targets
    const availableTargets = await prisma.region.findMany({
      where: {
        isPrimary: false,
        status: "healthy",
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        priority: true,
        activeDeployments: true,
        maxDeployments: true,
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({
      status,
      history,
      primaryRegion,
      availableTargets,
    });
  } catch (error) {
    log.error("Failed to get failover status", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to get failover status" },
      { status: 500 }
    );
  }
}

// POST /api/admin/failover - Trigger failover action
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
    const { action, fromRegionId, toRegionId, eventId } = body;

    switch (action) {
      case "trigger": {
        if (!fromRegionId || !toRegionId) {
          return NextResponse.json(
            { error: "fromRegionId and toRegionId are required" },
            { status: 400 }
          );
        }

        // Verify regions exist
        const [fromRegion, toRegion] = await Promise.all([
          prisma.region.findUnique({ where: { id: fromRegionId } }),
          prisma.region.findUnique({ where: { id: toRegionId } }),
        ]);

        if (!fromRegion || !toRegion) {
          return NextResponse.json(
            { error: "Invalid region IDs" },
            { status: 400 }
          );
        }

        if (toRegion.status !== "healthy") {
          return NextResponse.json(
            { error: "Target region is not healthy" },
            { status: 400 }
          );
        }

        const result = await executeFailover(
          fromRegionId,
          toRegionId,
          "manual",
          user.id
        );

        return NextResponse.json({ result });
      }

      case "rollback": {
        if (!eventId) {
          return NextResponse.json(
            { error: "eventId is required for rollback" },
            { status: 400 }
          );
        }

        const result = await rollbackFailover(eventId);
        return NextResponse.json({ result });
      }

      case "cancel": {
        if (!eventId) {
          return NextResponse.json(
            { error: "eventId is required for cancel" },
            { status: 400 }
          );
        }

        const cancelled = await cancelFailover(eventId);
        if (!cancelled) {
          return NextResponse.json(
            { error: "Cannot cancel this failover (may not be pending)" },
            { status: 400 }
          );
        }

        return NextResponse.json({ success: true, message: "Failover cancelled" });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: trigger, rollback, or cancel" },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error("Failover action failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failover action failed" },
      { status: 500 }
    );
  }
}
