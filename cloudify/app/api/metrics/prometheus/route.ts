/**
 * Prometheus Metrics Endpoint
 * Exposes application metrics in Prometheus format for scraping
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisHealthCheck } from "@/lib/storage/redis-client";

const startTime = Date.now();

/**
 * GET /api/metrics/prometheus - Prometheus-compatible metrics endpoint
 */
export async function GET() {
  const timestamp = Date.now();
  const uptime = Math.floor((timestamp - startTime) / 1000);
  const memUsage = process.memoryUsage();

  const metrics: string[] = [];

  // Helper to add metric
  const addMetric = (name: string, value: number, help: string, type: string = "gauge", labels: Record<string, string> = {}) => {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    const labelPart = labelStr ? `{${labelStr}}` : "";

    metrics.push(`# HELP ${name} ${help}`);
    metrics.push(`# TYPE ${name} ${type}`);
    metrics.push(`${name}${labelPart} ${value}`);
  };

  // Application info
  addMetric(
    "cloudify_app_info",
    1,
    "Application information",
    "gauge",
    {
      version: process.env.npm_package_version || "1.0.0",
      node_version: process.version,
      environment: process.env.NODE_ENV || "development",
    }
  );

  // Uptime
  addMetric("cloudify_uptime_seconds", uptime, "Application uptime in seconds", "counter");

  // Memory metrics
  addMetric("cloudify_memory_heap_used_bytes", memUsage.heapUsed, "Heap memory used in bytes", "gauge");
  addMetric("cloudify_memory_heap_total_bytes", memUsage.heapTotal, "Total heap memory in bytes", "gauge");
  addMetric("cloudify_memory_external_bytes", memUsage.external, "External memory in bytes", "gauge");
  addMetric("cloudify_memory_rss_bytes", memUsage.rss, "Resident set size in bytes", "gauge");

  // Health checks
  let dbHealthy = 0;
  let dbLatency = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbHealthy = 1;
  } catch {
    dbHealthy = 0;
  }
  addMetric("cloudify_database_healthy", dbHealthy, "Database health status (1=healthy, 0=unhealthy)", "gauge");
  addMetric("cloudify_database_latency_ms", dbLatency, "Database query latency in milliseconds", "gauge");

  let redisHealthy = 0;
  let redisLatency = 0;
  try {
    const start = Date.now();
    const ok = await redisHealthCheck();
    redisLatency = Date.now() - start;
    redisHealthy = ok ? 1 : 0;
  } catch {
    redisHealthy = 0;
  }
  addMetric("cloudify_redis_healthy", redisHealthy, "Redis health status (1=healthy, 0=unhealthy)", "gauge");
  addMetric("cloudify_redis_latency_ms", redisLatency, "Redis query latency in milliseconds", "gauge");

  // Deployment metrics
  try {
    const [total, successful, failed, pending] = await Promise.all([
      prisma.deployment.count(),
      prisma.deployment.count({ where: { status: "READY" } }),
      prisma.deployment.count({ where: { status: "ERROR" } }),
      prisma.deployment.count({ where: { status: { in: ["QUEUED", "BUILDING", "DEPLOYING"] } } }),
    ]);

    addMetric("cloudify_deployments_total", total, "Total number of deployments", "counter");
    addMetric("cloudify_deployments_successful_total", successful, "Total successful deployments", "counter");
    addMetric("cloudify_deployments_failed_total", failed, "Total failed deployments", "counter");
    addMetric("cloudify_deployments_pending", pending, "Current pending deployments", "gauge");

    // Success rate
    const successRate = total > 0 ? (successful / total) * 100 : 100;
    addMetric("cloudify_deployments_success_rate", successRate, "Deployment success rate percentage", "gauge");
  } catch {
    // Skip deployment metrics if database is unavailable
  }

  // Project metrics
  try {
    const projectCount = await prisma.project.count();
    addMetric("cloudify_projects_total", projectCount, "Total number of projects", "gauge");
  } catch {
    // Skip if database unavailable
  }

  // User metrics
  try {
    const userCount = await prisma.user.count();
    addMetric("cloudify_users_total", userCount, "Total number of users", "gauge");
  } catch {
    // Skip if database unavailable
  }

  // Domain metrics
  try {
    const [totalDomains, verifiedDomains] = await Promise.all([
      prisma.domain.count(),
      prisma.domain.count({ where: { verified: true } }),
    ]);
    addMetric("cloudify_domains_total", totalDomains, "Total number of domains", "gauge");
    addMetric("cloudify_domains_verified", verifiedDomains, "Number of verified domains", "gauge");
  } catch {
    // Skip if database unavailable
  }

  // Function metrics
  try {
    const functionCount = await prisma.edgeFunction.count();
    addMetric("cloudify_functions_total", functionCount, "Total number of edge functions", "gauge");
  } catch {
    // Skip if database unavailable
  }

  // Overall health score (0-100)
  const healthScore = (dbHealthy + redisHealthy) * 50;
  addMetric("cloudify_health_score", healthScore, "Overall platform health score (0-100)", "gauge");

  // Return metrics in Prometheus text format
  return new NextResponse(metrics.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
