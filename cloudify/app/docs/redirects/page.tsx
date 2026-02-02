"use client";

import Link from "next/link";
import { ArrowRight, Check, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RedirectsDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Redirects</h1>

      <p className="lead">
        Configure URL redirects to handle moved content, enforce canonical URLs,
        or redirect users based on conditions.
      </p>

      <h2>Configuration</h2>

      <p>
        Define redirects in your <code>cloudify.json</code> configuration file:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    },
    {
      "source": "/blog/:slug",
      "destination": "/posts/:slug",
      "permanent": false
    }
  ]
}`}</code>
      </pre>

      <h2>Redirect Types</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <code className="text-blue-600 dark:text-blue-400 font-semibold">permanent: true</code>
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              308
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permanent redirect. Browsers and search engines cache this redirect.
            Use for content that has permanently moved.
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <code className="text-blue-600 dark:text-blue-400 font-semibold">permanent: false</code>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
              307
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Temporary redirect. Not cached by browsers.
            Use for A/B testing or temporary redirects.
          </p>
        </div>
      </div>

      <h2>Path Patterns</h2>

      <h3>Static Paths</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/about-us",
      "destination": "/about",
      "permanent": true
    }
  ]
}`}</code>
      </pre>

      <h3>Dynamic Segments</h3>

      <p>
        Use <code>:param</code> to capture path segments:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/users/:id/profile",
      "destination": "/profile/:id",
      "permanent": true
    },
    {
      "source": "/blog/:year/:month/:slug",
      "destination": "/posts/:slug",
      "permanent": true
    }
  ]
}`}</code>
      </pre>

      <h3>Wildcard Patterns</h3>

      <p>
        Use <code>*</code> to match any path:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/docs/:path*",
      "destination": "/documentation/:path*",
      "permanent": true
    },
    {
      "source": "/old-site/:path*",
      "destination": "https://archive.example.com/:path*",
      "permanent": true
    }
  ]
}`}</code>
      </pre>

      <h3>Regex Patterns</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/post/:id(\\\\d+)",
      "destination": "/blog/:id",
      "permanent": true
    }
  ]
}`}</code>
      </pre>

      <h2>External Redirects</h2>

      <p>
        Redirect to external URLs:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/github",
      "destination": "https://github.com/your-org",
      "permanent": false
    },
    {
      "source": "/twitter",
      "destination": "https://twitter.com/your-handle",
      "permanent": false
    }
  ]
}`}</code>
      </pre>

      <h2>Conditional Redirects</h2>

      <h3>Based on Headers</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/",
      "destination": "/mobile",
      "permanent": false,
      "has": [
        {
          "type": "header",
          "key": "user-agent",
          "value": ".*Mobile.*"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h3>Based on Query Parameters</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/search",
      "destination": "/search/advanced",
      "permanent": false,
      "has": [
        {
          "type": "query",
          "key": "advanced",
          "value": "true"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h3>Based on Cookies</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/login",
      "permanent": false,
      "missing": [
        {
          "type": "cookie",
          "key": "session"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Common Use Cases</h2>

      <h3>www to non-www</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://example.com/:path*",
      "permanent": true,
      "has": [
        {
          "type": "host",
          "value": "www.example.com"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h3>Trailing Slash Handling</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "trailingSlash": false,
  "redirects": [
    {
      "source": "/:path+/",
      "destination": "/:path+",
      "permanent": true
    }
  ]
}`}</code>
      </pre>

      <h3>Language Redirects</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "redirects": [
    {
      "source": "/",
      "destination": "/fr",
      "permanent": false,
      "has": [
        {
          "type": "header",
          "key": "accept-language",
          "value": "fr.*"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Redirect Order</h2>

      <p>
        Redirects are processed in the following order:
      </p>

      <ol>
        <li>Filesystem routes (pages, static files)</li>
        <li>Redirects defined in cloudify.json</li>
        <li>Rewrites defined in cloudify.json</li>
        <li>Dynamic routes</li>
      </ol>

      <div className="not-prose p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 my-8">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
          Performance Tip
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Redirects are processed at the edge, ensuring minimal latency. However,
          too many redirects can impact performance. Consider consolidating redirect
          rules when possible.
        </p>
      </div>

      <h2>Debugging Redirects</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Check redirect response
curl -I https://example.com/old-page

HTTP/2 308
location: https://example.com/new-page
x-cloudify-redirect: true`}</code>
      </pre>

      <div className="not-prose mt-12">
        <Button variant="primary" asChild>
          <Link href="/docs/rewrites">
            Learn About Rewrites
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
