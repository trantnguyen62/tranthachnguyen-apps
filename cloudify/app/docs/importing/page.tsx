"use client";

import { Github, FolderGit2, Upload, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ImportingPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Importing a Project</h1>

      <p className="lead">
        Import your existing project to Cloudify from Git or deploy directly from
        your local machine.
      </p>

      <h2>Import Methods</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Github className="h-8 w-8 text-gray-900 dark:text-white mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">From Git</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Connect GitHub, GitLab, or Bitbucket and import any repository.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <FolderGit2 className="h-8 w-8 text-blue-500 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">From Template</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Start with a pre-built template and customize from there.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Upload className="h-8 w-8 text-green-500 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">From CLI</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Deploy directly from your local machine using the Cloudify CLI.
          </p>
        </div>
      </div>

      <h2>Importing from Git</h2>

      <h3>Step 1: Connect Your Git Provider</h3>

      <p>
        If you haven&apos;t already, connect your Git provider to Cloudify:
      </p>

      <ol>
        <li>Go to your Account Settings → Git Integration</li>
        <li>Click &quot;Connect&quot; next to your preferred provider</li>
        <li>Authorize Cloudify to access your repositories</li>
      </ol>

      <h3>Step 2: Select a Repository</h3>

      <ol>
        <li>Click &quot;New Project&quot; from your dashboard</li>
        <li>Select &quot;Import Git Repository&quot;</li>
        <li>Choose the repository you want to import</li>
        <li>Click &quot;Import&quot;</li>
      </ol>

      <h3>Step 3: Configure Your Project</h3>

      <p>Cloudify will automatically detect your framework and suggest build settings:</p>

      <ul>
        <li><strong>Project Name</strong> - Used for your deployment URL</li>
        <li><strong>Root Directory</strong> - For monorepos, specify the app location</li>
        <li><strong>Build Command</strong> - Usually auto-detected (e.g., <code>npm run build</code>)</li>
        <li><strong>Output Directory</strong> - Where your built files are located</li>
        <li><strong>Environment Variables</strong> - Add any required variables</li>
      </ul>

      <h2>Framework Detection</h2>

      <p>
        Cloudify automatically detects these frameworks and configures optimal settings:
      </p>

      <table>
        <thead>
          <tr>
            <th>Framework</th>
            <th>Build Command</th>
            <th>Output Directory</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Next.js</td>
            <td><code>next build</code></td>
            <td><code>.next</code></td>
          </tr>
          <tr>
            <td>Create React App</td>
            <td><code>react-scripts build</code></td>
            <td><code>build</code></td>
          </tr>
          <tr>
            <td>Vite</td>
            <td><code>vite build</code></td>
            <td><code>dist</code></td>
          </tr>
          <tr>
            <td>Astro</td>
            <td><code>astro build</code></td>
            <td><code>dist</code></td>
          </tr>
          <tr>
            <td>Nuxt</td>
            <td><code>nuxt build</code></td>
            <td><code>.output</code></td>
          </tr>
          <tr>
            <td>SvelteKit</td>
            <td><code>vite build</code></td>
            <td><code>build</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Monorepo Support</h2>

      <p>
        For monorepos, specify the root directory of your application:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`my-monorepo/
├── apps/
│   ├── web/          ← Set this as Root Directory
│   │   ├── package.json
│   │   └── ...
│   └── docs/
├── packages/
└── package.json`}</code>
      </pre>

      <p>
        Cloudify supports Turborepo, Nx, Lerna, and pnpm workspaces.
      </p>

      <h2>Import from Template</h2>

      <p>
        Start with a pre-built template:
      </p>

      <ol>
        <li>Visit the Templates page</li>
        <li>Find a template that matches your needs</li>
        <li>Click &quot;Deploy&quot;</li>
        <li>A new repository will be created in your Git account</li>
        <li>The project will be automatically deployed</li>
      </ol>

      <div className="not-prose mt-8">
        <Button variant="outline" asChild>
          <Link href="/templates">
            Browse Templates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <h2>Deploy from CLI</h2>

      <p>
        For projects not in Git, or for quick deployments:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Install the CLI
npm install -g cloudify-cli

# Login to your account
cloudify login

# Navigate to your project
cd my-project

# Deploy
cloudify deploy`}</code>
      </pre>

      <p>
        This creates a deployment without Git integration. For production use,
        we recommend connecting to Git for automatic deployments.
      </p>
    </article>
  );
}
