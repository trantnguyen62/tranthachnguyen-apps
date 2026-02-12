/**
 * Unified API Authentication & Authorization
 *
 * Supports session-based (web UI) authentication.
 * Includes team RBAC for project-level access control.
 *
 * RBAC role hierarchy: viewer < member < developer < admin < owner
 * - requireReadAccess: any authenticated user (viewer+)
 * - requireWriteAccess: member+ role for project-scoped operations
 * - requireDeployAccess: developer+ role for deploy operations
 * - requireAdminAccess: checks ADMIN_EMAILS env var (system-level admin)
 * - requireProjectAccess: project-scoped check with minimum role
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "./next-auth";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  authMethod: "session";
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
 * Get authenticated user from NextAuth session.
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null> {
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
  } catch {
    // Session auth may fail in some contexts, that's OK
  }

  return null;
}

/**
 * Middleware-style authentication checker
 * Returns either the authenticated user or an error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return fail("AUTH_REQUIRED", "Authentication required", 401);
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
 * Require read access — authenticates the user (viewer role minimum).
 * For non-project-scoped reads, this just verifies authentication.
 * For project-scoped reads, use requireProjectAccess instead.
 */
export async function requireReadAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request);
}

/**
 * Require write access — authenticates the user.
 * For project-scoped writes, the caller should also use requireProjectAccess
 * or checkProjectAccess with meetsMinimumRole("member") to verify role.
 */
export async function requireWriteAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request);
}

/**
 * Require deploy access — authenticates the user.
 * For project-scoped deploys, the caller should also use requireProjectAccess
 * or checkProjectAccess with meetsMinimumRole("developer") to verify role.
 */
export async function requireDeployAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  return requireAuth(request);
}

/**
 * Project-scoped authorization check.
 *
 * Verifies:
 * 1. User is authenticated
 * 2. User has access to the project (owner or team member)
 * 3. User's role meets the minimum required role
 *
 * Project owners implicitly have all permissions.
 *
 * @example
 *   const result = await requireProjectAccess(request, projectId, "developer");
 *   if (isAuthError(result)) return result;
 *   const { user, access } = result;
 */
export async function requireProjectAccess(
  request: NextRequest,
  projectId: string,
  minimumRole: TeamRole
): Promise<{ user: AuthUser; access: ProjectAccess } | NextResponse> {
  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { user } = authResult;
  const access = await checkProjectAccess(user.id, projectId);

  if (!access.hasAccess) {
    return fail("AUTH_FORBIDDEN", "You do not have access to this project", 403);
  }

  // Project owners have all permissions
  if (access.isOwner) {
    return { user, access };
  }

  // Check team role meets minimum
  const role = access.teamRole || "viewer";
  if (!meetsMinimumRole(role, minimumRole)) {
    return fail(
      "AUTH_FORBIDDEN",
      `This action requires ${minimumRole} role or higher. Your role: ${role}`,
      403
    );
  }

  return { user, access };
}

/**
 * Require admin access — checks ADMIN_EMAILS environment variable
 */
export async function requireAdminAccess(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  const result = await requireAuth(request);
  if (isAuthError(result)) return result;

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0 && !adminEmails.includes(result.user.email.toLowerCase())) {
    return fail("AUTH_FORBIDDEN", "Admin access required", 403);
  }

  return result;
}
