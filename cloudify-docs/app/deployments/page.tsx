import Link from "next/link";
import { Callout } from "@/components/Callout";

export default function DeploymentsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Deployments</h1>

      <p className="lead">
        Learn how Cloudify handles deployments, from automatic builds to
        production releases.
      </p>

      <h2>How Deployments Work</h2>

      <p>
        When you push code to your connected repository, Cloudify automatically:
      </p>

      <ol>
        <li>Detects the changes and starts a new build</li>
        <li>Clones your repository to a fresh build environment</li>
        <li>Installs dependencies and runs your build command</li>
        <li>Deploys the output to our global edge network</li>
        <li>Updates DNS and SSL certificates as needed</li>
      </ol>

      <h2>Deployment Types</h2>

      <h3>Production Deployments</h3>

      <p>
        Pushes to your production branch (typically <code>main</code> or{" "}
        <code>master</code>) create production deployments. These are served at
        your primary domain.
      </p>

      <h3>Preview Deployments</h3>

      <p>
        Every pull request and non-production branch push gets a unique preview
        URL. This lets you test changes before merging to production.
      </p>

      <CodeBlock code={`# Preview URL format
https://my-project-abc123.cloudify.tranthachnguyen.com`} />

      <Callout type="info" title="Preview URLs">
        Preview URLs are perfect for sharing with teammates, clients, or QA
        teams before merging changes.
      </Callout>

      <h2>Build Configuration</h2>

      <p>
        Cloudify auto-detects your framework and configures the build. You can
        customize these settings in your project dashboard:
      </p>

      <ul>
        <li>
          <strong>Build Command</strong> - The command to build your project
          (e.g., <code>npm run build</code>)
        </li>
        <li>
          <strong>Output Directory</strong> - Where your build outputs files
          (e.g., <code>.next</code>, <code>dist</code>)
        </li>
        <li>
          <strong>Install Command</strong> - How to install dependencies (e.g.,{" "}
          <code>npm install</code>)
        </li>
        <li>
          <strong>Node.js Version</strong> - The Node.js version for your build
        </li>
      </ul>

      <h2>Deployment Status</h2>

      <p>Each deployment goes through these stages:</p>

      <div className="not-prose my-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            Queued
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            Building
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            Deploying
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            Ready
          </span>
        </div>
      </div>

      <p>
        If a build fails, you&apos;ll see the error status and can view the logs to
        debug the issue.
      </p>

      <h2>Rollbacks</h2>

      <p>
        Every deployment is immutable. If something goes wrong, you can
        instantly rollback to any previous deployment from your dashboard.
      </p>

      <h2>Related Topics</h2>

      <ul>
        <li>
          <Link href="/deployments/git-integration">Git Integration</Link> -
          Connect your repository
        </li>
        <li>
          <Link href="/deployments/build-settings">Build Settings</Link> -
          Configure your build
        </li>
        <li>
          <Link href="/deployments/environment-variables">
            Environment Variables
          </Link>{" "}
          - Manage secrets
        </li>
        <li>
          <Link href="/deployments/domains">Custom Domains</Link> - Connect your
          domain
        </li>
      </ul>
    </article>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
      <code>{code}</code>
    </pre>
  );
}
