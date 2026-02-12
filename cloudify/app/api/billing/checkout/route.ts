/**
 * Billing Checkout API
 * Create Stripe checkout sessions for subscription upgrades
 */

import { NextRequest } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { createCheckoutSession, STRIPE_PRICES } from "@/lib/billing/stripe";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("billing/checkout");

type PriceKey = "PRO_MONTHLY" | "PRO_YEARLY" | "TEAM_MONTHLY" | "TEAM_YEARLY";

/**
 * POST /api/billing/checkout - Create checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { plan, interval } = body;

    // Validate plan
    if (!plan || !["pro", "team"].includes(plan)) {
      return fail("VALIDATION_ERROR", "Invalid plan. Must be 'pro' or 'team'", 400);
    }

    // Validate interval
    if (!interval || !["monthly", "yearly"].includes(interval)) {
      return fail("VALIDATION_ERROR", "Invalid interval. Must be 'monthly' or 'yearly'", 400);
    }

    // Get the correct price ID
    const priceKey = `${plan.toUpperCase()}_${interval.toUpperCase()}` as PriceKey;
    const priceId = STRIPE_PRICES[priceKey];

    if (!priceId) {
      return fail("BAD_REQUEST", "Price not configured for this plan", 400);
    }

    // Build success and cancel URLs
    const baseUrl = process.env.AUTH_URL || "https://cloudify.tranthachnguyen.com";
    const successUrl = `${baseUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/settings/billing?canceled=true`;

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      user.id,
      priceId,
      successUrl,
      cancelUrl
    );

    if (!checkoutUrl) {
      return fail("INTERNAL_ERROR", "Failed to create checkout session. Stripe may not be configured.", 500);
    }

    return ok({ url: checkoutUrl });
  } catch (error) {
    log.error("Failed to create checkout session", error);
    return fail("INTERNAL_ERROR", "Failed to create checkout session", 500);
  }
}
