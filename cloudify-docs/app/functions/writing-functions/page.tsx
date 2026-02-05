import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function WritingFunctionsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Writing Functions</h1>

      <p className="lead">
        Learn how to create, deploy, and manage Edge Functions on Cloudify.
      </p>

      <h2>Basic Structure</h2>

      <p>
        Every Edge Function exports a default function that handles incoming
        requests:
      </p>

      <CodeBlock
        code={`// Basic function structure
export default function handler(request: Request): Response {
  return new Response("Hello, World!");
}

// With async operations
export default async function handler(request: Request): Promise<Response> {
  const data = await fetchSomeData();
  return Response.json(data);
}`}
        language="typescript"
      />

      <h2>Request Handling</h2>

      <h3>Reading Request Data</h3>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  // Get URL and method
  const url = new URL(request.url);
  const method = request.method;

  // Get headers
  const authHeader = request.headers.get("Authorization");

  // Get query parameters
  const searchParams = url.searchParams;
  const id = searchParams.get("id");

  // Read JSON body
  const body = await request.json();

  return Response.json({ url: url.pathname, method, id, body });
}`}
        language="typescript"
      />

      <h3>Handling Different Methods</h3>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  const { method } = request;

  switch (method) {
    case "GET":
      return handleGet(request);
    case "POST":
      return handlePost(request);
    case "PUT":
      return handlePut(request);
    case "DELETE":
      return handleDelete(request);
    default:
      return new Response("Method not allowed", { status: 405 });
  }
}`}
        language="typescript"
      />

      <h2>Response Types</h2>

      <h3>JSON Response</h3>

      <CodeBlock
        code={`// Using Response.json (recommended)
return Response.json({ success: true, data: result });

// Manual JSON response
return new Response(JSON.stringify({ success: true }), {
  headers: { "Content-Type": "application/json" },
});`}
        language="typescript"
      />

      <h3>HTML Response</h3>

      <CodeBlock
        code={`return new Response("<h1>Hello World</h1>", {
  headers: { "Content-Type": "text/html" },
});`}
        language="typescript"
      />

      <h3>Redirects</h3>

      <CodeBlock
        code={`// Redirect to another URL
return Response.redirect("https://example.com", 302);

// Or manually
return new Response(null, {
  status: 302,
  headers: { Location: "https://example.com" },
});`}
        language="typescript"
      />

      <h2>Environment Variables</h2>

      <p>
        Access environment variables using <code>process.env</code>:
      </p>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  const apiKey = process.env.API_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  // Use the variables...
  return Response.json({ configured: true });
}`}
        language="typescript"
      />

      <Callout type="warning">
        Never hardcode secrets in your function code. Always use environment
        variables.
      </Callout>

      <h2>Making HTTP Requests</h2>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  // Fetch data from an external API
  const response = await fetch("https://api.example.com/data", {
    method: "GET",
    headers: {
      Authorization: \`Bearer \${process.env.API_KEY}\`,
    },
  });

  if (!response.ok) {
    return new Response("External API error", { status: 502 });
  }

  const data = await response.json();
  return Response.json(data);
}`}
        language="typescript"
      />

      <h2>Error Handling</h2>

      <CodeBlock
        code={`export default async function handler(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Process request...
    return Response.json({ success: true });

  } catch (error) {
    console.error("Function error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}`}
        language="typescript"
      />

      <h2>CORS Headers</h2>

      <CodeBlock
        code={`const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(request: Request) {
  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Add CORS headers to response
  return Response.json(
    { data: "your data" },
    { headers: corsHeaders }
  );
}`}
        language="typescript"
      />

      <h2>Deployment</h2>

      <p>
        Functions are automatically deployed when you push to your repository.
        Place your functions in the <code>functions/</code> directory or use
        Next.js API routes in <code>app/api/</code>.
      </p>
    </article>
  );
}
