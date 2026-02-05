import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function EnvironmentVariablesPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Environment Variables</h1>

      <p className="lead">
        Securely manage configuration and secrets for your deployments.
      </p>

      <h2>Adding Environment Variables</h2>

      <p>
        Add environment variables in your project settings. They&apos;re available
        during build and runtime.
      </p>

      <ol>
        <li>Go to your project settings</li>
        <li>Click &quot;Environment Variables&quot;</li>
        <li>Add your key-value pairs</li>
        <li>Click &quot;Save&quot;</li>
      </ol>

      <Callout type="warning" title="Redeploy Required">
        After changing environment variables, you need to redeploy for the
        changes to take effect.
      </Callout>

      <h2>Variable Types</h2>

      <h3>Build-time Variables</h3>

      <p>
        Available during the build process. Use for configuration that&apos;s needed
        at build time:
      </p>

      <CodeBlock
        code={`# Build-time variables
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=UA-12345678-1`}
        language="bash"
      />

      <h3>Runtime Variables</h3>

      <p>
        Available at runtime in your serverless functions and API routes:
      </p>

      <CodeBlock
        code={`# Runtime variables (server-side only)
DATABASE_URL=postgresql://user:pass@host:5432/db
API_SECRET_KEY=sk_live_xxxxxxxxxxxx
REDIS_URL=redis://localhost:6379`}
        language="bash"
      />

      <Callout type="info" title="Client-side Variables">
        For Next.js, prefix variables with <code>NEXT_PUBLIC_</code> to expose
        them to the browser. Be careful not to expose sensitive data!
      </Callout>

      <h2>Environment-specific Variables</h2>

      <p>
        Set different values for production and preview deployments:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Variable</th>
              <th className="px-4 py-2 text-left">Production</th>
              <th className="px-4 py-2 text-left">Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>API_URL</code></td>
              <td className="px-4 py-2">https://api.example.com</td>
              <td className="px-4 py-2">https://staging-api.example.com</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>DATABASE_URL</code></td>
              <td className="px-4 py-2">Production database</td>
              <td className="px-4 py-2">Staging database</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>System Variables</h2>

      <p>
        Cloudify automatically provides these variables during build and
        runtime:
      </p>

      <CodeBlock
        code={`# Automatically set by Cloudify
CLOUDIFY=1
CLOUDIFY_ENV=production|preview
CLOUDIFY_URL=https://your-project.cloudify.tranthachnguyen.com
CLOUDIFY_GIT_COMMIT_SHA=abc123...
CLOUDIFY_GIT_COMMIT_MESSAGE=Update homepage
CLOUDIFY_GIT_BRANCH=main`}
        language="bash"
      />

      <h2>Accessing Variables</h2>

      <h3>In JavaScript/TypeScript</h3>

      <CodeBlock
        code={`// Server-side (API routes, server components)
const dbUrl = process.env.DATABASE_URL;

// Client-side (must use NEXT_PUBLIC_ prefix)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;`}
        language="typescript"
      />

      <h3>In Build Scripts</h3>

      <CodeBlock
        code={`{
  "scripts": {
    "build": "echo $DATABASE_URL && next build"
  }
}`}
        language="json"
      />

      <h2>Security</h2>

      <ul>
        <li>
          Environment variables are encrypted at rest and in transit
        </li>
        <li>
          Variables are never exposed in build logs
        </li>
        <li>
          Only project team members can view and edit variables
        </li>
        <li>
          Never commit secrets to your repository
        </li>
      </ul>

      <Callout type="error" title="Never expose secrets">
        Don&apos;t use <code>NEXT_PUBLIC_</code> prefix for API keys, database URLs,
        or other sensitive data. These will be visible in browser code!
      </Callout>
    </article>
  );
}
