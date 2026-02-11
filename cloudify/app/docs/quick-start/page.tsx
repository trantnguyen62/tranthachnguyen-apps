"use client";

import Link from "next/link";
import { ArrowRight, Terminal, Github, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function QuickStartPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Quick Start</h1>

      <p className="lead">
        Deploy your first project to Cloudify in under 5 minutes. This guide walks you through
        the fastest way to get started.
      </p>

      <h2>Prerequisites</h2>

      <ul>
        <li>A GitHub, GitLab, or Bitbucket account</li>
        <li>A project repository (or use one of our templates)</li>
        <li>Node.js 18+ (for local development)</li>
      </ul>

      <h2>Step 1: Sign Up</h2>

      <p>
        Create a free Cloudify account by signing up with your Git provider. This allows
        Cloudify to access your repositories for deployment.
      </p>

      <div className="not-prose my-6">
        <Button variant="default" asChild>
          <Link href="/signup">
            <Github className="h-4 w-4" />
            Sign Up with GitHub
          </Link>
        </Button>
      </div>

      <h2>Step 2: Import Your Project</h2>

      <p>
        Once signed in, click the &quot;New Project&quot; button. You can either:
      </p>

      <ul>
        <li><strong>Import from Git</strong> - Select a repository from your connected Git account</li>
        <li><strong>Use a Template</strong> - Start with one of our pre-built templates</li>
        <li><strong>Deploy with CLI</strong> - Use the Cloudify CLI to deploy from your terminal</li>
      </ul>

      <h2>Step 3: Configure Build Settings</h2>

      <p>
        Cloudify automatically detects your framework and configures the build settings.
        For most projects, the defaults work perfectly. You can customize:
      </p>

      <ul>
        <li><strong>Build Command</strong> - The command to build your project (e.g., <code>npm run build</code>)</li>
        <li><strong>Output Directory</strong> - Where your built files are located (e.g., <code>.next</code>, <code>dist</code>)</li>
        <li><strong>Root Directory</strong> - For monorepos, specify the project root</li>
        <li><strong>Environment Variables</strong> - Add any required environment variables</li>
      </ul>

      <h2>Step 4: Deploy</h2>

      <p>
        Click &quot;Deploy&quot; and watch your project build in real-time. Cloudify will:
      </p>

      <ol>
        <li>Clone your repository</li>
        <li>Install dependencies</li>
        <li>Run your build command</li>
        <li>Deploy to our global edge network</li>
      </ol>

      <p>
        Your project will be live at a <code>.cloudify.app</code> URL within minutes.
      </p>

      <h2>Alternative: Deploy with CLI</h2>

      <p>
        For a more hands-on approach, use the Cloudify CLI to deploy directly from your terminal.
      </p>

      <h3>Install the CLI</h3>

      <div className="not-prose my-4">
        <CodeBlock code="npm install -g cloudify-cli" />
      </div>

      <h3>Login</h3>

      <div className="not-prose my-4">
        <CodeBlock code="cloudify login" />
      </div>

      <h3>Deploy</h3>

      <p>Navigate to your project directory and run:</p>

      <div className="not-prose my-4">
        <CodeBlock code="cloudify deploy" />
      </div>

      <p>
        That&apos;s it! Your project is now live on Cloudify.
      </p>

      <h2>Next Steps</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <Link
          href="/docs/git"
          className="p-4 rounded-lg border border-border hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
        >
          <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3]">
            Git Integration
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set up automatic deployments from your repository
          </p>
        </Link>

        <Link
          href="/docs/environment-variables"
          className="p-4 rounded-lg border border-border hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
        >
          <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3]">
            Environment Variables
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure secrets and environment-specific settings
          </p>
        </Link>

        <Link
          href="/docs/domains"
          className="p-4 rounded-lg border border-border hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
        >
          <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3]">
            Custom Domains
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add your own domain to your deployment
          </p>
        </Link>

        <Link
          href="/docs/functions"
          className="p-4 rounded-lg border border-border hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
        >
          <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3]">
            Serverless Functions
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add backend APIs to your frontend project
          </p>
        </Link>
      </div>
    </article>
  );
}
