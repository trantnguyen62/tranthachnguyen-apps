/**
 * Readiness Probe Endpoint
 * Returns 200 only if the app is ready to receive traffic
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    console.error("[Ready] Database check failed:", error);
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
