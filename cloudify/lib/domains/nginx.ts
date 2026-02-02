import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

const NGINX_CONF_DIR = "/etc/nginx/conf.d";
const NGINX_DOMAINS_CONF = path.join(NGINX_CONF_DIR, "cloudify-domains.conf");

interface DomainConfig {
  domain: string;
  siteSlug: string;
  sslEnabled: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
}

/**
 * Generate nginx config block for a single domain
 */
function generateDomainConfig(config: DomainConfig): string {
  const { domain, siteSlug, sslEnabled, sslCertPath, sslKeyPath } = config;

  if (sslEnabled && sslCertPath && sslKeyPath) {
    return `
# Custom domain: ${domain}
server {
    listen 80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    ssl_certificate ${sslCertPath};
    ssl_certificate_key ${sslKeyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    root /usr/share/nginx/html/${siteSlug};
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Cloudify-Domain ${domain};
    add_header X-Powered-By "Cloudify";
}
`;
  }

  // HTTP-only config (before SSL is provisioned)
  return `
# Custom domain: ${domain} (SSL pending)
server {
    listen 80;
    server_name ${domain};

    root /usr/share/nginx/html/${siteSlug};
    index index.html index.htm;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Cloudify-Domain ${domain};
    add_header X-Powered-By "Cloudify";
}
`;
}

/**
 * Generate the complete nginx domains configuration file
 */
export async function generateDomainsConfig(): Promise<string> {
  // Get all verified domains with their project's latest deployment
  const domains = await prisma.domain.findMany({
    where: {
      verified: true,
    },
    include: {
      project: {
        include: {
          deployments: {
            where: { status: "READY" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              siteSlug: true,
            },
          },
        },
      },
    },
  });

  const configs = domains
    .filter((d) => d.project.deployments[0]?.siteSlug) // Only domains with active deployments
    .map((d) =>
      generateDomainConfig({
        domain: d.domain,
        siteSlug: d.project.deployments[0].siteSlug!,
        sslEnabled: d.sslStatus === "active",
        sslCertPath: d.sslCertPath || undefined,
        sslKeyPath: d.sslKeyPath || undefined,
      })
    );

  const header = `# Cloudify Custom Domains Configuration
# Auto-generated - Do not edit manually
# Generated at: ${new Date().toISOString()}

`;

  return header + configs.join("\n");
}

/**
 * Write the nginx configuration and reload nginx
 */
export async function updateNginxConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await generateDomainsConfig();

    // Write config file
    await fs.writeFile(NGINX_DOMAINS_CONF, config, "utf-8");

    // Test nginx config
    const { stderr: testError } = await execAsync("nginx -t");
    if (testError && testError.includes("error")) {
      return { success: false, error: `Nginx config test failed: ${testError}` };
    }

    // Reload nginx
    await execAsync("nginx -s reload");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update nginx config:", message);
    return { success: false, error: message };
  }
}

/**
 * Get the siteSlug for a domain (for request routing)
 */
export async function getSiteSlugForDomain(domain: string): Promise<string | null> {
  const domainRecord = await prisma.domain.findFirst({
    where: {
      domain,
      verified: true,
    },
    include: {
      project: {
        include: {
          deployments: {
            where: { status: "READY" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { siteSlug: true },
          },
        },
      },
    },
  });

  return domainRecord?.project.deployments[0]?.siteSlug || null;
}
