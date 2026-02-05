import { APIEndpoint } from "@/components/APIReference";

export default function DeploymentsAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Deployments API</h1>

      <p className="lead">
        Trigger deployments, check status, and manage releases.
      </p>

      <h2>Endpoints</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/deployments"
        description="List all deployments for the authenticated user."
        parameters={[
          { name: "projectId", type: "string", description: "Filter by project ID" },
          { name: "status", type: "string", description: "Filter by status (building, ready, failed)" },
          { name: "limit", type: "number", description: "Max results (default: 50)" },
        ]}
        responseBody={`{
  "deployments": [
    {
      "id": "dpl_abc123",
      "project": "My App",
      "projectSlug": "my-app",
      "branch": "main",
      "commit": "a1b2c3d",
      "commitMessage": "Update homepage",
      "status": "ready",
      "url": "my-app.cloudify.tranthachnguyen.com",
      "createdAt": "2024-01-25T12:00:00Z",
      "duration": "45s"
    }
  ]
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/deployments/:id"
        description="Get a single deployment by ID."
        parameters={[
          { name: "id", type: "string", required: true, description: "Deployment ID" },
        ]}
        responseBody={`{
  "id": "dpl_abc123",
  "projectId": "proj_xyz789",
  "status": "ready",
  "url": "my-app.cloudify.tranthachnguyen.com",
  "branch": "main",
  "commit": "a1b2c3d4e5f6",
  "commitMessage": "Update homepage",
  "buildLogs": "...",
  "createdAt": "2024-01-25T12:00:00Z",
  "readyAt": "2024-01-25T12:00:45Z",
  "buildTime": 45
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/deployments"
        description="Trigger a new deployment."
        requestBody={`{
  "projectId": "proj_xyz789",
  "branch": "main",
  "commit": "a1b2c3d"
}`}
        responseBody={`{
  "id": "dpl_new123",
  "status": "queued",
  "createdAt": "2024-01-25T14:00:00Z"
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/deployments/:id/redeploy"
        description="Redeploy an existing deployment."
        parameters={[
          { name: "id", type: "string", required: true, description: "Deployment ID to redeploy" },
        ]}
        responseBody={`{
  "id": "dpl_redeploy456",
  "status": "queued",
  "createdAt": "2024-01-25T15:00:00Z"
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/deployments/:id/rollback"
        description="Rollback to a previous deployment."
        parameters={[
          { name: "id", type: "string", required: true, description: "Deployment ID to rollback to" },
        ]}
        responseBody={`{
  "id": "dpl_rollback789",
  "status": "deploying",
  "rollbackFrom": "dpl_current123",
  "createdAt": "2024-01-25T16:00:00Z"
}`}
      />

      <APIEndpoint
        method="DELETE"
        endpoint="/api/deployments/:id"
        description="Cancel a pending or building deployment."
        parameters={[
          { name: "id", type: "string", required: true, description: "Deployment ID" },
        ]}
        responseBody={`{
  "success": true,
  "message": "Deployment cancelled"
}`}
      />

      <h2>File Upload Deploy</h2>

      <p>
        Deploy by uploading a tarball of your project. This is used by the CLI for direct deployments.
      </p>

      <APIEndpoint
        method="POST"
        endpoint="/api/deploy"
        description="Upload and deploy a project tarball. The tarball should contain your built project files."
        parameters={[
          { name: "file", type: "File", required: true, description: "Gzipped tarball (.tar.gz) of the project" },
          { name: "projectId", type: "string", required: true, description: "Project ID to deploy to" },
          { name: "production", type: "boolean", description: "Deploy to production (default: false for preview)" },
        ]}
        responseBody={`{
  "deployment": {
    "id": "dpl_upload123",
    "url": "my-app-abc123.cloudify.tranthachnguyen.com",
    "status": "QUEUED"
  }
}`}
      />

      <h2>Build Logs</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/deployments/:id/build-logs"
        description="Get the build logs for a deployment."
        parameters={[
          { name: "id", type: "string", required: true, description: "Deployment ID" },
        ]}
        responseBody={`{
  "logs": "Installing dependencies...\\nnpm install\\n✓ Installed 150 packages\\n\\nBuilding project...\\nnpm run build\\n✓ Build completed in 45s\\n\\nDeploying to edge...\\n✓ Deployed to 12 regions"
}`}
      />

      <h2>CLI Commands</h2>

      <p>
        The Cloudify CLI provides a convenient way to deploy and manage your projects from the command line.
        Install it via npm:
      </p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`npm install -g @cloudify/cli`}
      </pre>

      <h3>Deploy</h3>

      <p>Deploy the current project to Cloudify:</p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# Deploy to preview
cloudify deploy

# Deploy to production
cloudify deploy --prod

# Deploy with a message
cloudify deploy -m "Fix homepage layout"`}
      </pre>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Option</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>-p, --prod</code></td>
              <td className="px-4 py-2">Deploy to production environment</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>--preview</code></td>
              <td className="px-4 py-2">Create a preview deployment (default)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>-m, --message</code></td>
              <td className="px-4 py-2">Deployment message/description</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Rollback</h3>

      <p>Rollback to a previous deployment:</p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# Interactive rollback (select from list)
cloudify rollback

# Rollback to specific deployment
cloudify rollback dpl_abc123

# Skip confirmation
cloudify rollback dpl_abc123 --yes`}
      </pre>

      <h3>View Logs</h3>

      <p>Stream or fetch deployment logs:</p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# Fetch recent logs
cloudify logs

# Stream logs in real-time
cloudify logs --follow

# Show more lines
cloudify logs -n 200

# Filter by deployment
cloudify logs --deployment dpl_abc123`}
      </pre>

      <h3>List Deployments</h3>

      <p>View all projects and their deployments:</p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# List all projects
cloudify list

# Or use the alias
cloudify ls`}
      </pre>

      <h3>Environment Variables</h3>

      <p>Manage environment variables for deployments:</p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# List environment variables
cloudify env list

# Pull env vars to local .env file
cloudify env pull

# Push local .env to Cloudify
cloudify env push

# Specify environment
cloudify env pull --environment production`}
      </pre>

      <h2>Deployment Status</h2>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>QUEUED</code></td>
              <td className="px-4 py-2">Waiting to start</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>BUILDING</code></td>
              <td className="px-4 py-2">Build in progress</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>DEPLOYING</code></td>
              <td className="px-4 py-2">Deploying to edge</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>READY</code></td>
              <td className="px-4 py-2">Successfully deployed</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>ERROR</code></td>
              <td className="px-4 py-2">Build or deploy failed</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>CANCELLED</code></td>
              <td className="px-4 py-2">Manually cancelled</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Platform Monitoring</h2>

      <p>
        Monitor the health and status of the Cloudify platform itself, including
        deployment statistics, service health, and system metrics.
      </p>

      <APIEndpoint
        method="GET"
        endpoint="/api/admin/monitoring"
        description="Get comprehensive platform health and metrics. Returns service status, deployment statistics, memory usage, and CI/CD pipeline information."
        responseBody={`{
  "status": "healthy",
  "timestamp": "2024-01-25T12:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "environment": "production",
  "services": {
    "api": {
      "status": "operational",
      "lastChecked": "2024-01-25T12:00:00Z"
    },
    "database": {
      "status": "operational",
      "latency": 2,
      "lastChecked": "2024-01-25T12:00:00Z"
    },
    "redis": {
      "status": "operational",
      "latency": 1,
      "lastChecked": "2024-01-25T12:00:00Z"
    },
    "storage": {
      "status": "operational",
      "lastChecked": "2024-01-25T12:00:00Z"
    }
  },
  "deployments": {
    "total": 150,
    "successful": 142,
    "failed": 5,
    "pending": 3,
    "recent": [
      {
        "id": "dpl_abc123",
        "projectName": "my-app",
        "status": "READY",
        "createdAt": "2024-01-25T11:55:00Z",
        "duration": 45,
        "commit": "a1b2c3d"
      }
    ]
  },
  "system": {
    "nodeVersion": "v20.20.0",
    "platform": "linux",
    "memoryUsage": {
      "heapUsed": 52,
      "heapTotal": 88,
      "external": 3,
      "rss": 137
    }
  },
  "cicd": {
    "lastDeployment": "2024-01-25T10:00:00Z",
    "lastCommit": "a1b2c3d4e5f6",
    "branch": "main",
    "buildNumber": "123"
  }
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/admin/monitoring"
        description="Record a platform deployment event. Used by CI/CD pipelines to track deployment history."
        authRequired={true}
        requestBody={`{
  "commit": "a1b2c3d4e5f6",
  "branch": "main",
  "buildNumber": "124",
  "status": "success",
  "timestamp": "2024-01-25T12:00:00Z"
}`}
        responseBody={`{
  "success": true,
  "deployment": {
    "lastDeployment": "2024-01-25T12:00:00Z",
    "lastCommit": "a1b2c3d4e5f6",
    "branch": "main",
    "buildNumber": "124",
    "status": "success"
  }
}`}
      />

      <h2>Prometheus Metrics</h2>

      <p>
        Export platform metrics in Prometheus format for monitoring and alerting.
        This endpoint can be scraped by Prometheus at regular intervals.
      </p>

      <APIEndpoint
        method="GET"
        endpoint="/api/metrics/prometheus"
        description="Get platform metrics in Prometheus text format. Returns health status, deployment counts, memory usage, and latency metrics."
        responseBody={`# HELP cloudify_app_info Application information
# TYPE cloudify_app_info gauge
cloudify_app_info{version="1.0.0",node_version="v20.20.0",environment="production"} 1

# HELP cloudify_uptime_seconds Application uptime in seconds
# TYPE cloudify_uptime_seconds counter
cloudify_uptime_seconds 86400

# HELP cloudify_database_healthy Database health (1=healthy, 0=unhealthy)
# TYPE cloudify_database_healthy gauge
cloudify_database_healthy 1

# HELP cloudify_database_latency_ms Database query latency
# TYPE cloudify_database_latency_ms gauge
cloudify_database_latency_ms 2

# HELP cloudify_redis_healthy Redis health (1=healthy, 0=unhealthy)
# TYPE cloudify_redis_healthy gauge
cloudify_redis_healthy 1

# HELP cloudify_deployments_total Total number of deployments
# TYPE cloudify_deployments_total counter
cloudify_deployments_total 150

# HELP cloudify_deployments_successful_total Successful deployments
# TYPE cloudify_deployments_successful_total counter
cloudify_deployments_successful_total 142

# HELP cloudify_deployments_failed_total Failed deployments
# TYPE cloudify_deployments_failed_total counter
cloudify_deployments_failed_total 5

# HELP cloudify_deployments_pending Current pending deployments
# TYPE cloudify_deployments_pending gauge
cloudify_deployments_pending 3

# HELP cloudify_deployments_success_rate Success rate percentage
# TYPE cloudify_deployments_success_rate gauge
cloudify_deployments_success_rate 94.67

# HELP cloudify_health_score Overall health score (0-100)
# TYPE cloudify_health_score gauge
cloudify_health_score 100

# HELP cloudify_memory_heap_used_bytes Heap memory used
# TYPE cloudify_memory_heap_used_bytes gauge
cloudify_memory_heap_used_bytes 52540992

# HELP cloudify_projects_total Total number of projects
# TYPE cloudify_projects_total gauge
cloudify_projects_total 25

# HELP cloudify_users_total Total number of users
# TYPE cloudify_users_total gauge
cloudify_users_total 10`}
      />

      <h3>Available Metrics</h3>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Metric</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_app_info</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">App version and environment info (labels)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_uptime_seconds</code></td>
              <td className="px-4 py-2">counter</td>
              <td className="px-4 py-2">Application uptime in seconds</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_database_healthy</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Database health (1=up, 0=down)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_database_latency_ms</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Database query latency in milliseconds</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_redis_healthy</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Redis health (1=up, 0=down)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_redis_latency_ms</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Redis query latency in milliseconds</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_deployments_total</code></td>
              <td className="px-4 py-2">counter</td>
              <td className="px-4 py-2">Total deployment count</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_deployments_successful_total</code></td>
              <td className="px-4 py-2">counter</td>
              <td className="px-4 py-2">Successful deployment count</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_deployments_failed_total</code></td>
              <td className="px-4 py-2">counter</td>
              <td className="px-4 py-2">Failed deployment count</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_deployments_pending</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Currently pending deployments</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_deployments_success_rate</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Deployment success rate (0-100%)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_health_score</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Overall platform health (0-100)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_memory_*</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Memory metrics (heap, rss, external)</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_projects_total</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Total project count</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_users_total</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Total user count</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_domains_total</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Total custom domains</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>cloudify_functions_total</code></td>
              <td className="px-4 py-2">gauge</td>
              <td className="px-4 py-2">Total edge functions</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Prometheus Configuration</h3>

      <p>
        Add this to your <code>prometheus.yml</code> to scrape Cloudify metrics:
      </p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`scrape_configs:
  - job_name: cloudify-app
    metrics_path: /api/metrics/prometheus
    static_configs:
      - targets: ["cloudify.tranthachnguyen.com:443"]
    scheme: https`}
      </pre>
    </article>
  );
}
