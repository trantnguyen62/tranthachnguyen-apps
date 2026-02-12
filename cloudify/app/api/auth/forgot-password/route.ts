import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRawEmail } from "@/lib/notifications/email";
import { createPasswordResetEmail } from "@/lib/notifications/auth-emails";
import crypto from "crypto";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("auth/forgot-password");

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: "If an account exists with this email, a password reset link has been sent.",
    });

    // Look up the user (don't reveal if they exist)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return successResponse;
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the token
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    // Send the email (non-blocking — don't fail the request if email fails)
    const emailPayload = createPasswordResetEmail({
      recipientEmail: normalizedEmail,
      recipientName: user.name,
      token,
    });

    sendRawEmail(emailPayload).catch((err) =>
      log.error("Failed to send password reset email", { error: err instanceof Error ? err.message : String(err) })
    );

    return successResponse;
  } catch (error) {
    log.error("Forgot password error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
