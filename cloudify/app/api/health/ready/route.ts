/**
 * Readiness Probe Endpoint
 * Returns 200 only if the app is ready to receive traffic
 */

import { prisma } from "@/lib/prisma";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("health/ready");

export async function GET() {
  try {
    // Verify database is accessible
    await prisma.$queryRaw`SELECT 1`;

    return ok({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Database check failed", { error: error instanceof Error ? error.message : String(error) });
    return fail("SERVICE_UNAVAILABLE", "Database unavailable", 503);
  }
}
