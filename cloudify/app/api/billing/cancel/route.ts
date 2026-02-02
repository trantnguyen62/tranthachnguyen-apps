/**
 * Billing Cancel API
 * Cancel or resume subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { cancelSubscription, resumeSubscription } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/billing/cancel - Cancel subscription at period end
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await cancelSubscription(session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to cancel subscription. You may not have an active subscription." },
        { status: 400 }
      );
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
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
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/cancel - Resume a canceled subscription
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await resumeSubscription(session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to resume subscription" },
        { status: 400 }
      );
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
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
    console.error("Failed to resume subscription:", error);
    return NextResponse.json(
      { error: "Failed to resume subscription" },
      { status: 500 }
    );
  }
}
