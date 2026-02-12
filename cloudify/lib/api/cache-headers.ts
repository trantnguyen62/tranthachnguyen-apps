/**
 * Cache Headers Helper - Adds proper Cache-Control headers to API responses
 *
 * Usage:
 *   return withCache(NextResponse.json(data), { maxAge: 30, staleWhileRevalidate: 60 });
 *   return noCache(NextResponse.json(data, { status: 201 }));
 */

import { NextResponse } from "next/server";

interface CacheOptions {
  /** Max age in seconds for fresh cache */
  maxAge?: number;
  /** Time in seconds to serve stale content while revalidating */
  staleWhileRevalidate?: number;
  /** Whether the response is private (user-specific) — defaults to true for API routes */
  isPrivate?: boolean;
  /** Additional Vary headers (e.g., "Accept", "Accept-Encoding") */
  vary?: string[];
}

/**
 * Add Cache-Control headers for cacheable GET responses.
 * Defaults to private caching since most API responses are user-specific.
 */
export function withCache(
  response: NextResponse,
  options: CacheOptions = {}
): NextResponse {
  const {
    maxAge = 30,
    staleWhileRevalidate = 60,
    isPrivate = true,
    vary = [],
  } = options;

  const scope = isPrivate ? "private" : "public";
  const parts = [
    scope,
    `max-age=${maxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
  ];

  response.headers.set("Cache-Control", parts.join(", "));

  // Set Vary header so caches differentiate by auth and encoding
  const varyValues = ["Authorization", "Cookie", ...vary];
  response.headers.set("Vary", varyValues.join(", "));

  return response;
}

/**
 * Add no-cache headers for mutation responses (POST, PUT, DELETE)
 * or any response that should never be cached.
 */
export function noCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}
