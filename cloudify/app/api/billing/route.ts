/**
 * Billing API
 * Get subscription status and usage information
 */

import { NextRequest } from "next/server";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionDetails } from "@/lib/billing/stripe";
import { getUsageWithLimits } from "@/lib/billing/metering";
import { PlanType, getPlan } from "@/lib/billing/pricing";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

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
      return fail("NOT_FOUND", "User not found", 404);
    }

    const plan = (user.plan || "free") as PlanType;
    const planConfig = getPlan(plan);

    // Get Stripe subscription details if available
    const subscriptionDetails = await getSubscriptionDetails(authUser.id);

    // Get usage with limits
    const usageWithLimits = await getUsageWithLimits(authUser.id, plan);

    return ok({
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
    return fail("INTERNAL_ERROR", "Failed to get billing info", 500);
  }
}
