/**
 * Speed Insights Service
 * Collects and analyzes performance data beyond basic Web Vitals
 */

import { prisma } from "@/lib/prisma";

// Thresholds for Core Web Vitals (based on Google's recommendations)
export const VITALS_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 },
};

export interface SpeedInsightData {
  projectId: string;
  url: string;
  path: string;

  // Core Web Vitals
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  inp?: number;

  // Navigation Timing
  dnsLookupTime?: number;
  tcpConnectTime?: number;
  tlsHandshakeTime?: number;
  serverResponseTime?: number;
  domInteractive?: number;
  domComplete?: number;
  resourceLoadTime?: number;

  // Resource Breakdown
  jsExecutionTime?: number;
  cssParseTime?: number;
  imageLoadTime?: number;
  fontLoadTime?: number;
  thirdPartyTime?: number;

  // Context
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  connectionType?: string;

  // Session
  sessionId?: string;
  visitorId?: string;
}

/**
 * Record a speed insight
 */
export async function recordSpeedInsight(data: SpeedInsightData) {
  return prisma.speedInsight.create({
    data: {
      projectId: data.projectId,
      url: data.url,
      path: data.path,
      ttfb: data.ttfb,
      fcp: data.fcp,
      lcp: data.lcp,
      fid: data.fid,
      cls: data.cls,
      inp: data.inp,
      dnsLookupTime: data.dnsLookupTime,
      tcpConnectTime: data.tcpConnectTime,
      tlsHandshakeTime: data.tlsHandshakeTime,
      serverResponseTime: data.serverResponseTime,
      domInteractive: data.domInteractive,
      domComplete: data.domComplete,
      resourceLoadTime: data.resourceLoadTime,
      jsExecutionTime: data.jsExecutionTime,
      cssParseTime: data.cssParseTime,
      imageLoadTime: data.imageLoadTime,
      fontLoadTime: data.fontLoadTime,
      thirdPartyTime: data.thirdPartyTime,
      device: data.device,
      browser: data.browser,
      os: data.os,
      country: data.country,
      region: data.region,
      connectionType: data.connectionType,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
    },
  });
}

/**
 * Get speed insights summary for a project
 */
export async function getSpeedInsightsSummary(
  projectId: string,
  options?: {
    path?: string;
    device?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = {
    projectId,
    createdAt: {
      gte: options?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      lte: options?.endDate || new Date(),
    },
  };

  if (options?.path) {
    where.path = options.path;
  }

  if (options?.device) {
    where.device = options.device;
  }

  const insights = await prisma.speedInsight.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  if (insights.length === 0) {
    return null;
  }

  // Calculate percentiles for each metric
  const metrics = ["lcp", "fcp", "fid", "cls", "ttfb", "inp"] as const;
  const summary: Record<string, any> = {
    sampleCount: insights.length,
    metrics: {},
  };

  for (const metric of metrics) {
    const values = insights
      .map((i) => i[metric])
      .filter((v): v is number => v !== null && v !== undefined)
      .sort((a, b) => a - b);

    if (values.length > 0) {
      summary.metrics[metric] = {
        p50: percentile(values, 50),
        p75: percentile(values, 75),
        p90: percentile(values, 90),
        p99: percentile(values, 99),
        rating: getRating(metric, percentile(values, 75)),
        sampleCount: values.length,
      };
    }
  }

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  insights.forEach((i) => {
    if (i.device) {
      deviceCounts[i.device] = (deviceCounts[i.device] || 0) + 1;
    }
  });
  summary.deviceBreakdown = deviceCounts;

  // Country breakdown (top 10)
  const countryCounts: Record<string, number> = {};
  insights.forEach((i) => {
    if (i.country) {
      countryCounts[i.country] = (countryCounts[i.country] || 0) + 1;
    }
  });
  summary.countryBreakdown = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  return summary;
}

/**
 * Get performance breakdown by path
 */
export async function getPathPerformance(
  projectId: string,
  options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const insights = await prisma.speedInsight.findMany({
    where: {
      projectId,
      createdAt: {
        gte: options?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lte: options?.endDate || new Date(),
      },
    },
    select: {
      path: true,
      lcp: true,
      fcp: true,
      cls: true,
      ttfb: true,
    },
  });

  // Group by path
  const pathGroups: Record<string, number[][]> = {};

  insights.forEach((i) => {
    if (!pathGroups[i.path]) {
      pathGroups[i.path] = [[], [], [], []]; // lcp, fcp, cls, ttfb
    }
    if (i.lcp) pathGroups[i.path][0].push(i.lcp);
    if (i.fcp) pathGroups[i.path][1].push(i.fcp);
    if (i.cls) pathGroups[i.path][2].push(i.cls);
    if (i.ttfb) pathGroups[i.path][3].push(i.ttfb);
  });

  // Calculate metrics for each path
  const results = Object.entries(pathGroups)
    .map(([path, [lcp, fcp, cls, ttfb]]) => ({
      path,
      views: lcp.length || fcp.length || 1,
      lcp: lcp.length > 0 ? { p75: percentile(lcp.sort((a, b) => a - b), 75), rating: getRating("lcp", percentile(lcp.sort((a, b) => a - b), 75)) } : null,
      fcp: fcp.length > 0 ? { p75: percentile(fcp.sort((a, b) => a - b), 75), rating: getRating("fcp", percentile(fcp.sort((a, b) => a - b), 75)) } : null,
      cls: cls.length > 0 ? { p75: percentile(cls.sort((a, b) => a - b), 75), rating: getRating("cls", percentile(cls.sort((a, b) => a - b), 75)) } : null,
      ttfb: ttfb.length > 0 ? { p75: percentile(ttfb.sort((a, b) => a - b), 75), rating: getRating("ttfb", percentile(ttfb.sort((a, b) => a - b), 75)) } : null,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, options?.limit || 20);

  return results;
}

/**
 * Get resource timing breakdown
 */
export async function getResourceBreakdown(
  projectId: string,
  options?: {
    path?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = {
    projectId,
    createdAt: {
      gte: options?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      lte: options?.endDate || new Date(),
    },
  };

  if (options?.path) {
    where.path = options.path;
  }

  const insights = await prisma.speedInsight.findMany({
    where,
    select: {
      jsExecutionTime: true,
      cssParseTime: true,
      imageLoadTime: true,
      fontLoadTime: true,
      thirdPartyTime: true,
    },
  });

  const resources = ["jsExecutionTime", "cssParseTime", "imageLoadTime", "fontLoadTime", "thirdPartyTime"] as const;
  const breakdown: Record<string, { avg: number; p75: number; total: number }> = {};

  for (const resource of resources) {
    const values = insights
      .map((i) => i[resource])
      .filter((v): v is number => v !== null && v !== undefined)
      .sort((a, b) => a - b);

    if (values.length > 0) {
      breakdown[resource] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p75: percentile(values, 75),
        total: values.reduce((a, b) => a + b, 0),
      };
    }
  }

  return breakdown;
}

/**
 * Calculate percentile
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Get rating for a metric value
 */
function getRating(
  metric: keyof typeof VITALS_THRESHOLDS,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = VITALS_THRESHOLDS[metric];
  if (!thresholds) return "good";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needs-improvement";
  return "poor";
}
