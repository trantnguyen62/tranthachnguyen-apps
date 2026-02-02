/**
 * Health Monitor
 * Orchestrates health checks across all regions
 */

import { prisma } from "@/lib/prisma";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy" | "timeout";
  latency: number;
  checks: {
    api: "ok" | "error" | "timeout";
    database: "ok" | "error" | "timeout";
    storage: "ok" | "error" | "timeout";
    redis: "ok" | "error" | "timeout";
  };
  error?: string;
  errorType?: string;
}

export interface RegionHealth {
  regionId: string;
  regionName: string;
  status: string;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

// Health check configuration
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const UNHEALTHY_THRESHOLD = 3; // 3 consecutive failures
const DEGRADED_THRESHOLD = 1; // 1 failure

/**
 * Perform a health check on a single region
 */
export async function checkRegionHealth(regionId: string): Promise<HealthCheckResult> {
  const startTime = Date.now();

  const region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    throw new Error("Region not found");
  }

  const checks: HealthCheckResult["checks"] = {
    api: "error",
    database: "error",
    storage: "error",
    redis: "error",
  };

  let overallStatus: HealthCheckResult["status"] = "healthy";
  let error: string | undefined;
  let errorType: string | undefined;

  try {
    // Check API endpoint
    const apiResult = await checkEndpoint(`${region.endpoint}/health`, HEALTH_CHECK_TIMEOUT);
    checks.api = apiResult.status;
    if (apiResult.error) {
      error = apiResult.error;
      errorType = apiResult.errorType;
    }

    // Check database connectivity
    const dbResult = await checkEndpoint(`${region.endpoint}/health/db`, HEALTH_CHECK_TIMEOUT);
    checks.database = dbResult.status;

    // Check storage (MinIO)
    const storageResult = await checkEndpoint(`${region.endpoint}/health/storage`, HEALTH_CHECK_TIMEOUT);
    checks.storage = storageResult.status;

    // Check Redis
    const redisResult = await checkEndpoint(`${region.endpoint}/health/redis`, HEALTH_CHECK_TIMEOUT);
    checks.redis = redisResult.status;

    // Determine overall status
    const failedChecks = Object.values(checks).filter((c) => c !== "ok").length;
    if (failedChecks === 0) {
      overallStatus = "healthy";
    } else if (failedChecks <= 1) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }
  } catch (err) {
    overallStatus = "timeout";
    error = err instanceof Error ? err.message : "Unknown error";
    errorType = "connection";
  }

  const latency = Date.now() - startTime;

  // Record health check
  await prisma.regionHealthCheck.create({
    data: {
      regionId,
      status: overallStatus,
      latency,
      checks,
      error,
      errorType,
    },
  });

  // Update region status
  await updateRegionStatus(regionId, overallStatus);

  return {
    status: overallStatus,
    latency,
    checks,
    error,
    errorType,
  };
}

/**
 * Check a single endpoint
 */
async function checkEndpoint(
  url: string,
  timeout: number
): Promise<{ status: "ok" | "error" | "timeout"; error?: string; errorType?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Cloudify-HealthCheck/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { status: "ok" };
    }

    return {
      status: "error",
      error: `HTTP ${response.status}`,
      errorType: "http",
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { status: "timeout", error: "Request timeout", errorType: "timeout" };
      }
      if (err.message.includes("ECONNREFUSED")) {
        return { status: "error", error: "Connection refused", errorType: "connection" };
      }
      if (err.message.includes("ENOTFOUND")) {
        return { status: "error", error: "DNS resolution failed", errorType: "dns" };
      }
      if (err.message.includes("certificate")) {
        return { status: "error", error: "SSL certificate error", errorType: "ssl" };
      }
    }

    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
      errorType: "unknown",
    };
  }
}

/**
 * Update region status based on recent health checks
 */
async function updateRegionStatus(regionId: string, latestStatus: string): Promise<void> {
  // Get recent health checks
  const recentChecks = await prisma.regionHealthCheck.findMany({
    where: { regionId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Count failures
  const failures = recentChecks.filter((c) => c.status !== "healthy").length;

  let newStatus: string;
  if (failures >= UNHEALTHY_THRESHOLD) {
    newStatus = "unhealthy";
  } else if (failures >= DEGRADED_THRESHOLD) {
    newStatus = "degraded";
  } else {
    newStatus = "healthy";
  }

  await prisma.region.update({
    where: { id: regionId },
    data: {
      status: newStatus,
      lastHealthCheck: new Date(),
    },
  });
}

/**
 * Run health checks on all active regions
 */
export async function runAllHealthChecks(): Promise<RegionHealth[]> {
  const regions = await prisma.region.findMany({
    where: {
      status: { not: "maintenance" },
    },
  });

  const results: RegionHealth[] = [];

  // Run health checks in parallel with concurrency limit
  const CONCURRENCY = 5;
  for (let i = 0; i < regions.length; i += CONCURRENCY) {
    const batch = regions.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (region) => {
        try {
          const result = await checkRegionHealth(region.id);
          return {
            regionId: region.id,
            regionName: region.name,
            status: result.status,
            latency: result.latency,
            lastCheck: new Date(),
            consecutiveFailures: result.status !== "healthy" ? 1 : 0,
          };
        } catch (error) {
          return {
            regionId: region.id,
            regionName: region.name,
            status: "error",
            latency: -1,
            lastCheck: new Date(),
            consecutiveFailures: 1,
          };
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Get health status for all regions
 */
export async function getAllRegionHealth(): Promise<RegionHealth[]> {
  const regions = await prisma.region.findMany({
    include: {
      healthChecks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return regions.map((region) => {
    const lastCheck = region.healthChecks[0];
    return {
      regionId: region.id,
      regionName: region.name,
      status: region.status,
      latency: lastCheck?.latency || 0,
      lastCheck: region.lastHealthCheck || region.createdAt,
      consecutiveFailures: 0, // Would need to calculate from recent checks
    };
  });
}

/**
 * Check if a region should trigger failover
 */
export async function shouldTriggerFailover(regionId: string): Promise<{
  shouldFailover: boolean;
  reason?: string;
}> {
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    include: {
      healthChecks: {
        orderBy: { createdAt: "desc" },
        take: UNHEALTHY_THRESHOLD,
      },
    },
  });

  if (!region) {
    return { shouldFailover: false };
  }

  // Don't failover from non-primary regions
  if (!region.isPrimary) {
    return { shouldFailover: false };
  }

  // Check consecutive failures
  const consecutiveFailures = region.healthChecks.filter(
    (c) => c.status === "unhealthy" || c.status === "timeout"
  ).length;

  if (consecutiveFailures >= UNHEALTHY_THRESHOLD) {
    return {
      shouldFailover: true,
      reason: `${consecutiveFailures} consecutive health check failures`,
    };
  }

  return { shouldFailover: false };
}

/**
 * Get the best failover target region
 */
export async function getBestFailoverTarget(excludeRegionId: string): Promise<string | null> {
  const regions = await prisma.region.findMany({
    where: {
      id: { not: excludeRegionId },
      status: "healthy",
    },
    orderBy: [
      { priority: "asc" },
      { activeDeployments: "asc" },
    ],
  });

  if (regions.length === 0) {
    return null;
  }

  // Return the region with highest priority (lowest number) and least load
  return regions[0].id;
}

/**
 * Clean up old health check records
 */
export async function cleanupOldHealthChecks(retentionDays: number = 7): Promise<number> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await prisma.regionHealthCheck.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}
