/**
 * Health Check API
 * Provides health status for monitoring and load balancers
 */

import { prisma } from "@/lib/prisma";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("health");
import { redisHealthCheck } from "@/lib/storage/redis-client";
import { healthCheck as minioHealthCheck } from "@/lib/build/artifact-manager";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    minio: CheckResult;
    buildPipeline: CheckResult;
  };
}

interface CheckResult {
  status: "pass" | "fail";
  latency?: number;
  error?: string;
}

const startTime = Date.now();

/**
 * GET /api/health - Health check endpoint
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || "1.0.0";
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const checks: HealthStatus["checks"] = {
    database: { status: "fail" },
    redis: { status: "fail" },
    minio: { status: "fail" },
    buildPipeline: { status: "fail" },
  };

  // Check database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "pass",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    log.error("Database check failed", { error: error instanceof Error ? error.message : String(error) });
    checks.database = {
      status: "fail",
      error: "Database check failed",
    };
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    const redisOk = await redisHealthCheck();
    checks.redis = {
      status: redisOk ? "pass" : "fail",
      latency: Date.now() - redisStart,
    };
  } catch (error) {
    log.error("Redis check failed", { error: error instanceof Error ? error.message : String(error) });
    checks.redis = {
      status: "fail",
      error: "Redis check failed",
    };
  }

  // Check MinIO
  const minioStart = Date.now();
  try {
    const minioOk = await minioHealthCheck();
    checks.minio = {
      status: minioOk ? "pass" : "fail",
      latency: Date.now() - minioStart,
    };
  } catch (error) {
    log.error("MinIO check failed", { error: error instanceof Error ? error.message : String(error) });
    checks.minio = {
      status: "fail",
      error: "MinIO check failed",
    };
  }

  // Check Build Pipeline
  const buildStart = Date.now();
  try {
    let pipelineErrors = 0;

    // Check /data/builds is writable
    const buildsDir = process.env.BUILDS_DIR || "/data/builds";
    const reposDir = process.env.REPOS_DIR || "/data/repos";

    try {
      await fs.access(buildsDir, fs.constants.W_OK);
    } catch {
      pipelineErrors++;
    }

    try {
      await fs.access(reposDir, fs.constants.W_OK);
    } catch {
      pipelineErrors++;
    }

    // Check git is available
    try {
      await execAsync("git --version");
    } catch {
      pipelineErrors++;
    }

    // Check node is available
    try {
      const { stdout } = await execAsync("node --version");
      const nodeVersion = stdout.trim();
      if (!nodeVersion.startsWith("v")) {
        pipelineErrors++;
      }
    } catch {
      pipelineErrors++;
    }

    checks.buildPipeline = {
      status: pipelineErrors === 0 ? "pass" : "fail",
      latency: Date.now() - buildStart,
      ...(pipelineErrors > 0 && { error: "Build pipeline check failed" }),
    };
  } catch (error) {
    log.error("Build pipeline check failed", { error: error instanceof Error ? error.message : String(error) });
    checks.buildPipeline = {
      status: "fail",
      error: "Build pipeline check failed",
    };
  }

  // Determine overall status
  const allPassing = Object.values(checks).every((c) => c.status === "pass");
  const anyPassing = Object.values(checks).some((c) => c.status === "pass");

  let status: HealthStatus["status"] = "healthy";
  let httpStatus = 200;

  if (!allPassing && anyPassing) {
    status = "degraded";
    httpStatus = 200; // Still return 200 for degraded
  } else if (!anyPassing) {
    status = "unhealthy";
    httpStatus = 503;
  }

  const healthData: HealthStatus = {
    status,
    timestamp,
    version,
    uptime,
    checks,
  };

  if (httpStatus === 503) {
    return fail("SERVICE_UNAVAILABLE", "System unhealthy", 503, healthData);
  }

  return ok(healthData);
}
