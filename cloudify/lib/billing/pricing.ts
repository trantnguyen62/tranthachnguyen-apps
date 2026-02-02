/**
 * Pricing Tiers Configuration
 * Defines plan limits, features, and pricing for Cloudify
 */

export type PlanType = "free" | "pro" | "team" | "enterprise";

export interface PlanLimits {
  // Deployments
  deploymentsPerMonth: number;
  buildMinutesPerMonth: number;
  concurrentBuilds: number;

  // Bandwidth & Requests
  bandwidthGB: number;
  requestsPerMonth: number;

  // Storage
  blobStorageGB: number;
  kvEntriesPerStore: number;

  // Functions
  functionInvocationsPerMonth: number;
  functionTimeoutSeconds: number;
  functionMemoryMB: number;

  // Projects & Team
  projects: number;
  teamMembers: number;
  customDomains: number;

  // Features
  analytics: boolean;
  edgeConfig: boolean;
  previewDeployments: boolean;
  passwordProtection: boolean;
  draftDeployments: boolean;
  webhooks: boolean;
  prioritySupport: boolean;
}

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  popular?: boolean;
}

/**
 * Plan configurations
 */
export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: "Hobby",
    description: "Perfect for personal projects and learning",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      // Deployments
      deploymentsPerMonth: 100,
      buildMinutesPerMonth: 100,
      concurrentBuilds: 1,

      // Bandwidth & Requests
      bandwidthGB: 100,
      requestsPerMonth: 100000,

      // Storage
      blobStorageGB: 1,
      kvEntriesPerStore: 1000,

      // Functions
      functionInvocationsPerMonth: 100000,
      functionTimeoutSeconds: 10,
      functionMemoryMB: 1024,

      // Projects & Team
      projects: 3,
      teamMembers: 1,
      customDomains: 1,

      // Features
      analytics: true,
      edgeConfig: false,
      previewDeployments: true,
      passwordProtection: false,
      draftDeployments: false,
      webhooks: true,
      prioritySupport: false,
    },
  },

  pro: {
    name: "Pro",
    description: "For professional developers and small teams",
    priceMonthly: 20,
    priceYearly: 192, // $16/month billed yearly
    popular: true,
    limits: {
      // Deployments
      deploymentsPerMonth: 1000,
      buildMinutesPerMonth: 400,
      concurrentBuilds: 3,

      // Bandwidth & Requests
      bandwidthGB: 1000,
      requestsPerMonth: 1000000,

      // Storage
      blobStorageGB: 10,
      kvEntriesPerStore: 10000,

      // Functions
      functionInvocationsPerMonth: 1000000,
      functionTimeoutSeconds: 60,
      functionMemoryMB: 3008,

      // Projects & Team
      projects: 20,
      teamMembers: 1,
      customDomains: 10,

      // Features
      analytics: true,
      edgeConfig: true,
      previewDeployments: true,
      passwordProtection: true,
      draftDeployments: true,
      webhooks: true,
      prioritySupport: false,
    },
  },

  team: {
    name: "Team",
    description: "For growing teams that need collaboration",
    priceMonthly: 50,
    priceYearly: 480, // $40/month billed yearly
    limits: {
      // Deployments
      deploymentsPerMonth: 3000,
      buildMinutesPerMonth: 1000,
      concurrentBuilds: 6,

      // Bandwidth & Requests
      bandwidthGB: 5000,
      requestsPerMonth: 5000000,

      // Storage
      blobStorageGB: 50,
      kvEntriesPerStore: 100000,

      // Functions
      functionInvocationsPerMonth: 5000000,
      functionTimeoutSeconds: 60,
      functionMemoryMB: 3008,

      // Projects & Team
      projects: 100,
      teamMembers: 10,
      customDomains: 50,

      // Features
      analytics: true,
      edgeConfig: true,
      previewDeployments: true,
      passwordProtection: true,
      draftDeployments: true,
      webhooks: true,
      prioritySupport: true,
    },
  },

  enterprise: {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    priceMonthly: 0, // Custom pricing
    priceYearly: 0,
    limits: {
      // Unlimited
      deploymentsPerMonth: -1, // -1 = unlimited
      buildMinutesPerMonth: -1,
      concurrentBuilds: 12,

      bandwidthGB: -1,
      requestsPerMonth: -1,

      blobStorageGB: -1,
      kvEntriesPerStore: -1,

      functionInvocationsPerMonth: -1,
      functionTimeoutSeconds: 900, // 15 minutes
      functionMemoryMB: 3008,

      projects: -1,
      teamMembers: -1,
      customDomains: -1,

      analytics: true,
      edgeConfig: true,
      previewDeployments: true,
      passwordProtection: true,
      draftDeployments: true,
      webhooks: true,
      prioritySupport: true,
    },
  },
};

/**
 * Get plan configuration
 */
export function getPlan(planType: PlanType): PlanConfig {
  return PLANS[planType] || PLANS.free;
}

/**
 * Get plan limits
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
  return getPlan(planType).limits;
}

/**
 * Check if a limit is unlimited (-1)
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Check if user has exceeded a limit
 * Note: Being AT the limit is OK, only OVER the limit is exceeded
 */
