/**
 * Datadog Integration
 * Metrics, logs, and event forwarding to Datadog
 *
 * Provides:
 * - Custom metrics submission
 * - Log forwarding
 * - Event tracking
 * - Service checks
 */

// Configuration
const DATADOG_API_KEY = process.env.DATADOG_API_KEY;
const DATADOG_APP_KEY = process.env.DATADOG_APP_KEY;
const DATADOG_SITE = process.env.DATADOG_SITE || "datadoghq.com";
const APP_ENV = process.env.NODE_ENV || "development";
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

// Datadog API endpoints
const getApiUrl = () => `https://api.${DATADOG_SITE}`;

/**
 * Check if Datadog is configured
 */
export function isDatadogConfigured(): boolean {
  return !!DATADOG_API_KEY;
}

/**
 * Metric types supported by Datadog
 */
export type MetricType = "gauge" | "count" | "rate" | "histogram" | "distribution";

/**
 * Log levels for Datadog
 */
export type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

/**
 * Event priority levels
 */
export type EventPriority = "normal" | "low";

/**
 * Alert type for events
 */
export type AlertType = "info" | "warning" | "error" | "success";

/**
 * Metric point
 */
interface MetricPoint {
  timestamp?: number;
  value: number;
}

/**
 * Metric series for submission
 */
interface MetricSeries {
  metric: string;
  type?: MetricType;
  points: MetricPoint[];
  tags?: string[];
  host?: string;
  unit?: string;
}

/**
 * Log entry
 */
