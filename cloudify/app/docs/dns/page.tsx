"use client";

import Link from "next/link";
import { ArrowRight, Check, Globe, Shield, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DnsDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>DNS Configuration</h1>

      <p className="lead">
        Configure DNS settings for your custom domains. Cloudify provides
        fast, reliable DNS with built-in DDoS protection.
      </p>

      <div className="not-prose p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 my-8">
        <div className="flex items-start gap-4">
          <Zap className="h-8 w-8 text-blue-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
              Global DNS Network
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our anycast DNS network resolves queries from the nearest location,
              providing sub-50ms resolution times worldwide.
            </p>
          </div>
        </div>
      </div>

      <h2>Adding a Domain</h2>

      <h3>Step 1: Add Domain in Dashboard</h3>

      <p>
        Navigate to your project settings and add your custom domain:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`cloudify domains add example.com`}</code>
      </pre>

      <h3>Step 2: Configure DNS Records</h3>

      <p>
        Point your domain to Cloudify by adding the following DNS records at your registrar:
      </p>

      <h4>For Apex Domains (example.com)</h4>

      <div className="not-prose my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400"><code>A</code></td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400"><code>@</code></td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400"><code>76.76.21.21</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4>For Subdomains (www.example.com)</h4>

      <div className="not-prose my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400"><code>CNAME</code></td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400"><code>www</code></td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400"><code>cname.cloudify.app</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>DNS Record Types</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { type: "A", desc: "Maps a domain to an IPv4 address" },
          { type: "AAAA", desc: "Maps a domain to an IPv6 address" },
          { type: "CNAME", desc: "Creates an alias to another domain" },
          { type: "MX", desc: "Specifies mail servers for the domain" },
          { type: "TXT", desc: "Stores text data, often for verification" },
          { type: "NS", desc: "Specifies authoritative name servers" },
        ].map((record) => (
          <div key={record.type} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <code className="text-blue-600 dark:text-blue-400 font-semibold">{record.type}</code>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.desc}</p>
          </div>
        ))}
      </div>

      <h2>Cloudify Nameservers</h2>

      <p>
        For full DNS management, you can transfer your nameservers to Cloudify:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`ns1.cloudify.app
ns2.cloudify.app`}</code>
      </pre>

      <div className="not-prose p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 my-8">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
          Benefits of Cloudify Nameservers
        </h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Automatic SSL certificate provisioning
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Built-in DDoS protection
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Global anycast network
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Instant DNS propagation
          </li>
        </ul>
      </div>

      <h2>Wildcard Domains</h2>

      <p>
        Configure wildcard subdomains to match any subdomain:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`cloudify domains add "*.example.com"`}</code>
      </pre>

      <p>
        This will route all subdomains (app.example.com, api.example.com, etc.) to your project.
      </p>

      <h2>DNS Propagation</h2>

      <div className="not-prose p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 my-8">
        <div className="flex items-start gap-4">
          <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
              Propagation Time
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              DNS changes can take up to 48 hours to propagate globally, though most
              changes are visible within a few minutes. Use a DNS checker tool to verify
              propagation status.
            </p>
          </div>
        </div>
      </div>

      <h2>Verifying DNS Configuration</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Check A record
dig example.com A

# Check CNAME record
dig www.example.com CNAME

# Check with specific DNS server
dig @8.8.8.8 example.com A`}</code>
      </pre>

      <h2>Troubleshooting</h2>

      <h3>Domain Not Verifying</h3>

      <ul>
        <li>Ensure DNS records are correctly configured at your registrar</li>
        <li>Wait for DNS propagation (up to 48 hours)</li>
        <li>Check for typos in record values</li>
        <li>Remove conflicting records</li>
      </ul>

      <h3>SSL Certificate Issues</h3>

      <ul>
        <li>Verify domain ownership by adding the required TXT record</li>
        <li>Ensure no CAA records are blocking certificate issuance</li>
        <li>Check that the domain is publicly accessible</li>
      </ul>

      <div className="not-prose mt-12">
        <Button variant="primary" asChild>
          <Link href="/docs/ssl">
            Configure SSL Certificates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
