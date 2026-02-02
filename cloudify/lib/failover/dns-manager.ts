/**
 * DNS Manager
 * Manages DNS records and load balancing for multi-region failover
 * Supports Cloudflare Load Balancing API
 */

export interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
}

export interface LoadBalancerPool {
  id: string;
  name: string;
  origins: Array<{
    name: string;
    address: string;
    enabled: boolean;
    weight: number;
  }>;
  enabled: boolean;
  healthy: boolean;
}

export interface DNSStatus {
  propagated: boolean;
  activeRegion: string;
  records: DNSRecord[];
}

// Cloudflare configuration
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_BASE = "https://api.cloudflare.com/client/v4";

// Region to endpoint mapping
const REGION_ENDPOINTS: Record<string, string> = {
  iad1: process.env.REGION_IAD1_ENDPOINT || "iad1.cloudify.app",
  sfo1: process.env.REGION_SFO1_ENDPOINT || "sfo1.cloudify.app",
  cdg1: process.env.REGION_CDG1_ENDPOINT || "cdg1.cloudify.app",
  fra1: process.env.REGION_FRA1_ENDPOINT || "fra1.cloudify.app",
  sin1: process.env.REGION_SIN1_ENDPOINT || "sin1.cloudify.app",
  syd1: process.env.REGION_SYD1_ENDPOINT || "syd1.cloudify.app",
};

/**
 * Update DNS records for failover
 */
export async function updateDNSRecords(
  fromRegion: string,
  toRegion: string
): Promise<boolean> {
  if (!CF_API_TOKEN || !CF_ZONE_ID) {
    console.warn("Cloudflare credentials not configured, skipping DNS update");
    return true;
  }

  try {
    // Get the load balancer pool
    const pools = await getLoadBalancerPools();
    const pool = pools.find((p) => p.name.includes("cloudify"));

    if (pool) {
      // Update origin weights
      await updatePoolOrigins(pool.id, fromRegion, toRegion);
    } else {
      // Fallback to direct DNS update
      await updateDirectDNS(fromRegion, toRegion);
    }

    return true;
  } catch (error) {
    console.error("Failed to update DNS:", error);
    throw error;
  }
}

/**
 * Get Cloudflare Load Balancer pools
 */
async function getLoadBalancerPools(): Promise<LoadBalancerPool[]> {
  const response = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/load_balancers/pools`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get pools: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Update load balancer pool origins
 */
async function updatePoolOrigins(
  poolId: string,
  fromRegion: string,
  toRegion: string
): Promise<void> {
  // Get current pool config
  const response = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/load_balancers/pools/${poolId}`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get pool: ${response.statusText}`);
  }

  const pool = (await response.json()).result;

  // Update origins
  const updatedOrigins = pool.origins.map((origin: any) => {
    if (origin.name === fromRegion) {
      return { ...origin, enabled: false, weight: 0 };
    }
    if (origin.name === toRegion) {
      return { ...origin, enabled: true, weight: 1 };
    }
    return origin;
  });

  // Update pool
  const updateResponse = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/load_balancers/pools/${poolId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ origins: updatedOrigins }),
    }
  );

  if (!updateResponse.ok) {
    throw new Error(`Failed to update pool: ${updateResponse.statusText}`);
  }
}

/**
 * Update DNS records directly (fallback)
 */
async function updateDirectDNS(
  fromRegion: string,
  toRegion: string
): Promise<void> {
  const toEndpoint = REGION_ENDPOINTS[toRegion];
  if (!toEndpoint) {
    throw new Error(`Unknown region: ${toRegion}`);
  }

  // Get existing DNS records
  const records = await getDNSRecords();
  const mainRecord = records.find(
    (r) => r.name === "projects.tranthachnguyen.com" && r.type === "CNAME"
  );

  if (mainRecord) {
    // Update existing record
    await fetch(
      `${CF_API_BASE}/zones/${CF_ZONE_ID}/dns_records/${mainRecord.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: toEndpoint,
          ttl: 60, // Short TTL during failover
        }),
      }
    );
  }
}

