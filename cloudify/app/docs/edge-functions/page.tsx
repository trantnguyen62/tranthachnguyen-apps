"use client";

import { Globe, Zap, Clock, Shield } from "lucide-react";

export default function EdgeFunctionsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Edge Functions</h1>

      <p className="lead">
        Run JavaScript at the edge, closer to your users. Edge Functions execute in
        milliseconds with zero cold starts, perfect for personalization, A/B testing,
        authentication, and more.
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Globe className="h-8 w-8 text-blue-500 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Global by Default</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Code runs in 100+ locations worldwide, automatically routed to the nearest edge.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Zap className="h-8 w-8 text-yellow-500 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Zero Cold Starts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Functions start instantly with no initialization delay. Sub-millisecond startup times.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Clock className="h-8 w-8 text-green-500 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Ultra-Low Latency</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Respond in under 50ms globally. Perfect for time-sensitive operations.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Shield className="h-8 w-8 text-purple-500 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Secure Runtime</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Isolated V8 runtime with strong security boundaries. No shared state between requests.
          </p>
        </div>
      </div>

      <h2>Creating Edge Functions</h2>

      <h3>With Next.js</h3>

      <p>
        Add <code>export const runtime = &apos;edge&apos;</code> to any API route or page:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/api/hello/route.ts
export const runtime = 'edge';

export function GET(request: Request) {
  return new Response('Hello from the Edge!');
}`}</code>
      </pre>

      <h3>Middleware</h3>

      <p>
        Next.js Middleware automatically runs at the edge:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Runs at the edge, before the request reaches your app
  const country = request.geo?.country || 'US';

  // Rewrite to country-specific page
  return NextResponse.rewrite(
    new URL(\`/\${country}\${request.nextUrl.pathname}\`, request.url)
  );
}

export const config = {
  matcher: '/((?!api|_next|favicon.ico).*)',
};`}</code>
      </pre>

      <h3>Standalone Edge Functions</h3>

      <p>
        Create edge functions in the <code>/api</code> directory with <code>.edge.js</code> extension:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/geo.edge.js
export default function handler(request) {
  return new Response(JSON.stringify({
    city: request.geo?.city,
    country: request.geo?.country,
    region: request.geo?.region,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}`}</code>
      </pre>

      <h2>Use Cases</h2>

      <h3>Geolocation-Based Routing</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export const runtime = 'edge';

export function GET(request: Request) {
  const country = request.geo?.country;

  // Redirect EU users to EU-specific page
  if (['DE', 'FR', 'IT', 'ES', 'NL'].includes(country)) {
    return Response.redirect(new URL('/eu', request.url));
  }

  return Response.redirect(new URL('/us', request.url));
}`}</code>
      </pre>

      <h3>A/B Testing</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export const runtime = 'edge';

export function middleware(request) {
  // Get or assign bucket
  let bucket = request.cookies.get('ab-bucket')?.value;

  if (!bucket) {
    bucket = Math.random() < 0.5 ? 'control' : 'variant';
  }

  const response = NextResponse.next();
  response.cookies.set('ab-bucket', bucket);

  // Add bucket to headers for server components
  response.headers.set('x-ab-bucket', bucket);

  return response;
}`}</code>
      </pre>

      <h3>Authentication</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export const runtime = 'edge';

export async function middleware(request) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return Response.redirect(new URL('/login', request.url));
  }

  // Verify JWT at the edge
  try {
    await verifyJWT(token);
    return NextResponse.next();
  } catch {
    return Response.redirect(new URL('/login', request.url));
  }
}`}</code>
      </pre>

      <h3>Rate Limiting</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export const runtime = 'edge';

export async function middleware(request) {
  const ip = request.ip ?? '127.0.0.1';

  // Check rate limit using Edge Config or KV
  const { remaining, reset } = await checkRateLimit(ip);

  if (remaining <= 0) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
      }
    });
  }

  return NextResponse.next();
}`}</code>
      </pre>

      <h2>Available APIs</h2>

      <p>
        Edge Functions have access to standard Web APIs:
      </p>

      <ul>
        <li><code>fetch()</code> - Make HTTP requests</li>
        <li><code>Request</code> / <code>Response</code> - Standard Fetch API</li>
        <li><code>URL</code> / <code>URLSearchParams</code> - URL manipulation</li>
        <li><code>Headers</code> - HTTP headers</li>
        <li><code>TextEncoder</code> / <code>TextDecoder</code> - Text encoding</li>
        <li><code>crypto</code> - Web Crypto API</li>
        <li><code>atob()</code> / <code>btoa()</code> - Base64 encoding</li>
      </ul>

      <h3>Cloudify-Specific APIs</h3>

      <ul>
        <li><code>request.geo</code> - Geolocation data (city, country, region, latitude, longitude)</li>
        <li><code>request.ip</code> - Client IP address</li>
        <li><code>request.nextUrl</code> - Parsed URL with Next.js helpers</li>
      </ul>

      <h2>Limitations</h2>

      <ul>
        <li><strong>No Node.js APIs</strong> - Edge Functions use V8 isolates, not Node.js</li>
        <li><strong>No filesystem</strong> - Cannot read/write files</li>
        <li><strong>Limited execution time</strong> - 30 second maximum</li>
        <li><strong>Limited memory</strong> - 128MB per function</li>
        <li><strong>No native modules</strong> - JavaScript/WASM only</li>
      </ul>

      <h2>Edge vs Serverless</h2>

      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Edge Functions</th>
            <th>Serverless Functions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cold Start</td>
            <td>~0ms</td>
            <td>~250ms</td>
          </tr>
          <tr>
            <td>Locations</td>
            <td>100+ edge locations</td>
            <td>Regional (configurable)</td>
          </tr>
          <tr>
            <td>Runtime</td>
            <td>V8 Isolates</td>
            <td>Node.js</td>
          </tr>
          <tr>
            <td>Max Duration</td>
            <td>30 seconds</td>
            <td>300 seconds</td>
          </tr>
          <tr>
            <td>Memory</td>
            <td>128MB</td>
            <td>Up to 3GB</td>
          </tr>
          <tr>
            <td>Best For</td>
            <td>Auth, routing, personalization</td>
            <td>Heavy computation, DB queries</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
