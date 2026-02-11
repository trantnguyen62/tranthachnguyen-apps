/**
 * AI Performance Recommendations API
 *
 * POST /api/ai/performance - Get AI-powered performance recommendations for a project
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import {
  analyzePerformance,
  calculatePerformanceScore,
  getMetricStatus,
  WebVitals,
} from "@/lib/ai/performance-advisor";

/**
 * POST /api/ai/performance
 *
 * Analyze project performance and get recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, vitals } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        framework: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Analyze performance
    const { score, analysis, recommendations } = await analyzePerformance(
      projectId,
      vitals as WebVitals | undefined
    );

    // Build response with metric details
    const metricsDetails: Record<string, { value: number; status: string; target: number }> = {};

    if (vitals) {
      const vitalKeys: Array<keyof WebVitals> = ["lcp", "fid", "cls", "ttfb", "fcp", "inp"];
      const targets: Record<keyof WebVitals, number> = {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        ttfb: 800,
        fcp: 1800,
        inp: 200,
      };

      for (const key of vitalKeys) {
        if (vitals[key] !== undefined) {
          metricsDetails[key.toUpperCase()] = {
            value: vitals[key] as number,
            status: getMetricStatus(key, vitals[key] as number),
            target: targets[key],
          };
        }
      }
    }

    // Store the analysis
    await prisma.aIAnalysis.create({
      data: {
        projectId: project.id,
        type: "performance",
        status: "completed",
        input: { vitals },
        output: JSON.parse(JSON.stringify({
          summary: analysis?.summary || `Performance score: ${score}/100`,
          score,
          analysis,
          recommendations,
          metrics: metricsDetails,
        })),
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        framework: project.framework,
      },
      score,
      metrics: metricsDetails,
      analysis: analysis
        ? {
            summary: analysis.summary,
            criticalIssues: analysis.criticalIssues,
            quickWins: analysis.quickWins,
            longTermImprovements: analysis.longTermImprovements,
          }
        : null,
      recommendations: recommendations.map((r) => ({
        category: r.category,
        severity: r.severity,
        issue: r.issue,
        suggestion: r.suggestion,
        codeExample: r.codeExample,
        impact: r.impact,
        estimatedImprovement: r.estimatedImprovement,
      })),
    });
  } catch (error) {
    console.error("[AI Performance] Error:", error);
    return NextResponse.json(
      { error: "Performance analysis failed" },
      { status: 500 }
    );
  }
}
