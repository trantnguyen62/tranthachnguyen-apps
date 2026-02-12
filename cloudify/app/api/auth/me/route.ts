/**
 * GET /api/auth/me - Get current authenticated user
 * Used by CLI to validate tokens and retrieve user info
 */

import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("auth/me");

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return fail("AUTH_REQUIRED", "Unauthorized", 401);
    }

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      authMethod: user.authMethod,
    });
  } catch (error) {
    log.error("Auth check error", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Authentication failed", 500);
  }
}
