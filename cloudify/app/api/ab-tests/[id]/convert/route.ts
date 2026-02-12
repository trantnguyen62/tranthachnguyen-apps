/**
 * A/B Test Conversion API
 * POST - Track a conversion for a test
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackConversion } from "@/lib/edge/ab-testing";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ab-tests/convert");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/ab-tests/[id]/convert - Track conversion
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Parse body with error handling
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { visitorId, conversionType = "goal_reached", value, metadata } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: "Visitor ID is required" },
        { status: 400 }
      );
    }

    // Verify test exists
    const test = await prisma.aBTest.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    if (!test.enabled) {
      return NextResponse.json(
        { error: "A/B test is not active" },
        { status: 400 }
      );
    }

    // Track conversion
    const tracked = await trackConversion(id, visitorId, conversionType, value, metadata);

    if (!tracked) {
      return NextResponse.json(
        { error: "Visitor not found in test" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversion tracked",
    });
  } catch (error) {
    log.error("Failed to track conversion", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to track conversion" },
      { status: 500 }
    );
  }
}
