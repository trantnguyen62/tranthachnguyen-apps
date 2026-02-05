import { APIEndpoint } from "@/components/APIReference";

export default function AnalyticsAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Analytics API</h1>

      <p className="lead">
        Query analytics data and ingest custom events.
      </p>

      <h2>Query Endpoints</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/analytics"
        description="Get aggregated analytics for a project."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "from", type: "string", description: "Start date (ISO format)" },
          { name: "to", type: "string", description: "End date (ISO format)" },
        ]}
        responseBody={`{
  "pageviews": 12500,
  "visitors": 4200,
  "sessions": 5100,
  "bounceRate": 0.42,
  "avgSessionDuration": 185,
  "topPages": [
    { "path": "/", "views": 5000 },
    { "path": "/pricing", "views": 2000 }
  ],
  "sources": [
    { "source": "google", "visits": 1500 },
    { "source": "direct", "visits": 1200 }
  ]
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/analytics/vitals"
        description="Get Web Vitals data for a project."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "from", type: "string", description: "Start date (ISO format)" },
          { name: "to", type: "string", description: "End date (ISO format)" },
        ]}
        responseBody={`{
  "lcp": { "p75": 1850, "good": 0.72, "needsWork": 0.20, "poor": 0.08 },
  "inp": { "p75": 95, "good": 0.85, "needsWork": 0.12, "poor": 0.03 },
  "cls": { "p75": 0.05, "good": 0.90, "needsWork": 0.07, "poor": 0.03 },
  "fcp": { "p75": 1200, "good": 0.78, "needsWork": 0.17, "poor": 0.05 },
  "ttfb": { "p75": 450, "good": 0.82, "needsWork": 0.14, "poor": 0.04 }
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/analytics/realtime"
        description="Get real-time visitor data."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
        ]}
        responseBody={`{
  "activeVisitors": 42,
  "pageviewsPerMinute": 15,
  "topPages": [
    { "path": "/", "visitors": 12 },
    { "path": "/docs", "visitors": 8 }
  ]
}`}
      />

      <h2>Ingestion Endpoints</h2>

      <APIEndpoint
        method="POST"
        endpoint="/api/analytics/ingest"
        description="Ingest analytics events."
        authRequired={false}
        requestBody={`{
  "projectId": "proj_abc123",
  "events": [
    {
      "type": "pageview",
      "url": "https://example.com/page",
      "referrer": "https://google.com",
      "timestamp": "2024-01-25T12:00:00Z"
    }
  ]
}`}
        responseBody={`{
  "success": true,
  "processed": 1
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/analytics/vitals"
        description="Report Web Vitals metrics."
        authRequired={false}
        requestBody={`{
  "projectId": "proj_abc123",
  "metrics": [
    {
      "name": "LCP",
      "value": 1850,
      "id": "v3-1234567890",
      "url": "https://example.com"
    }
  ]
}`}
        responseBody={`{
  "success": true
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/analytics/events"
        description="Track custom events."
        authRequired={false}
        requestBody={`{
  "projectId": "proj_abc123",
  "event": "signup_completed",
  "properties": {
    "plan": "pro",
    "source": "homepage"
  }
}`}
        responseBody={`{
  "success": true
}`}
      />
    </article>
  );
}
