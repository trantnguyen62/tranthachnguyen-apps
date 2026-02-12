import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("admin/users");

// Admin emails from environment variable (comma-separated list)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/**
 * Check if a user email is an admin
 */
function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    // For session auth, verify user is in ADMIN_EMAILS list
    if (user.authMethod === "session" && !isAdminEmail(user.email)) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add isAdmin flag to response
    const usersWithAdminFlag = users.map((u) => ({
      ...u,
      isAdmin: isAdminEmail(u.email),
    }));

    return ok({ users: usersWithAdminFlag });
  } catch (error) {
    log.error("Failed to fetch users", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch users", 500);
  }
}
