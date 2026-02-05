import Link from "next/link";
import { Callout } from "@/components/Callout";
import { CodeBlock } from "@/components/CodeBlock";

export default function FunctionsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Edge Functions</h1>

      <p className="lead">
        Run serverless functions at the edge for low-latency API endpoints and
        backend logic.
      </p>

      <h2>What are Edge Functions?</h2>

      <p>
        Edge Functions are serverless functions that run close to your users on
        Cloudify&apos;s global edge network. They&apos;re perfect for:
      </p>

      <ul>
        <li>API endpoints and webhooks</li>
        <li>Authentication and authorization</li>
        <li>Data transformation and validation</li>
        <li>Server-side rendering</li>
        <li>Proxy requests to other services</li>
      </ul>

      <h2>Quick Example</h2>

      <p>
        Create a simple API endpoint that returns JSON:
      </p>

      <CodeBlock
        code={`// functions/hello.ts
export default function handler(req: Request) {
  return new Response(
    JSON.stringify({ message: "Hello from the edge!" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}`}
        language="typescript"
        filename="functions/hello.ts"
      />

      <p>
        Access your function at{" "}
        <code>https://your-project.cloudify.tranthachnguyen.com/api/hello</code>
      </p>

      <h2>Features</h2>

      <div className="not-prose my-6 grid md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900">Low Latency</h3>
          <p className="text-sm text-gray-600">
            Functions run at the edge, close to your users for fast response
            times.
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900">Auto-scaling</h3>
          <p className="text-sm text-gray-600">
            Automatically scales to handle any amount of traffic.
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900">TypeScript Support</h3>
          <p className="text-sm text-gray-600">
            Write functions in TypeScript with full type checking.
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900">Built-in Logging</h3>
          <p className="text-sm text-gray-600">
            View real-time logs and errors in your dashboard.
          </p>
        </div>
      </div>

      <h2>Runtime</h2>

      <p>
        Edge Functions use a Web-standard runtime compatible with the Fetch API,
        Web Crypto, and other standard APIs:
      </p>

      <CodeBlock
        code={`// Available APIs
fetch()           // HTTP requests
Request           // HTTP request object
Response          // HTTP response object
Headers           // HTTP headers
URL               // URL parsing
crypto            // Web Crypto API
TextEncoder       // Text encoding
TextDecoder       // Text decoding
atob/btoa         // Base64 encoding`}
        language="typescript"
      />

      <Callout type="info">
        Edge Functions have a 30-second execution timeout and 128MB memory
        limit by default.
      </Callout>

      <h2>Related Topics</h2>

      <ul>
        <li>
          <Link href="/functions/writing-functions">Writing Functions</Link> -
          Detailed guide to creating functions
        </li>
        <li>
          <Link href="/functions/logs">Logs & Debugging</Link> - View and debug
          function execution
        </li>
        <li>
          <Link href="/api-reference/functions">Functions API</Link> - API
          reference for managing functions
        </li>
      </ul>
    </article>
  );
}
