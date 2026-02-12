/**
 * Prometheus Metrics Endpoint
 * Exposes application metrics for Prometheus scraping
 */

import { NextRequest, NextResponse } from "next/server";
import { exportMetrics, getMetricsSummary } from "@/lib/monitoring/metrics";
import { refreshVitalsMetrics } from "@/lib/monitoring/vitals-exporter";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("metrics");

// Optional: Require authentication for metrics
const METRICS_AUTH_TOKEN = process.env.METRICS_AUTH_TOKEN;

/**
 * GET /api/metrics - Export Prometheus metrics
 */
export async function GET(request: NextRequest) {
  // Optional authentication
  if (METRICS_AUTH_TOKEN) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${METRICS_AUTH_TOKEN}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const format = request.nextUrl.searchParams.get("format");

  if (format === "json") {
    // Return JSON summary for debugging
    return NextResponse.json(getMetricsSummary());
  }

  // Refresh Web Vitals and Analytics metrics from database
  try {
    await refreshVitalsMetrics();
  } catch (error) {
    log.error("Failed to refresh vitals metrics", { error: error instanceof Error ? error.message : String(error) });
    // Continue with export even if vitals refresh fails
  }

  // Return Prometheus format
  const metrics = exportMetrics();

  return new NextResponse(metrics, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
