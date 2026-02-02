/**
 * Unified API Authentication
 * Supports both session-based (web UI) and token-based (CLI) authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "./next-auth";
import { validateApiToken, ApiTokenUser, hasScope } from "./api-token";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  scopes?: string[];
  authMethod: "session" | "token";
}

/**
 * Get authenticated user from either session or API token
 * Tries API token first (for CLI), then falls back to session (for web UI)
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null> {
  // First try API token (for CLI and programmatic access)
  const tokenUser = await validateApiToken(request);
  if (tokenUser) {
    return {
      id: tokenUser.id,
      email: tokenUser.email,
      name: tokenUser.name,
      scopes: tokenUser.scopes,
      authMethod: "token",
    };
  }

  // Fall back to session auth (for web UI)
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "",
        authMethod: "session",
      };
    }
  } catch (error) {
    // Session auth may fail in some contexts, that's OK
    console.error("Session auth error:", error);
  }

  return null;
}

/**
 * Middleware-style authentication checker
 * Returns either the authenticated user or an error response
 */
export async function requireAuth(
  request: NextRequest,
  requiredScope?: string
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check scope if required and using token auth
  if (requiredScope && user.authMethod === "token") {
    if (!user.scopes?.includes(requiredScope) && !user.scopes?.includes("admin")) {
      return NextResponse.json(
        { error: "Insufficient permissions", required: requiredScope },
        { status: 403 }
      );
    }
  }

  return { user };
}

/**
 * Check if the result is an error response
 */
export function isAuthError(
  result: { user: AuthUser } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Require read scope
 */
export async function requireReadAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request, "read");
}

/**
 * Require write scope
 */
export async function requireWriteAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request, "write");
}

/**
 * Require deploy scope
 */
export async function requireDeployAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request, "deploy");
}

/**
 * Require admin scope
 */
export async function requireAdminAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request, "admin");
}
