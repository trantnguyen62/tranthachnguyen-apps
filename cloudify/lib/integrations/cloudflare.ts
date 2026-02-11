/**
 * Cloudflare Integration
 * DNS management and zone operations via Cloudflare API
 *
 * Provides:
 * - DNS record creation (A, CNAME, TXT)
 * - DNS record deletion and updates
 * - Zone management
 * - DNS verification via API
 */

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY; // Global API key (alternative)

// Cloudflare API base URL
const CF_API_URL = "https://api.cloudflare.com/client/v4";

/**
 * Check if Cloudflare is configured
 */
export function isCloudflareConfigured(): boolean {
  return !!(CLOUDFLARE_API_TOKEN || (CLOUDFLARE_EMAIL && CLOUDFLARE_API_KEY));
}

/**
 * DNS record types
 */
export type DnsRecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "SRV";

/**
 * DNS record structure
 */
export interface DnsRecord {
  id?: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
  comment?: string;
}

/**
 * Cloudflare API response structure
 */
interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

/**
 * Zone information
 */
export interface Zone {
  id: string;
  name: string;
  status: string;
  nameServers: string[];
}

/**
 * Make authenticated request to Cloudflare API
 */
async function cloudflareRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<CloudflareResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prefer API Token over Global API Key
  if (CLOUDFLARE_API_TOKEN) {
    headers["Authorization"] = `Bearer ${CLOUDFLARE_API_TOKEN}`;
  } else if (CLOUDFLARE_EMAIL && CLOUDFLARE_API_KEY) {
    headers["X-Auth-Email"] = CLOUDFLARE_EMAIL;
    headers["X-Auth-Key"] = CLOUDFLARE_API_KEY;
  } else {
    throw new Error("Cloudflare API credentials not configured");
  }

  const response = await fetch(`${CF_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return data as CloudflareResponse<T>;
}

// ============ Zone Operations ============

/**
 * List all zones accessible to the account
 */
export async function listZones(): Promise<Zone[]> {
  if (!isCloudflareConfigured()) {
    console.log("[Cloudflare] Not configured");
    return [];
  }

  try {
    const response = await cloudflareRequest<
      Array<{
        id: string;
        name: string;
        status: string;
        name_servers: string[];
      }>
    >("/zones", "GET");

    if (!response.success) {
      console.error("[Cloudflare] Failed to list zones:", response.errors);
      return [];
    }

    return response.result.map((zone) => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      nameServers: zone.name_servers,
    }));
  } catch (error) {
    console.error("[Cloudflare] Error listing zones:", error);
    return [];
  }
}

/**
 * Get zone by domain name
 */
export async function getZoneByDomain(domain: string): Promise<Zone | null> {
  if (!isCloudflareConfigured()) {
    return null;
  }

  try {
    // Extract root domain (e.g., "sub.example.com" -> "example.com")
    const parts = domain.split(".");
    const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : domain;

    const response = await cloudflareRequest<
      Array<{
        id: string;
        name: string;
        status: string;
        name_servers: string[];
      }>
    >(`/zones?name=${encodeURIComponent(rootDomain)}`, "GET");

    if (!response.success || response.result.length === 0) {
      return null;
    }

    const zone = response.result[0];
    return {
      id: zone.id,
      name: zone.name,
      status: zone.status,
      nameServers: zone.name_servers,
    };
  } catch (error) {
    console.error("[Cloudflare] Error getting zone:", error);
    return null;
  }
}

/**
 * Get zone ID - uses configured zone ID or looks up by domain
 */
export async function getZoneId(domain?: string): Promise<string | null> {
  if (CLOUDFLARE_ZONE_ID) {
    return CLOUDFLARE_ZONE_ID;
  }

  if (domain) {
    const zone = await getZoneByDomain(domain);
    return zone?.id || null;
  }

  return null;
}

// ============ DNS Record Operations ============

/**
 * List DNS records for a zone
 */
export async function listDnsRecords(
  zoneId: string,
  options?: {
    type?: DnsRecordType;
    name?: string;
    content?: string;
  }
): Promise<DnsRecord[]> {
  if (!isCloudflareConfigured()) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (options?.type) params.set("type", options.type);
    if (options?.name) params.set("name", options.name);
    if (options?.content) params.set("content", options.content);

    const queryString = params.toString();
    const endpoint = `/zones/${zoneId}/dns_records${queryString ? `?${queryString}` : ""}`;

    const response = await cloudflareRequest<
      Array<{
        id: string;
        type: DnsRecordType;
        name: string;
        content: string;
        ttl: number;
        proxied: boolean;
        priority?: number;
        comment?: string;
      }>
    >(endpoint, "GET");

    if (!response.success) {
      console.error("[Cloudflare] Failed to list DNS records:", response.errors);
      return [];
    }

    return response.result.map((record) => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      priority: record.priority,
      comment: record.comment,
    }));
  } catch (error) {
    console.error("[Cloudflare] Error listing DNS records:", error);
    return [];
  }
}

/**
 * Create a DNS record
 */
export async function createDnsRecord(
  zoneId: string,
  record: Omit<DnsRecord, "id">
): Promise<DnsRecord | null> {
  if (!isCloudflareConfigured()) {
    console.log("[Cloudflare] Not configured, skipping DNS record creation");
    return null;
  }

  try {
    const response = await cloudflareRequest<{
      id: string;
      type: DnsRecordType;
      name: string;
      content: string;
      ttl: number;
      proxied: boolean;
      priority?: number;
      comment?: string;
    }>(`/zones/${zoneId}/dns_records`, "POST", {
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl || 1, // 1 = auto
      proxied: record.proxied ?? false,
      priority: record.priority,
      comment: record.comment,
    });

    if (!response.success) {
      console.error("[Cloudflare] Failed to create DNS record:", response.errors);
      return null;
    }

    console.log(`[Cloudflare] Created ${record.type} record for ${record.name}`);

    return {
      id: response.result.id,
      type: response.result.type,
      name: response.result.name,
      content: response.result.content,
      ttl: response.result.ttl,
      proxied: response.result.proxied,
      priority: response.result.priority,
      comment: response.result.comment,
    };
  } catch (error) {
    console.error("[Cloudflare] Error creating DNS record:", error);
    return null;
  }
}

/**
 * Update a DNS record
 */
export async function updateDnsRecord(
  zoneId: string,
  recordId: string,
  record: Partial<Omit<DnsRecord, "id">>
): Promise<DnsRecord | null> {
  if (!isCloudflareConfigured()) {
    return null;
  }

  try {
    const response = await cloudflareRequest<{
      id: string;
      type: DnsRecordType;
      name: string;
      content: string;
      ttl: number;
      proxied: boolean;
    }>(`/zones/${zoneId}/dns_records/${recordId}`, "PATCH", record);

    if (!response.success) {
      console.error("[Cloudflare] Failed to update DNS record:", response.errors);
      return null;
    }

    console.log(`[Cloudflare] Updated DNS record ${recordId}`);

    return {
      id: response.result.id,
      type: response.result.type,
      name: response.result.name,
      content: response.result.content,
      ttl: response.result.ttl,
      proxied: response.result.proxied,
    };
  } catch (error) {
    console.error("[Cloudflare] Error updating DNS record:", error);
    return null;
  }
}

/**
 * Delete a DNS record
 */
export async function deleteDnsRecord(
  zoneId: string,
  recordId: string
): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    return false;
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "DELETE"
    );

    if (!response.success) {
      console.error("[Cloudflare] Failed to delete DNS record:", response.errors);
      return false;
    }

    console.log(`[Cloudflare] Deleted DNS record ${recordId}`);
    return true;
  } catch (error) {
    console.error("[Cloudflare] Error deleting DNS record:", error);
    return false;
  }
}

/**
 * Find DNS record by name and type
 */
export async function findDnsRecord(
  zoneId: string,
  name: string,
  type: DnsRecordType
): Promise<DnsRecord | null> {
  const records = await listDnsRecords(zoneId, { name, type });
  return records.length > 0 ? records[0] : null;
}

// ============ Domain Setup Helpers ============

/**
 * Create or update A record for a domain
 */
export async function setupARecord(
  domain: string,
  ipAddress: string,
  options?: { proxied?: boolean; zoneId?: string }
): Promise<DnsRecord | null> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    console.error("[Cloudflare] Could not determine zone ID for domain:", domain);
    return null;
  }

  // Check if record already exists
  const existingRecord = await findDnsRecord(zoneId, domain, "A");

  if (existingRecord?.id) {
    // Update existing record
    if (existingRecord.content === ipAddress) {
      console.log(`[Cloudflare] A record for ${domain} already exists with correct IP`);
      return existingRecord;
    }
    return updateDnsRecord(zoneId, existingRecord.id, {
      content: ipAddress,
      proxied: options?.proxied ?? true,
    });
  }

  // Create new record
  return createDnsRecord(zoneId, {
    type: "A",
    name: domain,
    content: ipAddress,
    proxied: options?.proxied ?? true,
    comment: "Created by Cloudify",
  });
}

/**
 * Create or update CNAME record
 */
export async function setupCnameRecord(
  domain: string,
  target: string,
  options?: { proxied?: boolean; zoneId?: string }
): Promise<DnsRecord | null> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    console.error("[Cloudflare] Could not determine zone ID for domain:", domain);
    return null;
  }

  // Check if record already exists
  const existingRecord = await findDnsRecord(zoneId, domain, "CNAME");

  if (existingRecord?.id) {
    if (existingRecord.content === target) {
      console.log(`[Cloudflare] CNAME record for ${domain} already exists`);
      return existingRecord;
    }
    return updateDnsRecord(zoneId, existingRecord.id, {
      content: target,
      proxied: options?.proxied ?? true,
    });
  }

  return createDnsRecord(zoneId, {
    type: "CNAME",
    name: domain,
    content: target,
    proxied: options?.proxied ?? true,
    comment: "Created by Cloudify",
  });
}

/**
 * Create TXT record for domain verification
 */
export async function setupVerificationRecord(
  domain: string,
  token: string,
  options?: { zoneId?: string }
): Promise<DnsRecord | null> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    console.error("[Cloudflare] Could not determine zone ID for domain:", domain);
    return null;
  }

  const verificationDomain = `_cloudify-verify.${domain}`;

  // Check if record already exists
  const existingRecord = await findDnsRecord(zoneId, verificationDomain, "TXT");

  if (existingRecord?.id) {
    if (existingRecord.content === token) {
      console.log(`[Cloudflare] Verification record for ${domain} already exists`);
      return existingRecord;
    }
    return updateDnsRecord(zoneId, existingRecord.id, { content: token });
  }

  return createDnsRecord(zoneId, {
    type: "TXT",
    name: verificationDomain,
    content: token,
    comment: "Cloudify domain verification",
  });
}

/**
 * Create TXT record for ACME DNS-01 challenge
 */
export async function setupAcmeChallengeRecord(
  domain: string,
  challengeValue: string,
  options?: { zoneId?: string }
): Promise<DnsRecord | null> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    console.error("[Cloudflare] Could not determine zone ID for domain:", domain);
    return null;
  }

  const challengeDomain = `_acme-challenge.${domain}`;

  // Delete existing challenge record if present
  const existingRecord = await findDnsRecord(zoneId, challengeDomain, "TXT");
  if (existingRecord?.id) {
    await deleteDnsRecord(zoneId, existingRecord.id);
  }

  return createDnsRecord(zoneId, {
    type: "TXT",
    name: challengeDomain,
    content: challengeValue,
    ttl: 60, // Short TTL for challenges
    comment: "ACME DNS-01 challenge",
  });
}

/**
 * Remove ACME challenge record
 */
export async function removeAcmeChallengeRecord(
  domain: string,
  options?: { zoneId?: string }
): Promise<boolean> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    return false;
  }

  const challengeDomain = `_acme-challenge.${domain}`;
  const existingRecord = await findDnsRecord(zoneId, challengeDomain, "TXT");

  if (existingRecord?.id) {
    return deleteDnsRecord(zoneId, existingRecord.id);
  }

  return true;
}

/**
 * Remove domain records from Cloudflare
 */
export async function removeDomainRecords(
  domain: string,
  options?: { zoneId?: string }
): Promise<boolean> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    return false;
  }

  try {
    // Find and delete all records for this domain
    const records = await listDnsRecords(zoneId, { name: domain });

    for (const record of records) {
      if (record.id) {
        await deleteDnsRecord(zoneId, record.id);
      }
    }

    // Also remove verification record
    const verificationDomain = `_cloudify-verify.${domain}`;
    const verificationRecord = await findDnsRecord(zoneId, verificationDomain, "TXT");
    if (verificationRecord?.id) {
      await deleteDnsRecord(zoneId, verificationRecord.id);
    }

    console.log(`[Cloudflare] Removed all DNS records for ${domain}`);
    return true;
  } catch (error) {
    console.error("[Cloudflare] Error removing domain records:", error);
    return false;
  }
}

// ============ DNS Verification ============

/**
 * Verify domain via Cloudflare API (check if TXT record exists)
 */
export async function verifyDomainViaCloudflare(
  domain: string,
  token: string,
  options?: { zoneId?: string }
): Promise<{ verified: boolean; error?: string }> {
  const zoneId = options?.zoneId || (await getZoneId(domain));
  if (!zoneId) {
    return {
      verified: false,
      error: "Could not determine Cloudflare zone for domain",
    };
  }

  try {
    const verificationDomain = `_cloudify-verify.${domain}`;
    const record = await findDnsRecord(zoneId, verificationDomain, "TXT");

    if (!record) {
      return {
        verified: false,
        error: `TXT record not found at ${verificationDomain}`,
      };
    }

    if (record.content !== token) {
      return {
        verified: false,
        error: `TXT record value mismatch. Expected: ${token}, Found: ${record.content}`,
      };
    }

    return { verified: true };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Setup complete domain in Cloudflare
 */
export async function setupDomainInCloudflare(
  domain: string,
  config: {
    verificationToken: string;
    targetIp?: string;
    targetCname?: string;
    proxied?: boolean;
  }
): Promise<{
  success: boolean;
  records: DnsRecord[];
  errors: string[];
}> {
  const errors: string[] = [];
  const records: DnsRecord[] = [];

  const zoneId = await getZoneId(domain);
  if (!zoneId) {
    return {
      success: false,
      records: [],
      errors: ["Could not determine Cloudflare zone for domain"],
    };
  }

  // Create verification record
  const verificationRecord = await setupVerificationRecord(
    domain,
    config.verificationToken,
    { zoneId }
  );
  if (verificationRecord) {
    records.push(verificationRecord);
  } else {
    errors.push("Failed to create verification TXT record");
  }

  // Create A or CNAME record
  if (config.targetIp) {
    const aRecord = await setupARecord(domain, config.targetIp, {
      proxied: config.proxied,
      zoneId,
    });
    if (aRecord) {
      records.push(aRecord);
    } else {
      errors.push("Failed to create A record");
    }
  } else if (config.targetCname) {
    const cnameRecord = await setupCnameRecord(domain, config.targetCname, {
      proxied: config.proxied,
      zoneId,
    });
    if (cnameRecord) {
      records.push(cnameRecord);
    } else {
      errors.push("Failed to create CNAME record");
    }
  }

  return {
    success: errors.length === 0,
    records,
    errors,
  };
}

/**
 * Get Cloudflare status summary
 */
export async function getCloudflareStatus(): Promise<{
  configured: boolean;
  zones?: Zone[];
  error?: string;
}> {
  if (!isCloudflareConfigured()) {
    return { configured: false, error: "Cloudflare API credentials not configured" };
  }

  try {
    const zones = await listZones();
    return {
      configured: true,
      zones,
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============ Project Subdomain Management ============

const CLOUDFLARE_TUNNEL_ID = process.env.CLOUDFLARE_TUNNEL_ID;
const BASE_DOMAIN = process.env.BASE_DOMAIN || "tranthachnguyen.com";

/**
 * Create a CNAME record for a deployed project subdomain
 * This creates {projectSlug}.{baseDomain} pointing to the Cloudflare tunnel
 *
 * Example: myproject.tranthachnguyen.com -> tunnel.cfargotunnel.com
 */
export async function createProjectSubdomain(
  projectSlug: string,
  options?: { zoneId?: string }
): Promise<{ success: boolean; subdomain: string; error?: string }> {
  if (!isCloudflareConfigured()) {
    return {
      success: false,
      subdomain: `${projectSlug}.${BASE_DOMAIN}`,
      error: "Cloudflare not configured",
    };
  }

  if (!CLOUDFLARE_TUNNEL_ID) {
    return {
      success: false,
      subdomain: `${projectSlug}.${BASE_DOMAIN}`,
      error: "CLOUDFLARE_TUNNEL_ID not configured",
    };
  }

  const zoneId = options?.zoneId || await getZoneId(BASE_DOMAIN);
  if (!zoneId) {
    return {
      success: false,
      subdomain: `${projectSlug}.${BASE_DOMAIN}`,
      error: `Could not find zone for ${BASE_DOMAIN}`,
    };
  }

  const subdomain = `${projectSlug}.${BASE_DOMAIN}`;
  const tunnelTarget = `${CLOUDFLARE_TUNNEL_ID}.cfargotunnel.com`;

  try {
    // Check if record already exists
    const existingRecord = await findDnsRecord(zoneId, subdomain, "CNAME");

    if (existingRecord) {
      if (existingRecord.content === tunnelTarget) {
        console.log(`[Cloudflare] Project subdomain ${subdomain} already exists`);
        return { success: true, subdomain };
      }

      // Update existing record
      if (existingRecord.id) {
        await updateDnsRecord(zoneId, existingRecord.id, {
          content: tunnelTarget,
          proxied: true,
        });
        console.log(`[Cloudflare] Updated project subdomain ${subdomain}`);
        return { success: true, subdomain };
      }
    }

    // Create new CNAME record
    const record = await createDnsRecord(zoneId, {
      type: "CNAME",
      name: projectSlug, // Just the subdomain part
      content: tunnelTarget,
      proxied: true,
      comment: `Cloudify deployed project: ${projectSlug}`,
    });

    if (record) {
      console.log(`[Cloudflare] Created project subdomain ${subdomain}`);
      return { success: true, subdomain };
    }

    return {
      success: false,
      subdomain,
      error: "Failed to create DNS record",
    };
  } catch (error) {
    console.error(`[Cloudflare] Error creating project subdomain:`, error);
    return {
      success: false,
      subdomain,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a project subdomain CNAME record
 */
export async function deleteProjectSubdomain(
  projectSlug: string,
  options?: { zoneId?: string }
): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    return false;
  }

  const zoneId = options?.zoneId || await getZoneId(BASE_DOMAIN);
  if (!zoneId) {
    return false;
  }

  const subdomain = `${projectSlug}.${BASE_DOMAIN}`;

  try {
    const existingRecord = await findDnsRecord(zoneId, subdomain, "CNAME");

    if (existingRecord?.id) {
      const deleted = await deleteDnsRecord(zoneId, existingRecord.id);
      if (deleted) {
        console.log(`[Cloudflare] Deleted project subdomain ${subdomain}`);
      }
      return deleted;
    }

    return true; // Record doesn't exist, consider it deleted
  } catch (error) {
    console.error(`[Cloudflare] Error deleting project subdomain:`, error);
    return false;
  }
}

/**
 * Check if a project subdomain exists
 */
export async function projectSubdomainExists(
  projectSlug: string,
  options?: { zoneId?: string }
): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    return false;
  }

  const zoneId = options?.zoneId || await getZoneId(BASE_DOMAIN);
  if (!zoneId) {
    return false;
  }

  const subdomain = `${projectSlug}.${BASE_DOMAIN}`;
  const existingRecord = await findDnsRecord(zoneId, subdomain, "CNAME");

  return !!existingRecord;
}

/**
 * Get the full URL for a deployed project
 */
export function getProjectUrl(projectSlug: string): string {
  return `https://${projectSlug}.${BASE_DOMAIN}`;
}

