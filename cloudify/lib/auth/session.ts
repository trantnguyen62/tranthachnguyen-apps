/**
 * Custom Session Management (JWT-only, no database Session model)
 *
 * Used by the /api/auth endpoint for email/password login and signup.
 * NextAuth handles OAuth-based sessions separately.
 *
 * The Session database model has been removed. Sessions are now
 * stored entirely as signed JWTs in an httpOnly cookie.
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt, { SignOptions } from "jsonwebtoken";

const SESSION_COOKIE_NAME = "cloudify_session";
const SESSION_DURATION_DAYS = 7;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return "development-secret-change-in-production";
}

interface JWTPayload {
  userId: string;
  [key: string]: unknown;
}

function signToken(payload: JWTPayload, expiresIn: string = "7d"): string {
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, getJwtSecret(), options);
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

/**
 * Create a session by setting a signed JWT cookie.
 */
export async function createSession(userId: string, _userAgent?: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const jwtToken = signToken({ userId });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return jwtToken;
}

/**
 * Get the current session user from the cookie.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, image: true },
  });

  if (!user) {
    await clearSession();
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}

/**
 * Clear the session cookie.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
