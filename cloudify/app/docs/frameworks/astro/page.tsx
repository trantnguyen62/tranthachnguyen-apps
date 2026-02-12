"use client";

import Link from "next/link";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AstroDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <div className="not-prose flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FF5D01] to-[#FF8A4C] flex items-center justify-center">
          <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.358 20.162c-1.186-1.07-1.532-3.316-1.038-4.944.856 1.026 2.043 1.352 3.272 1.535 1.897.283 3.76.177 5.522-.678.202-.098.388-.229.608-.36.166.473.209.95.151 1.437-.14 1.185-.738 2.1-1.688 2.794-.38.277-.782.525-1.175.787-1.205.804-1.531 1.747-1.078 3.119l.044.148a3.158 3.158 0 0 1-1.407-1.188 3.31 3.31 0 0 1-.544-1.815c-.004-.32-.004-.642-.048-.958-.106-.769-.472-1.113-1.161-1.133-.707-.02-1.267.411-1.415 1.09-.012.053-.028.104-.043.182zm-5.961-4.445s3.24-1.575 6.49-1.575l2.451-7.565c.092-.366.36-.614.662-.614.303 0 .57.248.662.614l2.45 7.565c3.85 0 6.491 1.575 6.491 1.575L16.088.727C15.93.285 15.663 0 15.303 0H8.697c-.36 0-.615.285-.784.727l-5.516 14.99z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] m-0">Astro on Cloudify</h1>
          <p className="text-[var(--text-secondary)] m-0 mt-1">Ship less JavaScript with Astro&apos;s island architecture</p>
        </div>
      </div>

      <p className="lead">
        Astro&apos;s content-focused architecture pairs perfectly with Cloudify&apos;s edge network.
        Deploy static sites, server-rendered pages, or hybrid apps with zero configuration.
      </p>

      <div className="not-prose p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 my-8">
        <div className="flex items-start gap-4">
          <Zap className="h-8 w-8 text-orange-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-2">
              Zero JavaScript by Default
            </h3>
            <p className="text-[var(--text-secondary)]">
              Astro ships zero JavaScript by default, only hydrating interactive components.
              Perfect for content-heavy sites that need to be fast.
            </p>
          </div>
        </div>
      </div>

      <h2>Features</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          "Static Site Generation",
          "Server-Side Rendering",
          "Hybrid Rendering",
          "Island Architecture",
          "Content Collections",
          "Image Optimization",
          "View Transitions",
          "Multiple UI Frameworks",
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-primary)]">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <span className="text-[var(--text-primary)]">{feature}</span>
          </div>
        ))}
      </div>

      <h2>Quick Start</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`npm create astro@latest my-astro-site
cd my-astro-site
cloudify deploy`}</code>
      </pre>

      <h2>Build Settings</h2>

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
            <td><code>npm run build</code></td>
          </tr>
          <tr>
            <td>Output Directory</td>
            <td><code>dist</code></td>
          </tr>
          <tr>
            <td>Install Command</td>
            <td><code>npm install</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Output Modes</h2>

      <h3>Static (Default)</h3>

      <p>
        Pre-renders all pages at build time. Best for content sites, blogs, and documentation.
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// astro.config.mjs
export default defineConfig({
  output: 'static' // Default
})`}</code>
      </pre>

      <h3>Server (SSR)</h3>

      <p>
        Renders pages on-demand. Requires an adapter for deployment.
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// astro.config.mjs
import cloudify from '@astrojs/cloudify';

export default defineConfig({
  output: 'server',
  adapter: cloudify()
})`}</code>
      </pre>

      <h3>Hybrid</h3>

      <p>
        Pre-render most pages, but allow specific pages to be server-rendered.
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// astro.config.mjs
import cloudify from '@astrojs/cloudify';

export default defineConfig({
  output: 'hybrid',
  adapter: cloudify()
})

// pages/dynamic.astro
export const prerender = false; // This page renders on-demand`}</code>
      </pre>

      <h2>Using UI Frameworks</h2>

      <p>
        Astro supports multiple UI frameworks in the same project:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [react(), vue(), svelte()]
})`}</code>
      </pre>

      <h3>Client Directives</h3>

      <p>
        Control when components hydrate:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`---
import Counter from './Counter.jsx';
---

<!-- Hydrate immediately -->
<Counter client:load />

<!-- Hydrate when visible -->
<Counter client:visible />

<!-- Hydrate when idle -->
<Counter client:idle />

<!-- Hydrate on specific media query -->
<Counter client:media="(max-width: 768px)" />`}</code>
      </pre>

      <h2>Content Collections</h2>

      <p>
        Organize and query your content with type safety:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };`}</code>
      </pre>

      <h2>API Routes</h2>

      <p>
        Create API endpoints in the <code>pages/api</code> directory:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// src/pages/api/hello.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ params, request }) => {
  return new Response(JSON.stringify({
    message: 'Hello from Astro!'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}`}</code>
      </pre>

      <h2>Environment Variables</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// Server-side (secrets)
const apiKey = import.meta.env.API_KEY;

// Client-side (public)
const publicKey = import.meta.env.PUBLIC_API_URL;`}</code>
      </pre>

      <h2>Image Optimization</h2>

      <p>
        Use Astro&apos;s built-in image component:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`---
import { Image } from 'astro:assets';
import hero from '../images/hero.jpg';
---

<Image src={hero} alt="Hero image" width={800} />`}</code>
      </pre>

      <div className="not-prose mt-12">
        <Button variant="default" asChild>
          <Link href="/new">
            Deploy Your Astro Site
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
