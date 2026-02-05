import Link from "next/link";
import { Callout } from "@/components/Callout";

export default function GettingStartedPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Introduction to Cloudify</h1>

      <p className="lead">
        Cloudify is a modern deployment platform designed for frontend developers.
        Deploy your web applications, serverless functions, and static sites with
        zero configuration.
      </p>

      <h2>What is Cloudify?</h2>

      <p>
        Cloudify provides a complete platform for deploying and hosting modern web
        applications. Whether you're building a Next.js app, a React SPA, or a
        static website, Cloudify handles the infrastructure so you can focus on
        building great products.
      </p>

      <h2>Key Features</h2>

      <ul>
        <li>
          <strong>Instant Deployments</strong> - Push your code and get a live URL
          in seconds with automatic builds
        </li>
        <li>
          <strong>Preview Deployments</strong> - Every pull request gets its own
          preview URL for easy collaboration
        </li>
        <li>
          <strong>Edge Functions</strong> - Run serverless functions at the edge
          for low-latency API endpoints
        </li>
        <li>
          <strong>Blob Storage</strong> - Store and serve files with our
          S3-compatible storage
        </li>
        <li>
          <strong>KV Store</strong> - Fast key-value storage for caching and
          session data
        </li>
        <li>
          <strong>Analytics</strong> - Built-in Web Vitals and visitor tracking
        </li>
        <li>
          <strong>Custom Domains</strong> - Connect your own domains with
          automatic SSL
        </li>
      </ul>

      <Callout type="info" title="Ready to get started?">
        Follow our <Link href="/getting-started/quick-start">Quick Start guide</Link> to
        deploy your first project in under 5 minutes.
      </Callout>

      <h2>How It Works</h2>

      <ol>
        <li>
          <strong>Connect your repository</strong> - Link your GitHub repository
          to Cloudify
        </li>
        <li>
          <strong>Configure your build</strong> - Cloudify auto-detects your
          framework and sets up the build
        </li>
        <li>
          <strong>Deploy</strong> - Push to your repository and Cloudify
          automatically deploys your changes
        </li>
        <li>
          <strong>Monitor</strong> - Track performance with built-in analytics
          and monitoring
        </li>
      </ol>

      <h2>Supported Frameworks</h2>

      <p>Cloudify supports all major frontend frameworks out of the box:</p>

      <div className="grid grid-cols-2 gap-4 not-prose my-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Next.js</h3>
          <p className="text-sm text-gray-600">
            Full support including SSR, API routes, and ISR
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">React</h3>
          <p className="text-sm text-gray-600">
            Vite, Create React App, and custom setups
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Vue.js</h3>
          <p className="text-sm text-gray-600">
            Nuxt, Vite, and Vue CLI projects
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Static Sites</h3>
          <p className="text-sm text-gray-600">
            HTML, Astro, Hugo, Jekyll, and more
          </p>
        </div>
      </div>

      <h2>Next Steps</h2>

      <ul>
        <li>
          <Link href="/getting-started/quick-start">Quick Start</Link> - Deploy
          your first project
        </li>
        <li>
          <Link href="/getting-started/first-deployment">
            Your First Deployment
          </Link>{" "}
          - Detailed walkthrough
        </li>
        <li>
          <Link href="/deployments">Deployments</Link> - Learn about deployment
          options
        </li>
      </ul>
    </article>
  );
}
