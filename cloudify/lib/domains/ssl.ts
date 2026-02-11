/**
 * SSL Certificate Management
 *
 * This module provides SSL certificate operations with two modes:
 * 1. ACME mode (default): Uses our ACME client for programmatic certificate management
 * 2. Certbot mode (legacy): Uses certbot CLI for certificate provisioning
 *
 * The ACME mode is preferred as it provides:
 * - Support for DNS-01 challenges via Cloudflare
 * - Better integration with renewal automation
 * - More control over certificate lifecycle
 */

import { exec, execFile } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { updateNginxConfig } from "./nginx";
import { isValidDomain } from "./validate";
import {
  provisionCertificate,
  renewCertificate,
  getCertificateInfo,
  checkAndRenewCertificates,
  getExpiringCertificates,
  sendExpirationWarnings,
  getCertificateManagerStatus,
  startRenewalScheduler,
  stopRenewalScheduler,
  triggerProvisioningInBackground,
  CertificateInfo,
  CertificateStatus,
} from "./certificate-manager";
import { isCloudflareConfigured } from "@/lib/integrations/cloudflare";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// Configuration
const SSL_CERTS_DIR = process.env.SSL_CERTS_DIR || "/etc/letsencrypt/live";
const CERTBOT_WEBROOT = process.env.CERTBOT_WEBROOT || "/var/www/certbot";
const ACME_EMAIL = process.env.ACME_EMAIL || "admin@tranthachnguyen.com";
const USE_ACME_CLIENT = process.env.USE_ACME_CLIENT !== "false"; // Default to true

export interface SslProvisionResult {
  success: boolean;
  certPath?: string;
  keyPath?: string;
  expiresAt?: Date;
  error?: string;
  method?: "acme" | "certbot";
}

export interface SslStatus {
  configured: boolean;
  status?: CertificateStatus;
  expires?: Date;
  daysUntilExpiry?: number;
  certPath?: string;
  keyPath?: string;
}

/**
 * Provision SSL certificate for a domain
 *
 * Uses ACME client by default, falls back to certbot if ACME fails or is disabled
 */
export async function provisionSslCertificate(
  domainId: string
): Promise<SslProvisionResult> {
  // Try ACME client first (preferred method)
  if (USE_ACME_CLIENT) {
    console.log(`[SSL] Using ACME client for domain ${domainId}`);

    const result = await provisionCertificate(domainId);

    if (result.success) {
      const domain = await prisma.domain.findUnique({ where: { id: domainId } });
      return {
        success: true,
        certPath: domain?.sslCertPath || undefined,
        keyPath: domain?.sslKeyPath || undefined,
        method: "acme",
      };
    }

    // If Cloudflare is not configured, DNS-01 won't work
    // Fall back to certbot for HTTP-01
    if (!isCloudflareConfigured()) {
      console.log(`[SSL] ACME failed, falling back to certbot for ${domainId}`);
      return provisionWithCertbot(domainId);
    }

    return {
      success: false,
      error: result.error,
      method: "acme",
    };
  }

  // Use certbot if ACME client is disabled
  return provisionWithCertbot(domainId);
}

/**
 * Provision SSL certificate using Certbot CLI (legacy method)
 */
async function provisionWithCertbot(domainId: string): Promise<SslProvisionResult> {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      return { success: false, error: "Domain not found", method: "certbot" };
    }

    if (!domain.verified) {
      return {
        success: false,
        error: "Domain must be verified before SSL provisioning",
        method: "certbot",
      };
    }

    // Validate domain name to prevent command injection
    if (!isValidDomain(domain.domain)) {
      return {
        success: false,
        error: "Invalid domain name",
        method: "certbot",
      };
    }

    console.log(`[SSL] Provisioning certificate via certbot for ${domain.domain}`);

    // Update status to provisioning
    await prisma.domain.update({
      where: { id: domainId },
      data: { sslStatus: "provisioning" },
    });

    // Ensure webroot directory exists
    await fs.mkdir(CERTBOT_WEBROOT, { recursive: true });

    // Run certbot with execFile (safe — no shell interpolation)
    const certbotArgs = [
      "certonly",
      "--webroot",
      "-w", CERTBOT_WEBROOT,
      "-d", domain.domain,
      "--non-interactive",
      "--agree-tos",
      "--email", ACME_EMAIL,
      "--no-eff-email",
    ];

    try {
      await execFileAsync("certbot", certbotArgs);
    } catch (certbotError) {
      const error = certbotError as Error & { stderr?: string };
      console.error("[SSL] Certbot error:", error.stderr || error.message);

      await prisma.domain.update({
        where: { id: domainId },
        data: { sslStatus: "error" },
      });

      return {
        success: false,
        error: `SSL provisioning failed: ${error.stderr || error.message}`,
        method: "certbot",
      };
    }

    // Certificate paths
    const certPath = path.join(SSL_CERTS_DIR, domain.domain, "fullchain.pem");
    const keyPath = path.join(SSL_CERTS_DIR, domain.domain, "privkey.pem");

    // Verify certificates exist
    try {
      await fs.access(certPath);
      await fs.access(keyPath);
    } catch {
      await prisma.domain.update({
        where: { id: domainId },
        data: { sslStatus: "error" },
      });

      return {
        success: false,
        error: "SSL certificates were not created properly",
        method: "certbot",
      };
    }

    // Get expiration date (using execFile — safe, no shell)
    let expiresAt: Date | undefined;
    try {
      const { stdout } = await execFileAsync("openssl", [
        "x509", "-enddate", "-noout", "-in", certPath,
      ]);
      const match = stdout.match(/notAfter=(.+)/);
      if (match) {
        expiresAt = new Date(match[1]);
      }
    } catch {
      // Ignore expiration parsing errors
    }

    // Update domain with certificate paths
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        sslStatus: "active",
        sslCertPath: certPath,
        sslKeyPath: keyPath,
      },
    });

    // Update nginx config to use SSL
    await updateNginxConfig();

    console.log(`[SSL] Certificate provisioned successfully for ${domain.domain}`);

    return {
      success: true,
      certPath,
      keyPath,
      expiresAt,
      method: "certbot",
    };
  } catch (error) {
    console.error("[SSL] Provisioning error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      method: "certbot",
    };
  }
}

