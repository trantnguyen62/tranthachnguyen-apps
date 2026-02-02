/**
 * Billing API
 * Get subscription status and usage information
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionDetails } from "@/lib/billing/stripe";
import { getUsageWithLimits } from "@/lib/billing/metering";
import { PlanType, getPlan } from "@/lib/billing/pricing";

/**
 * GET /api/billing - Get current subscription and usage
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionId: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = (user.plan || "free") as PlanType;
    const planConfig = getPlan(plan);

    // Get Stripe subscription details if available
    const subscriptionDetails = await getSubscriptionDetails(session.user.id);

    // Get usage with limits
    const usageWithLimits = await getUsageWithLimits(session.user.id, plan);

    return NextResponse.json({
      subscription: {
        plan,
        planName: planConfig.name,
        planDescription: planConfig.description,
        priceMonthly: planConfig.priceMonthly,
        priceYearly: planConfig.priceYearly,
        status: subscriptionDetails.status,
        currentPeriodEnd: subscriptionDetails.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionDetails.cancelAtPeriodEnd,
        stripeSubscriptionId: user.subscriptionId,
      },
      usage: usageWithLimits.usage,
      limits: usageWithLimits.limits,
      percentages: usageWithLimits.percentages,
      exceeded: usageWithLimits.exceeded,
    });
  } catch (error) {
    console.error("Failed to get billing info:", error);
    return NextResponse.json(
      { error: "Failed to get billing info" },
      { status: 500 }
    );
  }
}
