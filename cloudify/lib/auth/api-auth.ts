/**
 * Unified API Authentication
 * Supports both session-based (web UI) and token-based (CLI) authentication
 * Includes team RBAC for project-level access control
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "./next-auth";
import { validateApiToken, ApiTokenUser, hasScope } from "./api-token";
import { getSessionFromRequest } from "./session";
import { prisma } from "@/lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  scopes?: string[];
  authMethod: "session" | "token";
}

/**
 * Team role hierarchy (higher index = more permissions)
 */
const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  member: 1,
  developer: 2,
  admin: 3,
  owner: 4,
};

export type TeamRole = keyof typeof ROLE_HIERARCHY;

export interface ProjectAccess {
  hasAccess: boolean;
  isOwner: boolean;
  teamRole?: string;
}

/**
 * Check if a user has access to a project — either as owner or via team membership.
 * Returns the access level details.
 */
export async function checkProjectAccess(
  userId: string,
  projectId: string
): Promise<ProjectAccess> {
  // 1. Check direct ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return { hasAccess: false, isOwner: false };
  }

  if (project.userId === userId) {
    return { hasAccess: true, isOwner: true };
  }

  // 2. Check team membership via TeamProject + TeamMember
  const teamAccess = await prisma.teamProject.findFirst({
    where: {
      projectId,
      team: {
        members: {
          some: { userId },
        },
      },
    },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
            take: 1,
          },
        },
      },
    },
  });

  if (teamAccess && teamAccess.team.members.length > 0) {
    return {
      hasAccess: true,
      isOwner: false,
      teamRole: teamAccess.team.members[0].role,
    };
  }

  return { hasAccess: false, isOwner: false };
}

/**
 * Check if a team role meets the minimum required role.
 */
export function meetsMinimumRole(
  userRole: string,
  minimumRole: string
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? Infinity;
  return userLevel >= requiredLevel;
}

/**
 * Get authenticated user from either session or API token
 * Tries: API token -> NextAuth session -> Custom session
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

  // Try NextAuth session (for web UI with OAuth/credentials)
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
  }

  // Fall back to custom session (for /api/auth endpoint)
  try {
    const customSession = await getSessionFromRequest(request);
    if (customSession) {
      return {
        id: customSession.id,
        email: customSession.email,
        name: customSession.name,
        authMethod: "session",
      };
    }
  } catch (error) {
    // Custom session may fail, that's OK
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
