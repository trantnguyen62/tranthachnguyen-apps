/**
 * Billing Cancel API
 * Cancel or resume subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { cancelSubscription, resumeSubscription } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("billing/cancel");

/**
 * POST /api/billing/cancel - Cancel subscription at period end
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const success = await cancelSubscription(user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to cancel subscription. You may not have an active subscription." },
        { status: 400 }
      );
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "billing",
        action: "subscription.cancel_requested",
        description: "Subscription cancellation requested",
        metadata: {},
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the current billing period",
    });
  } catch (error) {
    log.error("Failed to cancel subscription", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/cancel - Resume a canceled subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const success = await resumeSubscription(user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to resume subscription" },
        { status: 400 }
      );
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "billing",
        action: "subscription.resumed",
        description: "Subscription cancellation reversed",
        metadata: {},
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription has been resumed",
    });
  } catch (error) {
    log.error("Failed to resume subscription", error);
    return NextResponse.json(
      { error: "Failed to resume subscription" },
      { status: 500 }
    );
  }
}
