import { APIEndpoint } from "@/components/APIReference";
import { Callout } from "@/components/Callout";

export default function AuditLogsAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Audit Logs API</h1>

      <p className="lead">
        Access and manage audit logs for compliance and security monitoring. Track user actions,
        export logs, and configure retention policies.
      </p>

      <Callout type="info">
        Audit logs capture all significant actions including authentication, project changes,
        deployments, environment variable modifications, and team management operations.
      </Callout>

      <h2>List Audit Logs</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/audit-logs"
        description="List and search audit logs with filtering and pagination."
        parameters={[
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page (default: 50, max: 100)" },
          { name: "type", type: "string", description: "Filter by activity type (auth, project, deployment, etc.)" },
          { name: "action", type: "string", description: "Filter by action (created, updated, deleted, etc.)" },
          { name: "userId", type: "string", description: "Filter by user ID" },
          { name: "projectId", type: "string", description: "Filter by project ID" },
          { name: "teamId", type: "string", description: "Filter by team ID" },
          { name: "startDate", type: "string", description: "Filter from date (ISO format)" },
          { name: "endDate", type: "string", description: "Filter to date (ISO format)" },
          { name: "search", type: "string", description: "Search in description, user name, or email" },
          { name: "includeFilters", type: "boolean", description: "Include available filter options in response" },
        ]}
        responseBody={`{
  "logs": [
    {
      "id": "act_abc123",
      "type": "deployment",
      "action": "created",
      "description": "Triggered deployment for main branch",
      "timestamp": "2024-01-25T12:00:00Z",
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "project": {
        "id": "proj_abc",
        "name": "My App",
        "slug": "my-app"
      },
      "team": {
        "id": "team_xyz",
        "name": "Engineering",
        "slug": "engineering"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "branch": "main",
        "commitSha": "abc123"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25,
    "hasMore": true
  },
  "filterOptions": {
    "types": ["auth", "project", "deployment", "domain", "env_var", "team"],
    "actions": ["created", "updated", "deleted", "deployed", "login", "logout"]
  }
}`}
      />

      <h2>Export Audit Logs</h2>

      <APIEndpoint
        method="POST"
        endpoint="/api/audit-logs/export"
        description="Export audit logs in JSON or CSV format. Returns a downloadable file."
        requestBody={`{
  "format": "json",  // or "csv"
  "filters": {
    "type": "deployment",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "teamId": "team_xyz"
  }
}`}
        responseBody={`// For JSON format:
[
  {
    "id": "act_abc123",
    "timestamp": "2024-01-25T12:00:00Z",
    "type": "deployment",
    "action": "created",
    "description": "Triggered deployment",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    ...
  }
]

// For CSV format:
ID,Timestamp,Type,Action,Description,User ID,User Name,...`}
      />

      <h2>Retention Policy</h2>

      <h3>Get Retention Policy</h3>

      <APIEndpoint
        method="GET"
        endpoint="/api/settings/audit/retention"
        description="Get the current audit log retention policy and statistics for a team."
        parameters={[
          { name: "teamId", type: "string", required: true, description: "Team ID" },
        ]}
        responseBody={`{
  "policy": {
    "enabled": true,
    "retentionDays": 90,
    "autoDelete": false,
    "lastCleanup": "2024-01-20T00:00:00Z"
  },
  "preview": {
    "totalLogs": 15000,
    "logsToDelete": 3500,
    "oldestLog": "2023-10-01T00:00:00Z"
  },
  "storageEstimate": {
    "currentSizeKB": 15000,
    "afterCleanupSizeKB": 11500
  }
}`}
      />

      <h3>Update Retention Policy</h3>

      <APIEndpoint
        method="PUT"
        endpoint="/api/settings/audit/retention"
        description="Update the audit log retention policy for a team. Requires admin permissions."
        requestBody={`{
  "teamId": "team_xyz",
  "policy": {
    "enabled": true,
    "retentionDays": 90,
    "autoDelete": true
  }
}`}
        responseBody={`{
  "message": "Retention policy updated",
  "policy": {
    "enabled": true,
    "retentionDays": 90,
    "autoDelete": true
  }
}`}
      />

      <h3>Apply Retention Policy</h3>

      <APIEndpoint
        method="POST"
        endpoint="/api/settings/audit/retention"
        description="Manually apply the retention policy to delete old logs. Requires admin permissions."
        requestBody={`{
  "teamId": "team_xyz"
}`}
        responseBody={`{
  "message": "Retention policy applied",
  "deletedCount": 3500
}`}
      />

      <h2>Activity Types</h2>

      <p>Audit logs are categorized by the following types:</p>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Type</th>
            <th className="text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>auth</code></td>
            <td>Authentication events (login, logout, failed attempts)</td>
          </tr>
          <tr>
            <td><code>project</code></td>
            <td>Project creation, updates, and deletion</td>
          </tr>
          <tr>
            <td><code>deployment</code></td>
            <td>Deployment triggers, completions, and rollbacks</td>
          </tr>
          <tr>
            <td><code>domain</code></td>
            <td>Custom domain additions and verification</td>
          </tr>
          <tr>
            <td><code>env_var</code></td>
            <td>Environment variable changes</td>
          </tr>
          <tr>
            <td><code>team</code></td>
            <td>Team member management</td>
          </tr>
          <tr>
            <td><code>billing</code></td>
            <td>Billing and subscription changes</td>
          </tr>
          <tr>
            <td><code>settings</code></td>
            <td>Configuration changes</td>
          </tr>
          <tr>
            <td><code>api_key</code></td>
            <td>API key creation and revocation</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
