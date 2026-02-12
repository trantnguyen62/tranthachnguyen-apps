/**
 * Certificate Manager
 * Handles certificate lifecycle including provisioning, storage, renewal, and monitoring
 *
 * Provides:
 * - Certificate provisioning via ACME
 * - Certificate storage and retrieval
 * - Automatic renewal scheduling
 * - Expiration monitoring and alerts
 */

import { prisma } from "@/lib/prisma";
import { requestCertificate, needsRenewal, ChallengeType } from "./acme";
import { updateNginxConfig } from "./nginx";
import { sendNotification } from "@/lib/notifications";
import { isCloudflareConfigured } from "@/lib/integrations/cloudflare";

// Configuration
const SSL_CERTS_DIR = process.env.SSL_CERTS_DIR || "/etc/letsencrypt/live";
const RENEWAL_THRESHOLD_DAYS = parseInt(process.env.CERTIFICATE_EXPIRY_THRESHOLD || "30", 10);
const CLOUDIFY_SERVER_IP = process.env.CLOUDIFY_SERVER_IP || "192.168.0.203";

/**
 * Certificate status types
 */
export type CertificateStatus = "pending" | "provisioning" | "active" | "expiring" | "expired" | "error";

/**
 * Certificate info
 */
export interface CertificateInfo {
  domainId: string;
  domain: string;
  status: CertificateStatus;
  issuedAt?: Date;
  expiresAt?: Date;
  certPath?: string;
  keyPath?: string;
  daysUntilExpiry?: number;
  lastError?: string;
}

/**
 * Provisioning result
 */
export interface ProvisioningResult {
  success: boolean;
  domain: string;
  certificate?: string;
  error?: string;
}

/**
 * Write certificate files to disk
 */
async function writeCertificateFiles(
  domain: string,
  certificate: string,
  privateKey: string
): Promise<{ certPath: string; keyPath: string }> {
  const { mkdir, writeFile } = await import("fs/promises");
  const path = await import("path");

  const domainDir = path.join(SSL_CERTS_DIR, domain);

  // Create directory
  await mkdir(domainDir, { recursive: true });

  const certPath = path.join(domainDir, "fullchain.pem");
  const keyPath = path.join(domainDir, "privkey.pem");

  // Write files
  await writeFile(certPath, certificate, { mode: 0o644 });
  await writeFile(keyPath, privateKey, { mode: 0o600 });

  console.log(`[CertManager] Certificate files written to ${domainDir}`);

  return { certPath, keyPath };
}

/**
 * Check if certificate files exist
 */
async function certificateFilesExist(
  certPath: string,
  keyPath: string
): Promise<boolean> {
  const { access } = await import("fs/promises");

  try {
    await access(certPath);
    await access(keyPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse certificate expiration from file
 */
async function getCertificateExpiry(certPath: string): Promise<Date | null> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync(
      `openssl x509 -in "${certPath}" -enddate -noout`
    );

    // Parse: notAfter=Jan 15 12:00:00 2024 GMT
    const match = stdout.match(/notAfter=(.+)/);
    if (match) {
      return new Date(match[1].trim());
    }
  } catch (error) {
    console.error("[CertManager] Failed to parse certificate expiry:", error);
  }

  return null;
}

/**
 * Determine best challenge type for domain
 */
function getBestChallengeType(): ChallengeType {
  // Prefer DNS-01 if Cloudflare is configured (more reliable)
  if (isCloudflareConfigured()) {
    return "dns-01";
  }
  // Fall back to HTTP-01
  return "http-01";
}

/**
 * Provision SSL certificate for a domain
 */
export async function provisionCertificate(
  domainId: string,
  options?: { challengeType?: ChallengeType }
): Promise<ProvisioningResult> {
  // Get domain from database
  const domainRecord = await prisma.domain.findUnique({
    where: { id: domainId },
    include: { project: true },
  });

  if (!domainRecord) {
    return { success: false, domain: "", error: "Domain not found" };
  }

  const domain = domainRecord.domain;

  // Check if domain is verified
  if (!domainRecord.verified) {
    return {
      success: false,
      domain,
      error: "Domain must be verified before provisioning SSL",
    };
  }

  console.log(`[CertManager] Starting certificate provisioning for ${domain}`);

  // Update status to provisioning
  await prisma.domain.update({
    where: { id: domainId },
    data: { sslStatus: "PROVISIONING" },
  });

  try {
    // Determine challenge type
    const challengeType = options?.challengeType || getBestChallengeType();

    // Request certificate via ACME
    const result = await requestCertificate([domain], challengeType);

    if (!result.success || !result.certificate || !result.privateKey) {
      throw new Error(result.error || "Certificate request failed");
    }

    // Write certificate files
    const { certPath, keyPath } = await writeCertificateFiles(
      domain,
      result.certificate,
      result.privateKey
    );

    // Update database
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        sslStatus: "ACTIVE",
        sslCertPath: certPath,
        sslKeyPath: keyPath,
      },
    });

    // Update nginx config
    await updateNginxConfig();

    console.log(`[CertManager] Certificate provisioned successfully for ${domain}`);

    // Send success notification
    if (domainRecord.project) {
      await sendNotification({
        userId: domainRecord.project.userId,
        type: "domain_verified",
        title: `SSL certificate active for ${domain}`,
        message: `Your SSL certificate has been provisioned and is now active.`,
        projectId: domainRecord.projectId,
        projectName: domainRecord.project.name,
        metadata: {
          domain,
          expiresAt: result.expiresAt?.toISOString(),
        },
      });
    }

    return {
      success: true,
      domain,
      certificate: result.certificate,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`[CertManager] Certificate provisioning failed for ${domain}:`, error);

    // Update status to error
    await prisma.domain.update({
      where: { id: domainId },
      data: { sslStatus: "ERROR" },
    });

    // Send error notification
    if (domainRecord.project) {
      await sendNotification({
        userId: domainRecord.project.userId,
        type: "domain_error",
        title: `SSL certificate failed for ${domain}`,
        message: `Failed to provision SSL certificate: ${errorMessage}`,
        projectId: domainRecord.projectId,
        projectName: domainRecord.project.name,
        metadata: { domain, error: errorMessage },
      });
    }

    return { success: false, domain, error: errorMessage };
  }
}

