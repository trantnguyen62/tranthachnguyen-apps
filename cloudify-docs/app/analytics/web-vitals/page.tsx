import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function WebVitalsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Web Vitals</h1>

      <p className="lead">
        Track Core Web Vitals and other performance metrics to ensure great
        user experience.
      </p>

      <h2>What are Web Vitals?</h2>

      <p>
        Web Vitals are a set of metrics defined by Google that measure real-world
        user experience on your website. They affect both user satisfaction and
        search engine rankings.
      </p>

      <h2>Core Web Vitals</h2>

      <div className="not-prose my-6 space-y-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              LCP (Largest Contentful Paint)
            </h3>
            <span className="text-sm text-gray-500">Loading</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Measures loading performance. LCP should occur within 2.5 seconds of
            when the page first starts loading.
          </p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Good: &lt;2.5s
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              Needs work: 2.5s-4s
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
              Poor: &gt;4s
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              INP (Interaction to Next Paint)
            </h3>
            <span className="text-sm text-gray-500">Interactivity</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Measures responsiveness. INP should be less than 200 milliseconds for
            good user experience.
          </p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Good: &lt;200ms
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              Needs work: 200-500ms
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
              Poor: &gt;500ms
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              CLS (Cumulative Layout Shift)
            </h3>
            <span className="text-sm text-gray-500">Visual Stability</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Measures visual stability. CLS should be less than 0.1 for good user
            experience.
          </p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Good: &lt;0.1
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              Needs work: 0.1-0.25
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
              Poor: &gt;0.25
            </span>
          </div>
        </div>
      </div>

      <h2>Additional Metrics</h2>

      <p>
        Cloudify also tracks these supplementary metrics:
      </p>

      <ul>
        <li>
          <strong>FCP (First Contentful Paint)</strong> - Time until the first
          content is rendered
        </li>
        <li>
          <strong>TTFB (Time to First Byte)</strong> - Server response time
        </li>
        <li>
          <strong>FID (First Input Delay)</strong> - Legacy interactivity metric
          (replaced by INP)
        </li>
      </ul>

      <h2>Automatic Collection</h2>

      <p>
        When you add the Cloudify analytics script, Web Vitals are automatically
        collected. No additional configuration needed:
      </p>

      <CodeBlock
        code={`<script
  defer
  src="https://cloudify.tranthachnguyen.com/analytics.js"
  data-project="your-project-slug"
></script>`}
        language="html"
      />

      <h2>Manual Reporting</h2>

      <p>
        You can also report Web Vitals manually using the SDK:
      </p>

      <CodeBlock
        code={`import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

function reportVital(metric) {
  fetch("/api/analytics/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
    }),
  });
}

// Report all vitals
onCLS(reportVital);
onINP(reportVital);
onLCP(reportVital);
onFCP(reportVital);
onTTFB(reportVital);`}
        language="typescript"
      />

      <h2>Viewing Data</h2>

      <p>
        View your Web Vitals in the project dashboard under Analytics →
        Performance. The dashboard shows:
      </p>

      <ul>
        <li>Current p75 values for each metric</li>
        <li>Trends over time</li>
        <li>Page-level breakdown</li>
        <li>Device type comparison</li>
      </ul>

      <Callout type="info" title="75th Percentile">
        Cloudify reports the 75th percentile (p75) for all metrics. This means
        75% of your users experience this performance or better.
      </Callout>

      <h2>Improving Web Vitals</h2>

      <h3>Improve LCP</h3>

      <ul>
        <li>Optimize and compress images</li>
        <li>Use CDN for static assets</li>
        <li>Preload critical resources</li>
        <li>Remove render-blocking scripts</li>
      </ul>

      <h3>Improve INP</h3>

      <ul>
        <li>Minimize JavaScript execution time</li>
        <li>Break up long tasks</li>
        <li>Use web workers for heavy computation</li>
        <li>Debounce input handlers</li>
      </ul>

      <h3>Improve CLS</h3>

      <ul>
        <li>Set explicit dimensions on images and embeds</li>
        <li>Reserve space for dynamic content</li>
        <li>Avoid inserting content above existing content</li>
        <li>Use CSS transforms for animations</li>
      </ul>
    </article>
  );
}
