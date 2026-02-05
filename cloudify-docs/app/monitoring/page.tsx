import Link from "next/link";

export default function MonitoringPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Monitoring</h1>

      <p className="lead">
        Monitor your deployments and functions with built-in observability tools.
      </p>

      <h2>Overview</h2>

      <p>
        Cloudify provides comprehensive monitoring for all your deployments:
      </p>

      <ul>
        <li>Real-time deployment logs</li>
        <li>Function execution logs</li>
        <li>Prometheus-compatible metrics</li>
        <li>Alerting and notifications</li>
      </ul>

      <h2>Deployment Logs</h2>

      <p>
        View real-time logs for all deployments:
      </p>

      <ul>
        <li>Build output and errors</li>
        <li>Deployment progress</li>
        <li>Static file serving logs</li>
      </ul>

      <h3>Accessing Logs</h3>

      <ol>
        <li>Go to your project dashboard</li>
        <li>Click on a deployment</li>
        <li>Select the &quot;Logs&quot; tab</li>
      </ol>

      <h2>Function Logs</h2>

      <p>
        Monitor Edge Function execution:
      </p>

      <ul>
        <li>Request and response logs</li>
        <li>Console output from your functions</li>
        <li>Error tracking and stack traces</li>
        <li>Execution duration and memory usage</li>
      </ul>

      <h2>Metrics</h2>

      <p>
        Cloudify exposes Prometheus-compatible metrics at{" "}
        <code>/api/metrics</code>. These include:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Metric</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>http_requests_total</code></td>
              <td className="px-4 py-2">Counter</td>
              <td className="px-4 py-2">Total HTTP requests</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>http_request_duration_ms</code></td>
              <td className="px-4 py-2">Histogram</td>
              <td className="px-4 py-2">Request latency</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>deployments_total</code></td>
              <td className="px-4 py-2">Counter</td>
              <td className="px-4 py-2">Total deployments</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>function_invocations_total</code></td>
              <td className="px-4 py-2">Counter</td>
              <td className="px-4 py-2">Function calls</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>web_vitals_*</code></td>
              <td className="px-4 py-2">Gauge</td>
              <td className="px-4 py-2">Web Vitals p75</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Integrations</h2>

      <p>
        Export metrics to your monitoring stack:
      </p>

      <ul>
        <li>
          <strong>Prometheus</strong> - Scrape the <code>/api/metrics</code>{" "}
          endpoint
        </li>
        <li>
          <strong>Grafana</strong> - Visualize with pre-built dashboards
        </li>
        <li>
          <strong>Datadog</strong> - Forward via Prometheus integration
        </li>
        <li>
          <strong>Custom</strong> - Any Prometheus-compatible system
        </li>
      </ul>

      <h2>Alerting</h2>

      <p>
        Set up alerts in your monitoring system based on:
      </p>

      <ul>
        <li>High error rates</li>
        <li>Slow response times</li>
        <li>Build failures</li>
        <li>Web Vitals degradation</li>
      </ul>

      <h2>Related Topics</h2>

      <ul>
        <li>
          <Link href="/monitoring/metrics">Metrics Reference</Link> - Detailed
          metrics documentation
        </li>
        <li>
          <Link href="/functions/logs">Function Logs</Link> - Debugging
          functions
        </li>
      </ul>
    </article>
  );
}
