import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function NextJSGuidePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Deploy Next.js</h1>

      <p className="lead">
        Deploy Next.js applications with full support for SSR, API routes,
        middleware, and Incremental Static Regeneration.
      </p>

      <h2>Supported Features</h2>

      <ul>
        <li>Server-Side Rendering (SSR)</li>
        <li>Static Site Generation (SSG)</li>
        <li>Incremental Static Regeneration (ISR)</li>
        <li>API Routes</li>
        <li>Middleware</li>
        <li>Image Optimization</li>
        <li>App Router & Pages Router</li>
      </ul>

      <h2>Quick Start</h2>

      <h3>1. Create a Next.js App</h3>

      <CodeBlock
        code={`npx create-next-app@latest my-app
cd my-app`}
        language="bash"
      />

      <h3>2. Push to GitHub</h3>

      <CodeBlock
        code={`git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/you/my-app.git
git push -u origin main`}
        language="bash"
      />

      <h3>3. Deploy on Cloudify</h3>

      <ol>
        <li>Go to your Cloudify dashboard</li>
        <li>Click &quot;New Project&quot;</li>
        <li>Select your GitHub repository</li>
        <li>Cloudify auto-detects Next.js and configures the build</li>
        <li>Click &quot;Deploy&quot;</li>
      </ol>

      <h2>Build Configuration</h2>

      <p>
        Cloudify automatically detects these settings for Next.js:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Setting</th>
              <th className="px-4 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">Framework</td>
              <td className="px-4 py-2">Next.js</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Build Command</td>
              <td className="px-4 py-2"><code>npm run build</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>.next</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Install Command</td>
              <td className="px-4 py-2"><code>npm install</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Environment Variables</h2>

      <p>
        Next.js uses two types of environment variables:
      </p>

      <CodeBlock
        code={`# Server-side only (API routes, server components)
DATABASE_URL=postgresql://...
API_SECRET=sk_live_xxx

# Client-side (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=UA-12345678-1`}
        language="bash"
      />

      <Callout type="warning">
        Variables prefixed with <code>NEXT_PUBLIC_</code> are exposed to the
        browser. Never use this prefix for secrets!
      </Callout>

      <h2>API Routes</h2>

      <p>
        API routes are automatically deployed as Edge Functions:
      </p>

      <CodeBlock
        code={`// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: "Hello from the edge!" });
}`}
        language="typescript"
        filename="app/api/hello/route.ts"
      />

      <h2>Middleware</h2>

      <p>
        Next.js middleware runs at the edge for every request:
      </p>

      <CodeBlock
        code={`// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Add custom header
  const response = NextResponse.next();
  response.headers.set("x-custom-header", "my-value");
  return response;
}

export const config = {
  matcher: "/api/:path*",
};`}
        language="typescript"
        filename="middleware.ts"
      />

      <h2>Image Optimization</h2>

      <p>
        Next.js Image Optimization works out of the box:
      </p>

      <CodeBlock
        code={`import Image from "next/image";

export default function Page() {
  return (
    <Image
      src="/photo.jpg"
      alt="Photo"
      width={500}
      height={300}
      priority
    />
  );
}`}
        language="tsx"
      />

      <h2>Standalone Output</h2>

      <p>
        For optimal deployment, enable standalone output in <code>next.config.js</code>:
      </p>

      <CodeBlock
        code={`/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

module.exports = nextConfig;`}
        language="javascript"
        filename="next.config.js"
      />

      <h2>Common Issues</h2>

      <h3>Build fails with memory error</h3>

      <p>
        Add this environment variable:
      </p>

      <CodeBlock
        code={`NODE_OPTIONS=--max_old_space_size=4096`}
        language="bash"
      />

      <h3>ISR not working</h3>

      <p>
        Make sure your page uses revalidation:
      </p>

      <CodeBlock
        code={`// app/posts/[id]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds`}
        language="typescript"
      />
    </article>
  );
}
