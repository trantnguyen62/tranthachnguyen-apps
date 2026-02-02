/**
 * Edge Middleware Handler
 * Intercepts requests and runs edge functions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeEdgeFunction, matchEdgeFunction } from "./runtime";
import { getGeoData, getClientIP, getDeviceType, getBrowser } from "./geo";
import { assignVariants } from "./ab-testing";

export interface MiddlewareConfig {
  projectId: string;
  baseDomain: string;
}

export interface MiddlewareResult {
  response?: NextResponse;
  proceed: boolean;
  rewriteUrl?: string;
  abTests?: Array<{
    testId: string;
    variant: string;
  }>;
}

/**
 * Run edge middleware for a request
 */
export async function runEdgeMiddleware(
  request: NextRequest,
  config: MiddlewareConfig
): Promise<MiddlewareResult> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check for matching edge function
  const match = await matchEdgeFunction(config.projectId, path);

  if (!match) {
    return { proceed: true };
  }

  // Get geo data
  const geo = getGeoData(request.headers);
  const clientIP = getClientIP(request.headers);

  // Build execution context
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Get request body if present
  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  // Execute edge function
  const result = await executeEdgeFunction({
    functionId: match.functionId,
    projectId: config.projectId,
    request: {
      url: request.url,
      method: request.method,
      headers,
      body,
    },
    geo: {
      country: geo.country,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    envVars: match.function.envVars as Record<string, string> | undefined,
  });

  if (result.status === "error" || result.status === "timeout") {
    // Log error and proceed with original request
    console.error(`Edge function error: ${result.error}`);
    return { proceed: true };
  }

  if (!result.response) {
    return { proceed: true };
  }

  // Check for special headers
  const responseHeaders = result.response.headers;

  // Handle middleware next
  if (responseHeaders["x-middleware-next"]) {
    return { proceed: true };
  }

  // Handle rewrite
  if (responseHeaders["x-middleware-rewrite"]) {
    return {
      proceed: false,
      rewriteUrl: responseHeaders["x-middleware-rewrite"],
    };
  }

  // Return the response from edge function
  const response = new NextResponse(result.response.body, {
    status: result.response.status,
    statusText: result.response.statusText,
    headers: result.response.headers,
  });

  return {
    response,
    proceed: false,
  };
}

/**
 * Handle A/B test assignment middleware
 */
export async function handleABTestMiddleware(
  request: NextRequest,
  projectId: string
): Promise<{
  assignments: Array<{ testId: string; testSlug: string; variant: string }>;
  cookies: Array<{ name: string; value: string; options: any }>;
}> {
  // Get or create visitor ID
  let visitorId = request.cookies.get("cloudify_visitor_id")?.value;
  const cookies: Array<{ name: string; value: string; options: any }> = [];

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookies.push({
      name: "cloudify_visitor_id",
      value: visitorId,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60, // 1 year
      },
    });
  }

  // Get context
  const geo = getGeoData(request.headers);
  const userAgent = request.headers.get("user-agent");

  // Assign variants
  const assignments = await assignVariants(projectId, visitorId, {
    country: geo.country,
    device: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
    url: request.url,
  });

  // Set assignment cookies for client access
  for (const assignment of assignments) {
    cookies.push({
      name: `cloudify_ab_${assignment.testSlug}`,
      value: assignment.variant,
      options: {
        httpOnly: false, // Allow JS access
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    });
  }

  return { assignments, cookies };
}

/**
 * Create middleware handler for a project
 */
export function createProjectMiddleware(config: MiddlewareConfig) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Run A/B test middleware
    const abResult = await handleABTestMiddleware(request, config.projectId);

    // Run edge middleware
    const edgeResult = await runEdgeMiddleware(request, config);

    // Handle edge function response
    if (edgeResult.response) {
      // Add A/B test cookies
      for (const cookie of abResult.cookies) {
        edgeResult.response.cookies.set(
          cookie.name,
          cookie.value,
          cookie.options
        );
      }
      return edgeResult.response;
    }

    // Handle rewrite
    if (edgeResult.rewriteUrl) {
      const response = NextResponse.rewrite(new URL(edgeResult.rewriteUrl, request.url));
      for (const cookie of abResult.cookies) {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      }
      return response;
    }

    // Proceed with original request
    const response = NextResponse.next();

    // Add A/B test cookies
    for (const cookie of abResult.cookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    // Add A/B test assignments header for logging
    if (abResult.assignments.length > 0) {
      response.headers.set(
        "x-cloudify-ab-assignments",
        JSON.stringify(abResult.assignments)
      );
    }

    return response;
  };
}

/**
 * Middleware matcher patterns
 */
export function createMiddlewareMatcher(routes: string[]): string[] {
  // Convert route patterns to Next.js middleware matcher format
  return routes.map((route) => {
    // Handle glob patterns
    if (route.includes("*")) {
      return route.replace(/\*/g, ":path*");
    }
    return route;
  });
}

/**
 * Get all middleware routes for a project
 */
export async function getProjectMiddlewareRoutes(projectId: string): Promise<string[]> {
  const functions = await prisma.edgeFunction.findMany({
    where: {
      projectId,
      enabled: true,
    },
    select: {
      routes: true,
    },
  });

  const allRoutes: string[] = [];
  for (const fn of functions) {
    allRoutes.push(...fn.routes);
  }

  return [...new Set(allRoutes)];
}
