import Link from "next/link";

export default function StoragePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Storage</h1>

      <p className="lead">
        Cloudify provides two types of storage: Blob Storage for files and
        KV Store for key-value data.
      </p>

      <h2>Storage Options</h2>

      <div className="not-prose my-6 grid md:grid-cols-2 gap-6">
        <Link
          href="/storage/blob-storage"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Blob Storage
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Store and serve files like images, videos, and documents. S3-compatible
            API for easy integration.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>Up to 5GB per file</li>
            <li>Unlimited storage</li>
            <li>CDN-cached delivery</li>
            <li>S3-compatible API</li>
          </ul>
        </Link>

        <Link
          href="/storage/kv-store"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            KV Store
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Fast key-value storage for caching, sessions, and configuration data.
            Redis-compatible operations.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>Sub-millisecond latency</li>
            <li>Automatic expiration</li>
            <li>JSON support</li>
            <li>Redis-compatible</li>
          </ul>
        </Link>
      </div>

      <h2>Use Cases</h2>

      <h3>Blob Storage</h3>

      <ul>
        <li>User-uploaded files (avatars, documents)</li>
        <li>Static assets (images, videos, fonts)</li>
        <li>Generated files (reports, exports)</li>
        <li>Backup and archival</li>
      </ul>

      <h3>KV Store</h3>

      <ul>
        <li>Session management</li>
        <li>API response caching</li>
        <li>Rate limiting</li>
        <li>Feature flags</li>
        <li>Real-time counters</li>
      </ul>

      <h2>Getting Started</h2>

      <p>
        Storage is automatically provisioned when you create a project. Access
        credentials are available as environment variables:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Variable</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2"><code>BLOB_URL</code></td>
              <td className="px-4 py-2">Blob storage endpoint URL</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>BLOB_ACCESS_KEY</code></td>
              <td className="px-4 py-2">S3 access key</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>BLOB_SECRET_KEY</code></td>
              <td className="px-4 py-2">S3 secret key</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2"><code>KV_URL</code></td>
              <td className="px-4 py-2">KV store Redis URL</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Pricing</h2>

      <p>
        Storage usage is included with your Cloudify plan:
      </p>

      <ul>
        <li>
          <strong>Free tier</strong>: 1GB Blob + 100MB KV
        </li>
        <li>
          <strong>Pro tier</strong>: 100GB Blob + 1GB KV
        </li>
        <li>
          <strong>Enterprise</strong>: Unlimited (contact us)
        </li>
      </ul>
    </article>
  );
}
