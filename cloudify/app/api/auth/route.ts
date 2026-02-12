import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, getSession, clearSession } from "@/lib/auth/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getRouteLogger } from "@/lib/api/logger";

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
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { action, email, password, name } = body;

    // Validate action is a string
    if (typeof action !== "string") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (action === "signup") {
      // Rate limit signup attempts by IP
      const clientIP = getClientIP(request);
      const signupLimit = checkRateLimit(`signup:${clientIP}`, RATE_LIMITS.signup);
      if (!signupLimit.success) {
        return NextResponse.json(
          { error: "Too many signup attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(signupLimit.retryAfter) } }
        );
      }

      // Validate all fields are strings
      if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
        return NextResponse.json(
          { error: "Email, password, and name must be strings" },
          { status: 400 }
        );
      }

      if (!email.trim() || !password || !name.trim()) {
        return NextResponse.json(
          { error: "Email, password, and name are required" },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Validate email length (RFC 5321: max 64 local + 255 domain, practical limit 254 total)
      if (email.length > 254) {
        return NextResponse.json(
          { error: "Email address is too long" },
          { status: 400 }
        );
      }

      // Validate local part length (before @)
      const localPart = email.split("@")[0];
      if (localPart.length > 64) {
        return NextResponse.json(
          { error: "Email local part is too long (max 64 characters before @)" },
          { status: 400 }
        );
      }

      // Validate password strength
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      // Sanitize name (strip HTML tags) and validate length
      const sanitizedName = name.trim().replace(/<[^>]*>/g, "");
      if (sanitizedName.length === 0) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      if (sanitizedName.length > 100) {
        return NextResponse.json(
          { error: "Name must be 100 characters or less" },
          { status: 400 }
        );
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

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
    }

    if (action === "login") {
      // Rate limit login attempts by IP
      const clientIP = getClientIP(request);
      const loginLimit = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.login);
      if (!loginLimit.success) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(loginLimit.retryAfter) } }
        );
      }

      // Validate fields are strings
      if (typeof email !== "string" || typeof password !== "string") {
        return NextResponse.json(
          { error: "Email and password must be strings" },
          { status: 400 }
        );
      }

      if (!email.trim() || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Create session
      const userAgent = request.headers.get("user-agent") || undefined;
      await createSession(user.id, userAgent);

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
    }

    if (action === "logout") {
      await clearSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    log.error("Auth error", { error: error instanceof Error ? error.message : String(error) });

    // Handle Prisma specific errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message?: string };

      // Unique constraint violation (duplicate email)
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      // Database connection error
      if (prismaError.code === "P1001" || prismaError.code === "P1002") {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        avatar: session.avatar,
      },
    });
  } catch (error) {
    log.error("Session check error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Logout error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