interface LogEntry {
  message: string;
  level?: LogLevel;
  service?: string;
  hostname?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

/**
 * Event payload
 */
interface EventPayload {
  title: string;
  text: string;
  date_happened?: number;
  priority?: EventPriority;
  host?: string;
  tags?: string[];
  alert_type?: AlertType;
  aggregation_key?: string;
  source_type_name?: string;
}

/**
 * Service check payload
 */
interface ServiceCheckPayload {
  check: string;
  host_name: string;
  status: 0 | 1 | 2 | 3; // 0=OK, 1=Warning, 2=Critical, 3=Unknown
  timestamp?: number;
  message?: string;
  tags?: string[];
}

/**
 * Default tags for all submissions
 */
function getDefaultTags(): string[] {
  return [
    `env:${APP_ENV}`,
    `service:cloudify`,
    `version:${APP_VERSION}`,
  ];
}

/**
 * Make authenticated request to Datadog API
 */
async function datadogRequest(
  endpoint: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<Response> {
  if (!DATADOG_API_KEY) {
    throw new Error("Datadog API key not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "DD-API-KEY": DATADOG_API_KEY,
  };

  if (DATADOG_APP_KEY) {
    headers["DD-APPLICATION-KEY"] = DATADOG_APP_KEY;
  }

  return fetch(`${getApiUrl()}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Submit metrics to Datadog
 */
export async function submitMetrics(series: MetricSeries[]): Promise<boolean> {
  if (!isDatadogConfigured()) {
    console.log("[Datadog] Not configured, skipping metrics submission");
    return false;
  }

  try {
    // Add default tags and timestamps
    const enrichedSeries = series.map((s) => ({
      ...s,
      tags: [...(s.tags || []), ...getDefaultTags()],
      points: s.points.map((p) => ({
        timestamp: p.timestamp || Math.floor(Date.now() / 1000),
        value: p.value,
      })),
    }));

    // Convert to Datadog API v2 format
    const payload = {
      series: enrichedSeries.map((s) => ({
        metric: s.metric,
        type: mapMetricType(s.type || "gauge"),
        points: s.points.map((p) => ({
          timestamp: p.timestamp,
          value: p.value,
        })),
        tags: s.tags,
        unit: s.unit,
      })),
    };

    const response = await datadogRequest("/api/v2/series", "POST", payload);

    if (!response.ok) {
      const error = await response.text();
      console.error("[Datadog] Failed to submit metrics:", error);
      return false;
    }

    console.log(`[Datadog] Submitted ${series.length} metric series`);
    return true;
  } catch (error) {
    console.error("[Datadog] Error submitting metrics:", error);
    return false;
  }
}

/**
 * Map metric type to Datadog API v2 type
 */
function mapMetricType(type: MetricType): number {
  const typeMap: Record<MetricType, number> = {
    gauge: 1,
    count: 2,
    rate: 3,
    histogram: 4,
    distribution: 5,
  };
  return typeMap[type] || 1;
}

/**
 * Submit a single metric
 */
export async function submitMetric(
  metric: string,
  value: number,
  options?: {
    type?: MetricType;
    tags?: string[];
    unit?: string;
    timestamp?: number;
  }
): Promise<boolean> {
  return submitMetrics([
    {
      metric,
      type: options?.type || "gauge",
      points: [{ value, timestamp: options?.timestamp }],
      tags: options?.tags,
      unit: options?.unit,
    },
  ]);
}

/**
 * Submit logs to Datadog
 */
export async function submitLogs(logs: LogEntry[]): Promise<boolean> {
  if (!isDatadogConfigured()) {
    console.log("[Datadog] Not configured, skipping logs submission");
    return false;
  }

  try {
    const payload = logs.map((log) => ({
      message: log.message,
      status: log.level || "info",
      service: log.service || "cloudify",
      hostname: log.hostname || "cloudify-app",
      ddsource: "cloudify",
      ddtags: [...(log.tags || []), ...getDefaultTags()].join(","),
      ...log.attributes,
    }));

    const response = await fetch(
      `https://http-intake.logs.${DATADOG_SITE}/api/v2/logs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": DATADOG_API_KEY!,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Datadog] Failed to submit logs:", error);
      return false;
    }

    console.log(`[Datadog] Submitted ${logs.length} log entries`);
    return true;
  } catch (error) {
    console.error("[Datadog] Error submitting logs:", error);
    return false;
  }
}

/**
 * Submit a single log entry
 */
export async function submitLog(
  message: string,
  level: LogLevel = "info",
  attributes?: Record<string, unknown>
): Promise<boolean> {
  return submitLogs([{ message, level, attributes }]);
}

/**
 * Submit an event to Datadog
 */
export async function submitEvent(event: EventPayload): Promise<boolean> {
  if (!isDatadogConfigured()) {
    console.log("[Datadog] Not configured, skipping event submission");
    return false;
  }

  try {
    const payload = {
      ...event,
      date_happened: event.date_happened || Math.floor(Date.now() / 1000),
      tags: [...(event.tags || []), ...getDefaultTags()],
      source_type_name: event.source_type_name || "cloudify",
    };

    const response = await datadogRequest("/api/v1/events", "POST", payload);

    if (!response.ok) {
      const error = await response.text();
      console.error("[Datadog] Failed to submit event:", error);
      return false;
    }

    console.log(`[Datadog] Submitted event: ${event.title}`);
    return true;
  } catch (error) {
    console.error("[Datadog] Error submitting event:", error);
    return false;
  }
}

/**
 * Submit a service check
 */
export async function submitServiceCheck(check: ServiceCheckPayload): Promise<boolean> {
  if (!isDatadogConfigured()) {
    return false;
  }

  try {
    const payload = {
      ...check,
      timestamp: check.timestamp || Math.floor(Date.now() / 1000),
      tags: [...(check.tags || []), ...getDefaultTags()],
    };

    const response = await datadogRequest("/api/v1/check_run", "POST", payload);

    if (!response.ok) {
      const error = await response.text();
      console.error("[Datadog] Failed to submit service check:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Datadog] Error submitting service check:", error);
    return false;
  }
}

// ============ Cloudify-specific metrics ============

/**
 * Track deployment metrics
 */
export async function trackDeploymentMetrics(data: {
  projectId: string;
  projectName: string;
  deploymentId: string;
  status: "started" | "success" | "failure";
  duration?: number;
  buildTime?: number;
}): Promise<boolean> {
  const tags = [
    `project:${data.projectId}`,
    `project_name:${data.projectName}`,
    `status:${data.status}`,
  ];

  const metrics: MetricSeries[] = [
    {
      metric: "cloudify.deployments.count",
      type: "count",
      points: [{ value: 1 }],
      tags: [...tags, `deployment_id:${data.deploymentId}`],
    },
  ];

  if (data.status === "success" && data.duration) {
    metrics.push({
      metric: "cloudify.deployments.duration",
      type: "gauge",
      points: [{ value: data.duration }],
      tags,
      unit: "second",
    });
  }

  if (data.buildTime) {
    metrics.push({
      metric: "cloudify.builds.duration",
      type: "gauge",
      points: [{ value: data.buildTime }],
      tags,
      unit: "second",
    });
  }

  // Submit event for deployment status changes
  if (data.status !== "started") {
    await submitEvent({
      title: `Deployment ${data.status}: ${data.projectName}`,
      text: `Deployment ${data.deploymentId} ${data.status}${
        data.duration ? ` in ${data.duration}s` : ""
      }`,
      alert_type: data.status === "success" ? "success" : "error",
      tags,
      aggregation_key: data.projectId,
    });
  }

  return submitMetrics(metrics);
}

/**
 * Track function invocation metrics
 */
export async function trackFunctionMetrics(data: {
  functionId: string;
  functionName: string;
  projectId: string;
  status: "success" | "error" | "timeout";
  duration: number;
  memoryUsed?: number;
  region?: string;
}): Promise<boolean> {
  const tags = [
    `function:${data.functionId}`,
    `function_name:${data.functionName}`,
    `project:${data.projectId}`,
    `status:${data.status}`,
    `region:${data.region || "default"}`,
  ];

  const metrics: MetricSeries[] = [
    {
      metric: "cloudify.functions.invocations",
      type: "count",
      points: [{ value: 1 }],
      tags,
    },
    {
      metric: "cloudify.functions.duration",
      type: "distribution",
      points: [{ value: data.duration }],
      tags,
      unit: "millisecond",
    },
  ];

  if (data.memoryUsed) {
    metrics.push({
      metric: "cloudify.functions.memory",
      type: "gauge",
      points: [{ value: data.memoryUsed }],
      tags,
      unit: "megabyte",
    });
  }

  if (data.status === "error" || data.status === "timeout") {
    metrics.push({
      metric: "cloudify.functions.errors",
      type: "count",
      points: [{ value: 1 }],
      tags,
    });
  }

  return submitMetrics(metrics);
}

/**
 * Track storage metrics
 */
export async function trackStorageMetrics(data: {
  projectId: string;
  storeId: string;
  storeType: "blob" | "kv";
  operation: "read" | "write" | "delete" | "list";
  size?: number;
  duration?: number;
}): Promise<boolean> {
  const tags = [
    `project:${data.projectId}`,
    `store:${data.storeId}`,
    `store_type:${data.storeType}`,
    `operation:${data.operation}`,
  ];

  const metrics: MetricSeries[] = [
    {
      metric: `cloudify.storage.${data.storeType}.operations`,
      type: "count",
      points: [{ value: 1 }],
      tags,
    },
  ];

  if (data.size) {
    metrics.push({
      metric: `cloudify.storage.${data.storeType}.bytes`,
      type: "count",
      points: [{ value: data.size }],
      tags,
      unit: "byte",
    });
  }

  if (data.duration) {
    metrics.push({
      metric: `cloudify.storage.${data.storeType}.latency`,
      type: "distribution",
      points: [{ value: data.duration }],
      tags,
      unit: "millisecond",
    });
  }

  return submitMetrics(metrics);
}

/**
 * Track bandwidth usage
 */
export async function trackBandwidth(data: {
  projectId: string;
  deploymentId?: string;
  bytes: number;
  direction: "ingress" | "egress";
}): Promise<boolean> {
  const tags = [
    `project:${data.projectId}`,
    `direction:${data.direction}`,
  ];

  if (data.deploymentId) {
    tags.push(`deployment:${data.deploymentId}`);
  }

  return submitMetric("cloudify.bandwidth.bytes", data.bytes, {
    type: "count",
    tags,
    unit: "byte",
  });
}

/**
 * Track API request metrics
 */
export async function trackApiRequest(data: {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: string;
}): Promise<boolean> {
  const tags = [
    `endpoint:${data.endpoint}`,
    `method:${data.method}`,
    `status_code:${data.statusCode}`,
    `status_class:${Math.floor(data.statusCode / 100)}xx`,
  ];

  if (data.userId) {
    tags.push(`user:${data.userId}`);
  }

  const metrics: MetricSeries[] = [
    {
      metric: "cloudify.api.requests",
      type: "count",
      points: [{ value: 1 }],
      tags,
    },
    {
      metric: "cloudify.api.latency",
      type: "distribution",
      points: [{ value: data.duration }],
      tags,
      unit: "millisecond",
    },
  ];

  if (data.statusCode >= 400) {
    metrics.push({
      metric: "cloudify.api.errors",
      type: "count",
      points: [{ value: 1 }],
      tags,
    });
  }

  return submitMetrics(metrics);
}

/**
 * Submit Cloudify health check
 */
export async function submitHealthCheck(
  healthy: boolean,
  message?: string
): Promise<boolean> {
  return submitServiceCheck({
    check: "cloudify.health",
    host_name: "cloudify-app",
    status: healthy ? 0 : 2,
    message: message || (healthy ? "Service is healthy" : "Service is unhealthy"),
    tags: getDefaultTags(),
  });
}
