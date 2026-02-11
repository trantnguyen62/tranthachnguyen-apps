"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeadersDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Custom Headers</h1>

      <p className="lead">
        Configure custom HTTP headers to control caching, security policies,
        and other response behaviors for your deployments.
      </p>

      <h2>Configuration</h2>

      <p>
        Define custom headers in your <code>cloudify.json</code> configuration file:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Security Headers</h2>

      <div className="not-prose p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 my-8">
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 text-green-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground text-lg mb-2">
              Recommended Security Headers
            </h3>
            <p className="text-muted-foreground">
              These headers help protect your application from common web vulnerabilities.
            </p>
          </div>
        </div>
      </div>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "on"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Content Security Policy</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h3>CSP Directives</h3>

      <div className="not-prose my-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Directive</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 px-4 text-muted-foreground"><code>default-src</code></td>
              <td className="py-3 px-4 text-muted-foreground">Fallback for other directives</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 text-muted-foreground"><code>script-src</code></td>
              <td className="py-3 px-4 text-muted-foreground">JavaScript sources</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 text-muted-foreground"><code>style-src</code></td>
              <td className="py-3 px-4 text-muted-foreground">CSS sources</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 text-muted-foreground"><code>img-src</code></td>
              <td className="py-3 px-4 text-muted-foreground">Image sources</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 text-muted-foreground"><code>connect-src</code></td>
              <td className="py-3 px-4 text-muted-foreground">Fetch, XHR, WebSocket sources</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 text-muted-foreground"><code>frame-ancestors</code></td>
              <td className="py-3 px-4 text-muted-foreground">Embedding sources (iframe)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Caching Headers</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, stale-while-revalidate=86400"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h3>Cache-Control Directives</h3>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { directive: "public", desc: "Response can be cached by any cache" },
          { directive: "private", desc: "Response is for a single user only" },
          { directive: "max-age=N", desc: "Cache for N seconds" },
          { directive: "s-maxage=N", desc: "CDN cache time (overrides max-age)" },
          { directive: "no-store", desc: "Never cache the response" },
          { directive: "no-cache", desc: "Revalidate before using cache" },
          { directive: "immutable", desc: "Content will never change" },
          { directive: "stale-while-revalidate=N", desc: "Serve stale while fetching" },
        ].map((item) => (
          <div key={item.directive} className="p-4 rounded-lg bg-background border border-border">
            <code className="text-foreground font-semibold">{item.directive}</code>
            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2>CORS Headers</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://example.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Path Patterns</h2>

      <h3>Exact Path</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "source": "/robots.txt",
  "headers": [...]
}`}</code>
      </pre>

      <h3>Wildcard</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "source": "/assets/:path*",
  "headers": [...]
}`}</code>
      </pre>

      <h3>File Extension</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "source": "/:path*.js",
  "headers": [...]
}`}</code>
      </pre>

      <h2>Common Patterns</h2>

      <h3>Prevent Clickjacking</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'none'"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h3>Allow Specific Embedding</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "headers": [
    {
      "source": "/embed/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "ALLOW-FROM https://partner.com"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Debugging Headers</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# View response headers
curl -I https://example.com

# View all headers (verbose)
curl -v https://example.com 2>&1 | grep -E '^<'`}</code>
      </pre>

      <div className="not-prose mt-12">
        <Button variant="default" asChild>
          <Link href="/docs/redirects">
            Configure Redirects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
