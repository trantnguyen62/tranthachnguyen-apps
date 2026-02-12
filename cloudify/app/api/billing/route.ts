/**
 * Billing API
 * Get subscription status and usage information
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionDetails } from "@/lib/billing/stripe";
import { getUsageWithLimits } from "@/lib/billing/metering";
import { PlanType, getPlan } from "@/lib/billing/pricing";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("billing");

/**
 * GET /api/billing - Get current subscription and usage
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user: authUser } = authResult;

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
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
    const subscriptionDetails = await getSubscriptionDetails(authUser.id);

    // Get usage with limits
    const usageWithLimits = await getUsageWithLimits(authUser.id, plan);

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
    log.error("Failed to get billing info", error);
    return NextResponse.json(
      { error: "Failed to get billing info" },
      { status: 500 }
    );
  }
}
