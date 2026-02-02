/**
 * A/B Testing Service
 * Manages experiment assignment and conversion tracking
 */

import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export interface ABTestVariant {
  name: string;
  weight: number;
  url?: string;
  config?: Record<string, unknown>;
}

export interface ABTestTargeting {
  countries?: string[];
  devices?: string[];
  browsers?: string[];
  percentage?: number;
  urlPatterns?: string[];
}

export interface ABTestAssignment {
  testId: string;
  testSlug: string;
  variant: string;
  variantConfig?: Record<string, unknown>;
}

/**
 * Get active A/B tests for a project
 */
export async function getActiveTests(projectId: string): Promise<any[]> {
  const now = new Date();

  return prisma.aBTest.findMany({
    where: {
      projectId,
      enabled: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    },
  });
}

/**
 * Assign a visitor to A/B test variants
 */
export async function assignVariants(
  projectId: string,
  visitorId: string,
  context: {
    country?: string;
    device?: string;
    browser?: string;
    url?: string;
  }
): Promise<ABTestAssignment[]> {
  const activeTests = await getActiveTests(projectId);
  const assignments: ABTestAssignment[] = [];

  for (const test of activeTests) {
    // Check if already assigned
    const existingAssignment = await prisma.aBTestParticipant.findUnique({
      where: {
        testId_visitorId: {
          testId: test.id,
          visitorId,
        },
      },
    });

    if (existingAssignment) {
      const variants = test.variants as unknown as ABTestVariant[];
      const variantConfig = variants.find((v) => v.name === existingAssignment.variant);

      assignments.push({
        testId: test.id,
        testSlug: test.slug,
        variant: existingAssignment.variant,
        variantConfig: variantConfig?.config,
      });
      continue;
    }

    // Check targeting rules
    const targeting = test.targeting as ABTestTargeting | null;
    if (targeting) {
      if (targeting.countries && context.country && !targeting.countries.includes(context.country)) {
        continue;
      }
      if (targeting.devices && context.device && !targeting.devices.includes(context.device)) {
        continue;
      }
      if (targeting.browsers && context.browser && !targeting.browsers.includes(context.browser)) {
        continue;
      }
      if (targeting.percentage && Math.random() * 100 > targeting.percentage) {
        continue;
      }
      if (targeting.urlPatterns && context.url) {
        const matched = targeting.urlPatterns.some((pattern) => {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          return regex.test(context.url!);
        });
        if (!matched) continue;
      }
    }

    // Assign variant based on deterministic hash
    const variant = assignVariant(test.id, visitorId, test.variants as ABTestVariant[]);

    // Record assignment
    await prisma.aBTestParticipant.create({
      data: {
        testId: test.id,
        visitorId,
        variant: variant.name,
        country: context.country,
        device: context.device,
      },
    });

    assignments.push({
      testId: test.id,
      testSlug: test.slug,
      variant: variant.name,
      variantConfig: variant.config,
    });
  }

  return assignments;
}

/**
 * Deterministically assign a variant based on visitor ID
 */
function assignVariant(
  testId: string,
  visitorId: string,
  variants: ABTestVariant[]
): ABTestVariant {
  // Create deterministic hash
  const hash = createHash("sha256")
    .update(`${testId}:${visitorId}`)
    .digest("hex");

  // Convert first 8 hex chars to number between 0-100
  const hashNum = parseInt(hash.substring(0, 8), 16);
  const percentage = (hashNum / 0xffffffff) * 100;

  // Assign based on weights
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (percentage < cumulative) {
      return variant;
    }
  }

  // Fallback to first variant
  return variants[0];
}

/**
 * Track a conversion
 */
