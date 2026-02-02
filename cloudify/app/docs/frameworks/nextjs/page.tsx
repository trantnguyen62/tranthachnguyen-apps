"use client";

import Link from "next/link";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NextJSDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <div className="not-prose flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center">
          <svg className="h-8 w-8 text-white" viewBox="0 0 180 180" fill="currentColor">
            <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
              <circle cx="90" cy="90" r="90" fill="white"/>
            </mask>
            <g mask="url(#mask0)">
              <circle cx="90" cy="90" r="90" fill="black"/>
              <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="url(#paint0_linear)"/>
              <rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear)"/>
            </g>
            <defs>
              <linearGradient id="paint0_linear" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="white"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="paint1_linear" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
                <stop stopColor="white"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0">Next.js on Cloudify</h1>
          <p className="text-gray-600 dark:text-gray-400 m-0 mt-1">The best deployment experience for Next.js</p>
        </div>
      </div>

      <p className="lead">
        Cloudify is the native platform for Next.js, providing zero-configuration deployments,
        automatic optimization, and full support for all Next.js features.
      </p>

      <h2>Features</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          "App Router & Pages Router",
          "Server Components",
          "Server Actions",
          "Streaming & Suspense",
          "ISR (Incremental Static Regeneration)",
          "Image Optimization",
          "Edge & Serverless Functions",
          "Middleware",
          "Draft Mode",
          "Partial Prerendering",
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <span className="text-gray-900 dark:text-white">{feature}</span>
          </div>
        ))}
      </div>

      <h2>Quick Deploy</h2>

      <p>
        Deploy a Next.js app with a single command:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`npx create-next-app@latest my-app
cd my-app
cloudify deploy`}</code>
      </pre>

      <p>Or import from your existing Git repository with automatic framework detection.</p>

      <h2>Build Settings</h2>

      <p>
        Cloudify automatically detects Next.js and configures optimal build settings:
      </p>

      <table>
        <thead>
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Build Command</td>
            <td><code>next build</code></td>
          </tr>
          <tr>
            <td>Output Directory</td>
            <td><code>.next</code></td>
          </tr>
          <tr>
            <td>Install Command</td>
            <td><code>npm install</code> (or yarn/pnpm)</td>
          </tr>
          <tr>
            <td>Node.js Version</td>
            <td>20.x (default)</td>
          </tr>
        </tbody>
      </table>

      <h2>Server Components</h2>

      <p>
        React Server Components are fully supported. Components render on the server
        by default, reducing client-side JavaScript and improving performance.
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/page.tsx - This runs on the server
async function getData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{data.title}</div>;
}`}</code>
      </pre>

      <h2>Server Actions</h2>

      <p>
        Server Actions allow you to run server-side code directly from your components:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/actions.ts
'use server'

export async function submitForm(formData: FormData) {
  const email = formData.get('email');
  await saveToDatabase(email);
  return { success: true };
}`}</code>
      </pre>

      <h2>Image Optimization</h2>

      <p>
        Next.js Image component is automatically optimized on Cloudify:
      </p>

      <ul>
        <li>Automatic WebP/AVIF conversion</li>
        <li>Responsive image sizing</li>
        <li>Lazy loading by default</li>
        <li>Cached on our edge network</li>
      </ul>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`import Image from 'next/image';

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="Profile"
      width={64}
      height={64}
    />
  );
}`}</code>
      </pre>

      <h2>Incremental Static Regeneration (ISR)</h2>

      <p>
        Update static pages after deployment without rebuilding your entire site:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/posts/[id]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Post({ params }) {
  const post = await getPost(params.id);
  return <article>{post.content}</article>;
}`}</code>
      </pre>

      <h2>Edge Functions</h2>

      <p>
        Run code at the edge for ultra-low latency:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/api/geo/route.ts
export const runtime = 'edge';

export function GET(request: Request) {
  return Response.json({
    city: request.geo?.city,
    country: request.geo?.country,
  });
}`}</code>
      </pre>

      <h2>Middleware</h2>

      <p>
        Run code before a request is completed. Perfect for authentication, redirects, and A/B testing:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  if (!request.cookies.get('token')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};`}</code>
      </pre>

      <h2>Environment Variables</h2>

      <p>
        Configure environment variables in your project settings. Access them in your code:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// Server-side (secure)
const apiKey = process.env.API_KEY;

// Client-side (public)
const publicKey = process.env.NEXT_PUBLIC_ANALYTICS_ID;`}</code>
      </pre>

      <div className="not-prose mt-12 p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <Zap className="h-8 w-8 text-blue-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
              Ready to deploy?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Deploy your Next.js application to Cloudify in seconds.
            </p>
            <Button variant="primary" asChild>
              <Link href="/new">
                Deploy Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
