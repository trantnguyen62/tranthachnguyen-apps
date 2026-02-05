import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function AuthenticationPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Authentication</h1>

      <p className="lead">
        Learn how to authenticate with the Cloudify API.
      </p>

      <h2>Authentication Methods</h2>

      <p>
        Cloudify supports multiple authentication methods:
      </p>

      <ul>
        <li>
          <strong>API Keys</strong> - For server-to-server integrations
        </li>
        <li>
          <strong>OAuth Session</strong> - For browser-based applications
        </li>
      </ul>

      <h2>API Keys</h2>

      <p>
        Generate API keys in your account settings. Include the key in the
        Authorization header:
      </p>

      <CodeBlock
        code={`curl -X GET https://cloudify.tranthachnguyen.com/api/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        language="bash"
      />

      <h3>Creating an API Key</h3>

      <ol>
        <li>Go to Account Settings</li>
        <li>Click &quot;API Keys&quot;</li>
        <li>Click &quot;Create New Key&quot;</li>
        <li>Give it a descriptive name</li>
        <li>Copy and securely store the key (it&apos;s only shown once)</li>
      </ol>

      <Callout type="warning">
        Keep your API keys secret. Don&apos;t commit them to git or expose them in
        client-side code.
      </Callout>

      <h3>Key Permissions</h3>

      <p>
        API keys have full access to your account by default. You can create
        scoped keys with limited permissions:
      </p>

      <ul>
        <li><code>projects:read</code> - Read project information</li>
        <li><code>projects:write</code> - Create and update projects</li>
        <li><code>deployments:read</code> - View deployments</li>
        <li><code>deployments:write</code> - Trigger deployments</li>
        <li><code>analytics:read</code> - Read analytics data</li>
      </ul>

      <h2>OAuth / Session Auth</h2>

      <p>
        For browser-based applications, use the OAuth flow:
      </p>

      <CodeBlock
        code={`// Redirect to OAuth login
window.location.href = "https://cloudify.tranthachnguyen.com/api/auth/signin";

// After login, the user is redirected back with a session cookie
// All subsequent requests are authenticated automatically`}
        language="typescript"
      />

      <h3>Getting the Current User</h3>

      <CodeBlock
        code={`GET /api/auth/session

Response:
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://..."
  },
  "expires": "2024-02-01T00:00:00.000Z"
}`}
        language="text"
      />

      <h2>Error Responses</h2>

      <h3>401 Unauthorized</h3>

      <p>
        Returned when no valid authentication is provided:
      </p>

      <CodeBlock
        code={`{
  "error": "Unauthorized",
  "message": "No valid API key or session found"
}`}
        language="json"
      />

      <h3>403 Forbidden</h3>

      <p>
        Returned when authentication is valid but lacks permissions:
      </p>

      <CodeBlock
        code={`{
  "error": "Forbidden",
  "message": "API key does not have permission: deployments:write"
}`}
        language="json"
      />

      <h2>Best Practices</h2>

      <ul>
        <li>Use environment variables to store API keys</li>
        <li>Rotate keys regularly</li>
        <li>Use scoped keys with minimum required permissions</li>
        <li>Revoke unused keys</li>
        <li>Never expose keys in client-side code</li>
      </ul>
    </article>
  );
}
