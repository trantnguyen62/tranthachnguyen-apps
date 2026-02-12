import { promises as dns } from "dns";
import {
  isCloudflareConfigured,
  verifyDomainViaCloudflare,
  setupDomainInCloudflare,
  setupVerificationRecord,
  setupARecord,
  getZoneId,
} from "@/lib/integrations/cloudflare";

// Server IP where Cloudify is hosted — must be set via environment variable in production
const CLOUDIFY_SERVER_IP = process.env.CLOUDIFY_SERVER_IP || (() => {
  if (process.env.NODE_ENV === "production") {
    console.warn("CLOUDIFY_SERVER_IP not set — DNS verification will use fallback IP");
  }
  return "192.168.0.203";
})();

export interface DnsVerificationResult {
  verified: boolean;
  txtRecordFound: boolean;
  domainResolvable: boolean;
  pointsToServer: boolean;
  errors: string[];
  warnings: string[];
  cloudflareManaged?: boolean;
}

/**
 * DNS setup result for automatic configuration
 */
export interface DnsSetupResult {
  success: boolean;
  method: "cloudflare" | "manual";
  recordsCreated: string[];
  errors: string[];
}

/**
 * Verify a domain's DNS configuration for Cloudify
 *
 * Requirements for verification:
 * 1. TXT record: _cloudify-verify.{domain} must contain the verification token
 * 2. Domain must resolve (A record or CNAME that eventually resolves to an IP)
 *
 * Note: We only REQUIRE the TXT record for verification.
 * The A/CNAME record is checked but only produces warnings, not errors.
 * This allows users to verify their domain before updating their DNS routing.
 */
export async function verifyDomainDns(
  domain: string,
  verificationToken: string
): Promise<DnsVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let txtRecordFound = false;
  let domainResolvable = false;
  let pointsToServer = false;

  // 1. Check TXT record for verification token (REQUIRED)
  try {
    const txtRecordHost = `_cloudify-verify.${domain}`;
    const txtRecords = await dns.resolveTxt(txtRecordHost);

    // TXT records are returned as arrays of chunks
    const flatRecords = txtRecords.map((chunks) => chunks.join(""));
    txtRecordFound = flatRecords.some((record) => record === verificationToken);

    if (!txtRecordFound) {
      errors.push(
        `TXT record found but token doesn't match. Expected: ${verificationToken}`
      );
    }
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
      errors.push(`TXT record not found at _cloudify-verify.${domain}`);
    } else {
      errors.push(`Failed to check TXT record: ${error.message}`);
    }
  }

  // 2. Check if domain resolves to an IP (OPTIONAL - just for warnings)
  try {
    const addresses = await dns.resolve4(domain);
    domainResolvable = addresses.length > 0;

    if (domainResolvable && CLOUDIFY_SERVER_IP !== "YOUR_SERVER_IP") {
      pointsToServer = addresses.includes(CLOUDIFY_SERVER_IP);
      if (!pointsToServer) {
        warnings.push(
          `Domain resolves to ${addresses[0]}, but should point to ${CLOUDIFY_SERVER_IP}`
        );
      }
    }
  } catch {
    // Try CNAME resolution
    try {
      const cnames = await dns.resolveCname(domain);
      if (cnames.length > 0) {
        // CNAME exists, try to resolve its target
        try {
          const targetAddresses = await dns.resolve4(cnames[0]);
          domainResolvable = targetAddresses.length > 0;
        } catch {
          warnings.push(`CNAME target ${cnames[0]} doesn't resolve to an IP yet`);
        }
      }
    } catch {
      warnings.push(
        `Domain ${domain} doesn't resolve yet. Update your DNS to point to your server.`
      );
    }
  }

  // Verification only requires TXT record
  // DNS routing can be configured after verification
  return {
    verified: txtRecordFound,
    txtRecordFound,
    domainResolvable,
    pointsToServer,
    errors,
    warnings,
  };
}

/**
 * Get DNS records that the user needs to configure
 */
export function getRequiredDnsRecords(domain: string, verificationToken: string) {
  const isRootDomain = domain.split(".").length === 2;

  const records = [
    {
      type: "TXT",
      name: `_cloudify-verify`,
      host: `_cloudify-verify.${domain}`,
      value: verificationToken,
      purpose: "Domain verification (required)",
      required: true,
    },
  ];

  if (isRootDomain) {
    // Root domains need A record
    records.push({
      type: "A",
      name: "@",
      host: domain,
      value: CLOUDIFY_SERVER_IP !== "YOUR_SERVER_IP" ? CLOUDIFY_SERVER_IP : "[Your Server IP]",
      purpose: "Route traffic to Cloudify",
      required: false,
    });
  } else {
    // Subdomains can use A record too (simpler than CNAME)
    records.push({
      type: "A",
      name: domain.split(".")[0],
      host: domain,
      value: CLOUDIFY_SERVER_IP !== "YOUR_SERVER_IP" ? CLOUDIFY_SERVER_IP : "[Your Server IP]",
      purpose: "Route traffic to Cloudify",
      required: false,
    });
  }

  return records;
}

