"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VueDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <div className="not-prose flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#42b883] flex items-center justify-center">
          <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0">Vue on Cloudify</h1>
          <p className="text-gray-600 dark:text-gray-400 m-0 mt-1">Deploy Vue.js applications with optimal performance</p>
        </div>
      </div>

      <p className="lead">
        Cloudify provides first-class support for Vue.js applications, including Vue 3,
        Nuxt, and Vite-based projects with automatic optimization.
      </p>

      <h2>Supported Vue Setups</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { name: "Vue 3 + Vite", desc: "Recommended for new projects" },
          { name: "Nuxt 3", desc: "Full-stack Vue framework" },
          { name: "Vue CLI", desc: "Classic Vue CLI projects" },
          { name: "Vue 2", desc: "Legacy Vue 2 support" },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Quick Start</h2>

      <h3>Vue 3 + Vite</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`npm create vue@latest my-app
cd my-app
npm install
cloudify deploy`}</code>
      </pre>

      <h3>Nuxt 3</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`npx nuxi@latest init my-nuxt-app
cd my-nuxt-app
npm install
cloudify deploy`}</code>
      </pre>

      <h2>Build Settings</h2>

      <h3>Vue 3 + Vite</h3>

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

      <h3>Nuxt 3</h3>

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
            <td><code>.output</code></td>
          </tr>
          <tr>
            <td>Install Command</td>
            <td><code>npm install</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Nuxt 3 Features</h2>

      <p>
        Cloudify fully supports Nuxt 3 features:
      </p>

      <ul>
        <li><strong>Server-side rendering (SSR)</strong> - Automatic SSR with serverless functions</li>
        <li><strong>Static site generation (SSG)</strong> - Pre-render pages at build time</li>
        <li><strong>Hybrid rendering</strong> - Mix SSR and SSG per route</li>
        <li><strong>API routes</strong> - Server routes in <code>/server/api</code></li>
        <li><strong>Edge rendering</strong> - Deploy to the edge with Nitro</li>
      </ul>

      <h3>Nuxt Configuration</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// nuxt.config.ts
export default defineNuxtConfig({
  // Static site generation
  ssr: true,

  // Or for static export
  // ssr: false,

  nitro: {
    preset: 'cloudify' // Optional: use Cloudify preset
  }
})`}</code>
      </pre>

      <h2>Environment Variables</h2>

      <p>
        Vue/Vite uses the <code>VITE_</code> prefix for client-side variables:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// In Cloudify dashboard
VITE_API_URL=https://api.example.com

// In your Vue code
const apiUrl = import.meta.env.VITE_API_URL`}</code>
      </pre>

      <h3>Nuxt Runtime Config</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (server-side only)
    apiSecret: process.env.API_SECRET,

    // Public keys (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE
    }
  }
})

// In your component
const config = useRuntimeConfig()
console.log(config.public.apiBase)`}</code>
      </pre>

      <h2>Vue Router Configuration</h2>

      <p>
        For Vue SPA with Vue Router, configure rewrites for history mode:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// cloudify.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}</code>
      </pre>

      <h2>API Routes with Nuxt</h2>

      <p>
        Create API endpoints in the <code>/server/api</code> directory:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// server/api/hello.ts
export default defineEventHandler((event) => {
  return {
    message: 'Hello from Nuxt API!'
  }
})

// In your Vue component
const { data } = await useFetch('/api/hello')`}</code>
      </pre>

      <h2>Performance Tips</h2>

      <ul>
        <li><strong>Code splitting</strong> - Use dynamic imports for large components</li>
        <li><strong>Lazy loading</strong> - Lazy load routes with <code>defineAsyncComponent</code></li>
        <li><strong>Image optimization</strong> - Use <code>nuxt/image</code> for Nuxt projects</li>
        <li><strong>Caching</strong> - Configure route rules for optimal caching</li>
      </ul>

      <div className="not-prose mt-12">
        <Button variant="primary" asChild>
          <Link href="/new">
            Deploy Your Vue App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
