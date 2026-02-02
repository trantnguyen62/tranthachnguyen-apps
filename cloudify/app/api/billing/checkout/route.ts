/**
 * Billing Checkout API
 * Create Stripe checkout sessions for subscription upgrades
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { createCheckoutSession, STRIPE_PRICES } from "@/lib/billing/stripe";

type PriceKey = "PRO_MONTHLY" | "PRO_YEARLY" | "TEAM_MONTHLY" | "TEAM_YEARLY";

/**
 * POST /api/billing/checkout - Create checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, interval } = body;

    // Validate plan
    if (!plan || !["pro", "team"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'team'" },
        { status: 400 }
      );
    }

    // Validate interval
    if (!interval || !["monthly", "yearly"].includes(interval)) {
      return NextResponse.json(
        { error: "Invalid interval. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    // Get the correct price ID
    const priceKey = `${plan.toUpperCase()}_${interval.toUpperCase()}` as PriceKey;
    const priceId = STRIPE_PRICES[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for this plan" },
        { status: 400 }
      );
    }

    // Build success and cancel URLs
    const baseUrl = process.env.AUTH_URL || "https://cloudify.tranthachnguyen.com";
    const successUrl = `${baseUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/settings/billing?canceled=true`;

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      priceId,
      successUrl,
      cancelUrl
    );

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout session. Stripe may not be configured." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: checkoutUrl,
    });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