/**
 * Renew SSL certificate for a domain
 */
export async function renewSslCertificate(domainId: string): Promise<SslProvisionResult> {
  if (USE_ACME_CLIENT) {
    const result = await renewCertificate(domainId);
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    return {
      success: result.success,
      certPath: domain?.sslCertPath || undefined,
      keyPath: domain?.sslKeyPath || undefined,
      error: result.error,
      method: "acme",
    };
  }

  // Certbot renewal is for all certificates
  return provisionWithCertbot(domainId);
}

/**
 * Renew all SSL certificates using certbot (legacy batch renewal)
 */
export async function renewAllCertificatesWithCertbot(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await execAsync("certbot renew --quiet");
    console.log("[SSL] All certificates renewed via certbot");
    return { success: true };
  } catch (error) {
    const err = error as Error & { stderr?: string };
    console.error("[SSL] Failed to renew certificates:", err);
    return {
      success: false,
      error: err.stderr || err.message,
    };
  }
}

/**
 * Check SSL status for a domain
 */
export async function checkSslStatus(domainId: string): Promise<SslStatus> {
  // Use certificate manager for detailed info
  const info = await getCertificateInfo(domainId);

  if (!info) {
    return { configured: false };
  }

  return {
    configured: info.status === "active" || info.status === "expiring",
    status: info.status,
    expires: info.expiresAt,
    daysUntilExpiry: info.daysUntilExpiry,
    certPath: info.certPath,
    keyPath: info.keyPath,
  };
}

/**
 * Get detailed certificate information
 */
export async function getSslCertificateInfo(
  domainId: string
): Promise<CertificateInfo | null> {
  return getCertificateInfo(domainId);
}

/**
 * Trigger SSL provisioning in background
 */
export async function triggerSslProvisioning(domainId: string): Promise<void> {
  if (USE_ACME_CLIENT) {
    triggerProvisioningInBackground(domainId);
  } else {
    // Run certbot provisioning in background
    provisionWithCertbot(domainId).catch((error) => {
      console.error(`[SSL] Background provisioning failed for ${domainId}:`, error);
    });
  }
}

/**
 * Check and renew all certificates that are expiring soon
 */
export async function checkAndRenewExpiring(): Promise<{
  checked: number;
  renewed: number;
  failed: number;
}> {
  if (USE_ACME_CLIENT) {
    const result = await checkAndRenewCertificates();
    return {
      checked: result.checked,
      renewed: result.renewed,
      failed: result.failed,
    };
  }

  // Certbot renews all certificates in one go
  const domains = await prisma.domain.findMany({
    where: {
      verified: true,
      sslStatus: "active",
    },
  });

  const result = await renewAllCertificatesWithCertbot();

  return {
    checked: domains.length,
    renewed: result.success ? domains.length : 0,
    failed: result.success ? 0 : domains.length,
  };
}

/**
 * Get list of expiring certificates
 */
export async function getExpiringSslCertificates(
  thresholdDays?: number
): Promise<CertificateInfo[]> {
  return getExpiringCertificates(thresholdDays);
}

/**
 * Send SSL expiration warnings to users
 */
export async function sendSslExpirationWarnings(): Promise<number> {
  return sendExpirationWarnings();
}

/**
 * Get SSL management status
 */
export async function getSslStatus(): Promise<{
  totalDomains: number;
  activeCertificates: number;
  pendingCertificates: number;
  expiringCertificates: number;
  errorCertificates: number;
  renewalThresholdDays: number;
  acmeEnabled: boolean;
  cloudflareEnabled: boolean;
}> {
  const status = await getCertificateManagerStatus();

  return {
    ...status,
    acmeEnabled: USE_ACME_CLIENT,
    cloudflareEnabled: isCloudflareConfigured(),
  };
}

/**
 * Start automatic SSL renewal scheduler
 */
export function startSslRenewalScheduler(intervalHours?: number): void {
  startRenewalScheduler(intervalHours);
}

/**
 * Stop automatic SSL renewal scheduler
 */
export function stopSslRenewalScheduler(): void {
  stopRenewalScheduler();
}

/**
 * Force renew a certificate regardless of expiration
 */
export async function forceRenewCertificate(
  domainId: string
): Promise<SslProvisionResult> {
  return renewSslCertificate(domainId);
}

/**
 * Revoke and remove a certificate
 */
export async function revokeSslCertificate(domainId: string): Promise<boolean> {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    return false;
  }

  // Update database
  await prisma.domain.update({
    where: { id: domainId },
    data: {
      sslStatus: "pending",
      sslCertPath: null,
      sslKeyPath: null,
    },
  });

  // Update nginx
  await updateNginxConfig();

  console.log(`[SSL] Certificate revoked for ${domain.domain}`);
  return true;
}

// Re-export types
export type { CertificateInfo, CertificateStatus };
