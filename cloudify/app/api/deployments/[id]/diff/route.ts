/**
 * Deployment Diff API
 * GET - Get diff between this deployment and previous
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getDeploymentDiff, getDeploymentComparisonSummary } from "@/lib/deployments/diff-service";

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
            repoUrl: true,
          },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (deployment.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Return summary only if requested
    if (summaryOnly) {
      const summary = await getDeploymentComparisonSummary(id);
      return NextResponse.json({ summary });
    }

    // Get full diff
    const diff = await getDeploymentDiff(id, compareWith);

    if (!diff) {
      return NextResponse.json(
        { error: "Could not generate diff" },
        { status: 404 }
      );
    }

    return NextResponse.json({ diff });
  } catch (error) {
    console.error("Failed to get deployment diff:", error);
    return NextResponse.json(
      { error: "Failed to get deployment diff" },
      { status: 500 }
    );
  }
}
