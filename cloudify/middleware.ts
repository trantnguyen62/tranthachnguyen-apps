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
  "/storage",
  "/functions",
  "/logs",
  "/activity",
  "/usage",
  "/feature-flags",
  "/edge-config",
  "/integrations",
  "/admin",
  "/welcome",
  "/templates",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

// CSP directives (shared between dev and prod)
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next.js App Router does not require unsafe-eval
  "style-src 'self' 'unsafe-inline'", // Required for styled-components/CSS-in-JS
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.stripe.com wss:",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
];

// Add upgrade-insecure-requests in production
if (process.env.NODE_ENV === "production") {
  cspDirectives.push("upgrade-insecure-requests");
}

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
  "Content-Security-Policy": cspDirectives.join("; "),
};

// HSTS header (only in production)
const hstsHeader = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, isProduction: boolean): NextResponse {
  // Hide server technology stack
  response.headers.delete("X-Powered-By");

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

  // Set Vary header for proper cache negotiation with compression
  // This ensures CDNs/proxies cache different versions for different encodings
  const existingVary = response.headers.get("Vary");
  const varyValues = new Set(
    existingVary ? existingVary.split(",").map((v) => v.trim()) : []
  );
  varyValues.add("Accept-Encoding");
  response.headers.set("Vary", Array.from(varyValues).join(", "));

  return response;
}

// Routes excluded from maintenance mode redirect
const maintenanceExcludedRoutes = ["/maintenance", "/api", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  // Check for any NextAuth session cookie
  const hasSessionCookie = NEXTAUTH_SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value
  );
  const isProduction = process.env.NODE_ENV === "production";

  // Maintenance mode: redirect all non-excluded routes to /maintenance
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  const isExcludedFromMaintenance = maintenanceExcludedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isMaintenanceMode && !isExcludedFromMaintenance) {
    const response = NextResponse.redirect(new URL("/maintenance", request.url));
    trackDatadogRequest(request, response, startTime);
    return applySecurityHeaders(response, isProduction);
  }

  // If maintenance mode is off but user is on /maintenance, redirect to home
  if (!isMaintenanceMode && pathname === "/maintenance") {
    const response = NextResponse.redirect(new URL("/", request.url));
    trackDatadogRequest(request, response, startTime);
    return applySecurityHeaders(response, isProduction);
  }

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
    trackDatadogRequest(request, response, startTime);
    return applySecurityHeaders(response, isProduction);
  }

  // If trying to access auth routes with session, redirect to dashboard
  if (isAuthRoute && hasSessionCookie) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    trackDatadogRequest(request, response, startTime);
    return applySecurityHeaders(response, isProduction);
  }

  // Apply security headers to all responses
  const response = NextResponse.next();
  trackDatadogRequest(request, response, startTime);
  return applySecurityHeaders(response, isProduction);
}

/**
 * Send request duration metrics to Datadog (fire-and-forget)
 */
function trackDatadogRequest(request: NextRequest, response: NextResponse, startTime: number) {
  const ddApiKey = process.env.DD_API_KEY;
  if (!ddApiKey) return;

  const duration = Date.now() - startTime;
  const { pathname } = request.nextUrl;
  const method = request.method;
  const statusCode = response.status;
  const timestamp = Math.floor(Date.now() / 1000);
  const ddSite = process.env.DD_SITE || "datadoghq.com";

  const payload = {
    series: [
      {
        metric: "cloudify.middleware.request.duration",
        type: 1, // gauge
        points: [{ timestamp, value: duration }],
        tags: [
          `path:${pathname}`,
          `method:${method}`,
          `status_code:${statusCode}`,
          `env:${process.env.NODE_ENV || "development"}`,
          `service:cloudify`,
        ],
        unit: "millisecond",
      },
      {
        metric: "cloudify.middleware.request.count",
        type: 2, // count
        points: [{ timestamp, value: 1 }],
        tags: [
          `path:${pathname}`,
          `method:${method}`,
          `status_code:${statusCode}`,
          `env:${process.env.NODE_ENV || "development"}`,
          `service:cloudify`,
        ],
      },
    ],
  };

  // Fire-and-forget: do not await to avoid blocking the response
  fetch(`https://api.${ddSite}/api/v2/series`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": ddApiKey,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignore Datadog submission errors in middleware
  });
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
