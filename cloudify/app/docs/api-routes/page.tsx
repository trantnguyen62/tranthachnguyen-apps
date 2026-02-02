"use client";

import Link from "next/link";
import { ArrowRight, Check, FileCode, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiRoutesDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>API Routes</h1>

      <p className="lead">
        Build full-stack applications by creating API endpoints alongside your frontend.
        Cloudify automatically deploys your API routes as serverless functions.
      </p>

      <div className="not-prose p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 my-8">
        <div className="flex items-start gap-4">
          <Zap className="h-8 w-8 text-blue-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
              Zero Configuration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              API routes are automatically detected and deployed. No server
              configuration required.
            </p>
          </div>
        </div>
      </div>

      <h2>Supported Frameworks</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { name: "Next.js", path: "/api or /app/api" },
          { name: "Nuxt", path: "/server/api" },
          { name: "SvelteKit", path: "/src/routes/api" },
          { name: "Astro", path: "/src/pages/api" },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
              <p className="text-sm text-gray-500">{item.path}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Creating API Routes</h2>

      <h3>Next.js (App Router)</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await db.users.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.users.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}`}</code>
      </pre>

      <h3>Next.js (Pages Router)</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const users = await db.users.findMany();
    return res.json(users);
  }

  if (req.method === 'POST') {
    const user = await db.users.create({ data: req.body });
    return res.status(201).json(user);
  }
}`}</code>
      </pre>

      <h3>Standalone Functions</h3>

      <p>
        For non-framework projects, create functions in the <code>/api</code> directory:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/hello.js
export default function handler(req, res) {
  res.json({ message: 'Hello, World!' });
}

// api/users/[id].js - Dynamic route
export default function handler(req, res) {
  const { id } = req.query;
  res.json({ userId: id });
}`}</code>
      </pre>

      <h2>HTTP Methods</h2>

      <p>
        API routes support all standard HTTP methods:
      </p>

      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td>Retrieve data</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td>Create new resources</td>
          </tr>
          <tr>
            <td><code>PUT</code></td>
            <td>Update existing resources</td>
          </tr>
          <tr>
            <td><code>PATCH</code></td>
            <td>Partially update resources</td>
          </tr>
          <tr>
            <td><code>DELETE</code></td>
            <td>Remove resources</td>
          </tr>
          <tr>
            <td><code>OPTIONS</code></td>
            <td>CORS preflight requests</td>
          </tr>
        </tbody>
      </table>

      <h2>Request Handling</h2>

      <h3>Query Parameters</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// GET /api/search?q=hello&limit=10
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  const results = await search(query, limit);
  return NextResponse.json(results);
}`}</code>
      </pre>

      <h3>Request Body</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export async function POST(request: Request) {
  // JSON body
  const json = await request.json();

  // Form data
  const formData = await request.formData();
  const file = formData.get('file');

  // Raw text
  const text = await request.text();
}`}</code>
      </pre>

      <h3>Headers</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  return NextResponse.json({ data: 'protected' }, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'X-Custom-Header': 'value',
    },
  });
}`}</code>
      </pre>

      <h2>Dynamic Routes</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await db.users.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}`}</code>
      </pre>

      <h2>Middleware</h2>

      <p>
        Apply middleware to API routes for authentication, logging, or rate limiting:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication
  const token = request.headers.get('authorization');

  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};`}</code>
      </pre>

      <h2>CORS Configuration</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/api/route.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { data: 'Hello' },
    { headers: corsHeaders }
  );
}`}</code>
      </pre>

      <h2>Error Handling</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}`}</code>
      </pre>

      <h2>Streaming Responses</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(
          encoder.encode(\`data: \${JSON.stringify({ count: i })}\\n\\n\`)
        );
        await new Promise(r => setTimeout(r, 1000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}`}</code>
      </pre>

      <h2>Best Practices</h2>

      <div className="not-prose grid grid-cols-1 gap-4 my-8">
        {[
          { icon: Shield, title: "Validate Input", desc: "Always validate and sanitize user input to prevent security vulnerabilities" },
          { icon: Zap, title: "Use Edge When Possible", desc: "Deploy latency-sensitive APIs to the edge for faster response times" },
          { icon: FileCode, title: "Type Your APIs", desc: "Use TypeScript for better developer experience and fewer runtime errors" },
          { icon: Globe, title: "Handle CORS", desc: "Configure CORS headers when your API is accessed from different origins" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <item.icon className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="not-prose mt-12">
        <Button variant="primary" asChild>
          <Link href="/docs/functions">
            Learn About Serverless Functions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