/**
 * Verify domain using Cloudflare API if available, otherwise DNS lookup
 * This provides more reliable verification for domains managed by Cloudflare
 */
export async function verifyDomainDnsWithCloudflare(
  domain: string,
  verificationToken: string
): Promise<DnsVerificationResult> {
  // Try Cloudflare verification first if configured
  if (isCloudflareConfigured()) {
    const zoneId = await getZoneId(domain);

    if (zoneId) {
      console.log(`[DNS] Using Cloudflare API verification for ${domain}`);

      const cfResult = await verifyDomainViaCloudflare(domain, verificationToken, { zoneId });

      if (cfResult.verified) {
        return {
          verified: true,
          txtRecordFound: true,
          domainResolvable: true,
          pointsToServer: true, // Assume managed domains point correctly
          errors: [],
          warnings: [],
          cloudflareManaged: true,
        };
      } else {
        // Cloudflare check failed, fall through to DNS lookup
        console.log(`[DNS] Cloudflare verification failed: ${cfResult.error}`);
      }
    }
  }

  // Fall back to standard DNS verification
  return verifyDomainDns(domain, verificationToken);
}

/**
 * Automatically set up DNS records via Cloudflare if available
 * This creates the verification TXT record and A record automatically
 */
export async function setupDomainDnsAutomatically(
  domain: string,
  verificationToken: string
): Promise<DnsSetupResult> {
  const errors: string[] = [];
  const recordsCreated: string[] = [];

  // Only works with Cloudflare
  if (!isCloudflareConfigured()) {
    return {
      success: false,
      method: "manual",
      recordsCreated: [],
      errors: ["Cloudflare not configured - manual DNS setup required"],
    };
  }

  const zoneId = await getZoneId(domain);
  if (!zoneId) {
    return {
      success: false,
      method: "manual",
      recordsCreated: [],
      errors: ["Domain zone not found in Cloudflare - manual DNS setup required"],
    };
  }

  console.log(`[DNS] Setting up DNS records automatically via Cloudflare for ${domain}`);

  // Create verification TXT record
  const verificationRecord = await setupVerificationRecord(domain, verificationToken, { zoneId });
  if (verificationRecord) {
    recordsCreated.push(`TXT _cloudify-verify.${domain}`);
  } else {
    errors.push("Failed to create verification TXT record");
  }

  // Create A record pointing to Cloudify server
  const aRecord = await setupARecord(domain, CLOUDIFY_SERVER_IP, {
    proxied: true,
    zoneId,
  });
  if (aRecord) {
    recordsCreated.push(`A ${domain} -> ${CLOUDIFY_SERVER_IP}`);
  } else {
    errors.push("Failed to create A record");
  }

  return {
    success: errors.length === 0,
    method: "cloudflare",
    recordsCreated,
    errors,
  };
}

/**
 * Set up complete domain in Cloudflare with all required records
 */
export async function setupDomainComplete(
  domain: string,
  verificationToken: string,
  options?: {
    proxied?: boolean;
  }
): Promise<DnsSetupResult> {
  if (!isCloudflareConfigured()) {
    return {
      success: false,
      method: "manual",
      recordsCreated: [],
      errors: ["Cloudflare not configured"],
    };
  }

  const result = await setupDomainInCloudflare(domain, {
    verificationToken,
    targetIp: CLOUDIFY_SERVER_IP,
    proxied: options?.proxied ?? true,
  });

  return {
    success: result.success,
    method: "cloudflare",
    recordsCreated: result.records.map((r) => `${r.type} ${r.name}`),
    errors: result.errors,
  };
}

/**
 * Check if domain is managed by Cloudflare
 */
export async function isDomainManagedByCloudflare(domain: string): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    return false;
  }

  const zoneId = await getZoneId(domain);
  return !!zoneId;
}

/**
 * Get DNS configuration status for a domain
 */
export async function getDnsStatus(domain: string): Promise<{
  cloudflareManaged: boolean;
  cloudflareConfigured: boolean;
  serverIp: string;
}> {
  const cloudflareConfigured = isCloudflareConfigured();
  const cloudflareManaged = await isDomainManagedByCloudflare(domain);

  return {
    cloudflareManaged,
    cloudflareConfigured,
    serverIp: CLOUDIFY_SERVER_IP,
  };
}
