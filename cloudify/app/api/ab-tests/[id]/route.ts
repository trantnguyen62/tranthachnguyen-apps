/**
 * Individual A/B Test API
 * GET - Get test details and results
 * PUT - Update test
 * DELETE - Delete test
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getTestResults, updateABTest, deleteABTest } from "@/lib/edge/ab-testing";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ab-tests/[id] - Get test details and results
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const test = await prisma.aBTest.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    // Verify ownership through project
    const project = await prisma.project.findFirst({
      where: {
        id: test.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get results
    const results = await getTestResults(id);

    // Get recent conversions
    const recentConversions = await prisma.aBTestConversion.findMany({
      where: { testId: id },
      orderBy: { convertedAt: "desc" },
      take: 20,
      select: {
        id: true,
        visitorId: true,
        variant: true,
        conversionType: true,
        value: true,
        convertedAt: true,
      },
    });

    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyParticipants = await prisma.aBTestParticipant.groupBy({
      by: ["variant"],
      where: {
        testId: id,
        assignedAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    const dailyConversions = await prisma.aBTestConversion.groupBy({
      by: ["variant"],
      where: {
        testId: id,
        convertedAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    return NextResponse.json({
      test: results.test,
      variants: results.variants,
      statisticalSignificance: results.statisticalSignificance,
      recentConversions,
      last7Days: {
        participants: dailyParticipants,
        conversions: dailyConversions,
      },
    });
  } catch (error) {
    console.error("Failed to fetch A/B test:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B test" },
      { status: 500 }
    );
  }
}

// PUT /api/ab-tests/[id] - Update test
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const test = await prisma.aBTest.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    // Verify ownership through project
    const project = await prisma.project.findFirst({
      where: {
        id: test.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, variants, targeting, endDate, name } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (enabled !== undefined) updateData.enabled = enabled;
    if (variants !== undefined) updateData.variants = variants;
    if (targeting !== undefined) updateData.targeting = targeting;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    }

    const updated = await updateABTest(id, updateData);

    // Log activity
    const actionType = enabled === true ? "started" : enabled === false ? "stopped" : "updated";
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: test.projectId,
        type: "ab_test",
        action: `ab_test.${actionType}`,
        description: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} A/B test "${test.name}"`,
        metadata: {
          testId: id,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({ test: updated });
  } catch (error) {
    console.error("Failed to update A/B test:", error);
    return NextResponse.json(
      { error: "Failed to update A/B test" },
      { status: 500 }
    );
  }
}

// DELETE /api/ab-tests/[id] - Delete test
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const test = await prisma.aBTest.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    // Verify ownership through project
    const project = await prisma.project.findFirst({
      where: {
        id: test.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the test
    await deleteABTest(id);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: test.projectId,
        type: "ab_test",
        action: "ab_test.deleted",
        description: `Deleted A/B test "${test.name}"`,
        metadata: { testId: id },
      },
    });

    return NextResponse.json({
      success: true,
      message: "A/B test deleted",
    });
  } catch (error) {
    console.error("Failed to delete A/B test:", error);
    return NextResponse.json(
      { error: "Failed to delete A/B test" },
      { status: 500 }
    );
  }
}
