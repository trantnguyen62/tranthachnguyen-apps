/**
 * Performance Budgets API
 * GET - Get performance budgets for a project
 * POST - Create a performance budget
 * PUT - Update a performance budget
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("projects/[id]/budgets");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/budgets - Get performance budgets
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;

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

    const budgets = await prisma.performanceBudget.findMany({
      where: { projectId },
      orderBy: { metric: "asc" },
    });

    // Get latest speed insight for all metrics
    const latestInsight = await prisma.speedInsight.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        lcp: true,
        fcp: true,
        cls: true,
        ttfb: true,
        fid: true,
        inp: true,
        createdAt: true,
      },
    });

    // Get latest values for each budget
    const budgetsWithStatus = budgets.map((budget) => {
      let currentValue: number | null = null;

      if (latestInsight) {
        const insightData = latestInsight as unknown as Record<string, number | null>;
        currentValue = insightData[budget.metric] ?? null;
      }

      return {
        ...budget,
        currentValue,
        status: getViolationStatus(budget, currentValue),
      };
    });

    return NextResponse.json({ budgets: budgetsWithStatus });
  } catch (error) {
    log.error("Failed to fetch performance budgets", error);
    return NextResponse.json(
      { error: "Failed to fetch performance budgets" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/budgets - Create performance budget
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;
    const body = await request.json();
    const { metric, threshold, unit, comparison, alertEnabled, alertChannel } = body;

    if (!metric || threshold === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: metric, threshold" },
        { status: 400 }
      );
    }

    // Validate metric
    const validMetrics = [
      "lcp", "fcp", "cls", "ttfb", "fid", "inp",
      "bundle_size", "js_size", "css_size", "image_size",
      "request_count", "build_time",
    ];
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Valid options: ${validMetrics.join(", ")}` },
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

    // Check for existing budget with same metric
    const existing = await prisma.performanceBudget.findUnique({
      where: {
        projectId_metric: {
          projectId,
          metric,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A budget for this metric already exists" },
        { status: 409 }
      );
    }

    const budget = await prisma.performanceBudget.create({
      data: {
        projectId,
        metric,
        threshold,
        unit: unit || getDefaultUnit(metric),
        comparison: comparison || "lte",
        alertEnabled: alertEnabled ?? true,
        alertChannel,
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    log.error("Failed to create performance budget", error);
    return NextResponse.json(
      { error: "Failed to create performance budget" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/budgets - Update multiple budgets
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;
    const body = await request.json();
    const { budgetId, threshold, alertEnabled, alertChannel } = body;

    if (!budgetId) {
      return NextResponse.json(
        { error: "budgetId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const budget = await prisma.performanceBudget.findUnique({
      where: { id: budgetId },
    });

    if (!budget || budget.projectId !== projectId) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update budget
    const updateData: Record<string, unknown> = {};
    if (threshold !== undefined) updateData.threshold = threshold;
    if (alertEnabled !== undefined) updateData.alertEnabled = alertEnabled;
    if (alertChannel !== undefined) updateData.alertChannel = alertChannel;

    const updated = await prisma.performanceBudget.update({
      where: { id: budgetId },
      data: updateData,
    });

    return NextResponse.json({ budget: updated });
  } catch (error) {
    log.error("Failed to update performance budget", error);
    return NextResponse.json(
      { error: "Failed to update performance budget" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/budgets - Delete a budget
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get("budgetId");

    if (!budgetId) {
      return NextResponse.json(
        { error: "budgetId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const budget = await prisma.performanceBudget.findUnique({
      where: { id: budgetId },
    });

    if (!budget || budget.projectId !== projectId) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.performanceBudget.delete({
      where: { id: budgetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Failed to delete performance budget", error);
    return NextResponse.json(
      { error: "Failed to delete performance budget" },
      { status: 500 }
    );
  }
}

function getDefaultUnit(metric: string): string {
  const units: Record<string, string> = {
    lcp: "ms",
    fcp: "ms",
    cls: "score",
    ttfb: "ms",
    fid: "ms",
    inp: "ms",
    bundle_size: "kb",
    js_size: "kb",
    css_size: "kb",
    image_size: "kb",
    request_count: "count",
    build_time: "s",
  };
  return units[metric] || "value";
}

function getViolationStatus(
  budget: { threshold: number; comparison: string },
  currentValue: number | null
): "pass" | "fail" | "unknown" {
  if (currentValue === null || currentValue === undefined) {
    return "unknown";
  }

  switch (budget.comparison) {
    case "lte":
      return currentValue <= budget.threshold ? "pass" : "fail";
    case "lt":
      return currentValue < budget.threshold ? "pass" : "fail";
    case "gte":
      return currentValue >= budget.threshold ? "pass" : "fail";
    case "gt":
      return currentValue > budget.threshold ? "pass" : "fail";
    default:
      return "unknown";
  }
}
