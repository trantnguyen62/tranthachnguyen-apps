/**
 * Usage Metering
 * Track and aggregate usage metrics for billing
 */

import { prisma } from "@/lib/prisma";
import {
  PlanType,
  getPlanLimits,
  hasExceededLimit,
  getUsagePercentage,
  OVERAGE_PRICING,
  calculateOverage,
} from "./pricing";

export type UsageType =
  | "BUILD_MINUTES"
  | "BANDWIDTH"
  | "REQUESTS"
  | "FUNCTION_INVOCATIONS"
  | "BLOB_STORAGE"
  | "DEPLOYMENTS";

export interface UsageRecord {
  type: UsageType;
  value: number;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  buildMinutes: number;
  bandwidthBytes: number;
  requests: number;
  functionInvocations: number;
  blobStorageBytes: number;
  deployments: number;
}

export interface UsageWithLimits {
  usage: UsageSummary;
  limits: {
    buildMinutes: number;
    bandwidthGB: number;
    requests: number;
    functionInvocations: number;
    blobStorageGB: number;
    deployments: number;
  };
  percentages: {
    buildMinutes: number;
    bandwidth: number;
    requests: number;
    functionInvocations: number;
    blobStorage: number;
    deployments: number;
  };
  exceeded: {
    buildMinutes: boolean;
    bandwidth: boolean;
    requests: boolean;
    functionInvocations: boolean;
    blobStorage: boolean;
    deployments: boolean;
  };
}

// ============ Record Usage ============

/**
 * Record a usage event
 */
export async function recordUsage(
  userId: string,
  record: UsageRecord
): Promise<void> {
  await prisma.usageRecord.create({
    data: {
      userId,
      type: record.type,
      value: record.value,
      projectId: record.projectId,
      metadata: (record.metadata || {}) as object,
      recordedAt: new Date(),
    },
  });
}

/**
 * Record build minutes usage
 */
export async function recordBuildMinutes(
  userId: string,
  projectId: string,
  minutes: number,
  deploymentId?: string
): Promise<void> {
  await recordUsage(userId, {
    type: "BUILD_MINUTES",
    value: minutes,
    projectId,
    metadata: { deploymentId },
  });
}

/**
 * Record bandwidth usage
 */
export async function recordBandwidth(
  userId: string,
  projectId: string,
  bytes: number
): Promise<void> {
  await recordUsage(userId, {
    type: "BANDWIDTH",
    value: bytes,
    projectId,
  });
}

/**
 * Record request count
 */
export async function recordRequests(
  userId: string,
  projectId: string,
  count: number
): Promise<void> {
  await recordUsage(userId, {
    type: "REQUESTS",
    value: count,
    projectId,
  });
}

/**
 * Record function invocation
 */
export async function recordFunctionInvocation(
  userId: string,
  projectId: string,
  functionId: string,
  durationMs: number
): Promise<void> {
  await recordUsage(userId, {
    type: "FUNCTION_INVOCATIONS",
    value: 1,
    projectId,
    metadata: { functionId, durationMs },
  });
}

/**
 * Record deployment
 */
export async function recordDeployment(
  userId: string,
  projectId: string,
  deploymentId: string
): Promise<void> {
  await recordUsage(userId, {
    type: "DEPLOYMENTS",
    value: 1,
    projectId,
    metadata: { deploymentId },
  });
}

// ============ Get Usage ============

/**
 * Get usage summary for current billing period
 */