/**
 * Renew certificate for a domain
 */
export async function renewCertificate(domainId: string): Promise<ProvisioningResult> {
  console.log(`[CertManager] Starting certificate renewal for domain ${domainId}`);

  // Renewal is essentially reprovisioning
  return provisionCertificate(domainId);
}

/**
 * Get certificate info for a domain
 */
export async function getCertificateInfo(domainId: string): Promise<CertificateInfo | null> {
  const domainRecord = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domainRecord) {
    return null;
  }

  const info: CertificateInfo = {
    domainId: domainRecord.id,
    domain: domainRecord.domain,
    status: domainRecord.sslStatus as CertificateStatus,
    certPath: domainRecord.sslCertPath || undefined,
    keyPath: domainRecord.sslKeyPath || undefined,
  };

  // If we have a certificate, get expiry info
  if (domainRecord.sslCertPath && domainRecord.sslStatus === "ACTIVE") {
    const expiresAt = await getCertificateExpiry(domainRecord.sslCertPath);

    if (expiresAt) {
      info.expiresAt = expiresAt;

      const now = new Date();
      const daysUntilExpiry = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      info.daysUntilExpiry = daysUntilExpiry;

      // Update status based on expiry
      if (daysUntilExpiry <= 0) {
        info.status = "expired";
      } else if (daysUntilExpiry <= RENEWAL_THRESHOLD_DAYS) {
        info.status = "expiring";
      }
    }
  }

  return info;
}

/**
 * Check all certificates and renew if needed
 */
