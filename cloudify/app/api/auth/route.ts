import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, getSession, clearSession } from "@/lib/auth/session";
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

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("BAD_REQUEST", "Invalid request body", 400);
    }
    const { action, email, password, name } = body;

    // Validate action is a string
    if (typeof action !== "string") {
      return fail("BAD_REQUEST", "Invalid action", 400);
    }

    if (action === "signup") {
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

      // Create session
      const userAgent = request.headers.get("user-agent") || undefined;
      await createSession(user.id, userAgent);

      return ok({
        user: { id: user.id, email: user.email, name: user.name },
      });
    }

    if (action === "login") {
      // Rate limit login attempts by IP
      const clientIP = getClientIP(request);
      const loginLimit = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.login);
      if (!loginLimit.success) {
        return fail("RATE_LIMITED", "Too many login attempts. Please try again later.", 429);
      }

      // Validate fields are strings
      if (typeof email !== "string" || typeof password !== "string") {
        return fail("VALIDATION_ERROR", "Email and password must be strings", 400);
      }

      if (!email.trim() || !password) {
        return fail("VALIDATION_MISSING_FIELD", "Email and password are required", 400);
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.passwordHash) {
        return fail("AUTH_REQUIRED", "Invalid email or password", 401);
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return fail("AUTH_REQUIRED", "Invalid email or password", 401);
      }

      // Create session
      const userAgent = request.headers.get("user-agent") || undefined;
      await createSession(user.id, userAgent);

      return ok({
        user: { id: user.id, email: user.email, name: user.name },
      });
    }

    if (action === "logout") {
      await clearSession();
      return ok({ success: true });
    }

    return fail("BAD_REQUEST", "Invalid action", 400);
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

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return fail("AUTH_REQUIRED", "Not authenticated", 401);
    }

    return ok({
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        image: session.image,
      },
    });
  } catch (error) {
    log.error("Session check error", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Session check failed", 500);
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return ok({ success: true });
  } catch (error) {
    log.error("Logout error", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Logout failed", 500);
  }
}
