/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF prevention
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "__csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Verify CSRF token using timing-safe comparison
 */
function verifyToken(cookieToken: string, headerToken: string): boolean {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    return false;
  }
}

/**
 * Get CSRF token from request
 */
export function getCsrfTokenFromRequest(request: NextRequest): {
  cookieToken: string | undefined;
  headerToken: string | undefined;
} {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME) || undefined;

  return { cookieToken, headerToken };
}

/**
 * Check if request method requires CSRF protection
 */
function requiresCsrfProtection(method: string): boolean {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Check if request is an API request that should skip CSRF
 * (e.g., webhook endpoints that use their own authentication)
 */
function shouldSkipCsrf(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;

  // Skip CSRF for webhook endpoints (they have their own authentication)
  if (pathname.startsWith("/api/webhooks/")) return true;

  // Skip CSRF for authentication endpoints that use credentials
  if (pathname.startsWith("/api/auth/")) return true;

  // Skip if request has Bearer token (API authentication)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return true;

  // Skip for internal service calls
  if (request.headers.get("x-internal-request") === "true") return true;

  return false;
}

/**
 * CSRF protection middleware
 * Returns null if validation passes, NextResponse if it fails
 */
export function csrfProtection(
  request: NextRequest
): NextResponse | null {
  // Skip for safe methods
  if (!requiresCsrfProtection(request.method)) {
    return null;
  }

  // Skip for excluded paths
  if (shouldSkipCsrf(request)) {
    return null;
  }

  // Get tokens
  const { cookieToken, headerToken } = getCsrfTokenFromRequest(request);

  // Verify token
  if (!cookieToken || !headerToken || !verifyToken(cookieToken, headerToken)) {
    return NextResponse.json(
      {
        error: "CSRF validation failed",
        message: "Invalid or missing CSRF token",
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Create a response with CSRF cookie set
 */
export function setCsrfCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

/**
 * Endpoint to get a new CSRF token
 * Call this from your frontend to get a token for forms
 */
export async function getCsrfTokenEndpoint(request: NextRequest): Promise<NextResponse> {
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const token = existingToken || generateCsrfToken();

  const response = NextResponse.json({ csrfToken: token });
  return setCsrfCookie(response, token);
}

/**
 * React hook helper - returns CSRF configuration for fetch
 */
export const csrfFetchConfig = {
  getCsrfToken: (): string | undefined => {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
    return match?.[1];
  },
  headers: (): Record<string, string> => {
    const token = csrfFetchConfig.getCsrfToken();
    return token ? { [CSRF_HEADER_NAME]: token } : {};
  },
};