export async function checkAndRenewCertificates(): Promise<{
  checked: number;
  renewed: number;
  failed: number;
  results: ProvisioningResult[];
}> {
  console.log("[CertManager] Starting certificate renewal check");

  const results: ProvisioningResult[] = [];
  let renewed = 0;
  let failed = 0;

  // Get all domains with active SSL
  const domains = await prisma.domain.findMany({
    where: {
      verified: true,
      sslStatus: "ACTIVE",
      sslCertPath: { not: null },
    },
  });

  console.log(`[CertManager] Checking ${domains.length} domains for renewal`);

  for (const domain of domains) {
    if (!domain.sslCertPath) continue;

    const expiresAt = await getCertificateExpiry(domain.sslCertPath);
    if (!expiresAt) continue;

    if (needsRenewal(expiresAt, RENEWAL_THRESHOLD_DAYS)) {
      console.log(
        `[CertManager] Certificate for ${domain.domain} expires ${expiresAt.toISOString()}, renewing...`
      );

      const result = await renewCertificate(domain.id);
      results.push(result);

      if (result.success) {
        renewed++;
      } else {
        failed++;
      }

      // Small delay between renewals to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `[CertManager] Renewal check complete: ${renewed} renewed, ${failed} failed`
  );

  return {
    checked: domains.length,
    renewed,
    failed,
    results,
  };
}

/**
 * Get certificates that are expiring soon
 */
export async function getExpiringCertificates(
  thresholdDays: number = RENEWAL_THRESHOLD_DAYS
): Promise<CertificateInfo[]> {
  const domains = await prisma.domain.findMany({
    where: {
      verified: true,
      sslStatus: "ACTIVE",
      sslCertPath: { not: null },
    },
  });

  const expiringCerts: CertificateInfo[] = [];

  for (const domain of domains) {
    const info = await getCertificateInfo(domain.id);
    if (info && info.daysUntilExpiry !== undefined && info.daysUntilExpiry <= thresholdDays) {
      expiringCerts.push(info);
    }
  }

  return expiringCerts;
}

/**
 * Send expiration warnings for certificates
 */
export async function sendExpirationWarnings(): Promise<number> {
  const expiringCerts = await getExpiringCertificates();
  let sentCount = 0;

  for (const cert of expiringCerts) {
    const domain = await prisma.domain.findUnique({
      where: { id: cert.domainId },
      include: { project: true },
    });

    if (!domain?.project) continue;

    // Only warn for certificates expiring in 7 days or less
    if (cert.daysUntilExpiry !== undefined && cert.daysUntilExpiry <= 7) {
      await sendNotification({
        userId: domain.project.userId,
        type: "ssl_expiring",
        title: `SSL certificate expiring for ${cert.domain}`,
        message: `Your SSL certificate for ${cert.domain} will expire in ${cert.daysUntilExpiry} days. Automatic renewal will be attempted.`,
        projectId: domain.projectId,
        projectName: domain.project.name,
        metadata: {
          domain: cert.domain,
          expiresAt: cert.expiresAt?.toISOString(),
          daysUntilExpiry: cert.daysUntilExpiry,
        },
      });
      sentCount++;
    }
  }

  return sentCount;
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(domainId: string): Promise<boolean> {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    return false;
  }

  // Update database (we don't actually revoke with ACME for now)
  await prisma.domain.update({
    where: { id: domainId },
    data: {
      sslStatus: "PENDING",
      sslCertPath: null,
      sslKeyPath: null,
    },
  });

  // Update nginx
  await updateNginxConfig();

  console.log(`[CertManager] Certificate revoked for ${domain.domain}`);
  return true;
}

/**
 * Get certificate manager status
 */
export async function getCertificateManagerStatus(): Promise<{
  totalDomains: number;
  activeCertificates: number;
  pendingCertificates: number;
  expiringCertificates: number;
  errorCertificates: number;
  renewalThresholdDays: number;
}> {
  const [total, active, pending, error] = await Promise.all([
    prisma.domain.count({ where: { verified: true } }),
    prisma.domain.count({ where: { sslStatus: "ACTIVE" } }),
    prisma.domain.count({ where: { sslStatus: { in: ["PENDING", "PROVISIONING"] } } }),
    prisma.domain.count({ where: { sslStatus: "ERROR" } }),
  ]);

  const expiring = await getExpiringCertificates();

  return {
    totalDomains: total,
    activeCertificates: active,
    pendingCertificates: pending,
    expiringCertificates: expiring.length,
    errorCertificates: error,
    renewalThresholdDays: RENEWAL_THRESHOLD_DAYS,
  };
}

/**
 * Trigger certificate provisioning in background
 */
export function triggerProvisioningInBackground(domainId: string): void {
  // Fire and forget
  provisionCertificate(domainId).catch((error) => {
    console.error(`[CertManager] Background provisioning failed for ${domainId}:`, error);
  });
}

/**
 * Schedule periodic certificate renewal checks
 * This should be called once on application startup
 */
let renewalInterval: NodeJS.Timeout | null = null;

export function startRenewalScheduler(intervalHours: number = 12): void {
  if (renewalInterval) {
    console.log("[CertManager] Renewal scheduler already running");
    return;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;

  console.log(`[CertManager] Starting renewal scheduler (every ${intervalHours} hours)`);

  // Run immediately on start
  checkAndRenewCertificates().catch((error) => {
    console.error("[CertManager] Initial renewal check failed:", error);
  });

  // Schedule periodic checks
  renewalInterval = setInterval(async () => {
    try {
      await checkAndRenewCertificates();
      await sendExpirationWarnings();
    } catch (error) {
      console.error("[CertManager] Scheduled renewal check failed:", error);
    }
  }, intervalMs);
}

export function stopRenewalScheduler(): void {
  if (renewalInterval) {
    clearInterval(renewalInterval);
    renewalInterval = null;
    console.log("[CertManager] Renewal scheduler stopped");
  }
}
