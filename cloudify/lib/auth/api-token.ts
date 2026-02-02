/**
 * API Token Authentication
 * Validates Bearer tokens from CLI and programmatic access
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export interface ApiTokenUser {
  id: string;
  email: string;
  name: string;
  scopes: string[];
  tokenId: string;
}

/**
 * Validate an API token from the Authorization header
 * Tokens are stored as SHA256 hashes, never raw
 */
export async function validateApiToken(
  request: NextRequest
): Promise<ApiTokenUser | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();

  // Cloudify tokens start with "cl_"
  if (!token.startsWith("cl_")) {
    return null;
  }

  // Hash the token to compare with stored hash
  const tokenHash = createHash("sha256").update(token).digest("hex");

  try {
    const apiToken = await prisma.apiToken.findFirst({
      where: { token: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!apiToken) {
      return null;
    }

    // Check expiration
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp (fire and forget)
    prisma.apiToken
      .update({
        where: { id: apiToken.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // Ignore update errors - don't block the request
      });

    return {
      id: apiToken.user.id,
      email: apiToken.user.email,
      name: apiToken.user.name || apiToken.user.email,
      scopes: apiToken.scopes,
      tokenId: apiToken.id,
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

/**
 * Check if user has a specific scope
 * Admin scope grants access to everything
 */
export function hasScope(user: ApiTokenUser, requiredScope: string): boolean {
  return user.scopes.includes(requiredScope) || user.scopes.includes("admin");
}

/**
 * Check if user has any of the specified scopes
 */
export function hasAnyScope(user: ApiTokenUser, scopes: string[]): boolean {
  if (user.scopes.includes("admin")) {
    return true;
  }
  return scopes.some((scope) => user.scopes.includes(scope));
}

/**
 * Check if user has all of the specified scopes
 */
export function hasAllScopes(user: ApiTokenUser, scopes: string[]): boolean {
  if (user.scopes.includes("admin")) {
    return true;
  }
  return scopes.every((scope) => user.scopes.includes(scope));
}
