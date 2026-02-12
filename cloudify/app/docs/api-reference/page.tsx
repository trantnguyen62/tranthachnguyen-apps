"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Lock,
  Globe,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function CodeBlock({ code, id }: { code: string; id: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
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

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
  auth: boolean;
  requestBody?: string;
  responseBody?: string;
}

interface EndpointGroup {
  title: string;
  description: string;
  endpoints: Endpoint[];
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PUT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  PATCH: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const apiGroups: EndpointGroup[] = [
  {
    title: "Authentication",
    description: "Manage user authentication and sessions.",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth",
        description: "Sign up a new user or sign in with credentials.",
        auth: false,
        requestBody: `{
  "action": "signup",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}`,
        responseBody: `{
  "id": "clx...",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`,
      },
    ],
  },
  {
    title: "Projects",
    description: "Create, read, update, and delete projects.",
    endpoints: [
      {
        method: "GET",
        path: "/api/projects",
        description: "List all projects for the authenticated user.",
        auth: true,
        responseBody: `[
  {
    "id": "clx...",
    "name": "my-app",
    "framework": "nextjs",
    "repoUrl": "https://github.com/user/my-app",
    "productionUrl": "https://my-app.cloudify.app",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]`,
      },
      {
        method: "POST",
        path: "/api/projects",
        description: "Create a new project from a Git repository.",
        auth: true,
        requestBody: `{
  "name": "my-app",
  "repoUrl": "https://github.com/user/my-app",
  "branch": "main",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDir": ".next"
}`,
        responseBody: `{
  "id": "clx...",
  "name": "my-app",
  "status": "created"
}`,
      },
      {
        method: "GET",
        path: "/api/projects/:name",
        description: "Get project details by name.",
        auth: true,
      },
      {
        method: "PATCH",
        path: "/api/projects/:name",
        description: "Update project settings.",
        auth: true,
        requestBody: `{
  "buildCommand": "npm run build",
  "outputDir": "dist",
  "rootDir": "packages/web"
}`,
      },
      {
        method: "DELETE",
        path: "/api/projects/:name",
        description: "Delete a project and all its deployments.",
        auth: true,
      },
    ],
  },
  {
    title: "Deployments",
    description: "Trigger and manage deployments.",
    endpoints: [
      {
        method: "GET",
        path: "/api/deployments",
        description: "List deployments for all projects or a specific project.",
        auth: true,
        responseBody: `[
  {
    "id": "clx...",
    "projectName": "my-app",
    "status": "ready",
    "url": "https://my-app-abc123.cloudify.app",
    "gitBranch": "main",
    "gitCommit": "a1b2c3d",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
]`,
      },
      {
        method: "POST",
        path: "/api/deploy",
        description: "Trigger a new deployment for a project.",
        auth: true,
        requestBody: `{
  "projectId": "clx...",
  "branch": "main",
  "isProduction": true
}`,
        responseBody: `{
  "id": "clx...",
  "status": "queued",
  "url": "https://my-app-abc123.cloudify.app"
}`,
      },
      {
        method: "GET",
        path: "/api/deployments/:id",
        description: "Get deployment details including build logs.",
        auth: true,
      },
    ],
  },
  {
    title: "Domains",
    description: "Manage custom domains for your projects.",
    endpoints: [
      {
        method: "GET",
        path: "/api/domains",
        description: "List all custom domains.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/domains",
        description: "Add a custom domain to a project.",
        auth: true,
        requestBody: `{
  "domain": "example.com",
  "projectId": "clx..."
}`,
      },
      {
        method: "DELETE",
        path: "/api/domains/:id",
        description: "Remove a custom domain.",
        auth: true,
      },
    ],
  },
  {
    title: "Environment Variables",
    description: "Manage environment variables for projects.",
    endpoints: [
      {
        method: "GET",
        path: "/api/projects/:name/env",
        description: "List environment variables for a project (values are masked).",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/projects/:name/env",
        description: "Add or update environment variables.",
        auth: true,
        requestBody: `{
  "variables": [
    { "key": "DATABASE_URL", "value": "postgres://...", "target": ["production"] },
    { "key": "API_KEY", "value": "sk_...", "target": ["production", "preview"] }
  ]
}`,
      },
    ],
  },
  {
    title: "Functions",
    description: "Manage and invoke serverless functions.",
    endpoints: [
      {
        method: "GET",
        path: "/api/functions",
        description: "List serverless functions for a project.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/functions",
        description: "Create or update a serverless function.",
        auth: true,
        requestBody: `{
  "name": "process-webhook",
  "runtime": "nodejs20",
  "code": "export default async function handler(req) { ... }",
  "projectId": "clx..."
}`,
      },
      {
        method: "POST",
        path: "/api/functions/:id/invoke",
        description: "Invoke a serverless function.",
        auth: true,
      },
    ],
  },
  {
    title: "Storage",
    description: "Manage blob storage and KV store.",
    endpoints: [
      {
        method: "GET",
        path: "/api/storage",
        description: "List files in blob storage for a project.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/storage",
        description: "Upload a file to blob storage.",
        auth: true,
      },
      {
        method: "DELETE",
        path: "/api/storage/:key",
        description: "Delete a file from blob storage.",
        auth: true,
      },
    ],
  },
  {
    title: "Teams",
    description: "Manage team membership and invitations.",
    endpoints: [
      {
        method: "GET",
        path: "/api/teams",
        description: "List teams for the authenticated user.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/invitations",
        description: "Invite a user to a team.",
        auth: true,
        requestBody: `{
  "email": "teammate@example.com",
  "role": "member"
}`,
      },
    ],
  },
  {
    title: "Analytics & Logs",
    description: "Access deployment analytics and runtime logs.",
    endpoints: [
      {
        method: "GET",
        path: "/api/analytics",
        description: "Get analytics data (page views, visitors, Web Vitals).",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/logs",
        description: "Stream runtime logs for a deployment.",
        auth: true,
      },
    ],
  },
  {
    title: "Health",
    description: "System health and status checks.",
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        description: "Check system health (database, Redis, build pipeline).",
        auth: false,
        responseBody: `{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "buildPipeline": "ready"
  },
  "uptime": 86400
}`,
      },
    ],
  },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Badge className={cn("font-mono text-xs", methodColors[endpoint.method])}>
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono text-[var(--text-primary)]">
            {endpoint.path}
          </code>
          {endpoint.auth && (
            <Lock className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
            {endpoint.description}
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border-primary)] p-4 space-y-4 bg-card">
          <p className="text-[var(--text-secondary)]">{endpoint.description}</p>

          {endpoint.auth && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Lock className="h-4 w-4" />
              Requires authentication (Bearer token or session cookie)
            </div>
          )}

          {endpoint.requestBody && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Request Body
              </h4>
              <CodeBlock
                code={endpoint.requestBody}
                id={`req-${endpoint.path}`}
              />
            </div>
          )}

          {endpoint.responseBody && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Response
              </h4>
              <CodeBlock
                code={endpoint.responseBody}
                id={`res-${endpoint.path}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function APIReferencePage() {
  return (
    <article className="max-w-none">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1>API Reference</h1>

        <p className="lead">
          The Cloudify REST API lets you programmatically manage projects,
          deployments, domains, and more. All endpoints are available at{" "}
          <code>https://cloudify.tranthachnguyen.com/api</code>.
        </p>

        <h2>Authentication</h2>

        <p>
          Most API endpoints require authentication. Include your API token in
          the <code>Authorization</code> header:
        </p>
      </div>

      <div className="my-4">
        <CodeBlock
          code={`curl -H "Authorization: Bearer YOUR_API_TOKEN" \\
  https://cloudify.tranthachnguyen.com/api/projects`}
          id="auth-example"
        />
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p>
          You can generate an API token from your{" "}
          <Link href="/settings">account settings</Link>. Alternatively, if you
          are making requests from a browser session, session cookies are used
          automatically.
        </p>

        <h2>Base URL</h2>
      </div>

      <div className="my-4">
        <CodeBlock
          code="https://cloudify.tranthachnguyen.com/api"
          id="base-url"
        />
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none mb-4">
        <h2>Rate Limits</h2>
        <p>
          API requests are rate-limited to protect the platform. Current limits:
        </p>
        <ul>
          <li>
            <strong>Authenticated requests:</strong> 1,000 requests per minute
          </li>
          <li>
            <strong>Unauthenticated requests:</strong> 60 requests per minute
          </li>
          <li>
            <strong>Deploy triggers:</strong> 10 per minute per project
          </li>
        </ul>
        <p>
          Rate limit headers (<code>X-RateLimit-Limit</code>,{" "}
          <code>X-RateLimit-Remaining</code>,{" "}
          <code>X-RateLimit-Reset</code>) are included in every response.
        </p>

        <h2>Endpoints</h2>
      </div>

      {/* Endpoint groups */}
      <div className="space-y-10">
        {apiGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {group.title}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                {group.description}
              </p>
            </div>
            <div className="space-y-2">
              {group.endpoints.map((endpoint) => (
                <EndpointCard
                  key={`${endpoint.method}-${endpoint.path}`}
                  endpoint={endpoint}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none mt-10">
        <h2>Error Responses</h2>
        <p>
          All error responses follow a consistent format:
        </p>
      </div>

      <div className="my-4">
        <CodeBlock
          code={`{
  "error": "Unauthorized",
  "message": "Invalid or expired API token",
  "statusCode": 401
}`}
          id="error-example"
        />
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <table>
          <thead>
            <tr>
              <th>Status Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>400</code>
              </td>
              <td>Bad Request -- invalid parameters</td>
            </tr>
            <tr>
              <td>
                <code>401</code>
              </td>
              <td>Unauthorized -- missing or invalid auth</td>
            </tr>
            <tr>
              <td>
                <code>403</code>
              </td>
              <td>Forbidden -- insufficient permissions</td>
            </tr>
            <tr>
              <td>
                <code>404</code>
              </td>
              <td>Not Found -- resource does not exist</td>
            </tr>
            <tr>
              <td>
                <code>429</code>
              </td>
              <td>Too Many Requests -- rate limit exceeded</td>
            </tr>
            <tr>
              <td>
                <code>500</code>
              </td>
              <td>Internal Server Error -- unexpected failure</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Webhooks section */}
      <div className="prose prose-gray dark:prose-invert max-w-none mt-10">
        <h2>Webhooks</h2>
        <p>
          Cloudify supports incoming webhooks from GitHub, GitLab, Bitbucket, and
          Stripe. These are configured automatically when you connect your Git
          provider or billing account.
        </p>
        <table>
          <thead>
            <tr>
              <th>Webhook</th>
              <th>Endpoint</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GitHub</td>
              <td>
                <code>/api/webhooks/github</code>
              </td>
              <td>Push events trigger deployments</td>
            </tr>
            <tr>
              <td>GitLab</td>
              <td>
                <code>/api/webhooks/gitlab</code>
              </td>
              <td>Push events trigger deployments</td>
            </tr>
            <tr>
              <td>Bitbucket</td>
              <td>
                <code>/api/webhooks/bitbucket</code>
              </td>
              <td>Push events trigger deployments</td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>
                <code>/api/webhooks/stripe</code>
              </td>
              <td>Billing events (subscription changes)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
