/**
 * Prometheus Metrics
 * Track application metrics for monitoring and alerting
 */

// Simple in-memory metrics store
// In production, use prom-client library for proper Prometheus format

interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

interface Counter {
  name: string;
  help: string;
  values: Map<string, MetricValue>;
}

interface Gauge {
  name: string;
  help: string;
  values: Map<string, MetricValue>;
}

interface Histogram {
  name: string;
  help: string;
  buckets: number[];
  observations: Map<string, number[]>;
  sums: Map<string, number>;
  counts: Map<string, number>;
}

// Metric registries
const counters = new Map<string, Counter>();
const gauges = new Map<string, Gauge>();
const histograms = new Map<string, Histogram>();

// Default histogram buckets (for request duration in ms)
const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

// ============ Counter Operations ============

/**
 * Create or get a counter metric
 */
export function counter(name: string, help: string): {
  inc: (labels?: Record<string, string>, value?: number) => void;
} {
  if (!counters.has(name)) {
    counters.set(name, { name, help, values: new Map() });
  }

  return {
    inc: (labels = {}, value = 1) => {
      const labelKey = JSON.stringify(labels);
      const counter = counters.get(name)!;
      const existing = counter.values.get(labelKey);
      counter.values.set(labelKey, {
        value: (existing?.value || 0) + value,
        labels,
        timestamp: Date.now(),
      });
    },
  };
}

// ============ Gauge Operations ============

/**
 * Create or get a gauge metric
 */
export function gauge(name: string, help: string): {
  set: (value: number, labels?: Record<string, string>) => void;
  inc: (labels?: Record<string, string>, value?: number) => void;
  dec: (labels?: Record<string, string>, value?: number) => void;
} {
  if (!gauges.has(name)) {
    gauges.set(name, { name, help, values: new Map() });
  }

  return {
    set: (value, labels = {}) => {
      const labelKey = JSON.stringify(labels);
      const gauge = gauges.get(name)!;
      gauge.values.set(labelKey, { value, labels, timestamp: Date.now() });
    },
    inc: (labels = {}, value = 1) => {
      const labelKey = JSON.stringify(labels);
      const gauge = gauges.get(name)!;
      const existing = gauge.values.get(labelKey);
      gauge.values.set(labelKey, {
        value: (existing?.value || 0) + value,
        labels,
        timestamp: Date.now(),
      });
    },
    dec: (labels = {}, value = 1) => {
      const labelKey = JSON.stringify(labels);
      const gauge = gauges.get(name)!;
      const existing = gauge.values.get(labelKey);
      gauge.values.set(labelKey, {
        value: (existing?.value || 0) - value,
        labels,
        timestamp: Date.now(),
      });
    },
  };
}

// ============ Histogram Operations ============

/**
 * Create or get a histogram metric
 */
export function histogram(
  name: string,
  help: string,
  buckets: number[] = DEFAULT_BUCKETS
): {
  observe: (value: number, labels?: Record<string, string>) => void;
  startTimer: (labels?: Record<string, string>) => () => number;
} {
  if (!histograms.has(name)) {
    histograms.set(name, {
      name,
      help,
      buckets: [...buckets].sort((a, b) => a - b),
      observations: new Map(),
      sums: new Map(),
      counts: new Map(),
    });
  }

  return {
    observe: (value, labels = {}) => {
      const labelKey = JSON.stringify(labels);
      const hist = histograms.get(name)!;

      // Update count and sum
      hist.counts.set(labelKey, (hist.counts.get(labelKey) || 0) + 1);
      hist.sums.set(labelKey, (hist.sums.get(labelKey) || 0) + value);

      // Update bucket observations
      const obs = hist.observations.get(labelKey) || new Array(hist.buckets.length).fill(0);
      for (let i = 0; i < hist.buckets.length; i++) {
        if (value <= hist.buckets[i]) {
          obs[i]++;
        }
      }
      hist.observations.set(labelKey, obs);
    },
    startTimer: (labels = {}) => {
      const start = Date.now();
      return () => {
        const duration = Date.now() - start;
        const labelKey = JSON.stringify(labels);
        const hist = histograms.get(name)!;

        hist.counts.set(labelKey, (hist.counts.get(labelKey) || 0) + 1);
        hist.sums.set(labelKey, (hist.sums.get(labelKey) || 0) + duration);

        const obs = hist.observations.get(labelKey) || new Array(hist.buckets.length).fill(0);
        for (let i = 0; i < hist.buckets.length; i++) {
          if (duration <= hist.buckets[i]) {
            obs[i]++;
          }
        }
        hist.observations.set(labelKey, obs);

        return duration;
      };
    },
  };
}

// ============ Predefined Metrics ============

// HTTP metrics
export const httpRequestsTotal = counter(
  "http_requests_total",
  "Total number of HTTP requests"
);

export const httpRequestDuration = histogram(
  "http_request_duration_ms",
  "HTTP request duration in milliseconds"
);