export async function trackConversion(
  testId: string,
  visitorId: string,
  conversionType: string = "goal_reached",
  value?: number,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  // Get the participant's variant
  const participant = await prisma.aBTestParticipant.findUnique({
    where: {
      testId_visitorId: {
        testId,
        visitorId,
      },
    },
  });

  if (!participant) {
    return false;
  }

  // Record conversion
  await prisma.aBTestConversion.create({
    data: {
      testId,
      visitorId,
      variant: participant.variant,
      conversionType,
      value,
      metadata: metadata as object | undefined,
    },
  });

  return true;
}

/**
 * Get test results
 */
export async function getTestResults(testId: string): Promise<{
  test: any;
  variants: Array<{
    name: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    totalValue: number;
  }>;
  statisticalSignificance?: number;
}> {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const variants = test.variants as unknown as ABTestVariant[];
  const variantResults = [];

  for (const variant of variants) {
    const [participants, conversions] = await Promise.all([
      prisma.aBTestParticipant.count({
        where: { testId, variant: variant.name },
      }),
      prisma.aBTestConversion.findMany({
        where: { testId, variant: variant.name },
        select: { value: true },
      }),
    ]);

    const conversionCount = conversions.length;
    const totalValue = conversions.reduce((sum, c) => sum + (c.value || 0), 0);
    const conversionRate = participants > 0 ? (conversionCount / participants) * 100 : 0;

    variantResults.push({
      name: variant.name,
      participants,
      conversions: conversionCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalValue,
    });
  }

  // Calculate statistical significance (simplified chi-square test)
  let significance: number | undefined;
  if (variantResults.length === 2) {
    significance = calculateSignificance(
      variantResults[0].participants,
      variantResults[0].conversions,
      variantResults[1].participants,
      variantResults[1].conversions
    );
  }

  return {
    test,
    variants: variantResults,
    statisticalSignificance: significance,
  };
}

/**
 * Calculate statistical significance using chi-square test
 */
function calculateSignificance(
  n1: number,
  c1: number,
  n2: number,
  c2: number
): number {
  if (n1 === 0 || n2 === 0) return 0;

  const p1 = c1 / n1;
  const p2 = c2 / n2;
  const p = (c1 + c2) / (n1 + n2);

  if (p === 0 || p === 1) return 0;

  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;

  const z = Math.abs(p1 - p2) / se;

  // Convert z-score to p-value (approximation)
  const pValue = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

  // Return confidence level (1 - p-value) as percentage
  return Math.min(99.9, Math.round((1 - pValue * 2) * 1000) / 10);
}

/**
 * Create a new A/B test
 */
export async function createABTest(
  projectId: string,
  data: {
    name: string;
    variants: ABTestVariant[];
    targeting?: ABTestTargeting;
    primaryMetric?: string;
    goalUrl?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<any> {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Validate variants sum to 100
  const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight !== 100) {
    throw new Error("Variant weights must sum to 100");
  }

  return prisma.aBTest.create({
    data: {
      projectId,
      name: data.name,
      slug,
      enabled: false, // Start disabled
      variants: data.variants as object,
      targeting: data.targeting as object | undefined,
      primaryMetric: data.primaryMetric,
      goalUrl: data.goalUrl,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
}

/**
 * Update A/B test
 */
export async function updateABTest(
  testId: string,
  data: {
    enabled?: boolean;
    variants?: ABTestVariant[];
    targeting?: ABTestTargeting;
    endDate?: Date;
  }
): Promise<any> {
  if (data.variants) {
    const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error("Variant weights must sum to 100");
    }
  }

  return prisma.aBTest.update({
    where: { id: testId },
    data: {
      enabled: data.enabled,
      variants: data.variants as object | undefined,
      targeting: data.targeting as object | undefined,
      endDate: data.endDate,
    },
  });
}

/**
 * Delete A/B test and all related data
 */
export async function deleteABTest(testId: string): Promise<void> {
  await prisma.aBTestConversion.deleteMany({ where: { testId } });
  await prisma.aBTestParticipant.deleteMany({ where: { testId } });
  await prisma.aBTest.delete({ where: { id: testId } });
}
