/**
 * Edge Middleware Handler
 * Intercepts requests and runs edge functions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeEdgeFunction, matchEdgeFunction } from "./runtime";
import { getGeoData } from "./geo";

export interface MiddlewareConfig {
  projectId: string;
  baseDomain: string;
}

export interface MiddlewareResult {
  response?: NextResponse;
  proceed: boolean;
  rewriteUrl?: string;
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
 * Create middleware handler for a project
 */
export function createProjectMiddleware(config: MiddlewareConfig) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Run edge middleware
    const edgeResult = await runEdgeMiddleware(request, config);

    // Handle edge function response
    if (edgeResult.response) {
      return edgeResult.response;
    }

    // Handle rewrite
    if (edgeResult.rewriteUrl) {
      return NextResponse.rewrite(new URL(edgeResult.rewriteUrl, request.url));
    }

    // Proceed with original request
    return NextResponse.next();
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
