import { APIEndpoint } from "@/components/APIReference";

export default function FunctionsAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Functions API</h1>

      <p className="lead">
        Manage and monitor Edge Functions.
      </p>

      <h2>Endpoints</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/functions"
        description="List all functions for a project."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
        ]}
        responseBody={`{
  "functions": [
    {
      "id": "fn_abc123",
      "name": "api/hello",
      "runtime": "edge",
      "invocations": 5000,
      "avgDuration": 45,
      "lastInvoked": "2024-01-25T12:00:00Z"
    }
  ]
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/functions/:id"
        description="Get details for a specific function."
        parameters={[
          { name: "id", type: "string", required: true, description: "Function ID" },
        ]}
        responseBody={`{
  "id": "fn_abc123",
  "name": "api/hello",
  "runtime": "edge",
  "region": "global",
  "memory": 128,
  "timeout": 30,
  "invocations": 5000,
  "errors": 12,
  "avgDuration": 45,
  "p95Duration": 120
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/functions/:id/logs"
        description="Get recent logs for a function."
        parameters={[
          { name: "id", type: "string", required: true, description: "Function ID" },
          { name: "limit", type: "number", description: "Max log entries (default: 100)" },
          { name: "since", type: "string", description: "ISO timestamp to fetch logs from" },
        ]}
        responseBody={`{
  "logs": [
    {
      "timestamp": "2024-01-25T12:00:00Z",
      "level": "info",
      "message": "Processing request",
      "requestId": "req_abc123"
    },
    {
      "timestamp": "2024-01-25T12:00:01Z",
      "level": "info",
      "message": "Request completed in 45ms",
      "requestId": "req_abc123"
    }
  ]
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/functions/:id/metrics"
        description="Get metrics for a function."
        parameters={[
          { name: "id", type: "string", required: true, description: "Function ID" },
          { name: "from", type: "string", description: "Start date (ISO format)" },
          { name: "to", type: "string", description: "End date (ISO format)" },
        ]}
        responseBody={`{
  "invocations": {
    "total": 5000,
    "success": 4988,
    "error": 12
  },
  "duration": {
    "avg": 45,
    "p50": 35,
    "p95": 120,
    "p99": 250
  },
  "timeseries": [
    {
      "timestamp": "2024-01-25T00:00:00Z",
      "invocations": 200,
      "errors": 1,
      "avgDuration": 42
    }
  ]
}`}
      />
    </article>
  );
}
