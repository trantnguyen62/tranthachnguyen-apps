"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ArrowRight,
  Server,
  Database,
  HardDrive,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function CodeBlock({
  code,
  id,
  language = "bash",
}: {
  code: string;
  id: string;
  language?: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 text-[var(--text-secondary)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied === id ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

const envVars = [
  {
    category: "Required",
    vars: [
      {
        name: "DATABASE_URL",
        description: "PostgreSQL connection string",
        example: "postgresql://cloudify:pass@cloudify-db:5432/cloudify",
      },
      {
        name: "REDIS_URL",
        description: "Redis connection string",
        example: "redis://cloudify-redis:6379",
      },
      {
        name: "JWT_SECRET",
        description: "JWT signing secret (min 32 chars)",
        example: "openssl rand -base64 32",
      },
      {
        name: "AUTH_SECRET",
        description: "NextAuth secret (min 32 chars)",
        example: "openssl rand -base64 32",
      },
      {
        name: "AUTH_URL",
        description: "Public URL of your Cloudify instance",
        example: "https://cloudify.example.com",
      },
      {
        name: "BASE_DOMAIN",
        description: "Base domain for deployed sites",
        example: "example.com",
      },
    ],
  },
  {
    category: "Build Pipeline",
    vars: [
      {
        name: "BUILDS_DIR",
        description: "Directory for build artifacts",
        example: "/data/builds",
      },
      {
        name: "REPOS_DIR",
        description: "Directory for cloning repositories",
        example: "/data/repos",
      },
      {
        name: "USE_DOCKER_ISOLATION",
        description: "Run builds in isolated Docker containers",
        example: "true",
      },
      {
        name: "USE_K3S_BUILDS",
        description: "Use K3s cluster for builds",
        example: "false",
      },
    ],
  },
  {
    category: "GitHub Integration",
    vars: [
      {
        name: "GITHUB_WEBHOOK_SECRET",
        description: "Secret for verifying webhook payloads",
        example: "your-webhook-secret",
      },
      {
        name: "GITHUB_CLIENT_ID",
        description: "GitHub OAuth App client ID",
        example: "Iv1.abc123...",
      },
      {
        name: "GITHUB_CLIENT_SECRET",
        description: "GitHub OAuth App client secret",
        example: "secret_abc123...",
      },
      {
        name: "GITHUB_TOKEN",
        description: "Personal access token for repo access",
        example: "ghp_...",
      },
    ],
  },
  {
    category: "Object Storage (MinIO / S3)",
    vars: [
      {
        name: "MINIO_ENDPOINT",
        description: "MinIO/S3 hostname",
        example: "minio",
      },
      {
        name: "MINIO_PORT",
        description: "MinIO/S3 port",
        example: "9000",
      },
      {
        name: "MINIO_ACCESS_KEY",
        description: "Access key (username)",
        example: "cloudify",
      },
      {
        name: "MINIO_SECRET_KEY",
        description: "Secret key (password)",
        example: "your-minio-secret",
      },
    ],
  },
  {
    category: "Cloudflare (optional)",
    vars: [
      {
        name: "CLOUDFLARE_API_TOKEN",
        description: "API token with Zone:DNS:Edit permissions",
        example: "your-cf-api-token",
      },
      {
        name: "CLOUDFLARE_ZONE_ID",
        description: "Zone ID for your domain",
        example: "abc123...",
      },
      {
        name: "CLOUDFLARE_TUNNEL_ID",
        description: "Tunnel ID for routing traffic",
        example: "def456...",
      },
    ],
  },
  {
    category: "Billing (optional)",
    vars: [
      {
        name: "STRIPE_SECRET_KEY",
        description: "Stripe API secret key",
        example: "sk_live_...",
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        description: "Stripe webhook signing secret",
        example: "whsec_...",
      },
    ],
  },
];

export default function SelfHostingPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Self-Hosting Cloudify</h1>

      <p className="lead">
        Run Cloudify on your own infrastructure with Docker Compose. This guide
        covers everything from initial setup to production hardening.
      </p>

      {/* Architecture overview */}
      <h2>Architecture Overview</h2>

      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {[
          {
            icon: Server,
            name: "Cloudify App",
            detail: "Next.js on port 3000",
          },
          {
            icon: Database,
            name: "PostgreSQL",
            detail: "Primary database",
          },
          {
            icon: HardDrive,
            name: "Redis",
            detail: "Cache & KV store",
          },
          {
            icon: HardDrive,
            name: "MinIO",
            detail: "S3-compatible storage",
          },
        ].map((svc) => (
          <div
            key={svc.name}
            className="p-4 rounded-lg border border-[var(--border-primary)] bg-card"
          >
            <svc.icon className="h-6 w-6 text-[var(--text-primary)] mb-2" />
            <div className="font-semibold text-[var(--text-primary)] text-sm">
              {svc.name}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{svc.detail}</div>
          </div>
        ))}
      </div>

      <h2>Prerequisites</h2>

      <ul>
        <li>
          <strong>Docker &amp; Docker Compose</strong> installed on the host
          machine
        </li>
        <li>
          <strong>2+ CPU cores</strong> and <strong>4 GB+ RAM</strong>{" "}
          (recommended)
        </li>
        <li>
          <strong>Domain name</strong> with DNS access (for subdomain routing)
        </li>
        <li>
          A <strong>reverse proxy</strong> (Nginx, Traefik, or Cloudflare
          Tunnel) for HTTPS
        </li>
      </ul>

      <h2>Quick Start with Docker Compose</h2>

      <h3>1. Clone the Repository</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`git clone https://github.com/cloudify/cloudify.git
cd cloudify`}
          id="clone"
        />
      </div>

      <h3>2. Create Environment File</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`cp .env.example .env
# Edit .env with your secrets
# At minimum, set DATABASE_URL, JWT_SECRET, AUTH_SECRET, AUTH_URL`}
          id="env-setup"
        />
      </div>

      <h3>3. Create Data Directories</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`mkdir -p /data/builds /data/repos
chown -R 1001:1001 /data`}
          id="data-dirs"
        />
      </div>

      <div className="not-prose my-4 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              The Cloudify container runs as user <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">nextjs</code> (uid 1001).
              The <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">/data</code> directory must be writable by this user.
            </p>
          </div>
        </div>
      </div>

      <h3>4. Start All Services</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code="docker compose -f docker-compose.production.yml up -d"
          id="compose-up"
        />
      </div>

      <h3>5. Run Database Migrations</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code="docker exec cloudify-app npx prisma db push"
          id="migrations"
        />
      </div>

      <h3>6. Verify Health</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`curl http://localhost:3000/api/health
# Expected: {"status":"healthy","checks":{"database":"connected","redis":"connected","buildPipeline":"ready"}}`}
          id="health-check"
        />
      </div>

      <h2>Docker Compose Services</h2>

      <p>
        The production Docker Compose file defines the following services:
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                Service
              </th>
              <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                Image
              </th>
              <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                Port
              </th>
              <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                service: "cloudify",
                image: "cloudify:latest",
                port: "3000",
                purpose: "Main Next.js application",
              },
              {
                service: "postgres",
                image: "postgres:16-alpine",
                port: "5432",
                purpose: "Primary database",
              },
              {
                service: "redis",
                image: "redis:7-alpine",
                port: "6379",
                purpose: "Cache, KV store, job queues",
              },
              {
                service: "minio",
                image: "minio/minio",
                port: "9000 / 9001",
                purpose: "S3-compatible object storage",
              },
              {
                service: "traefik",
                image: "traefik:v3.0",
                port: "80 / 443",
                purpose: "Reverse proxy with auto SSL",
              },
            ].map((row) => (
              <tr key={row.service} className="border-b border-[var(--border-primary)]">
                <td className="py-2 px-3 font-mono text-[var(--text-primary)]">
                  {row.service}
                </td>
                <td className="py-2 px-3 text-[var(--text-secondary)]">
                  {row.image}
                </td>
                <td className="py-2 px-3 text-[var(--text-secondary)]">{row.port}</td>
                <td className="py-2 px-3 text-[var(--text-secondary)]">
                  {row.purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Environment Variables</h2>

      <p>
        Below is a complete reference of all environment variables. Copy{" "}
        <code>.env.example</code> and fill in the values for your setup.
      </p>

      <div className="not-prose space-y-8 my-6">
        {envVars.map((group) => (
          <div key={group.category}>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              {group.category}
              {group.category === "Required" && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Required
                </Badge>
              )}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                      Variable
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                      Description
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-[var(--text-primary)]">
                      Example
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.vars.map((v) => (
                    <tr key={v.name} className="border-b border-[var(--border-primary)]">
                      <td className="py-2 px-3 font-mono text-[var(--text-primary)] text-xs">
                        {v.name}
                      </td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">
                        {v.description}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-[var(--text-secondary)]">
                        {v.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <h2>Reverse Proxy Configuration</h2>

      <h3>Option A: Traefik (included)</h3>

      <p>
        The production Docker Compose includes Traefik with automatic SSL via
        Let&apos;s Encrypt. Set the <code>ACME_EMAIL</code> environment variable
        and Traefik handles the rest.
      </p>

      <h3>Option B: Nginx</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`server {
    listen 80;
    server_name cloudify.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Subdomain routing for deployed sites
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\\.example\\.com$;

    location / {
        root /data/builds/$subdomain;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}`}
          id="nginx-config"
          language="nginx"
        />
      </div>

      <h3>Option C: Cloudflare Tunnel</h3>

      <p>
        For zero-config HTTPS without opening ports, use a Cloudflare Tunnel:
      </p>

      <div className="not-prose my-4">
        <CodeBlock
          code={`# /etc/cloudflared/config.yml
tunnel: your-tunnel-id
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: cloudify.example.com
    service: http://localhost:3000
  - hostname: "*.example.com"
    service: http://localhost:8080
  - service: http_status:404`}
          id="cf-tunnel"
          language="yaml"
        />
      </div>

      <h2>Database Management</h2>

      <h3>Migrations</h3>
      <p>
        After updating Cloudify, push schema changes to the database:
      </p>

      <div className="not-prose my-4">
        <CodeBlock
          code="docker exec cloudify-app npx prisma db push"
          id="db-push"
        />
      </div>

      <h3>Backups</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`# Backup PostgreSQL
docker exec cloudify-db pg_dump -h localhost -U cloudify cloudify > backup.sql

# Restore
docker exec -i cloudify-db psql -h localhost -U cloudify cloudify < backup.sql`}
          id="db-backup"
        />
      </div>

      <h2>Updating Cloudify</h2>

      <div className="not-prose my-4">
        <CodeBlock
          code={`# Pull the latest image
docker compose -f docker-compose.production.yml pull cloudify

# Restart with the new image
docker compose -f docker-compose.production.yml up -d cloudify

# Run database migrations
docker exec cloudify-app npx prisma db push`}
          id="update"
        />
      </div>

      <h2>Troubleshooting</h2>

      <h3>Build fails with &quot;git: command not found&quot;</h3>
      <p>
        Ensure git is installed in the Docker image. The official Cloudify image
        includes git by default.
      </p>

      <h3>Build fails with &quot;spawn docker ENOENT&quot;</h3>
      <p>
        Set <code>USE_DOCKER_ISOLATION=false</code> to run builds directly
        without Docker-in-Docker.
      </p>

      <h3>Permission denied on /data</h3>
      <p>
        The container runs as uid 1001. Fix ownership:
      </p>

      <div className="not-prose my-4">
        <CodeBlock code="chown -R 1001:1001 /data" id="fix-perms" />
      </div>

      <h3>Login fails</h3>
      <ul>
        <li>
          Verify <code>AUTH_URL</code> matches the public URL exactly
        </li>
        <li>
          Ensure <code>JWT_SECRET</code> and <code>AUTH_SECRET</code> are at
          least 32 characters
        </li>
        <li>
          Check that HTTPS is properly configured (cookies require secure
          transport in production)
        </li>
        <li>
          Confirm the database is accessible and the schema is up to date
        </li>
      </ul>

      <h3>PostgreSQL &quot;database does not exist&quot;</h3>

      <div className="not-prose my-4">
        <CodeBlock
          code={`docker exec -it cloudify-db psql -h localhost -U cloudify -d postgres \\
  -c 'CREATE DATABASE cloudify'`}
          id="create-db"
        />
      </div>

      <h2>Security Hardening</h2>

      <div className="not-prose my-6">
        <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-card">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-5 w-5 text-[var(--text-primary)] shrink-0 mt-0.5" />
            <h3 className="font-semibold text-[var(--text-primary)]">
              Production Security Checklist
            </h3>
          </div>
          <ul className="space-y-2">
            {[
              "Use strong, unique secrets for JWT_SECRET and AUTH_SECRET",
              "Enable HTTPS with valid SSL certificates",
              "Restrict database access to the Docker network only",
              "Set read_only: true on containers where possible",
              "Enable no-new-privileges security option",
              "Regularly update Docker images to patch vulnerabilities",
              "Set up automated database backups",
              "Monitor /api/health endpoint for uptime alerts",
              "Configure firewall rules to expose only ports 80 and 443",
              "Use Docker secrets or a vault for sensitive environment variables",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-[var(--text-secondary)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="not-prose mt-8 flex gap-4">
        <Button variant="default" asChild>
          <Link href="/docs/getting-started">
            Getting Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/docs/api-reference">API Reference</Link>
        </Button>
      </div>
    </article>
  );
}
