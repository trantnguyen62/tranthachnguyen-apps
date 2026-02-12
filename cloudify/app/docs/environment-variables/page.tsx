"use client";

import { Shield, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function EnvironmentVariablesPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Environment Variables</h1>

      <p className="lead">
        Environment variables allow you to configure your application without hardcoding
        sensitive information. Cloudify provides a secure way to manage environment variables
        for different deployment environments.
      </p>

      <h2>Overview</h2>

      <p>
        Environment variables are key-value pairs that are injected into your application
        at build time and/or runtime. Common use cases include:
      </p>

      <ul>
        <li>API keys and secrets</li>
        <li>Database connection strings</li>
        <li>Third-party service credentials</li>
        <li>Feature flags</li>
        <li>Environment-specific configuration</li>
      </ul>

      <h2>Adding Environment Variables</h2>

      <h3>Via Dashboard</h3>

      <ol>
        <li>Navigate to your project settings</li>
        <li>Click on the &quot;Environment Variables&quot; tab</li>
        <li>Add your variable name and value</li>
        <li>Select which environments should have access</li>
        <li>Click &quot;Save&quot;</li>
      </ol>

      <h3>Via CLI</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Add a variable
cloudify env add DATABASE_URL "postgres://..."

# Add a variable for specific environment
cloudify env add API_KEY "sk-..." --environment production

# List all variables
cloudify env ls

# Remove a variable
cloudify env rm DATABASE_URL`}</code>
      </pre>

      <h2>Environment Types</h2>

      <p>
        Cloudify supports three environment types for your variables:
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-6 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)]">
          <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Production</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Variables available only in production deployments from your main branch.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)]">
          <div className="h-10 w-10 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
            <Eye className="h-5 w-5 text-[var(--text-primary)]" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Preview</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Variables available in preview deployments from pull requests and branches.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)]">
          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Development</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Variables for local development. Pulled with <code>cloudify env pull</code>.
          </p>
        </div>
      </div>

      <h2>Sensitive Variables</h2>

      <p>
        By default, environment variables are marked as sensitive. Sensitive variables:
      </p>

      <ul>
        <li>Are encrypted at rest</li>
        <li>Cannot be viewed after being set (only edited)</li>
        <li>Are not exposed in build logs</li>
        <li>Are not sent to the browser (server-side only)</li>
      </ul>

      <div className="not-prose p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 my-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              Security Warning
            </h3>
            <p className="text-[var(--text-secondary)] text-sm">
              Never expose sensitive variables to the browser. Variables prefixed with
              <code className="mx-1">NEXT_PUBLIC_</code> or <code className="mx-1">VITE_</code>
              are bundled into your client-side code and visible to anyone.
            </p>
          </div>
        </div>
      </div>

      <h2>System Environment Variables</h2>

      <p>
        Cloudify automatically provides these system variables during build and runtime:
      </p>

      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>CLOUDIFY</code></td>
            <td>Always <code>1</code> when running on Cloudify</td>
          </tr>
          <tr>
            <td><code>CLOUDIFY_ENV</code></td>
            <td><code>production</code>, <code>preview</code>, or <code>development</code></td>
          </tr>
          <tr>
            <td><code>CLOUDIFY_URL</code></td>
            <td>The deployment URL (e.g., <code>https://my-app.cloudify.app</code>)</td>
          </tr>
          <tr>
            <td><code>CLOUDIFY_GIT_COMMIT_SHA</code></td>
            <td>The Git commit SHA that triggered the build</td>
          </tr>
          <tr>
            <td><code>CLOUDIFY_GIT_COMMIT_REF</code></td>
            <td>The Git branch or tag name</td>
          </tr>
          <tr>
            <td><code>CLOUDIFY_GIT_REPO_SLUG</code></td>
            <td>The repository slug (e.g., <code>owner/repo</code>)</td>
          </tr>
        </tbody>
      </table>

      <h2>Local Development</h2>

      <p>
        To use your environment variables locally, create a <code>.env.local</code> file
        in your project root. You can also pull your variables from Cloudify:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Pull all development environment variables
cloudify env pull .env.local

# Pull production variables (requires additional confirmation)
cloudify env pull .env.local --environment production`}</code>
      </pre>

      <h2>Best Practices</h2>

      <ul>
        <li>
          <strong>Never commit secrets</strong> - Add <code>.env.local</code> to your
          <code>.gitignore</code>
        </li>
        <li>
          <strong>Use different values per environment</strong> - Production should use
          production credentials
        </li>
        <li>
          <strong>Rotate secrets regularly</strong> - Update API keys and passwords periodically
        </li>
        <li>
          <strong>Limit access</strong> - Only give team members access to the environments they need
        </li>
        <li>
          <strong>Audit changes</strong> - Review environment variable changes in your activity log
        </li>
      </ul>
    </article>
  );
}
