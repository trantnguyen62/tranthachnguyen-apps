import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("feature-flags/evaluate");

// POST /api/feature-flags/evaluate - Evaluate feature flags for a user
// This endpoint is meant to be called from deployed apps
export async function POST(request: NextRequest) {
  try {
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, userId, userAttributes = {} } = body;

    if (!projectId) {
      return fail("VALIDATION_MISSING_FIELD", "Project ID is required", 400);
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Get all enabled flags for the project
    const flags = await prisma.featureFlag.findMany({
      where: { projectId, enabled: true },
    });

    // Evaluate each flag
    const results: Record<string, boolean> = {};

    for (const flag of flags) {
      results[flag.key] = evaluateFlag(flag, userId, userAttributes);
    }

    return ok({
      flags: results,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Failed to evaluate feature flags", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to evaluate feature flags", 500);
  }
}

interface FeatureFlagInput {
  key: string;
  enabled: boolean;
  percentage: number;
  conditions: unknown;
}

function evaluateFlag(
  flag: FeatureFlagInput,
  userId?: string,
  userAttributes?: Record<string, unknown>
): boolean {
  // If not enabled, always false
  if (!flag.enabled) return false;

  // Check percentage rollout
  if (flag.percentage < 100) {
    if (!userId) {
      // No user ID, use random
      return Math.random() * 100 < flag.percentage;
    }

    // Deterministic rollout based on user ID and flag key
    const hash = createHash("md5")
      .update(`${flag.key}:${userId}`)
      .digest("hex");
    const hashValue = parseInt(hash.substring(0, 8), 16) % 100;

    if (hashValue >= flag.percentage) {
      return false;
    }
  }

  // Check conditions
  if (flag.conditions && userAttributes) {
    const conditions = flag.conditions as Record<string, unknown>;

    for (const [key, expected] of Object.entries(conditions)) {
      const actual = userAttributes[key];

      if (Array.isArray(expected)) {
        // If expected is an array, check if actual is in the array
        if (!expected.includes(actual)) {
          return false;
        }
      } else if (actual !== expected) {
        return false;
      }
    }
  }

  return true;
}
