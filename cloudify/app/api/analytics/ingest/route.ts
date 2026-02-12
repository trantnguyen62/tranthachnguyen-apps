/**
 * Analytics Ingestion API
 * High-volume endpoint for collecting analytics events from deployed sites
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVitalRating } from "@/lib/analytics/sdk-source";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("analytics/ingest");

interface AnalyticsEvent {
  projectId: string;
  type: "pageview" | "event" | "vitals" | "identify";
  path?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  os?: string;
  sessionId?: string;
  visitorId?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

interface IngestPayload {
  events: AnalyticsEvent[];
}

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // Max events per minute per IP

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

/**
 * POST /api/analytics/ingest - Ingest analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIP(request);

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return fail("RATE_LIMITED", "Rate limit exceeded", 429);
    }

    const parseResult = await parseJsonBody<IngestPayload>(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return fail("BAD_REQUEST", "No events provided", 400);
    }

    // Limit batch size
    if (events.length > 50) {
      return fail("BAD_REQUEST", "Too many events in batch (max 50)", 400);
    }

    // Get valid project IDs
    const projectIds = [...new Set(events.map((e) => e.projectId))];
    const validProjects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true },
    });
    const validProjectIds = new Set(validProjects.map((p) => p.id));

    // Process events
    const analyticsEvents: Prisma.AnalyticsEventCreateManyInput[] = [];

    const webVitals: Prisma.WebVitalCreateManyInput[] = [];

    for (const event of events) {
      // Skip events for invalid projects
      if (!validProjectIds.has(event.projectId)) {
        continue;
      }

      if (event.type === "vitals" && event.data) {
        // Handle Web Vitals
        const vitalsData = event.data as Record<string, number>;
        const url = event.path || "/";

        for (const [metric, value] of Object.entries(vitalsData)) {
          if (typeof value === "number") {
            const rating = getVitalRating(
              metric as "LCP" | "FID" | "CLS" | "FCP" | "TTFB" | "INP",
              value
            );
            webVitals.push({
              projectId: event.projectId,
              url,
              metric,
              value,
              rating,
              device: event.device || null,
              browser: event.browser || null,
            });
          }
        }
      } else {
        // Handle regular analytics events
        analyticsEvents.push({
          projectId: event.projectId,
          type: event.type,
          path: event.path || null,
          referrer: event.referrer || null,
          device: event.device || null,
          browser: event.browser || null,
          os: event.os || null,
          eventName:
            event.type === "event"
              ? (event.data?.eventName as string) || null
              : null,
          eventData: (event.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          sessionId: event.sessionId || null,
          visitorId: event.visitorId || null,
        });
      }
    }

    // Batch insert analytics events
    if (analyticsEvents.length > 0) {
      await prisma.analyticsEvent.createMany({
        data: analyticsEvents,
      });
    }

    // Batch insert Web Vitals
    if (webVitals.length > 0) {
      await prisma.webVital.createMany({
        data: webVitals,
      });
    }

    return ok({
      success: true,
      processed: analyticsEvents.length + webVitals.length,
    });
  } catch (error) {
    log.error("Analytics ingest error", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to process events", 500);
  }
}

// Also support GET for beacon fallback (some browsers)
export async function GET() {
  return fail("BAD_REQUEST", "Use POST method", 405);
}

// Enable CORS for cross-origin requests from deployed sites
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
