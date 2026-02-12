"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ArrowRight,
  Rocket,
  GitBranch,
  Globe,
  Terminal,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CodeBlock({ code, id }: { code: string; id: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 text-[var(--text-secondary)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied === id ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

const steps = [
  {
    number: 1,
    title: "Create an Account",
    description:
      "Sign up for a free Cloudify account. You can sign up with your email or connect via GitHub for seamless repository access.",
  },
  {
    number: 2,
    title: "Connect Your Repository",
    description:
      "Link your GitHub, GitLab, or Bitbucket account. Cloudify will list your repositories so you can select which one to deploy.",
  },
  {
    number: 3,
    title: "Configure Your Project",
    description:
      "Cloudify auto-detects your framework and configures build settings. Review the build command, output directory, and environment variables.",
  },
  {
    number: 4,
    title: "Deploy",
    description:
      "Hit deploy and watch your project build in real-time. Cloudify clones your repository, installs dependencies, runs the build, and serves your site globally.",
  },
];

const nextSteps = [
  {
    icon: Globe,
    title: "Add a Custom Domain",
    description: "Connect your own domain with automatic SSL certificates.",
    href: "/docs/domains",
  },
  {
    icon: Settings,
    title: "Environment Variables",
    description: "Configure secrets and environment-specific settings.",
    href: "/docs/environment-variables",
  },
  {
    icon: GitBranch,
    title: "Preview Deployments",
    description: "Get a unique URL for every pull request automatically.",
    href: "/docs/previews",
  },
  {
    icon: Terminal,
    title: "CLI Reference",
    description: "Deploy and manage projects from the command line.",
    href: "/docs/cli",
  },
  {
    icon: Shield,
    title: "Security Best Practices",
    description: "Protect your deployments and sensitive data.",
    href: "/docs/security",
  },
  {
    icon: Rocket,
    title: "Serverless Functions",
    description: "Add backend APIs alongside your frontend project.",
    href: "/docs/functions",
  },
];

export default function GettingStartedPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Getting Started with Cloudify</h1>

      <p className="lead">
        Go from zero to deployed in under 5 minutes. This guide walks you
        through everything you need to start deploying web applications with
        Cloudify.
      </p>

      <h2>Prerequisites</h2>

      <ul>
        <li>
          <strong>Git provider account</strong> -- GitHub, GitLab, or Bitbucket
        </li>
        <li>
          <strong>A web project</strong> -- any framework (Next.js, React, Vue,
          Astro, etc.) or static site
        </li>
        <li>
          <strong>Node.js 18+</strong> -- for local development (optional)
        </li>
      </ul>

      <h2>Deployment Walkthrough</h2>

      <div className="not-prose space-y-8 my-8">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-lg">
              {step.number}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                {step.title}
              </h3>
              <p className="text-[var(--text-secondary)]">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Deploy via CLI</h2>

      <p>
        Prefer working from the terminal? Install the Cloudify CLI and deploy
        with a single command.
      </p>

      <h3>1. Install the CLI</h3>

      <div className="not-prose my-4">
        <Tabs defaultValue="npm">
          <TabsList>
            <TabsTrigger value="npm">npm</TabsTrigger>
            <TabsTrigger value="yarn">yarn</TabsTrigger>
            <TabsTrigger value="pnpm">pnpm</TabsTrigger>
          </TabsList>
          <TabsContent value="npm" className="mt-3">
            <CodeBlock code="npm install -g cloudify-cli" id="npm-install" />
          </TabsContent>
          <TabsContent value="yarn" className="mt-3">
            <CodeBlock
              code="yarn global add cloudify-cli"
              id="yarn-install"
            />
          </TabsContent>
          <TabsContent value="pnpm" className="mt-3">
            <CodeBlock code="pnpm add -g cloudify-cli" id="pnpm-install" />
          </TabsContent>
        </Tabs>
      </div>

      <h3>2. Authenticate</h3>

      <div className="not-prose my-4">
        <CodeBlock code="cloudify login" id="login" />
      </div>

      <p>
        This opens a browser window where you authorize the CLI with your
        Cloudify account.
      </p>

      <h3>3. Deploy your project</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`# Navigate to your project\ncd my-project\n\n# Deploy to production\ncloudify --prod`}
          id="deploy"
        />
      </div>

      <p>
        Cloudify will detect your framework, build your project, and deploy it
        to a <code>.cloudify.app</code> URL.
      </p>

      <h2>Supported Frameworks</h2>

      <p>
        Cloudify auto-detects and optimizes builds for these frameworks:
      </p>

      <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        {[
          { name: "Next.js", href: "/docs/frameworks/nextjs" },
          { name: "React", href: "/docs/frameworks/react" },
          { name: "Vue / Nuxt", href: "/docs/frameworks/vue" },
          { name: "Astro", href: "/docs/frameworks/astro" },
          { name: "Svelte / SvelteKit", href: "#" },
          { name: "Angular", href: "#" },
          { name: "Remix", href: "#" },
          { name: "Static HTML", href: "#" },
        ].map((fw) => (
          <Link
            key={fw.name}
            href={fw.href}
            className="px-4 py-3 rounded-lg border border-[var(--border-primary)] hover:border-foreground text-center text-sm font-medium text-[var(--text-primary)] transition-colors"
          >
            {fw.name}
          </Link>
        ))}
      </div>

      <h2>Troubleshooting</h2>

      <h3>Build fails with &quot;command not found&quot;</h3>
      <p>
        Make sure your <code>package.json</code> has a valid{" "}
        <code>build</code> script. Cloudify runs <code>npm run build</code> by
        default.
      </p>

      <h3>Environment variables not available at build time</h3>
      <p>
        Add your environment variables in the project settings before deploying.
        Variables prefixed with <code>NEXT_PUBLIC_</code> (for Next.js) are
        available at build time.
      </p>

      <h3>Deploy succeeds but site shows 404</h3>
      <p>
        Check that your output directory is correct. For Next.js it is{" "}
        <code>.next</code>, for Vite/React it is <code>dist</code>, and for
        Astro it is <code>dist</code>.
      </p>

      <h2>Next Steps</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {nextSteps.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="p-4 rounded-lg border border-[var(--border-primary)] hover:border-foreground transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="h-4 w-4 text-[var(--text-primary)]" />
              <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[#0070f3]">
                {item.title}
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="not-prose mt-8">
        <Button variant="default" asChild>
          <Link href="/docs/quick-start">
            Quick Start Guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
