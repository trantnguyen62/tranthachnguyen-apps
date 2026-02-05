import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function VisitorTrackingPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Visitor Tracking</h1>

      <p className="lead">
        Understand your audience with privacy-focused visitor analytics.
      </p>

      <h2>Overview</h2>

      <p>
        Cloudify&apos;s visitor tracking provides insights into how users find and
        interact with your site, without compromising their privacy.
      </p>

      <h2>Metrics Collected</h2>

      <h3>Traffic Metrics</h3>

      <ul>
        <li>
          <strong>Pageviews</strong> - Total number of pages viewed
        </li>
        <li>
          <strong>Unique Visitors</strong> - Number of distinct visitors
        </li>
        <li>
          <strong>Sessions</strong> - User visit sessions
        </li>
        <li>
          <strong>Bounce Rate</strong> - Single-page visits percentage
        </li>
        <li>
          <strong>Session Duration</strong> - Average time on site
        </li>
      </ul>

      <h3>Content Metrics</h3>

      <ul>
        <li>Top pages by views</li>
        <li>Entry and exit pages</li>
        <li>Page engagement time</li>
      </ul>

      <h3>Source Metrics</h3>

      <ul>
        <li>Referrers (where visitors come from)</li>
        <li>UTM campaign tracking</li>
        <li>Direct vs organic vs referral traffic</li>
      </ul>

      <h3>Technical Metrics</h3>

      <ul>
        <li>Browser type and version</li>
        <li>Operating system</li>
        <li>Device type (desktop/mobile/tablet)</li>
        <li>Screen resolution</li>
        <li>Country (from IP, not stored)</li>
      </ul>

      <h2>Setup</h2>

      <p>
        Add the analytics script to your site:
      </p>

      <CodeBlock
        code={`<script
  defer
  src="https://cloudify.tranthachnguyen.com/analytics.js"
  data-project="your-project-slug"
></script>`}
        language="html"
      />

      <Callout type="info">
        The script is only 1KB gzipped and loads asynchronously, so it won&apos;t
        impact your page load performance.
      </Callout>

      <h2>Custom Events</h2>

      <p>
        Track custom events for deeper insights:
      </p>

      <CodeBlock
        code={`// Track a custom event
window.cloudify?.track("signup_started", {
  plan: "pro",
  source: "homepage",
});

// Track a button click
document.querySelector("#cta-button")?.addEventListener("click", () => {
  window.cloudify?.track("cta_clicked", {
    button: "hero-cta",
    page: window.location.pathname,
  });
});

// Track a form submission
form.addEventListener("submit", () => {
  window.cloudify?.track("form_submitted", {
    form: "contact",
  });
});`}
        language="javascript"
      />

      <h2>UTM Tracking</h2>

      <p>
        UTM parameters are automatically captured from URLs:
      </p>

      <CodeBlock
        code={`# Example URL with UTM parameters
https://yoursite.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch

# These parameters are tracked:
- utm_source: twitter
- utm_medium: social
- utm_campaign: launch
- utm_term: (if present)
- utm_content: (if present)`}
        language="text"
      />

      <h2>Real-time Data</h2>

      <p>
        The dashboard shows real-time visitor data:
      </p>

      <ul>
        <li>Current visitors on site</li>
        <li>Pages being viewed right now</li>
        <li>Recent pageviews stream</li>
      </ul>

      <h2>Data Retention</h2>

      <ul>
        <li>
          <strong>Raw events</strong>: 30 days
        </li>
        <li>
          <strong>Aggregated data</strong>: 24 months
        </li>
        <li>
          <strong>Real-time data</strong>: 5 minutes
        </li>
      </ul>

      <h2>Privacy Compliance</h2>

      <p>
        Cloudify Analytics is designed for privacy compliance:
      </p>

      <ul>
        <li>
          <strong>No cookies</strong> - Basic tracking works without cookies
        </li>
        <li>
          <strong>No PII</strong> - No personal information is collected
        </li>
        <li>
          <strong>IP anonymization</strong> - IPs are not stored
        </li>
        <li>
          <strong>Data ownership</strong> - You own all your analytics data
        </li>
      </ul>

      <Callout type="success" title="GDPR Compliant">
        Basic visitor tracking doesn&apos;t require cookie consent under GDPR as
        it&apos;s considered essential for site operation and doesn&apos;t track
        individuals.
      </Callout>

      <h2>API Access</h2>

      <p>
        Query your analytics data via the API:
      </p>

      <CodeBlock
        code={`// Get visitor stats for the last 7 days
const response = await fetch(
  "/api/analytics/visitors?projectId=xxx&days=7",
  {
    headers: { Authorization: "Bearer YOUR_API_KEY" },
  }
);

const data = await response.json();
// {
//   totalVisitors: 4200,
//   totalPageviews: 12500,
//   topPages: [...],
//   sources: [...],
//   devices: {...}
// }`}
        language="typescript"
      />
    </article>
  );
}
