import { APIEndpoint } from "@/components/APIReference";

export default function ProjectsAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Projects API</h1>

      <p className="lead">
        Create, read, update, and delete projects.
      </p>

      <h2>Endpoints</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/projects"
        description="List all projects for the authenticated user."
        parameters={[
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "perPage", type: "number", description: "Items per page (default: 20)" },
        ]}
        responseBody={`{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "My App",
      "slug": "my-app",
      "framework": "nextjs",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 5
  }
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/projects/:id"
        description="Get a single project by ID."
        parameters={[
          { name: "id", type: "string", required: true, description: "Project ID" },
        ]}
        responseBody={`{
  "id": "proj_abc123",
  "name": "My App",
  "slug": "my-app",
  "framework": "nextjs",
  "gitRepository": "github.com/user/my-app",
  "productionBranch": "main",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T15:45:00Z"
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/projects"
        description="Create a new project."
        requestBody={`{
  "name": "My New App",
  "slug": "my-new-app",
  "gitRepository": "github.com/user/my-new-app",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}`}
        responseBody={`{
  "id": "proj_xyz789",
  "name": "My New App",
  "slug": "my-new-app",
  "createdAt": "2024-01-25T12:00:00Z"
}`}
      />

      <APIEndpoint
        method="PUT"
        endpoint="/api/projects/:id"
        description="Update a project."
        parameters={[
          { name: "id", type: "string", required: true, description: "Project ID" },
        ]}
        requestBody={`{
  "name": "Updated App Name",
  "buildCommand": "npm run build:prod",
  "productionBranch": "production"
}`}
        responseBody={`{
  "id": "proj_abc123",
  "name": "Updated App Name",
  "updatedAt": "2024-01-25T14:00:00Z"
}`}
      />

      <APIEndpoint
        method="DELETE"
        endpoint="/api/projects/:id"
        description="Delete a project. This action is irreversible."
        parameters={[
          { name: "id", type: "string", required: true, description: "Project ID" },
        ]}
        responseBody={`{
  "success": true,
  "message": "Project deleted"
}`}
      />

      <h2>Environment Variables</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/projects/:id/env"
        description="Get environment variables for a project."
        parameters={[
          { name: "id", type: "string", required: true, description: "Project ID" },
        ]}
        responseBody={`{
  "variables": [
    {
      "key": "DATABASE_URL",
      "target": ["production", "preview"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}`}
      />

      <APIEndpoint
        method="POST"
        endpoint="/api/projects/:id/env"
        description="Add an environment variable."
        requestBody={`{
  "key": "API_SECRET",
  "value": "secret_value",
  "target": ["production"]
}`}
        responseBody={`{
  "key": "API_SECRET",
  "target": ["production"],
  "createdAt": "2024-01-25T12:00:00Z"
}`}
      />
    </article>
  );
}
