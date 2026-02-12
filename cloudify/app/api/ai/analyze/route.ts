/**
 * AI Analysis API
 * POST - Trigger AI analysis for a deployment
 * GET - Get analysis results
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import {
  analyzeDeployment,
  getDeploymentAnalysis,
  analyzeBuildFailure,
} from "@/lib/ai/analysis-service";
import { isAIAvailable } from "@/lib/ai/client";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ai/analyze");

// POST /api/ai/analyze - Trigger analysis
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    if (!isAIAvailable()) {
      return NextResponse.json(
        { error: "AI features not available", reason: "API key not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { deploymentId, type = "deployment_analysis" } = body;

    if (!deploymentId) {
      return NextResponse.json(
        { error: "Deployment ID is required" },
        { status: 400 }
      );
    }

    // Verify deployment ownership
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    if (deployment.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check for existing recent analysis
    const existingAnalysis = await prisma.aIAnalysis.findFirst({
      where: {
        deploymentId,
        type,
        status: "completed",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within 5 minutes
        },
      },
    });

    if (existingAnalysis) {
      return NextResponse.json({
        analysis: existingAnalysis.output,
        cached: true,
        analysisId: existingAnalysis.id,
      });
    }

    // Run analysis based on type
    let result;
    switch (type) {
      case "deployment_analysis":
        result = await analyzeDeployment(deploymentId);
        break;
      case "build_failure":
        result = await analyzeBuildFailure(deploymentId);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown analysis type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      analysis: result,
      cached: false,
    });
  } catch (error) {
    log.error("AI analysis error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Analysis failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET /api/ai/analyze - Get analysis results
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("deploymentId");
    const analysisId = searchParams.get("analysisId");

    if (analysisId) {
      // Get specific analysis
      const analysis = await prisma.aIAnalysis.findUnique({
        where: { id: analysisId },
      });

      if (!analysis) {
        return NextResponse.json(
          { error: "Analysis not found" },
          { status: 404 }
        );
      }

      // Verify ownership through project
      const project = await prisma.project.findFirst({
        where: {
          id: analysis.projectId,
          userId: user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      return NextResponse.json({ analysis });
    }

    if (deploymentId) {
      // Get latest analysis for deployment
      const analysis = await getDeploymentAnalysis(deploymentId);

      if (!analysis) {
        return NextResponse.json(
          { error: "No analysis found", available: false },
          { status: 404 }
        );
      }

      return NextResponse.json({ analysis, available: true });
    }

    return NextResponse.json(
      { error: "Deployment ID or Analysis ID required" },
      { status: 400 }
    );
  } catch (error) {
    log.error("Get analysis error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to get analysis" },
      { status: 500 }
    );
  }
}
