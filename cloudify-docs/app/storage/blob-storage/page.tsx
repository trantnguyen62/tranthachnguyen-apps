import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function BlobStoragePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Blob Storage</h1>

      <p className="lead">
        Store and serve files with Cloudify&apos;s S3-compatible blob storage.
      </p>

      <h2>Overview</h2>

      <p>
        Blob Storage provides durable object storage for files of any type. Files
        are automatically replicated and served through our CDN for fast
        delivery.
      </p>

      <h2>Quick Start</h2>

      <p>
        Install the AWS S3 SDK to interact with Blob Storage:
      </p>

      <CodeBlock
        code={`npm install @aws-sdk/client-s3`}
        language="bash"
      />

      <h3>Initialize the Client</h3>

      <CodeBlock
        code={`import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.BLOB_URL,
  region: "auto",
  credentials: {
    accessKeyId: process.env.BLOB_ACCESS_KEY!,
    secretAccessKey: process.env.BLOB_SECRET_KEY!,
  },
  forcePathStyle: true,
});`}
        language="typescript"
      />

      <h2>Uploading Files</h2>

      <CodeBlock
        code={`// Upload a file
async function uploadFile(key: string, body: Buffer, contentType: string) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: "my-bucket",
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return \`\${process.env.BLOB_URL}/my-bucket/\${key}\`;
}

// Usage
const imageUrl = await uploadFile(
  "uploads/avatar.png",
  imageBuffer,
  "image/png"
);`}
        language="typescript"
      />

      <h3>Upload from Form Data</h3>

      <CodeBlock
        code={`// In a Next.js API route
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = \`uploads/\${Date.now()}-\${file.name}\`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: "my-bucket",
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return Response.json({
    url: \`\${process.env.BLOB_URL}/my-bucket/\${key}\`,
  });
}`}
        language="typescript"
      />

      <h2>Downloading Files</h2>

      <CodeBlock
        code={`import { GetObjectCommand } from "@aws-sdk/client-s3";

async function downloadFile(key: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: "my-bucket",
      Key: key,
    })
  );

  // Convert to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}`}
        language="typescript"
      />

      <h2>Listing Files</h2>

      <CodeBlock
        code={`import { ListObjectsV2Command } from "@aws-sdk/client-s3";

async function listFiles(prefix?: string) {
  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: "my-bucket",
      Prefix: prefix,
    })
  );

  return response.Contents?.map((obj) => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
  })) || [];
}`}
        language="typescript"
      />

      <h2>Deleting Files</h2>

      <CodeBlock
        code={`import { DeleteObjectCommand } from "@aws-sdk/client-s3";

async function deleteFile(key: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: "my-bucket",
      Key: key,
    })
  );
}`}
        language="typescript"
      />

      <h2>Signed URLs</h2>

      <p>
        Generate temporary signed URLs for private file access:
      </p>

      <CodeBlock
        code={`import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: "my-bucket",
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Generate a URL valid for 1 hour
const url = await getSignedDownloadUrl("private/document.pdf");`}
        language="typescript"
      />

      <Callout type="info">
        Signed URLs are perfect for private files that should only be accessible
        to authenticated users.
      </Callout>

      <h2>Best Practices</h2>

      <ul>
        <li>Use meaningful key names with folder-like prefixes</li>
        <li>Set appropriate Content-Type headers for browser compatibility</li>
        <li>Use signed URLs for private content</li>
        <li>Implement file type validation before uploading</li>
        <li>Consider file size limits for your use case</li>
      </ul>
    </article>
  );
}
