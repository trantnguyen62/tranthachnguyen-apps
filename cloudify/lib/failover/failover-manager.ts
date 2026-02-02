/**
 * Failover Manager
 * Orchestrates failover between regions
 */

import { prisma } from "@/lib/prisma";
import { getBestFailoverTarget, shouldTriggerFailover } from "./health-monitor";
import { updateDNSRecords, getDNSStatus } from "./dns-manager";

export interface FailoverResult {
  success: boolean;
  eventId: string;
  fromRegion: string;
  toRegion: string;
  duration: number;
  projectsAffected: number;
  deploymentsAffected: number;
  error?: string;
}

export interface FailoverStatus {
  inProgress: boolean;
  currentEvent?: {
    id: string;
    fromRegion: string;
    toRegion: string;
    status: string;
    startedAt: Date;
    progress: number;
  };
}

/**
 * Trigger automatic failover if conditions are met
 */
export async function checkAndTriggerFailover(regionId: string): Promise<FailoverResult | null> {
  const check = await shouldTriggerFailover(regionId);

  if (!check.shouldFailover) {
    return null;
  }

  const targetRegionId = await getBestFailoverTarget(regionId);

  if (!targetRegionId) {
    console.error(`No healthy failover target available for region ${regionId}`);
    return null;
  }

  return executeFailover(regionId, targetRegionId, "health_check_failed", "system");
}

/**
 * Execute a failover from one region to another
 */