export function hasExceededLimit(
  current: number,
  limit: number
): boolean {
  if (isUnlimited(limit)) return false;
  // Handle NaN - treat as not exceeded (fail open is safer for UX)
  if (Number.isNaN(current)) return false;
  // Strictly greater than - being AT limit is allowed
  return current > limit;
}

/**
 * Get usage percentage (0-100)
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (isUnlimited(limit)) return 0;
  // Handle NaN input - treat as 0 usage
  if (Number.isNaN(current) || Number.isNaN(limit)) return 0;
  // Handle 0/0 case - 0 usage out of 0 limit should be 0%, not 100%
  if (current === 0 && limit === 0) return 0;
  // Zero limit with non-zero usage means fully exceeded
  if (limit === 0) return 100;
  // Clamp negative usage to 0
  if (current < 0) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

/**
 * Format limit value for display
 */
export function formatLimit(value: number): string {
  if (isUnlimited(value)) return "Unlimited";
  // Handle NaN and Infinity gracefully
  if (Number.isNaN(value)) return "0";
  if (!Number.isFinite(value)) return "Unlimited";
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  // Handle negative values - bytes can't be negative
  if (bytes < 0) {
    return "0 B";
  }
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Overage pricing (per unit beyond included)
 */
export const OVERAGE_PRICING = {
  buildMinutes: 0.02, // $0.02 per minute
  bandwidthGB: 0.15, // $0.15 per GB
  functionInvocations: 0.0000006, // $0.60 per million
  blobStorageGB: 0.25, // $0.25 per GB per month
};

/**
 * Calculate overage cost
 */
export function calculateOverage(
  usage: number,
  included: number,
  pricePerUnit: number
): number {
  if (isUnlimited(included)) return 0;
  const overage = Math.max(0, usage - included);
  return overage * pricePerUnit;
}

/**
 * Get all plan features for comparison
 */
export function getPlanFeatures(): Array<{
  name: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
  enterprise: string | boolean;
}> {
  return [
    {
      name: "Deployments / month",
      free: formatLimit(PLANS.free.limits.deploymentsPerMonth),
      pro: formatLimit(PLANS.pro.limits.deploymentsPerMonth),
      team: formatLimit(PLANS.team.limits.deploymentsPerMonth),
      enterprise: "Unlimited",
    },
    {
      name: "Build minutes / month",
      free: formatLimit(PLANS.free.limits.buildMinutesPerMonth),
      pro: formatLimit(PLANS.pro.limits.buildMinutesPerMonth),
      team: formatLimit(PLANS.team.limits.buildMinutesPerMonth),
      enterprise: "Unlimited",
    },
    {
      name: "Concurrent builds",
      free: PLANS.free.limits.concurrentBuilds.toString(),
      pro: PLANS.pro.limits.concurrentBuilds.toString(),
      team: PLANS.team.limits.concurrentBuilds.toString(),
      enterprise: PLANS.enterprise.limits.concurrentBuilds.toString(),
    },
    {
      name: "Bandwidth",
      free: `${PLANS.free.limits.bandwidthGB} GB`,
      pro: `${PLANS.pro.limits.bandwidthGB} GB`,
      team: `${PLANS.team.limits.bandwidthGB} GB`,
      enterprise: "Unlimited",
    },
    {
      name: "Projects",
      free: PLANS.free.limits.projects.toString(),
      pro: PLANS.pro.limits.projects.toString(),
      team: PLANS.team.limits.teamMembers.toString(),
      enterprise: "Unlimited",
    },
    {
      name: "Team members",
      free: PLANS.free.limits.teamMembers.toString(),
      pro: PLANS.pro.limits.teamMembers.toString(),
      team: PLANS.team.limits.teamMembers.toString(),
      enterprise: "Unlimited",
    },
    {
      name: "Custom domains",
      free: PLANS.free.limits.customDomains.toString(),
      pro: PLANS.pro.limits.customDomains.toString(),
      team: PLANS.team.limits.customDomains.toString(),
      enterprise: "Unlimited",
    },
    {
      name: "Analytics",
      free: PLANS.free.limits.analytics,
      pro: PLANS.pro.limits.analytics,
      team: PLANS.team.limits.analytics,
      enterprise: true,
    },
    {
      name: "Preview deployments",
      free: PLANS.free.limits.previewDeployments,
      pro: PLANS.pro.limits.previewDeployments,
      team: PLANS.team.limits.previewDeployments,
      enterprise: true,
    },
    {
      name: "Edge Config",
      free: PLANS.free.limits.edgeConfig,
      pro: PLANS.pro.limits.edgeConfig,
      team: PLANS.team.limits.edgeConfig,
      enterprise: true,
    },
    {
      name: "Password protection",
      free: PLANS.free.limits.passwordProtection,
      pro: PLANS.pro.limits.passwordProtection,
      team: PLANS.team.limits.passwordProtection,
      enterprise: true,
    },
    {
      name: "Priority support",
      free: PLANS.free.limits.prioritySupport,
      pro: PLANS.pro.limits.prioritySupport,
      team: PLANS.team.limits.prioritySupport,
      enterprise: true,
    },
  ];
}
