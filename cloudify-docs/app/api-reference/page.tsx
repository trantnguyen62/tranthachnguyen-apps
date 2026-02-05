import Link from "next/link";

export default function APIReferencePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>API Reference</h1>

      <p className="lead">
        Complete reference for the Cloudify REST API. Build integrations and
        automate your workflows.
      </p>

      <h2>Base URL</h2>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
        <code>https://cloudify.tranthachnguyen.com/api</code>
      </pre>

      <h2>API Sections</h2>

      <div className="not-prose my-6 grid gap-4">
        <Link
          href="/api-reference/authentication"
          className="block p-4 border rounded-lg hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Authentication</h3>
          <p className="text-sm text-gray-600">
            API keys, OAuth, and session management
          </p>
        </Link>

        <Link
          href="/api-reference/projects"
          className="block p-4 border rounded-lg hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Projects</h3>
          <p className="text-sm text-gray-600">
            Create, read, update, and delete projects
          </p>
        </Link>

        <Link
          href="/api-reference/deployments"
          className="block p-4 border rounded-lg hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Deployments</h3>
          <p className="text-sm text-gray-600">
            Trigger deployments and check status
          </p>
        </Link>

        <Link
          href="/api-reference/functions"
          className="block p-4 border rounded-lg hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Functions</h3>
          <p className="text-sm text-gray-600">
            Manage Edge Functions
          </p>
        </Link>

        <Link
          href="/api-reference/storage"
          className="block p-4 border rounded-lg hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Storage</h3>
          <p className="text-sm text-gray-600">
            Blob storage and KV store operations
          </p>
        </Link>

        <Link
          href="/api-reference/analytics"
          className="block p-4 border rounded-lg hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-600">
            Query analytics data and ingest events
          </p>
        </Link>
      </div>

      <h2>Request Format</h2>

      <p>
        All API requests should include:
      </p>

      <ul>
        <li>
          <code>Content-Type: application/json</code> header for POST/PUT/PATCH
          requests
        </li>
        <li>
          <code>Authorization: Bearer YOUR_API_KEY</code> header for
          authenticated endpoints
        </li>
      </ul>

      <h2>Response Format</h2>

      <p>
        All responses are JSON. Successful responses include the requested data:
      </p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`{
  "data": { ... },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}`}</code>
      </pre>

      <p>
        Error responses include an error message:
      </p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "status": 404
}`}</code>
      </pre>

      <h2>HTTP Status Codes</h2>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>200</code></td>
              <td className="px-4 py-2">Success</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>201</code></td>
              <td className="px-4 py-2">Created</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>400</code></td>
              <td className="px-4 py-2">Bad Request</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>401</code></td>
              <td className="px-4 py-2">Unauthorized</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>403</code></td>
              <td className="px-4 py-2">Forbidden</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>404</code></td>
              <td className="px-4 py-2">Not Found</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>429</code></td>
              <td className="px-4 py-2">Rate Limited</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>500</code></td>
              <td className="px-4 py-2">Server Error</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Rate Limiting</h2>

      <p>
        API requests are rate limited to prevent abuse:
      </p>

      <ul>
        <li>
          <strong>Authenticated</strong>: 1000 requests per minute
        </li>
        <li>
          <strong>Unauthenticated</strong>: 60 requests per minute
        </li>
      </ul>

      <p>
        Rate limit headers are included in responses:
      </p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200`}</code>
      </pre>
    </article>
  );
}
