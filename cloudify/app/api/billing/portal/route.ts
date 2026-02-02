/**
 * Billing Portal API
 * Create Stripe billing portal sessions for subscription management
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { createPortalSession } from "@/lib/billing/stripe";

/**
 * POST /api/billing/portal - Create billing portal session
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build return URL
    const baseUrl = process.env.AUTH_URL || "https://cloudify.tranthachnguyen.com";
    const returnUrl = `${baseUrl}/settings/billing`;

    // Create portal session
    const portalUrl = await createPortalSession(session.user.id, returnUrl);

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Failed to create portal session. Stripe may not be configured." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: portalUrl,
    });
  } catch (error) {
    console.error("Failed to create portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