export const httpRequestsInProgress = gauge(
  "http_requests_in_progress",
  "Number of HTTP requests currently being processed"
);

// Deployment metrics
export const deploymentsTotal = counter(
  "deployments_total",
  "Total number of deployments"
);

export const deploymentDuration = histogram(
  "deployment_duration_seconds",
  "Deployment duration in seconds",
  [10, 30, 60, 120, 300, 600, 1200]
);

export const activeDeployments = gauge(
  "active_deployments",
  "Number of deployments currently in progress"
);

// Function metrics
export const functionInvocationsTotal = counter(
  "function_invocations_total",
  "Total number of function invocations"
);

export const functionDuration = histogram(
  "function_duration_ms",
  "Function execution duration in milliseconds",
  [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000]
);

// Storage metrics
export const blobOperationsTotal = counter(
  "blob_operations_total",
  "Total number of blob storage operations"
);

export const kvOperationsTotal = counter(
  "kv_operations_total",
  "Total number of KV store operations"
);

// ============ Web Vitals Metrics ============

// Web Vitals gauges (p75 values per project)
export const webVitalsLCP = gauge(
  "web_vitals_lcp_p75_ms",
  "LCP 75th percentile in milliseconds"
);

export const webVitalsFID = gauge(
  "web_vitals_fid_p75_ms",
  "FID 75th percentile in milliseconds"
);

export const webVitalsCLS = gauge(
  "web_vitals_cls_p75",
  "CLS 75th percentile score"
);

export const webVitalsTTFB = gauge(
  "web_vitals_ttfb_p75_ms",
  "TTFB 75th percentile in milliseconds"
);

export const webVitalsFCP = gauge(
  "web_vitals_fcp_p75_ms",
  "FCP 75th percentile in milliseconds"
);

export const webVitalsINP = gauge(
  "web_vitals_inp_p75_ms",
  "INP 75th percentile in milliseconds"
);

// ============ Visitor Analytics Metrics ============

export const analyticsActiveVisitors = gauge(
  "analytics_active_visitors",
  "Active visitors in last 5 minutes"
);

export const analyticsPageviewsPerMinute = gauge(
  "analytics_pageviews_per_minute",
  "Pageviews in last minute"
);

export const analyticsUniqueVisitorsDaily = gauge(
  "analytics_unique_visitors_daily",
  "Unique visitors today"
);

// ============ Export Metrics ============

/**
 * Export metrics in Prometheus format
 */
export function exportMetrics(): string {
  const lines: string[] = [];

  // Export counters
  for (const [, counter] of counters) {
    lines.push(`# HELP ${counter.name} ${counter.help}`);
    lines.push(`# TYPE ${counter.name} counter`);
    for (const [, val] of counter.values) {
      const labelStr = formatLabels(val.labels);
      lines.push(`${counter.name}${labelStr} ${val.value}`);
    }
  }

  // Export gauges
  for (const [, gauge] of gauges) {
    lines.push(`# HELP ${gauge.name} ${gauge.help}`);
    lines.push(`# TYPE ${gauge.name} gauge`);
    for (const [, val] of gauge.values) {
      const labelStr = formatLabels(val.labels);
      lines.push(`${gauge.name}${labelStr} ${val.value}`);
    }
  }

  // Export histograms
  for (const [, hist] of histograms) {
    lines.push(`# HELP ${hist.name} ${hist.help}`);
    lines.push(`# TYPE ${hist.name} histogram`);

    for (const [labelKey, obs] of hist.observations) {
      const labels = JSON.parse(labelKey);

      // Bucket observations
      for (let i = 0; i < hist.buckets.length; i++) {
        const bucketLabels = { ...labels, le: String(hist.buckets[i]) };
        lines.push(`${hist.name}_bucket${formatLabels(bucketLabels)} ${obs[i]}`);
      }

      // +Inf bucket
      const infLabels = { ...labels, le: "+Inf" };
      lines.push(`${hist.name}_bucket${formatLabels(infLabels)} ${hist.counts.get(labelKey) || 0}`);

      // Sum and count
      const labelStr = formatLabels(labels);
      lines.push(`${hist.name}_sum${labelStr} ${hist.sums.get(labelKey) || 0}`);
      lines.push(`${hist.name}_count${labelStr} ${hist.counts.get(labelKey) || 0}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format labels for Prometheus output
 */
function formatLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return "";

  const parts = entries.map(([k, v]) => `${k}="${escapeLabel(v)}"`);
  return `{${parts.join(",")}}`;
}

/**
 * Escape label values
 */
function escapeLabel(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
  counters.clear();
  gauges.clear();
  histograms.clear();
}

/**
 * Get metrics summary for debugging
 */
export function getMetricsSummary(): {
  counters: number;
  gauges: number;
  histograms: number;
} {
  return {
    counters: counters.size,
    gauges: gauges.size,
    histograms: histograms.size,
  };
}
