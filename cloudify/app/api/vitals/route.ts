import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("vitals");

// GET /api/vitals - Get web vitals data
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const range = searchParams.get("range") || "7d";
    const url = searchParams.get("url");

    if (!projectId) {
      return fail("VALIDATION_MISSING_FIELD", "Project ID is required", 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const where: {
      projectId: string;
      createdAt: { gte: Date };
      url?: string;
    } = {
      projectId,
      createdAt: { gte: startDate },
    };

    if (url) {
      where.url = url;
    }

    // Get vitals grouped by metric
    const vitals = await prisma.webVital.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Calculate averages and distributions
    const metrics = ["LCP", "FID", "CLS", "TTFB", "FCP", "INP"];
    const summary: Record<string, {
      avg: number;
      p75: number;
      good: number;
      needsImprovement: number;
      poor: number;
    }> = {};

    for (const metric of metrics) {
      const metricVitals = vitals.filter((v) => v.metric === metric);
      if (metricVitals.length === 0) continue;

      const values = metricVitals.map((v) => v.value).sort((a, b) => a - b);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const p75Index = Math.floor(values.length * 0.75);
      const p75 = values[p75Index] || 0;

      const good = metricVitals.filter((v) => v.rating === "good").length;
      const needsImprovement = metricVitals.filter(
        (v) => v.rating === "needs-improvement"
      ).length;
      const poor = metricVitals.filter((v) => v.rating === "poor").length;

      summary[metric] = {
        avg: Math.round(avg * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        good,
        needsImprovement,
        poor,
      };
    }

    // Get top slowest pages
    const slowestPages = await prisma.webVital.groupBy({
      by: ["url"],
      where: { ...where, metric: "LCP" },
      _avg: { value: true },
      orderBy: { _avg: { value: "desc" } },
      take: 10,
    });

    // Get device breakdown
    const deviceBreakdown = await prisma.webVital.groupBy({
      by: ["device"],
      where,
      _count: { id: true },
    });

    return ok({
      range,
      summary,
      slowestPages: slowestPages.map((p) => ({
        url: p.url,
        avgLCP: Math.round((p._avg.value || 0) * 100) / 100,
      })),
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.device || "unknown",
        count: d._count.id,
      })),
      totalMeasurements: vitals.length,
    });
  } catch (error) {
    log.error("Failed to fetch vitals", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch vitals", 500);
  }
}

// POST /api/vitals - Record a web vital
export async function POST(request: NextRequest) {
  try {
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, url, metric, value, rating, device, browser, country } = body;

    if (!projectId || !url || !metric || value === undefined) {
      return fail("VALIDATION_MISSING_FIELD", "Missing required fields", 400);
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Calculate rating if not provided
    const calculatedRating = rating || calculateRating(metric, value);

    await prisma.webVital.create({
      data: {
        projectId,
        url,
        metric,
        value,
        rating: calculatedRating,
        device,
        browser,
        country,
      },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to record vital", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to record vital", 500);
  }
}

// Calculate rating based on metric thresholds
function calculateRating(metric: string, value: number): string {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    FCP: { good: 1800, poor: 3000 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return "unknown";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}
