/**
 * Readiness Probe Endpoint
 * Returns 200 only if the app is ready to receive traffic
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("health/ready");

export async function GET() {
  try {
    // Verify database is accessible
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ready",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    log.error("Database check failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        status: "not_ready",
        error: "Database unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
