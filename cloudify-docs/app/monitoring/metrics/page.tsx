import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function MetricsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Metrics Reference</h1>

      <p className="lead">
        Complete reference for all Prometheus metrics exposed by Cloudify.
      </p>

      <h2>Endpoint</h2>

      <p>
        Metrics are available at:
      </p>

      <CodeBlock
        code={`GET https://cloudify.tranthachnguyen.com/api/metrics`}
        language="text"
      />

      <Callout type="info">
        Authentication may be required. Set the <code>METRICS_AUTH_TOKEN</code>{" "}
        environment variable to protect your metrics endpoint.
      </Callout>

      <h2>HTTP Metrics</h2>

      <h3>http_requests_total</h3>

      <p>
        Counter of total HTTP requests.
      </p>

      <CodeBlock
        code={`# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200",path="/api/projects"} 1234`}
        language="text"
      />

      <p>Labels:</p>
      <ul>
        <li><code>method</code> - HTTP method (GET, POST, etc.)</li>
        <li><code>status</code> - HTTP status code</li>
        <li><code>path</code> - Request path</li>
      </ul>

      <h3>http_request_duration_ms</h3>

      <p>
        Histogram of request duration in milliseconds.
      </p>

      <CodeBlock
        code={`# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{le="50"} 1000
http_request_duration_ms_bucket{le="100"} 1500
http_request_duration_ms_bucket{le="250"} 1800
http_request_duration_ms_bucket{le="+Inf"} 2000
http_request_duration_ms_sum 45000
http_request_duration_ms_count 2000`}
        language="text"
      />

      <h2>Deployment Metrics</h2>

      <h3>deployments_total</h3>

      <p>
        Counter of deployments by status.
      </p>

      <CodeBlock
        code={`# HELP deployments_total Total number of deployments
# TYPE deployments_total counter
deployments_total{status="success",project="my-app"} 150
deployments_total{status="failed",project="my-app"} 5`}
        language="text"
      />

      <h3>deployment_duration_seconds</h3>

      <p>
        Histogram of deployment duration in seconds.
      </p>

      <CodeBlock
        code={`# HELP deployment_duration_seconds Deployment duration in seconds
# TYPE deployment_duration_seconds histogram
deployment_duration_seconds_bucket{le="60"} 100
deployment_duration_seconds_bucket{le="120"} 140
deployment_duration_seconds_bucket{le="300"} 148
deployment_duration_seconds_bucket{le="+Inf"} 150`}
        language="text"
      />

      <h2>Function Metrics</h2>

      <h3>function_invocations_total</h3>

      <p>
        Counter of function invocations.
      </p>

      <CodeBlock
        code={`# HELP function_invocations_total Total number of function invocations
# TYPE function_invocations_total counter
function_invocations_total{function="api/hello",status="success"} 5000
function_invocations_total{function="api/hello",status="error"} 12`}
        language="text"
      />

      <h3>function_duration_ms</h3>

      <p>
        Histogram of function execution time.
      </p>

      <CodeBlock
        code={`# HELP function_duration_ms Function execution duration in milliseconds
# TYPE function_duration_ms histogram
function_duration_ms_bucket{function="api/hello",le="10"} 4500
function_duration_ms_bucket{function="api/hello",le="50"} 4900
function_duration_ms_bucket{function="api/hello",le="+Inf"} 5000`}
        language="text"
      />

      <h2>Web Vitals Metrics</h2>

      <p>
        Gauge metrics showing 75th percentile values.
      </p>

      <CodeBlock
        code={`# HELP web_vitals_lcp_p75_ms LCP 75th percentile in milliseconds
# TYPE web_vitals_lcp_p75_ms gauge
web_vitals_lcp_p75_ms{project="my-app"} 1850

# HELP web_vitals_inp_p75_ms INP 75th percentile in milliseconds
# TYPE web_vitals_inp_p75_ms gauge
web_vitals_inp_p75_ms{project="my-app"} 95

# HELP web_vitals_cls_p75 CLS 75th percentile score
# TYPE web_vitals_cls_p75 gauge
web_vitals_cls_p75{project="my-app"} 0.05

# HELP web_vitals_fcp_p75_ms FCP 75th percentile in milliseconds
# TYPE web_vitals_fcp_p75_ms gauge
web_vitals_fcp_p75_ms{project="my-app"} 1200

# HELP web_vitals_ttfb_p75_ms TTFB 75th percentile in milliseconds
# TYPE web_vitals_ttfb_p75_ms gauge
web_vitals_ttfb_p75_ms{project="my-app"} 450`}
        language="text"
      />

      <h2>Analytics Metrics</h2>

      <CodeBlock
        code={`# HELP analytics_active_visitors Active visitors in last 5 minutes
# TYPE analytics_active_visitors gauge
analytics_active_visitors{project="my-app"} 42

# HELP analytics_pageviews_per_minute Pageviews in last minute
# TYPE analytics_pageviews_per_minute gauge
analytics_pageviews_per_minute{project="my-app"} 15

# HELP analytics_unique_visitors_daily Unique visitors today
# TYPE analytics_unique_visitors_daily gauge
analytics_unique_visitors_daily{project="my-app"} 1250`}
        language="text"
      />

      <h2>Prometheus Configuration</h2>

      <p>
        Add Cloudify to your Prometheus scrape configuration:
      </p>

      <CodeBlock
        code={`# prometheus.yml
scrape_configs:
  - job_name: 'cloudify'
    static_configs:
      - targets: ['cloudify.tranthachnguyen.com']
    metrics_path: '/api/metrics'
    scheme: https
    # If authentication is enabled:
    bearer_token: 'your-metrics-token'`}
        language="yaml"
      />

      <h2>Grafana Dashboard</h2>

      <p>
        Import pre-built Grafana dashboards for visualizing Cloudify metrics.
        Dashboards are available at:{" "}
        <code>grafana.tranthachnguyen.com</code>
      </p>
    </article>
  );
}