export async function getUsageSummary(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary> {
  // Default to current month
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const records = await prisma.usageRecord.groupBy({
    by: ["type"],
    where: {
      userId,
      recordedAt: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      value: true,
    },
  });

  const summary: UsageSummary = {
    buildMinutes: 0,
    bandwidthBytes: 0,
    requests: 0,
    functionInvocations: 0,
    blobStorageBytes: 0,
    deployments: 0,
  };

  for (const record of records) {
    const value = record._sum.value || 0;
    switch (record.type) {
      case "BUILD_MINUTES":
        summary.buildMinutes = value;
        break;
      case "BANDWIDTH":
        summary.bandwidthBytes = value;
        break;
      case "REQUESTS":
        summary.requests = value;
        break;
      case "FUNCTION_INVOCATIONS":
        summary.functionInvocations = value;
        break;
      case "BLOB_STORAGE":
        summary.blobStorageBytes = value;
        break;
      case "DEPLOYMENTS":
        summary.deployments = value;
        break;
    }
  }

  return summary;
}

/**
 * Get usage with limits comparison
 */
export async function getUsageWithLimits(
  userId: string,
  plan: PlanType
): Promise<UsageWithLimits> {
  const usage = await getUsageSummary(userId);
  const limits = getPlanLimits(plan);

  // Convert to comparable units
  const bandwidthGB = usage.bandwidthBytes / (1024 * 1024 * 1024);
  const blobStorageGB = usage.blobStorageBytes / (1024 * 1024 * 1024);

  return {
    usage,
    limits: {
      buildMinutes: limits.buildMinutesPerMonth,
      bandwidthGB: limits.bandwidthGB,
      requests: limits.requestsPerMonth,
      functionInvocations: limits.functionInvocationsPerMonth,
      blobStorageGB: limits.blobStorageGB,
      deployments: limits.deploymentsPerMonth,
    },
    percentages: {
      buildMinutes: getUsagePercentage(
        usage.buildMinutes,
        limits.buildMinutesPerMonth
      ),
      bandwidth: getUsagePercentage(bandwidthGB, limits.bandwidthGB),
      requests: getUsagePercentage(usage.requests, limits.requestsPerMonth),
      functionInvocations: getUsagePercentage(
        usage.functionInvocations,
        limits.functionInvocationsPerMonth
      ),
      blobStorage: getUsagePercentage(blobStorageGB, limits.blobStorageGB),
      deployments: getUsagePercentage(
        usage.deployments,
        limits.deploymentsPerMonth
      ),
    },
    exceeded: {
      buildMinutes: hasExceededLimit(
        usage.buildMinutes,
        limits.buildMinutesPerMonth
      ),
      bandwidth: hasExceededLimit(bandwidthGB, limits.bandwidthGB),
      requests: hasExceededLimit(usage.requests, limits.requestsPerMonth),
      functionInvocations: hasExceededLimit(
        usage.functionInvocations,
        limits.functionInvocationsPerMonth
      ),
      blobStorage: hasExceededLimit(blobStorageGB, limits.blobStorageGB),
      deployments: hasExceededLimit(
        usage.deployments,
        limits.deploymentsPerMonth
      ),
    },
  };
}

/**
 * Get usage for a specific project
 */
export async function getProjectUsage(
  projectId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary> {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const records = await prisma.usageRecord.groupBy({
    by: ["type"],
    where: {
      projectId,
      recordedAt: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      value: true,
    },
  });

  const summary: UsageSummary = {
    buildMinutes: 0,
    bandwidthBytes: 0,
    requests: 0,
    functionInvocations: 0,
    blobStorageBytes: 0,
    deployments: 0,
  };

  for (const record of records) {
    const value = record._sum.value || 0;
    switch (record.type) {
      case "BUILD_MINUTES":
        summary.buildMinutes = value;
        break;
      case "BANDWIDTH":
        summary.bandwidthBytes = value;
        break;
      case "REQUESTS":
        summary.requests = value;
        break;
      case "FUNCTION_INVOCATIONS":
        summary.functionInvocations = value;
        break;
      case "BLOB_STORAGE":
        summary.blobStorageBytes = value;
        break;
      case "DEPLOYMENTS":
        summary.deployments = value;
        break;
    }
  }

  return summary;
}

// ============ Check Limits ============

/**
 * Check if user can perform an action based on limits
 */
export async function checkLimit(
  userId: string,
  plan: PlanType,
  type: UsageType,
  additionalUsage: number = 1
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const usage = await getUsageSummary(userId);
  const limits = getPlanLimits(plan);

  let current: number;
  let limit: number;

  switch (type) {
    case "BUILD_MINUTES":
      current = usage.buildMinutes;
      limit = limits.buildMinutesPerMonth;
      break;
    case "BANDWIDTH":
      current = usage.bandwidthBytes / (1024 * 1024 * 1024);
      limit = limits.bandwidthGB;
      break;
    case "REQUESTS":
      current = usage.requests;
      limit = limits.requestsPerMonth;
      break;
    case "FUNCTION_INVOCATIONS":
      current = usage.functionInvocations;
      limit = limits.functionInvocationsPerMonth;
      break;
    case "BLOB_STORAGE":
      current = usage.blobStorageBytes / (1024 * 1024 * 1024);
      limit = limits.blobStorageGB;
      break;
    case "DEPLOYMENTS":
      current = usage.deployments;
      limit = limits.deploymentsPerMonth;
      break;
    default:
      return { allowed: true, current: 0, limit: -1, remaining: -1 };
  }

  // Unlimited
  if (limit === -1) {
    return { allowed: true, current, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - current);
  const allowed = current + additionalUsage <= limit;

  return { allowed, current, limit, remaining };
}

/**
 * Check if user can deploy
 */
export async function canDeploy(
  userId: string,
  plan: PlanType
): Promise<boolean> {
  const check = await checkLimit(userId, plan, "DEPLOYMENTS");
  return check.allowed;
}

/**
 * Check if user can run builds
 */
export async function canBuild(
  userId: string,
  plan: PlanType,
  estimatedMinutes: number = 5
): Promise<boolean> {
  const check = await checkLimit(userId, plan, "BUILD_MINUTES", estimatedMinutes);
  return check.allowed;
}

// ============ Overage Calculation ============

/**
 * Calculate total overage charges for billing period
 */
export async function calculateOverageCharges(
  userId: string,
  plan: PlanType
): Promise<{
  buildMinutes: number;
  bandwidth: number;
  functionInvocations: number;
  total: number;
}> {
  const usage = await getUsageSummary(userId);
  const limits = getPlanLimits(plan);

  const bandwidthGB = usage.bandwidthBytes / (1024 * 1024 * 1024);

  const buildMinutesOverage = calculateOverage(
    usage.buildMinutes,
    limits.buildMinutesPerMonth,
    OVERAGE_PRICING.buildMinutes
  );

  const bandwidthOverage = calculateOverage(
    bandwidthGB,
    limits.bandwidthGB,
    OVERAGE_PRICING.bandwidthGB
  );

  const invocationsOverage = calculateOverage(
    usage.functionInvocations,
    limits.functionInvocationsPerMonth,
    OVERAGE_PRICING.functionInvocations
  );

  return {
    buildMinutes: buildMinutesOverage,
    bandwidth: bandwidthOverage,
    functionInvocations: invocationsOverage,
    total: buildMinutesOverage + bandwidthOverage + invocationsOverage,
  };
}

// ============ Usage History ============

/**
 * Get daily usage breakdown
 */
export async function getDailyUsage(
  userId: string,
  type: UsageType,
  days: number = 30
): Promise<Array<{ date: string; value: number }>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      type,
      recordedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      value: true,
      recordedAt: true,
    },
    orderBy: {
      recordedAt: "asc",
    },
  });

  // Group by date
  const dailyMap = new Map<string, number>();

  for (const record of records) {
    const dateKey = record.recordedAt.toISOString().split("T")[0];
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + record.value);
  }

  // Fill in missing dates
  const result: Array<{ date: string; value: number }> = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split("T")[0];
    result.push({
      date: dateKey,
      value: dailyMap.get(dateKey) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Clean up old usage records (keep 90 days)
 */
export async function cleanupOldRecords(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const result = await prisma.usageRecord.deleteMany({
    where: {
      recordedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
