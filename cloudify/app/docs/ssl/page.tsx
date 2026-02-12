"use client";

import Link from "next/link";
import { ArrowRight, Check, Shield, Lock, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SslDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>SSL Certificates</h1>

      <p className="lead">
        Cloudify automatically provisions and renews SSL certificates for all your domains,
        ensuring your applications are always served over HTTPS.
      </p>

      <div className="not-prose p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 my-8">
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 text-green-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-2">
              Automatic SSL
            </h3>
            <p className="text-[var(--text-secondary)]">
              SSL certificates are automatically provisioned within minutes of adding
              a domain. No configuration required.
            </p>
          </div>
        </div>
      </div>

      <h2>How It Works</h2>

      <ol>
        <li><strong>Domain Verification</strong> - When you add a domain, we verify ownership through DNS</li>
        <li><strong>Certificate Issuance</strong> - We automatically request an SSL certificate from Let&apos;s Encrypt</li>
        <li><strong>Auto-Renewal</strong> - Certificates are renewed automatically before expiration</li>
        <li><strong>HTTPS Enforcement</strong> - All HTTP traffic is redirected to HTTPS</li>
      </ol>

      <h2>Certificate Types</h2>

      <div className="not-prose grid grid-cols-1 gap-4 my-8">
        {[
          {
            title: "Domain Validated (DV)",
            desc: "Standard certificates for most use cases. Issued automatically.",
            included: "All plans",
          },
          {
            title: "Wildcard Certificates",
            desc: "Secure unlimited subdomains with a single certificate.",
            included: "Pro and Enterprise",
          },
          {
            title: "Custom Certificates",
            desc: "Bring your own OV/EV certificates for enhanced trust indicators.",
            included: "Enterprise",
          },
        ].map((cert) => (
          <div key={cert.title} className="p-4 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-primary)]">
            <div className="flex items-start gap-4">
              <Lock className="h-6 w-6 text-[#0070f3] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[var(--text-primary)]">{cert.title}</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{cert.desc}</p>
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[var(--surface-secondary)] text-[var(--text-primary)]">
                  {cert.included}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2>HTTPS Configuration</h2>

      <h3>Force HTTPS</h3>

      <p>
        HTTPS is enforced by default. All HTTP requests are automatically redirected to HTTPS.
        You can configure this behavior in your project settings:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// cloudify.json
{
  "ssl": {
    "forceHttps": true,
    "hstsEnabled": true,
    "hstsMaxAge": 31536000
  }
}`}</code>
      </pre>

      <h3>HSTS (HTTP Strict Transport Security)</h3>

      <p>
        Enable HSTS to tell browsers to only connect via HTTPS:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// cloudify.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2>Custom Certificates</h2>

      <p>
        Enterprise customers can upload their own SSL certificates:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`cloudify certs upload \\
  --domain example.com \\
  --cert ./certificate.pem \\
  --key ./private-key.pem \\
  --chain ./chain.pem`}</code>
      </pre>

      <h3>Certificate Requirements</h3>

      <ul>
        <li>PEM format</li>
        <li>RSA 2048-bit or higher, or ECDSA P-256 or higher</li>
        <li>Valid for the domain being configured</li>
        <li>Not expired</li>
        <li>Complete certificate chain</li>
      </ul>

      <h2>Certificate Status</h2>

      <p>
        Check the status of your SSL certificates:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`cloudify certs ls

┌──────────────────────┬────────────┬─────────────────┬──────────────┐
│ Domain               │ Status     │ Expires         │ Type         │
├──────────────────────┼────────────┼─────────────────┼──────────────┤
│ example.com          │ Active     │ Mar 15, 2025    │ DV           │
│ www.example.com      │ Active     │ Mar 15, 2025    │ DV           │
│ *.example.com        │ Active     │ Mar 15, 2025    │ Wildcard     │
└──────────────────────┴────────────┴─────────────────┴──────────────┘`}</code>
      </pre>

      <h2>Troubleshooting</h2>

      <div className="not-prose p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 my-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-2">
              Common Issues
            </h3>
            <ul className="space-y-3 text-[var(--text-secondary)]">
              <li>
                <strong>Certificate pending:</strong> Ensure DNS is correctly configured and propagated.
              </li>
              <li>
                <strong>CAA record blocking:</strong> Add a CAA record allowing Let&apos;s Encrypt:
                <code className="block mt-1 text-sm">0 issue "letsencrypt.org"</code>
              </li>
              <li>
                <strong>Rate limited:</strong> Let&apos;s Encrypt has rate limits. Wait and retry.
              </li>
              <li>
                <strong>Domain not resolving:</strong> Verify the domain points to Cloudify.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <h3>Verifying SSL Configuration</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Check certificate details
openssl s_client -connect example.com:443 -servername example.com

# Check certificate expiration
echo | openssl s_client -connect example.com:443 2>/dev/null | \\
  openssl x509 -noout -dates`}</code>
      </pre>

      <h2>Security Best Practices</h2>

      <div className="not-prose grid grid-cols-1 gap-4 my-8">
        {[
          { icon: Shield, title: "Enable HSTS", desc: "Prevent downgrade attacks by enforcing HTTPS" },
          { icon: Lock, title: "Use TLS 1.3", desc: "Cloudify uses TLS 1.3 by default for best security" },
          { icon: RefreshCw, title: "Monitor Expiration", desc: "Set up alerts for certificate expiration" },
          { icon: Check, title: "Verify Chain", desc: "Ensure complete certificate chain is served" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-primary)]">
            <item.icon className="h-6 w-6 text-[#0070f3] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">{item.title}</h4>
              <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="not-prose mt-12">
        <Button variant="default" asChild>
          <Link href="/docs/domains">
            Configure Custom Domains
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