export async function executeFailover(
  fromRegionId: string,
  toRegionId: string,
  reason: string,
  triggeredBy: string
): Promise<FailoverResult> {
  const startTime = Date.now();

  // Get region info
  const [fromRegion, toRegion] = await Promise.all([
    prisma.region.findUnique({ where: { id: fromRegionId } }),
    prisma.region.findUnique({ where: { id: toRegionId } }),
  ]);

  if (!fromRegion || !toRegion) {
    throw new Error("Invalid region IDs");
  }

  // Check for existing in-progress failover
  const existingFailover = await prisma.failoverEvent.findFirst({
    where: {
      status: { in: ["pending", "in_progress"] },
    },
  });

  if (existingFailover) {
    throw new Error(`Failover already in progress: ${existingFailover.id}`);
  }

  // Create failover event
  const event = await prisma.failoverEvent.create({
    data: {
      fromRegionId,
      toRegionId,
      reason,
      triggeredBy,
      status: "in_progress",
    },
  });

  try {
    // Step 1: Mark source region as unhealthy
    await prisma.region.update({
      where: { id: fromRegionId },
      data: { status: "unhealthy", isPrimary: false },
    });

    // Step 2: Count affected resources
    const projectsAffected = await countAffectedProjects(fromRegionId);
    const deploymentsAffected = await countAffectedDeployments(fromRegionId);

    await prisma.failoverEvent.update({
      where: { id: event.id },
      data: { projectsAffected, deploymentsAffected },
    });

    // Step 3: Update DNS records
    await updateDNSRecords(fromRegion.name, toRegion.name);

    // Step 4: Promote target region to primary
    await prisma.region.update({
      where: { id: toRegionId },
      data: { isPrimary: true },
    });

    // Step 5: Verify DNS propagation
    const dnsReady = await waitForDNSPropagation(toRegion.name, 30000);
    if (!dnsReady) {
      console.warn("DNS propagation not confirmed within timeout");
    }

    // Complete failover
    const duration = Date.now() - startTime;
    await prisma.failoverEvent.update({
      where: { id: event.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        duration,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: triggeredBy === "system" ? "system" : triggeredBy,
        type: "failover",
        action: "failover.completed",
        description: `Failover from ${fromRegion.name} to ${toRegion.name} completed`,
        metadata: {
          eventId: event.id,
          fromRegion: fromRegion.name,
          toRegion: toRegion.name,
          reason,
          duration,
        },
      },
    });

    return {
      success: true,
      eventId: event.id,
      fromRegion: fromRegion.name,
      toRegion: toRegion.name,
      duration,
      projectsAffected,
      deploymentsAffected,
    };
  } catch (error) {
    // Mark failover as failed
    await prisma.failoverEvent.update({
      where: { id: event.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    // Try to restore source region status
    await prisma.region.update({
      where: { id: fromRegionId },
      data: { status: "degraded" },
    });

    throw error;
  }
}

/**
 * Rollback a failover
 */
export async function rollbackFailover(eventId: string): Promise<FailoverResult> {
  const event = await prisma.failoverEvent.findUnique({
    where: { id: eventId },
    include: {
      fromRegion: true,
      toRegion: true,
    },
  });

  if (!event) {
    throw new Error("Failover event not found");
  }

  if (event.status !== "completed") {
    throw new Error("Can only rollback completed failovers");
  }

  // Execute reverse failover
  return executeFailover(
    event.toRegionId,
    event.fromRegionId,
    "rollback",
    "system"
  );
}

/**
 * Get current failover status
 */
export async function getFailoverStatus(): Promise<FailoverStatus> {
  const activeEvent = await prisma.failoverEvent.findFirst({
    where: {
      status: { in: ["pending", "in_progress"] },
    },
    include: {
      fromRegion: true,
      toRegion: true,
    },
    orderBy: { startedAt: "desc" },
  });

  if (!activeEvent) {
    return { inProgress: false };
  }

  // Calculate progress (simplified)
  const progress = activeEvent.status === "in_progress" ? 50 : 0;

  return {
    inProgress: true,
    currentEvent: {
      id: activeEvent.id,
      fromRegion: activeEvent.fromRegion.name,
      toRegion: activeEvent.toRegion.name,
      status: activeEvent.status,
      startedAt: activeEvent.startedAt,
      progress,
    },
  };
}

/**
 * Count affected projects for a region
 */
async function countAffectedProjects(regionId: string): Promise<number> {
  // In a real implementation, this would query projects associated with the region
  // For now, return a placeholder
  return await prisma.project.count();
}

/**
 * Count affected deployments for a region
 */
async function countAffectedDeployments(regionId: string): Promise<number> {
  // In a real implementation, this would query active deployments in the region
  return await prisma.deployment.count({
    where: { status: "READY", isActive: true },
  });
}

/**
 * Wait for DNS propagation
 */
async function waitForDNSPropagation(regionName: string, timeout: number): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getDNSStatus(regionName);
    if (status.propagated) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false;
}

/**
 * Schedule maintenance failover
 */
export async function scheduleMaintenanceFailover(
  regionId: string,
  scheduledTime: Date,
  estimatedDuration: number
): Promise<{ scheduled: boolean; eventId?: string }> {
  const targetRegionId = await getBestFailoverTarget(regionId);

  if (!targetRegionId) {
    return { scheduled: false };
  }

  // Mark region for maintenance
  await prisma.region.update({
    where: { id: regionId },
    data: { status: "maintenance" },
  });

  // Create scheduled failover event
  const event = await prisma.failoverEvent.create({
    data: {
      fromRegionId: regionId,
      toRegionId: targetRegionId,
      reason: "scheduled_maintenance",
      triggeredBy: "system",
      status: "pending",
      metadata: {
        scheduledTime: scheduledTime.toISOString(),
        estimatedDuration,
      },
    },
  });

  return { scheduled: true, eventId: event.id };
}

/**
 * Get failover history
 */
export async function getFailoverHistory(limit: number = 50): Promise<any[]> {
  return prisma.failoverEvent.findMany({
    include: {
      fromRegion: {
        select: { name: true, displayName: true },
      },
      toRegion: {
        select: { name: true, displayName: true },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

/**
 * Cancel a pending failover
 */
export async function cancelFailover(eventId: string): Promise<boolean> {
  const event = await prisma.failoverEvent.findUnique({
    where: { id: eventId },
  });

  if (!event || event.status !== "pending") {
    return false;
  }

  await prisma.failoverEvent.update({
    where: { id: eventId },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  });

  return true;
}