// ============ CDN Cache Management ============

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

/**
 * Purge cache for specific URLs
 */
export async function purgeCache(
  urls: string[],
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/purge_cache`,
      "POST",
      { files: urls }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Purged cache for ${urls.length} URLs`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Purge all cache for a zone
 */
export async function purgeAllCache(
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/purge_cache`,
      "POST",
      { purge_everything: true }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Purged all cache for zone ${zoneId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Purge cache by prefix (useful for project deployments)
 */
export async function purgeCacheByPrefix(
  prefixes: string[],
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/purge_cache`,
      "POST",
      { prefixes }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Purged cache for ${prefixes.length} prefixes`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Purge cache for a deployed project
 */
export async function purgeProjectCache(
  projectSlug: string
): Promise<{ success: boolean; error?: string }> {
  const projectUrl = getProjectUrl(projectSlug);
  return purgeCacheByPrefix([projectUrl]);
}

// ============ Cloudflare Workers ============

interface WorkerScript {
  id: string;
  name: string;
  created_on: string;
  modified_on: string;
}

interface WorkerRoute {
  id: string;
  pattern: string;
  script: string;
}

/**
 * Deploy a Worker script
 */
export async function deployWorker(
  scriptName: string,
  code: string,
  options?: {
    bindings?: Array<{
      type: "plain_text" | "secret_text" | "kv_namespace" | "r2_bucket";
      name: string;
      text?: string;
      namespace_id?: string;
      bucket_name?: string;
    }>;
  }
): Promise<{ success: boolean; worker?: WorkerScript; error?: string }> {
  if (!isCloudflareConfigured() || !CLOUDFLARE_ACCOUNT_ID) {
    return { success: false, error: "Cloudflare Workers not configured" };
  }

  try {
    // Create FormData for script upload
    const formData = new FormData();

    // Add the worker script
    const scriptBlob = new Blob([code], { type: "application/javascript" });
    formData.append("script", scriptBlob, "worker.js");

    // Add metadata with bindings
    const metadata: { main_module: string; bindings?: unknown[] } = {
      main_module: "worker.js",
    };

    if (options?.bindings) {
      metadata.bindings = options.bindings;
    }

    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );

    // Upload the worker
    const headers: Record<string, string> = {};
    if (CLOUDFLARE_API_TOKEN) {
      headers["Authorization"] = `Bearer ${CLOUDFLARE_API_TOKEN}`;
    } else if (CLOUDFLARE_EMAIL && CLOUDFLARE_API_KEY) {
      headers["X-Auth-Email"] = CLOUDFLARE_EMAIL;
      headers["X-Auth-Key"] = CLOUDFLARE_API_KEY;
    }

    const response = await fetch(
      `${CF_API_URL}/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${scriptName}`,
      {
        method: "PUT",
        headers,
        body: formData,
      }
    );

    const data = (await response.json()) as CloudflareResponse<WorkerScript>;

    if (!data.success) {
      return {
        success: false,
        error: data.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Deployed worker: ${scriptName}`);
    return { success: true, worker: data.result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a Worker script
 */
export async function deleteWorker(
  scriptName: string
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured() || !CLOUDFLARE_ACCOUNT_ID) {
    return { success: false, error: "Cloudflare Workers not configured" };
  }

  try {
    const response = await cloudflareRequest<null>(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${scriptName}`,
      "DELETE"
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Deleted worker: ${scriptName}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add a route for a Worker
 */
export async function addWorkerRoute(
  pattern: string,
  scriptName: string,
  options?: { zoneId?: string }
): Promise<{ success: boolean; route?: WorkerRoute; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<WorkerRoute>(
      `/zones/${zoneId}/workers/routes`,
      "POST",
      { pattern, script: scriptName }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Added worker route: ${pattern} -> ${scriptName}`);
    return { success: true, route: response.result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List Worker routes for a zone
 */
export async function listWorkerRoutes(
  options?: { zoneId?: string }
): Promise<WorkerRoute[]> {
  if (!isCloudflareConfigured()) {
    return [];
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return [];
  }

  try {
    const response = await cloudflareRequest<WorkerRoute[]>(
      `/zones/${zoneId}/workers/routes`,
      "GET"
    );

    if (!response.success) {
      return [];
    }

    return response.result;
  } catch {
    return [];
  }
}

/**
 * Delete a Worker route
 */
export async function deleteWorkerRoute(
  routeId: string,
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/workers/routes/${routeId}`,
      "DELETE"
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============ WAF / Firewall Rules ============

interface FirewallRule {
  id: string;
  paused: boolean;
  description: string;
  action: "block" | "challenge" | "js_challenge" | "managed_challenge" | "allow" | "log" | "bypass";
  priority: number;
  filter: {
    id: string;
    expression: string;
  };
}

/**
 * Create a firewall rule
 */
export async function createFirewallRule(
  rule: {
    description: string;
    action: FirewallRule["action"];
    expression: string;
    priority?: number;
    paused?: boolean;
  },
  options?: { zoneId?: string }
): Promise<{ success: boolean; rule?: FirewallRule; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<FirewallRule[]>(
      `/zones/${zoneId}/firewall/rules`,
      "POST",
      [
        {
          description: rule.description,
          action: rule.action,
          filter: {
            expression: rule.expression,
          },
          priority: rule.priority || 1,
          paused: rule.paused || false,
        },
      ]
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Created firewall rule: ${rule.description}`);
    return { success: true, rule: response.result[0] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List firewall rules for a zone
 */
export async function listFirewallRules(
  options?: { zoneId?: string }
): Promise<FirewallRule[]> {
  if (!isCloudflareConfigured()) {
    return [];
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return [];
  }

  try {
    const response = await cloudflareRequest<FirewallRule[]>(
      `/zones/${zoneId}/firewall/rules`,
      "GET"
    );

    if (!response.success) {
      return [];
    }

    return response.result;
  } catch {
    return [];
  }
}

/**
 * Delete a firewall rule
 */
export async function deleteFirewallRule(
  ruleId: string,
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/firewall/rules/${ruleId}`,
      "DELETE"
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Deleted firewall rule: ${ruleId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create rate limiting rule
 */
export async function createRateLimitRule(
  rule: {
    description: string;
    expression: string;
    requestsPerPeriod: number;
    period: number; // seconds
    action: "block" | "challenge" | "managed_challenge" | "log";
    timeout?: number; // seconds to block
  },
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ id: string }>(
      `/zones/${zoneId}/rate_limits`,
      "POST",
      {
        description: rule.description,
        match: {
          request: {
            url_pattern: "*",
          },
          response: {
            origin_traffic: true,
          },
        },
        threshold: rule.requestsPerPeriod,
        period: rule.period,
        action: {
          mode: rule.action,
          timeout: rule.timeout || 60,
        },
        disabled: false,
      }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Created rate limit rule: ${rule.description}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Enable "Under Attack" mode for DDoS protection
 */
export async function setSecurityLevel(
  level: "off" | "essentially_off" | "low" | "medium" | "high" | "under_attack",
  options?: { zoneId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isCloudflareConfigured()) {
    return { success: false, error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { success: false, error: "Zone ID not configured" };
  }

  try {
    const response = await cloudflareRequest<{ value: string }>(
      `/zones/${zoneId}/settings/security_level`,
      "PATCH",
      { value: level }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors.map((e) => e.message).join(", "),
      };
    }

    console.log(`[Cloudflare] Set security level to: ${level}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get current security settings
 */
export async function getSecuritySettings(
  options?: { zoneId?: string }
): Promise<{
  securityLevel?: string;
  wafEnabled?: boolean;
  browserIntegrityCheck?: boolean;
  challengeTTL?: number;
  error?: string;
}> {
  if (!isCloudflareConfigured()) {
    return { error: "Cloudflare not configured" };
  }

  const zoneId = options?.zoneId || CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    return { error: "Zone ID not configured" };
  }

  try {
    const [securityLevel, waf, browserCheck, challengeTTL] = await Promise.all([
      cloudflareRequest<{ value: string }>(`/zones/${zoneId}/settings/security_level`, "GET"),
      cloudflareRequest<{ value: string }>(`/zones/${zoneId}/settings/waf`, "GET"),
      cloudflareRequest<{ value: string }>(`/zones/${zoneId}/settings/browser_check`, "GET"),
      cloudflareRequest<{ value: number }>(`/zones/${zoneId}/settings/challenge_ttl`, "GET"),
    ]);

    return {
      securityLevel: securityLevel.result?.value,
      wafEnabled: waf.result?.value === "on",
      browserIntegrityCheck: browserCheck.result?.value === "on",
      challengeTTL: challengeTTL.result?.value,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
