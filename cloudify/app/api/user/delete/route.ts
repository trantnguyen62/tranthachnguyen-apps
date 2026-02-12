import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth/api-auth";
import { verifyPassword } from "@/lib/auth/password";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("user/delete");

/**
 * POST /api/user/delete - Delete user account
 * Requires password confirmation for security
 */
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (isAuthError(result)) return result;
    const { user: authUser } = result;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { password } = body;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        passwordHash: true,
        accounts: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For users with password (non-OAuth), require password confirmation
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: "Password confirmation required" },
          { status: 400 }
        );
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 403 }
        );
      }
    }

    // Delete all user data in a transaction
    // Prisma cascades handle most relations, but we clean up explicitly for safety
    await prisma.$transaction([
      // Delete user's notification preferences
      prisma.notificationPreference.deleteMany({ where: { userId: user.id } }),
      // Delete user's sessions
      prisma.session.deleteMany({ where: { userId: user.id } }),
      // Delete user's OAuth accounts
      prisma.account.deleteMany({ where: { userId: user.id } }),
      // Delete the user (cascades to projects, teams, etc.)
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Failed to delete account", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
