import Link from "next/link";
import { Callout } from "@/components/Callout";

export default function AnalyticsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Analytics</h1>

      <p className="lead">
        Built-in analytics for Web Vitals and visitor tracking, with no
        third-party scripts required.
      </p>

      <h2>Overview</h2>

      <p>
        Cloudify Analytics provides privacy-focused analytics that help you
        understand how users interact with your application and monitor
        performance.
      </p>

      <div className="not-prose my-6 grid md:grid-cols-2 gap-6">
        <Link
          href="/analytics/web-vitals"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Web Vitals
          </h3>
          <p className="text-gray-600 text-sm">
            Track Core Web Vitals (LCP, FID, CLS) and other performance metrics
            to ensure great user experience.
          </p>
        </Link>

        <Link
          href="/analytics/visitor-tracking"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Visitor Tracking
          </h3>
          <p className="text-gray-600 text-sm">
            Understand your audience with pageviews, unique visitors, referrers,
            and geographic data.
          </p>
        </Link>
      </div>

      <h2>Privacy First</h2>

      <p>
        Cloudify Analytics is designed with privacy in mind:
      </p>

      <ul>
        <li>No cookies required for basic tracking</li>
        <li>No personal data collection</li>
        <li>Data is aggregated and anonymized</li>
        <li>GDPR and CCPA compliant</li>
        <li>No third-party data sharing</li>
      </ul>

      <Callout type="info">
        Unlike Google Analytics, Cloudify Analytics doesn&apos;t require cookie
        consent banners for basic usage tracking.
      </Callout>

      <h2>Getting Started</h2>

      <p>
        Analytics is automatically enabled for all projects. Add the analytics
        script to start collecting data:
      </p>

      <h3>For Next.js</h3>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://cloudify.tranthachnguyen.com/analytics.js"
          data-project="your-project-slug"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`}</code>
      </pre>

      <h3>For Any Website</h3>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`<script
  defer
  src="https://cloudify.tranthachnguyen.com/analytics.js"
  data-project="your-project-slug"
></script>`}</code>
      </pre>

      <h2>Dashboard</h2>

      <p>
        View your analytics in the project dashboard:
      </p>

      <ul>
        <li>
          <strong>Overview</strong> - Key metrics at a glance
        </li>
        <li>
          <strong>Real-time</strong> - Current visitors and activity
        </li>
        <li>
          <strong>Performance</strong> - Web Vitals over time
        </li>
        <li>
          <strong>Pages</strong> - Most visited pages
        </li>
        <li>
          <strong>Sources</strong> - Traffic sources and referrers
        </li>
      </ul>

      <h2>API Access</h2>

      <p>
        Access analytics data programmatically through the API:
      </p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`GET /api/analytics?projectId=xxx&from=2024-01-01&to=2024-01-31

{
  "pageviews": 12500,
  "visitors": 4200,
  "bounceRate": 0.42,
  "avgSessionDuration": 185,
  "topPages": [...],
  "vitals": {...}
}`}</code>
      </pre>

      <h2>Related Topics</h2>

      <ul>
        <li>
          <Link href="/analytics/web-vitals">Web Vitals</Link> - Performance metrics
        </li>
        <li>
          <Link href="/analytics/visitor-tracking">Visitor Tracking</Link> - Traffic analysis
        </li>
        <li>
          <Link href="/api-reference/analytics">Analytics API</Link> - API reference
        </li>
      </ul>
    </article>
  );
}
