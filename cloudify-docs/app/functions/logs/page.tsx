import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function FunctionLogsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Logs & Debugging</h1>

      <p className="lead">
        Monitor and debug your Edge Functions with real-time logs and metrics.
      </p>

      <h2>Viewing Logs</h2>

      <p>
        Access function logs from your project dashboard:
      </p>

      <ol>
        <li>Go to your project</li>
        <li>Click on &quot;Functions&quot; in the sidebar</li>
        <li>Select a function to view its logs</li>
      </ol>

      <p>
        Logs are streamed in real-time and include:
      </p>

      <ul>
        <li>Timestamp</li>
        <li>Log level (info, warn, error)</li>
        <li>Request ID</li>
        <li>Message content</li>
      </ul>

      <h2>Console Logging</h2>

      <p>
        Use standard <code>console</code> methods to log from your functions:
      </p>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  // Info level (default)
  console.log("Processing request:", request.url);

  // Warning level
  console.warn("Deprecated API usage detected");

  // Error level
  console.error("Failed to process:", error);

  // Debug information
  console.info("User ID:", userId);

  return Response.json({ success: true });
}`}
        language="typescript"
      />

      <Callout type="info">
        Logs are retained for 7 days. For longer retention, consider integrating
        with an external logging service.
      </Callout>

      <h2>Structured Logging</h2>

      <p>
        For better log analysis, use structured JSON logging:
      </p>

      <CodeBlock
        code={`function log(level: string, message: string, data?: object) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }));
}

export default async function handler(request: Request) {
  log("info", "Request received", {
    method: request.method,
    url: request.url,
  });

  try {
    const result = await processRequest(request);
    log("info", "Request processed", { resultId: result.id });
    return Response.json(result);
  } catch (error) {
    log("error", "Request failed", { error: error.message });
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}`}
        language="typescript"
      />

      <h2>Request Tracing</h2>

      <p>
        Each request has a unique ID for tracing through your logs:
      </p>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  // Get the request ID from headers
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  console.log(\`[\${requestId}] Starting request processing\`);

  // ... your logic ...

  console.log(\`[\${requestId}] Request completed\`);

  return Response.json({ requestId });
}`}
        language="typescript"
      />

      <h2>Error Tracking</h2>

      <p>
        Errors are automatically captured and logged. View errors in the
        dashboard to see:
      </p>

      <ul>
        <li>Error message and stack trace</li>
        <li>Request that caused the error</li>
        <li>Timestamp and frequency</li>
      </ul>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  try {
    // Your function logic
    const data = await riskyOperation();
    return Response.json(data);
  } catch (error) {
    // Log the full error for debugging
    console.error("Function error:", {
      message: error.message,
      stack: error.stack,
      request: {
        method: request.method,
        url: request.url,
      },
    });

    // Return a safe error response
    return Response.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}`}
        language="typescript"
      />

      <h2>Performance Metrics</h2>

      <p>
        Monitor function performance with built-in metrics:
      </p>

      <ul>
        <li><strong>Invocations</strong> - Total number of function calls</li>
        <li><strong>Duration</strong> - Average execution time</li>
        <li><strong>Errors</strong> - Error rate and types</li>
        <li><strong>Cold Starts</strong> - Number of cold start invocations</li>
      </ul>

      <h2>Debugging Tips</h2>

      <h3>Local Development</h3>

      <p>
        Test functions locally before deploying:
      </p>

      <CodeBlock
        code={`# For Next.js API routes
npm run dev

# Test your function
curl http://localhost:3000/api/your-function`}
        language="bash"
      />

      <h3>Common Issues</h3>

      <ul>
        <li>
          <strong>Timeout errors</strong> - Functions have a 30-second limit.
          Optimize long-running operations.
        </li>
        <li>
          <strong>Memory errors</strong> - Functions have 128MB limit. Stream
          large responses instead of buffering.
        </li>
        <li>
          <strong>Cold starts</strong> - First invocation may be slower. Keep
          initialization minimal.
        </li>
      </ul>
    </article>
  );
}
