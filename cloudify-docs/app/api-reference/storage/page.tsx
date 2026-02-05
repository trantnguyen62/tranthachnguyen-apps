import { APIEndpoint } from "@/components/APIReference";
import { Callout } from "@/components/Callout";

export default function StorageAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Storage API</h1>

      <p className="lead">
        Blob storage and KV store operations.
      </p>

      <Callout type="info">
        For blob storage, you can also use the S3-compatible API directly.
        See the <a href="/storage/blob-storage">Blob Storage documentation</a>.
      </Callout>

      <h2>Blob Storage</h2>

      <APIEndpoint
        method="POST"
        endpoint="/api/storage/blob/upload"
        description="Upload a file to blob storage."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
        ]}
        requestBody={`FormData with:
- file: The file to upload
- path: Storage path (e.g., "uploads/image.png")`}
        responseBody={`{
  "url": "https://storage.cloudify.tranthachnguyen.com/proj_abc/uploads/image.png",
  "size": 102400,
  "contentType": "image/png"
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/storage/blob/list"
        description="List files in blob storage."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "prefix", type: "string", description: "Filter by path prefix" },
          { name: "limit", type: "number", description: "Max results (default: 100)" },
        ]}
        responseBody={`{
  "files": [
    {
      "key": "uploads/image.png",
      "size": 102400,
      "contentType": "image/png",
      "lastModified": "2024-01-25T12:00:00Z"
    }
  ],
  "hasMore": false
}`}
      />

      <APIEndpoint
        method="DELETE"
        endpoint="/api/storage/blob/delete"
        description="Delete a file from blob storage."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "key", type: "string", required: true, description: "File path to delete" },
        ]}
        responseBody={`{
  "success": true
}`}
      />

      <h2>KV Store</h2>

      <APIEndpoint
        method="GET"
        endpoint="/api/storage/kv/:key"
        description="Get a value from KV store."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "key", type: "string", required: true, description: "Key to retrieve" },
        ]}
        responseBody={`{
  "key": "user:123",
  "value": "{\"name\":\"John\"}",
  "ttl": 3600
}`}
      />

      <APIEndpoint
        method="PUT"
        endpoint="/api/storage/kv/:key"
        description="Set a value in KV store."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "key", type: "string", required: true, description: "Key to set" },
        ]}
        requestBody={`{
  "value": "{\"name\":\"John\"}",
  "ttl": 3600
}`}
        responseBody={`{
  "success": true
}`}
      />

      <APIEndpoint
        method="DELETE"
        endpoint="/api/storage/kv/:key"
        description="Delete a key from KV store."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "key", type: "string", required: true, description: "Key to delete" },
        ]}
        responseBody={`{
  "success": true
}`}
      />

      <APIEndpoint
        method="GET"
        endpoint="/api/storage/kv"
        description="List keys in KV store."
        parameters={[
          { name: "projectId", type: "string", required: true, description: "Project ID" },
          { name: "prefix", type: "string", description: "Filter by key prefix" },
          { name: "limit", type: "number", description: "Max results (default: 100)" },
        ]}
        responseBody={`{
  "keys": [
    "user:123",
    "user:456",
    "session:abc"
  ],
  "cursor": "next_page_cursor"
}`}
      />
    </article>
  );
}
