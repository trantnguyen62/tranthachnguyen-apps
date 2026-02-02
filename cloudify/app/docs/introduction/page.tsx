"use client";

import Link from "next/link";
import { ArrowRight, Zap, Globe, Shield, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntroductionPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Introduction to Cloudify</h1>

      <p className="lead">
        Cloudify is the platform for deploying and scaling modern web applications.
        Build, preview, and ship your projects with zero configuration.
      </p>

      <h2>What is Cloudify?</h2>

      <p>
        Cloudify provides the developer tools, cloud infrastructure, and AI
        capabilities to build, scale, and secure a faster, more personalized web.
        With automatic deployments from Git, serverless functions at the edge,
        and a global CDN, Cloudify makes it easy to ship your best work.
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Zap className="h-8 w-8 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Instant Deployments
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Push to Git and your site is live. Preview deployments for every pull request.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Globe className="h-8 w-8 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Global Edge Network
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Serve your content from 100+ edge locations worldwide for the fastest experience.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Cpu className="h-8 w-8 text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Serverless Functions
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Run backend code without managing servers. Scale automatically from zero to millions.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Shield className="h-8 w-8 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Enterprise Security
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Automatic HTTPS, DDoS protection, and SOC 2 compliance built-in.
          </p>
        </div>
      </div>

      <h2>How It Works</h2>

      <ol>
        <li>
          <strong>Connect your repository</strong> - Link your GitHub, GitLab, or Bitbucket account to import your project.
        </li>
        <li>
          <strong>Configure your build</strong> - Cloudify automatically detects your framework and configures the build settings.
        </li>
        <li>
          <strong>Deploy</strong> - Every push to your main branch triggers a production deployment. Pull requests get preview URLs.
        </li>
        <li>
          <strong>Scale</strong> - Your application automatically scales globally with our edge network.
        </li>
      </ol>

      <h2>Supported Frameworks</h2>

      <p>
        Cloudify supports all major frontend frameworks out of the box with zero configuration:
      </p>

      <ul>
        <li><strong>Next.js</strong> - Full support including App Router, Server Components, and ISR</li>
        <li><strong>React</strong> - Create React App, Vite, and custom configurations</li>
        <li><strong>Vue</strong> - Vue 3, Nuxt, and Vite-based projects</li>
        <li><strong>Svelte</strong> - SvelteKit and vanilla Svelte</li>
        <li><strong>Astro</strong> - Static and server-rendered Astro sites</li>
        <li><strong>Angular</strong> - Angular Universal and static Angular apps</li>
        <li><strong>And more...</strong> - Any static site generator or custom build process</li>
      </ul>

      <h2>Getting Started</h2>

      <p>
        Ready to deploy your first project? Follow our quick start guide to get up and running in under 5 minutes.
      </p>

      <div className="not-prose mt-8">
        <Button variant="primary" asChild>
          <Link href="/docs/quick-start">
            Quick Start Guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
