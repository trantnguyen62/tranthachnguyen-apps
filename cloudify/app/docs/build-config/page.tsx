"use client";

import { Settings, FileJson, Terminal, Folder } from "lucide-react";

export default function BuildConfigPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Build Configuration</h1>

      <p className="lead">
        Configure how Cloudify builds and deploys your project. Most settings are
        automatically detected, but you can customize everything.
      </p>

      <h2>Build Settings</h2>

      <p>
        Configure these settings in your project dashboard under Settings → General:
      </p>

      <div className="not-prose overflow-x-auto my-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Setting</th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Description</th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-3 px-4 text-[var(--text-primary)] font-medium">Build Command</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">Command to build your project</td>
              <td className="py-3 px-4"><code>npm run build</code></td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-[var(--text-primary)] font-medium">Output Directory</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">Directory containing built files</td>
              <td className="py-3 px-4"><code>dist</code>, <code>.next</code>, <code>build</code></td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-[var(--text-primary)] font-medium">Install Command</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">Command to install dependencies</td>
              <td className="py-3 px-4"><code>npm install</code></td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-[var(--text-primary)] font-medium">Root Directory</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">Subdirectory containing your app</td>
              <td className="py-3 px-4"><code>apps/web</code></td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-[var(--text-primary)] font-medium">Node.js Version</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">Node.js version for builds</td>
              <td className="py-3 px-4"><code>20.x</code>, <code>18.x</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>cloudify.json</h2>

      <p>
        For more advanced configuration, create a <code>cloudify.json</code> file in your project root:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@cloudify/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}`}</code>
      </pre>

      <h2>Framework Presets</h2>

      <p>
        Cloudify automatically detects your framework and applies optimal settings:
      </p>

      <h3>Next.js</h3>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`Build Command: next build
Output Directory: .next
Install Command: npm install`}</code>
      </pre>

      <h3>Create React App</h3>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`Build Command: react-scripts build
Output Directory: build
Install Command: npm install`}</code>
      </pre>

      <h3>Vite</h3>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`Build Command: vite build
Output Directory: dist
Install Command: npm install`}</code>
      </pre>

      <h3>Astro</h3>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`Build Command: astro build
Output Directory: dist
Install Command: npm install`}</code>
      </pre>

      <h2>Build Environment</h2>

      <h3>Node.js Version</h3>

      <p>
        Specify the Node.js version in your <code>package.json</code>:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "engines": {
    "node": "20.x"
  }
}`}</code>
      </pre>

      <p>Supported versions: 18.x, 20.x (default), 22.x</p>

      <h3>Package Manager</h3>

      <p>
        Cloudify automatically detects your package manager based on lock files:
      </p>

      <ul>
        <li><code>package-lock.json</code> → npm</li>
        <li><code>yarn.lock</code> → Yarn</li>
        <li><code>pnpm-lock.yaml</code> → pnpm</li>
        <li><code>bun.lockb</code> → Bun</li>
      </ul>

      <h2>Build Caching</h2>

      <p>
        Cloudify automatically caches:
      </p>

      <ul>
        <li><code>node_modules</code> - Dependencies are cached between builds</li>
        <li><code>.next/cache</code> - Next.js build cache</li>
        <li><code>.turbo</code> - Turborepo cache</li>
        <li>Custom cache directories specified in configuration</li>
      </ul>

      <p>
        To bust the cache, redeploy with the &quot;Clear Cache&quot; option in the dashboard.
      </p>

      <h2>Build Hooks</h2>

      <p>
        Run custom commands before or after the build:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "scripts": {
    "prebuild": "echo 'Running before build'",
    "build": "next build",
    "postbuild": "echo 'Running after build'"
  }
}`}</code>
      </pre>

      <h2>Ignored Files</h2>

      <p>
        Create a <code>.cloudifyignore</code> file to exclude files from deployment:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Dependencies
node_modules

# Build outputs (handled automatically)
.next
dist
build

# Development files
*.log
.env.local
.DS_Store

# Test files
__tests__
*.test.js
*.spec.js`}</code>
      </pre>

      <h2>Troubleshooting</h2>

      <h3>Build Fails</h3>
      <ul>
        <li>Check the build logs for specific error messages</li>
        <li>Ensure all dependencies are in <code>package.json</code></li>
        <li>Verify the build command works locally</li>
        <li>Check for case-sensitivity issues in imports</li>
      </ul>

      <h3>Missing Files</h3>
      <ul>
        <li>Verify the output directory is correct</li>
        <li>Check that files aren&apos;t excluded by <code>.cloudifyignore</code></li>
        <li>Ensure the build completes without errors</li>
      </ul>
    </article>
  );
}
