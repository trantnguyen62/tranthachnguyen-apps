/**
 * Health Check API
 * Provides health status for monitoring and load balancers
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisHealthCheck } from "@/lib/storage/redis-client";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
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
    checks.database = {
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
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
    checks.redis = {
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown error",
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

  const response: HealthStatus = {
    status,
    timestamp,
    version,
    uptime,
    checks,
  };

  return NextResponse.json(response, { status: httpStatus });
}
