/**
 * Web Vitals Metrics Exporter
 * Queries database and updates Prometheus gauges for Web Vitals and Analytics
 */

import { prisma } from "@/lib/prisma";
import {
  webVitalsLCP,
  webVitalsFID,
  webVitalsCLS,
  webVitalsTTFB,
  webVitalsFCP,
  webVitalsINP,
  analyticsActiveVisitors,
  analyticsPageviewsPerMinute,
  analyticsUniqueVisitorsDaily,
} from "./metrics";

// Map metric names to gauges
const VITALS_GAUGE_MAP = {
  LCP: webVitalsLCP,
  FID: webVitalsFID,
  CLS: webVitalsCLS,
  TTFB: webVitalsTTFB,
  FCP: webVitalsFCP,
  INP: webVitalsINP,
} as const;

const METRICS = ["LCP", "FID", "CLS", "TTFB", "FCP", "INP"] as const;

/**
 * Refresh Web Vitals and Analytics metrics from the database
 * Called before each metrics export to ensure fresh data
 */
export async function refreshVitalsMetrics(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get all active projects
  const projects = await prisma.project.findMany({
    select: { id: true, slug: true },
  });

  for (const project of projects) {
    const labels = { project: project.slug };

    // Web Vitals p75 for each metric type
    for (const metric of METRICS) {
      const vitals = await prisma.webVital.findMany({
        where: {
          projectId: project.id,
          metric,
          createdAt: { gte: oneHourAgo },
        },
        select: { value: true },
        orderBy: { value: "asc" },
      });

      if (vitals.length > 0) {
        // Calculate 75th percentile
        const p75Index = Math.floor(vitals.length * 0.75);
        const p75Value = vitals[p75Index]?.value ?? 0;
        VITALS_GAUGE_MAP[metric].set(p75Value, labels);
      }
    }

    // Active visitors (unique sessions in last 5 minutes)
    const activeSessions = await prisma.analyticsEvent.groupBy({
      by: ["sessionId"],
      where: {
        projectId: project.id,
        createdAt: { gte: fiveMinutesAgo },
        sessionId: { not: null },
      },
    });
    analyticsActiveVisitors.set(activeSessions.length, labels);

    // Pageviews per minute
    const pageviewCount = await prisma.analyticsEvent.count({
      where: {
        projectId: project.id,
        type: "pageview",
        createdAt: { gte: oneMinuteAgo },
      },
    });
    analyticsPageviewsPerMinute.set(pageviewCount, labels);

    // Unique visitors today
    const uniqueVisitors = await prisma.analyticsEvent.groupBy({
      by: ["visitorId"],
      where: {
        projectId: project.id,
        createdAt: { gte: todayStart },
        visitorId: { not: null },
      },
    });
    analyticsUniqueVisitorsDaily.set(uniqueVisitors.length, labels);
  }
}
