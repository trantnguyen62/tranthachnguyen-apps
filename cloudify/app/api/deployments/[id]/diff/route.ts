/**
 * Deployment Diff API
 * GET - Get diff between this deployment and previous
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getDeploymentDiff, getDeploymentComparisonSummary } from "@/lib/deployments/diff-service";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("deployments/[id]/diff");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/deployments/[id]/diff - Get deployment diff
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const compareWith = searchParams.get("compareWith") || undefined;
    const summaryOnly = searchParams.get("summary") === "true";

    // Get deployment
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
            repositoryUrl: true,
          },
        },
      },
    });

    if (!deployment) {
      return fail("NOT_FOUND", "Deployment not found", 404);
    }

    // Verify ownership
    if (deployment.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    // Return summary only if requested
    if (summaryOnly) {
      const summary = await getDeploymentComparisonSummary(id);
      return ok({ summary });
    }

    // Get full diff
    const diff = await getDeploymentDiff(id, compareWith);

    if (!diff) {
      return fail("NOT_FOUND", "Could not generate diff", 404);
    }

    return ok({ diff });
  } catch (error) {
    log.error("Failed to get deployment diff", error);
    return fail("INTERNAL_ERROR", "Failed to get deployment diff", 500);
  }
}
