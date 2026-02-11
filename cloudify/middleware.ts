import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NextAuth v5 uses these cookie names
const NEXTAUTH_SESSION_COOKIES = [
  "__Secure-authjs.session-token",  // Production (HTTPS)
  "authjs.session-token",           // Development (HTTP)
  "__Host-authjs.csrf-token",       // CSRF token (indicates auth activity)
];

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/projects",
  "/deployments",
  "/domains",
  "/analytics",
  "/settings",
  "/team",
  "/tokens",
  "/storage",
  "/functions",
  "/logs",
  "/activity",
  "/usage",
  "/feature-flags",
  "/edge-config",
  "/ai-insights",
  "/integrations",
  "/admin",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

// Security headers configuration
const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "SAMEORIGIN",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // XSS protection (legacy, but still useful)
  "X-XSS-Protection": "1; mode=block",
  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy (disable unnecessary features)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for styled-components/CSS-in-JS
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com https://*.stripe.com wss:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; "),
};

// HSTS header (only in production)
const hstsHeader = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, isProduction: boolean): NextResponse {
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply HSTS only in production
  if (isProduction) {
    Object.entries(hstsHeader).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Check for any NextAuth session cookie
  const hasSessionCookie = NEXTAUTH_SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value
  );
  const isProduction = process.env.NODE_ENV === "production";

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(response, isProduction);
  }

  // If trying to access auth routes with session, redirect to dashboard
  if (isAuthRoute && hasSessionCookie) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    return applySecurityHeaders(response, isProduction);
  }

  // Apply security headers to all responses
  const response = NextResponse.next();
  return applySecurityHeaders(response, isProduction);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
