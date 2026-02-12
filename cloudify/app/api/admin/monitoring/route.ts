/**
 * Admin Monitoring API
 * Provides comprehensive system metrics and deployment status for the Cloudify platform
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess, isAuthError } from "@/lib/auth/api-auth";
import { redisHealthCheck, getRedisClient, set, get } from "@/lib/storage/redis-client";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("admin/monitoring");

interface SystemMetrics {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
  };
  deployments: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    recent: DeploymentInfo[];
  };
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsage: MemoryUsage;
  };
  cicd: {
    lastDeployment: string | null;
    lastCommit: string | null;
    branch: string | null;
    buildNumber: string | null;
  };
}

interface ServiceStatus {
  status: "operational" | "degraded" | "down";
  latency?: number;
  error?: string;
  lastChecked: string;
}

interface DeploymentInfo {
  id: string;
  projectName: string;
  status: string;
  createdAt: string;
  duration?: number;
  commit?: string;
}

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

const startTime = Date.now();

// Store deployment events in Redis
const DEPLOYMENT_KEY = "cloudify:platform:deployments";
const LAST_DEPLOY_KEY = "cloudify:platform:lastDeploy";

/**
 * GET /api/admin/monitoring - Get comprehensive system metrics
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdminAccess(request);
  if (isAuthError(authResult)) return authResult;

  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || process.env.APP_VERSION || "1.0.0";
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const environment = process.env.NODE_ENV || "development";

  const services: SystemMetrics["services"] = {
    api: { status: "operational", lastChecked: timestamp },
    database: { status: "down", lastChecked: timestamp },
    redis: { status: "down", lastChecked: timestamp },
    storage: { status: "operational", lastChecked: timestamp },
  };

  // Check database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = {
      status: "operational",
      latency: Date.now() - dbStart,
      lastChecked: timestamp,
    };
  } catch (error) {
    services.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
      lastChecked: timestamp,
    };
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    const redisOk = await redisHealthCheck();
    services.redis = {
      status: redisOk ? "operational" : "down",
      latency: Date.now() - redisStart,
      lastChecked: timestamp,
    };
  } catch (error) {
    services.redis = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
      lastChecked: timestamp,
    };
  }

  // Get deployment statistics
  let deploymentStats = {
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    recent: [] as DeploymentInfo[],
  };

  try {
    const [total, successful, failed, pending, recentDeployments] = await Promise.all([
      prisma.deployment.count(),
      prisma.deployment.count({ where: { status: "READY" } }),
      prisma.deployment.count({ where: { status: "ERROR" } }),
      prisma.deployment.count({ where: { status: { in: ["QUEUED", "BUILDING", "DEPLOYING"] } } }),
      prisma.deployment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { name: true } },
        },
      }),
    ]);

    deploymentStats = {
      total,
      successful,
      failed,
      pending,
      recent: recentDeployments.map((d) => ({
        id: d.id,
        projectName: d.project.name,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        duration: d.buildTime || undefined,
        commit: d.commitSha || undefined,
      })),
    };
  } catch (error) {
    log.error("Failed to fetch deployment stats", { error: error instanceof Error ? error.message : String(error) });
  }

  // Get CI/CD info from Redis or env
  let cicdInfo = {
    lastDeployment: null as string | null,
    lastCommit: process.env.COMMIT_SHA || null,
    branch: process.env.BRANCH || "main",
    buildNumber: process.env.BUILD_NUMBER || null,
  };

  try {
    const lastDeploy = await get<string>(LAST_DEPLOY_KEY);
    if (lastDeploy) {
      cicdInfo = { ...cicdInfo, ...JSON.parse(lastDeploy) };
    }
  } catch (error) {
    log.error("Failed to fetch CI/CD info", { error: error instanceof Error ? error.message : String(error) });
  }

  // Get memory usage
  const memUsage = process.memoryUsage();
  const memoryUsage: MemoryUsage = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
  };

  // Determine overall status
  const serviceStatuses = Object.values(services);
  const allOperational = serviceStatuses.every((s) => s.status === "operational");
  const anyDown = serviceStatuses.some((s) => s.status === "down");

  let status: SystemMetrics["status"] = "healthy";
  if (anyDown) {
    status = "unhealthy";
  } else if (!allOperational) {
    status = "degraded";
  }

  const response: SystemMetrics = {
    status,
    timestamp,
    version,
    uptime,
    environment,
    services,
    deployments: deploymentStats,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage,
    },
    cicd: cicdInfo,
  };

  return ok(response);
}

/**
 * POST /api/admin/monitoring - Record a platform deployment event
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess(request);
    if (isAuthError(authResult)) return authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { commit, branch, buildNumber, status, timestamp } = body;

    const deploymentEvent = {
      lastDeployment: timestamp || new Date().toISOString(),
      lastCommit: commit || null,
      branch: branch || "main",
      buildNumber: buildNumber || null,
      status: status || "success",
    };

    // Store the latest deployment info
    await set(LAST_DEPLOY_KEY, JSON.stringify(deploymentEvent));

    return ok({ success: true, deployment: deploymentEvent });
  } catch (error) {
    log.error("Failed to record deployment", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to record deployment", 500);
  }
}
