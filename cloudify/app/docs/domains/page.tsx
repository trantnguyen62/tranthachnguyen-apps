"use client";

import { Globe, Lock, Check, ArrowRight, AlertCircle } from "lucide-react";

export default function DomainsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Custom Domains</h1>

      <p className="lead">
        Connect your own domain to your Cloudify project. We handle SSL certificates,
        DNS configuration, and global distribution automatically.
      </p>

      <h2>Adding a Domain</h2>

      <ol>
        <li>Go to your project&apos;s Settings → Domains</li>
        <li>Click &quot;Add Domain&quot;</li>
        <li>Enter your domain name (e.g., <code>example.com</code>)</li>
        <li>Configure your DNS as instructed</li>
        <li>Wait for verification (usually within minutes)</li>
      </ol>

      <h2>DNS Configuration</h2>

      <h3>Root Domain (example.com)</h3>

      <p>
        For root domains, add an <code>A</code> record pointing to Cloudify&apos;s IP address:
      </p>

      <div className="not-prose bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4">Type</th>
              <th className="text-left py-2 pr-4">Name</th>
              <th className="text-left py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 pr-4 text-green-400">A</td>
              <td className="py-2 pr-4">@</td>
              <td className="py-2">76.76.21.21</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Subdomain (www.example.com)</h3>

      <p>
        For subdomains, add a <code>CNAME</code> record pointing to <code>cname.cloudify.app</code>:
      </p>

      <div className="not-prose bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4">Type</th>
              <th className="text-left py-2 pr-4">Name</th>
              <th className="text-left py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 pr-4 text-[#0070f3]">CNAME</td>
              <td className="py-2 pr-4">www</td>
              <td className="py-2">cname.cloudify.app</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>SSL Certificates</h2>

      <div className="not-prose p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 my-8">
        <div className="flex items-start gap-4">
          <Lock className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Automatic HTTPS
            </h3>
            <p className="text-muted-foreground text-sm">
              Cloudify automatically provisions and renews SSL certificates for all your domains.
              No configuration required.
            </p>
          </div>
        </div>
      </div>

      <p>Our SSL certificates are:</p>

      <ul>
        <li>Issued by Let&apos;s Encrypt</li>
        <li>Auto-renewed before expiration</li>
        <li>Support for wildcard domains</li>
        <li>TLS 1.3 enabled by default</li>
      </ul>

      <h2>Wildcard Domains</h2>

      <p>
        You can add a wildcard domain to match any subdomain pattern:
      </p>

      <ul>
        <li><code>*.example.com</code> - Matches <code>app.example.com</code>, <code>blog.example.com</code>, etc.</li>
        <li>Useful for multi-tenant applications</li>
        <li>Each subdomain can serve different content based on the hostname</li>
      </ul>

      <h2>Domain Redirects</h2>

      <p>
        Configure redirects between your domains:
      </p>

      <ul>
        <li><strong>www to apex</strong> - Redirect <code>www.example.com</code> → <code>example.com</code></li>
        <li><strong>apex to www</strong> - Redirect <code>example.com</code> → <code>www.example.com</code></li>
        <li><strong>HTTP to HTTPS</strong> - Automatically enabled for all domains</li>
      </ul>

      <h2>Troubleshooting</h2>

      <h3>Domain not verifying</h3>

      <ul>
        <li>DNS propagation can take up to 48 hours (usually much faster)</li>
        <li>Check your DNS records are configured correctly</li>
        <li>Ensure there are no conflicting records</li>
        <li>Try using a DNS lookup tool to verify your records</li>
      </ul>

      <h3>SSL certificate not issuing</h3>

      <ul>
        <li>Verify the domain is pointing to Cloudify</li>
        <li>Check for CAA records that might block Let&apos;s Encrypt</li>
        <li>Ensure the domain is not on a blocklist</li>
      </ul>

      <div className="not-prose p-6 rounded-xl border border-border bg-secondary my-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-foreground shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Need Help?
            </h3>
            <p className="text-muted-foreground text-sm">
              If you&apos;re having trouble with your domain, our support team is here to help.
              Contact us at support@cloudify.app
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