/**
 * Get current DNS records
 */
async function getDNSRecords(): Promise<DNSRecord[]> {
  const response = await fetch(
    `${CF_API_BASE}/zones/${CF_ZONE_ID}/dns_records`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get DNS records: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Get DNS propagation status
 */
export async function getDNSStatus(regionName: string): Promise<DNSStatus> {
  try {
    const records = await getDNSRecords();
    const expectedEndpoint = REGION_ENDPOINTS[regionName];

    const mainRecord = records.find(
      (r) => r.name === "projects.tranthachnguyen.com"
    );

    return {
      propagated: mainRecord?.content === expectedEndpoint,
      activeRegion: regionName,
      records,
    };
  } catch (error) {
    return {
      propagated: false,
      activeRegion: regionName,
      records: [],
    };
  }
}

/**
 * Create health check for a region
 */
export async function createHealthCheck(
  regionName: string
): Promise<{ id: string; healthy: boolean }> {
  const endpoint = REGION_ENDPOINTS[regionName];
  if (!endpoint) {
    throw new Error(`Unknown region: ${regionName}`);
  }

  const response = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/load_balancers/monitors`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `Health check for ${regionName}`,
        type: "https",
        method: "GET",
        path: "/health",
        expected_codes: "200",
        timeout: 5,
        interval: 60,
        retries: 2,
        follow_redirects: true,
        allow_insecure: false,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create health check: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.result.id,
    healthy: true,
  };
}

/**
 * Setup Cloudflare Load Balancing
 */
export async function setupLoadBalancing(regions: string[]): Promise<{
  poolId: string;
  loadBalancerId: string;
}> {
  // Create origins from regions
  const origins = regions.map((region, index) => ({
    name: region,
    address: REGION_ENDPOINTS[region] || `${region}.cloudify.app`,
    enabled: true,
    weight: index === 0 ? 1 : 0.5, // Primary gets more weight
  }));

  // Create pool
  const poolResponse = await fetch(
    `${CF_API_BASE}/accounts/${CF_ACCOUNT_ID}/load_balancers/pools`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "cloudify-origins",
        origins,
        notification_email: process.env.ALERT_EMAIL,
        check_regions: ["WNAM", "ENAM", "WEU", "EEU", "SEAS"],
      }),
    }
  );

  if (!poolResponse.ok) {
    throw new Error(`Failed to create pool: ${poolResponse.statusText}`);
  }

  const pool = (await poolResponse.json()).result;

  // Create load balancer
  const lbResponse = await fetch(
    `${CF_API_BASE}/zones/${CF_ZONE_ID}/load_balancers`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "projects.tranthachnguyen.com",
        default_pools: [pool.id],
        fallback_pool: pool.id,
        proxied: true,
        steering_policy: "geo",
        session_affinity: "cookie",
        session_affinity_ttl: 3600,
      }),
    }
  );

  if (!lbResponse.ok) {
    throw new Error(`Failed to create load balancer: ${lbResponse.statusText}`);
  }

  const lb = (await lbResponse.json()).result;

  return {
    poolId: pool.id,
    loadBalancerId: lb.id,
  };
}

/**
 * Get load balancer analytics
 */
export async function getLoadBalancerAnalytics(
  loadBalancerId: string,
  since: Date
): Promise<{
  requests: number;
  bandwidth: number;
  regionBreakdown: Record<string, number>;
}> {
  const response = await fetch(
    `${CF_API_BASE}/zones/${CF_ZONE_ID}/load_balancers/${loadBalancerId}/analytics/latency`,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    return {
      requests: 0,
      bandwidth: 0,
      regionBreakdown: {},
    };
  }

  const data = await response.json();
  return {
    requests: data.result?.totals?.requests || 0,
    bandwidth: data.result?.totals?.bandwidth || 0,
    regionBreakdown: data.result?.by_origin || {},
  };
}
