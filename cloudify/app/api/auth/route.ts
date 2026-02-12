import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { checkRateLimit, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("auth");

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * POST /api/auth — Signup only.
 *
 * Creates a new user account. After signup, the client calls
 * NextAuth's signIn("credentials") to establish the session.
 * Login and logout are handled entirely by NextAuth.
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("BAD_REQUEST", "Invalid request body", 400);
    }
    const { action, email, password, name } = body;

    if (action !== "signup") {
      return fail("BAD_REQUEST", "Invalid action", 400);
    }

    // Rate limit signup attempts by IP
    const clientIP = getClientIP(request);
    const signupLimit = checkRateLimit(`signup:${clientIP}`, RATE_LIMITS.signup);
    if (!signupLimit.success) {
      return fail("RATE_LIMITED", "Too many signup attempts. Please try again later.", 429);
    }

    // Validate all fields are strings
    if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
      return fail("VALIDATION_ERROR", "Email, password, and name must be strings", 400);
    }

    if (!email.trim() || !password || !name.trim()) {
      return fail("VALIDATION_MISSING_FIELD", "Email, password, and name are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail("VALIDATION_ERROR", "Invalid email format", 400);
    }

    // Validate email length (RFC 5321: max 64 local + 255 domain, practical limit 254 total)
    if (email.length > 254) {
      return fail("VALIDATION_ERROR", "Email address is too long", 400);
    }

    // Validate local part length (before @)
    const localPart = email.split("@")[0];
    if (localPart.length > 64) {
      return fail("VALIDATION_ERROR", "Email local part is too long (max 64 characters before @)", 400);
    }

    // Validate password strength
    if (password.length < 8) {
      return fail("VALIDATION_ERROR", "Password must be at least 8 characters", 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return fail("CONFLICT", "An account with this email already exists", 409);
    }

    // Sanitize name (strip HTML tags) and validate length
    const sanitizedName = name.trim().replace(/<[^>]*>/g, "");
    if (sanitizedName.length === 0) {
      return fail("VALIDATION_ERROR", "Name cannot be empty", 400);
    }
    if (sanitizedName.length > 100) {
      return fail("VALIDATION_ERROR", "Name must be 100 characters or less", 400);
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: sanitizedName,
        passwordHash,
      },
    });

    return ok({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: unknown) {
    log.error("Auth error", { error: error instanceof Error ? error.message : String(error) });

    // Handle Prisma specific errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message?: string };

      // Unique constraint violation (duplicate email)
      if (prismaError.code === "P2002") {
        return fail("CONFLICT", "An account with this email already exists", 409);
      }

      // Database connection error
      if (prismaError.code === "P1001" || prismaError.code === "P1002") {
        return fail("SERVICE_UNAVAILABLE", "Service temporarily unavailable. Please try again later.", 503);
      }
    }

    return fail("INTERNAL_ERROR", "Authentication failed. Please try again.", 500);
  }
}
