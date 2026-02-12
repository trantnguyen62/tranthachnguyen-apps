/**
 * Database Metrics API
 * GET - Return database metrics (container stats, storage usage)
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import {
  getDatabaseContainerStats,
  getContainerName,
  isContainerRunning,
} from "@/lib/database/docker-provisioner";
import {
  getK8sDatabaseMetrics,
  isK8sDatabaseRunning,
} from "@/lib/database/k8s-provisioner";

const log = getRouteLogger("databases/[id]/metrics");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/databases/[id]/metrics - Get database metrics
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Fetch the database record
    const database = await prisma.managedDatabase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
        metrics: {
          orderBy: { timestamp: "desc" },
          take: 24, // Last 24 data points
        },
      },
    });

    if (!database) {
      return fail("NOT_FOUND", "Database not found", 404);
    }

    // Verify ownership
    if (database.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    // For Cloudify-hosted databases, get live stats
    let containerStats = null;
    let containerRunning = false;
    const useK8sMode =
      process.env.USE_K3S_BUILDS === "true" ||
      process.env.K3S_ENABLED === "true";

    if (database.provider === "cloudify" && database.status === "ACTIVE") {
      try {
        if (useK8sMode) {
          // K8s mode: query pod metrics
          containerRunning = await isK8sDatabaseRunning(id);

          if (containerRunning) {
            const k8sMetrics = await getK8sDatabaseMetrics(id);
            const memoryPercent =
              k8sMetrics.memoryLimitMB > 0
                ? (k8sMetrics.memoryUsageMB / k8sMetrics.memoryLimitMB) * 100
                : 0;

            containerStats = {
              cpuPercent: k8sMetrics.cpuPercent,
              memoryUsageMB:
                Math.round(k8sMetrics.memoryUsageMB * 100) / 100,
              memoryLimitMB:
                Math.round(k8sMetrics.memoryLimitMB * 100) / 100,
              memoryPercent: Math.round(memoryPercent * 100) / 100,
              podStatus: k8sMetrics.podStatus,
              restarts: k8sMetrics.restarts,
            };

            await prisma.databaseMetric.create({
              data: {
                databaseId: id,
                queryCount: 0,
                avgQueryTime: 0,
                slowQueries: 0,
                cpuUsage: k8sMetrics.cpuPercent,
                memoryUsage: memoryPercent,
                storageUsage: 0,
                connections: database.connectionsActive,
              },
            });
          }
        } else {
          // Docker mode: query container stats
          const containerName = getContainerName(id);
          containerRunning = await isContainerRunning(containerName);

          if (containerRunning) {
            const stats = await getDatabaseContainerStats(containerName);
            containerStats = {
              cpuPercent: stats.cpuPercent,
              memoryUsageMB:
                Math.round(stats.memoryUsageMB * 100) / 100,
              memoryLimitMB:
                Math.round(stats.memoryLimitMB * 100) / 100,
              memoryPercent: stats.memoryPercent,
              networkInputMB:
                Math.round(stats.networkInputMB * 100) / 100,
              networkOutputMB:
                Math.round(stats.networkOutputMB * 100) / 100,
              blockInputMB:
                Math.round(stats.blockInputMB * 100) / 100,
              blockOutputMB:
                Math.round(stats.blockOutputMB * 100) / 100,
            };

            await prisma.databaseMetric.create({
              data: {
                databaseId: id,
                queryCount: 0,
                avgQueryTime: 0,
                slowQueries: 0,
                cpuUsage: stats.cpuPercent,
                memoryUsage: stats.memoryPercent,
                storageUsage: stats.blockInputMB + stats.blockOutputMB,
                connections: database.connectionsActive,
              },
            });
          }
        }
      } catch (error) {
        log.warn("Failed to get database stats", {
          databaseId: id,
          mode: useK8sMode ? "k8s" : "docker",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return ok({
      metrics: {
        databaseId: id,
        type: database.type,
        provider: database.provider,
        status: database.status,
        containerRunning,

        // Resource usage
        storageUsed: database.storageUsed,
        storageLimit: database.storageLimit,
        connectionsActive: database.connectionsActive,
        connectionLimit: database.connectionLimit,
        queriesTotal: database.queriesTotal.toString(),

        // Live container stats (Cloudify-hosted only)
        container: containerStats,

        // Historical metrics
        history: database.metrics.map((m) => ({
          timestamp: m.timestamp,
          queryCount: m.queryCount,
          avgQueryTime: m.avgQueryTime,
          slowQueries: m.slowQueries,
          cpuUsage: m.cpuUsage,
          memoryUsage: m.memoryUsage,
          storageUsage: m.storageUsage,
          connections: m.connections,
        })),
      },
    });
  } catch (error) {
    log.error("Failed to fetch database metrics", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("INTERNAL_ERROR", "Failed to fetch database metrics", 500);
  }
}
