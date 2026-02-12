/**
 * Billing Portal API
 * Create Stripe billing portal sessions for subscription management
 */

import { NextRequest } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { createPortalSession } from "@/lib/billing/stripe";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("billing/portal");

/**
 * POST /api/billing/portal - Create billing portal session
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    // Build return URL
    const baseUrl = process.env.AUTH_URL || "https://cloudify.tranthachnguyen.com";
    const returnUrl = `${baseUrl}/settings/billing`;

    // Create portal session
    const portalUrl = await createPortalSession(user.id, returnUrl);

    if (!portalUrl) {
      return fail("INTERNAL_ERROR", "Failed to create portal session. Stripe may not be configured.", 500);
    }

    return ok({ url: portalUrl });
  } catch (error) {
    log.error("Failed to create portal session", error);
    return fail("INTERNAL_ERROR", "Failed to create portal session", 500);
  }
}
