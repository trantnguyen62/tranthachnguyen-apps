/**
 * A/B Tests API
 * GET - List A/B tests for a project
 * POST - Create a new A/B test
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { createABTest, getTestResults } from "@/lib/edge/ab-testing";

// GET /api/ab-tests - List A/B tests
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const tests = await prisma.aBTest.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        enabled: true,
        startDate: true,
        endDate: true,
        variants: true,
        targeting: true,
        primaryMetric: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            participants: true,
            conversions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate status for each test
    const now = new Date();
    const testsWithStatus = tests.map((test) => {
      let status: "draft" | "running" | "paused" | "completed" = "draft";

      if (test.enabled) {
        if (test.endDate && test.endDate < now) {
          status = "completed";
        } else if (!test.startDate || test.startDate <= now) {
          status = "running";
        } else {
          status = "draft";
        }
      } else {
        status = test._count.participants > 0 ? "paused" : "draft";
      }

      return {
        ...test,
        status,
        participantCount: test._count.participants,
        conversionCount: test._count.conversions,
        conversionRate: test._count.participants > 0
          ? Math.round((test._count.conversions / test._count.participants) * 10000) / 100
          : 0,
      };
    });

    return NextResponse.json({ tests: testsWithStatus });
  } catch (error) {
    console.error("Failed to fetch A/B tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B tests" },
      { status: 500 }
    );
  }
}

// POST /api/ab-tests - Create A/B test
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json();
    const {
      projectId,
      name,
      variants,
      targeting,
      primaryMetric,
      goalUrl,
      startDate,
      endDate,
    } = body;

    if (!projectId || !name || !variants) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, name, variants" },
        { status: 400 }
      );
    }

    // Validate variants
    if (!Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json(
        { error: "At least 2 variants are required" },
        { status: 400 }
      );
    }

    const totalWeight = variants.reduce((sum: number, v: any) => sum + (v.weight || 0), 0);
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: "Variant weights must sum to 100" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check plan limits
    const testCount = await prisma.aBTest.count({
      where: { projectId },
    });

    const limits: Record<string, number> = {
      free: 1,
      pro: 10,
      team: 50,
      enterprise: 200,
    };

    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    const maxTests = limits[userPlan?.plan || "free"] || 1;
    if (testCount >= maxTests) {
      return NextResponse.json(
        { error: `A/B test limit reached for your plan (${maxTests})` },
        { status: 403 }
      );
    }

    // Create test
    const test = await createABTest(projectId, {
      name,
      variants,
      targeting,
      primaryMetric,
      goalUrl,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "ab_test",
        action: "ab_test.created",
        description: `Created A/B test "${name}"`,
        metadata: {
          testId: test.id,
          variants: variants.map((v: any) => v.name),
        },
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error("Failed to create A/B test:", error);
    return NextResponse.json(
      { error: "Failed to create A/B test" },
      { status: 500 }
    );
  }
}
