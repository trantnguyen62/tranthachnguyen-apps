import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("auth/reset-password");

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return fail("VALIDATION_MISSING_FIELD", "Reset token is required", 400);
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return fail("VALIDATION_ERROR", "Password must be at least 8 characters", 400);
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return fail("VALIDATION_ERROR", "Invalid or expired reset link. Please request a new one.", 400);
    }

    // Check expiration
    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return fail("BAD_REQUEST", "This reset link has expired. Please request a new one.", 400);
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return fail("BAD_REQUEST", "Account not found", 400);
    }

    // Hash new password and update user in a transaction
    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      // Delete all reset tokens for this email
      prisma.passwordResetToken.deleteMany({
        where: { email: resetToken.email },
      }),
    ]);

    return ok({
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    log.error("Reset password error", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to reset password", 500);
  }
}
