import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth/api-auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ok, fail } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (isAuthError(result)) return result;
    const { user: authUser } = result;

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("VALIDATION_ERROR", "Invalid request body", 400);
    }
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return fail("VALIDATION_MISSING_FIELD", "Current password and new password are required", 400);
    }

    if (newPassword.length < 8) {
      return fail("VALIDATION_ERROR", "New password must be at least 8 characters", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return fail("BAD_REQUEST", "Password change is not available for OAuth accounts", 400);
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return fail("BAD_REQUEST", "Current password is incorrect", 400);
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: authUser.id },
      data: { passwordHash: newHash },
    });

    return ok({ message: "Password updated successfully" });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to update password", 500);
  }
}
