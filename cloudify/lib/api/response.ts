/**
 * Standardized API Response Envelope
 *
 * Every API response — success or failure — shares the same envelope shape.
 * Consumers can always expect { ok, data?, error?, meta? }.
 *
 * Inspired by Apple CloudKit's predictable response contract.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta?: ResponseMeta;
}

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
  requestId: string;
}

export interface ResponseMeta {
  pagination?: CursorPagination;
  rateLimit?: RateLimitInfo;
  timing?: { durationMs: number };
}

export interface CursorPagination {
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Error Code Taxonomy
// ---------------------------------------------------------------------------

export type ErrorCode =
  // Auth
  | "AUTH_REQUIRED"
  | "AUTH_FORBIDDEN"
  | "AUTH_INVALID_TOKEN"
  // Validation
  | "VALIDATION_ERROR"
  | "VALIDATION_MISSING_FIELD"
  // Resource
  | "NOT_FOUND"
  | "CONFLICT"
  // Rate limiting
  | "RATE_LIMITED"
  // Payment
  | "PAYMENT_REQUIRED"
  // Server
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  // Generic
  | "BAD_REQUEST";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

// ---------------------------------------------------------------------------
// Cursor Pagination Utilities
// ---------------------------------------------------------------------------

export function encodeCursor(record: { id: string; createdAt: Date }): string {
  return Buffer.from(
    JSON.stringify({ id: record.id, createdAt: record.createdAt })
  ).toString("base64url");
}

export function decodeCursor(cursor: string): { id: string; createdAt: string } {
  const decoded = Buffer.from(cursor, "base64url").toString();
  return JSON.parse(decoded);
}

/**
 * Build a Prisma `where` clause for cursor-based pagination.
 * Orders by createdAt DESC, id DESC (newest first).
 */
export function buildCursorWhere(cursor?: string | null) {
  if (!cursor) return {};
  const { id, createdAt } = decodeCursor(cursor);
  return {
    OR: [
      { createdAt: { lt: new Date(createdAt) } },
      { createdAt: new Date(createdAt), id: { lt: id } },
    ],
  };
}

/**
 * Parse standard pagination query params from a request URL.
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const cursor = searchParams.get("cursor") || undefined;
  const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  return { cursor, limit };
}

// ---------------------------------------------------------------------------
// Success Responses
// ---------------------------------------------------------------------------

/**
 * Return a successful response with the standard envelope.
 *
 * @example
 *   return ok(project);
 *   return ok(project, { status: 201 });
 *   return ok(projects, { pagination: { cursor, hasMore, total } });
 */
export function ok<T>(
  data: T,
  options?: {
    status?: number;
    pagination?: CursorPagination;
    rateLimit?: RateLimitInfo;
    headers?: Record<string, string>;
  }
): NextResponse<ApiResponse<T>> {
  const status = options?.status ?? 200;
  const meta: ResponseMeta = {};

  if (options?.pagination) {
    meta.pagination = options.pagination;
  }

  if (options?.rateLimit) {
    meta.rateLimit = options.rateLimit;
  }

  const body: ApiResponse<T> = {
    ok: true,
    data,
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
  };

  const responseHeaders: Record<string, string> = {};

  // Rate limit headers
  if (options?.rateLimit) {
    responseHeaders["X-RateLimit-Limit"] = String(options.rateLimit.limit);
    responseHeaders["X-RateLimit-Remaining"] = String(options.rateLimit.remaining);
    responseHeaders["X-RateLimit-Reset"] = options.rateLimit.resetAt;
  }

  // Request ID header
  const requestId = generateRequestId();
  responseHeaders["X-Request-Id"] = requestId;

  // API version header
  responseHeaders["API-Version"] = "2026-02-12";

  // Merge custom headers
  if (options?.headers) {
    Object.assign(responseHeaders, options.headers);
  }

  return NextResponse.json(body, { status, headers: responseHeaders });
}

// ---------------------------------------------------------------------------
// Error Responses
// ---------------------------------------------------------------------------

/**
 * Return an error response with the standard envelope.
 *
 * @example
 *   return fail("NOT_FOUND", "Project not found", 404);
 *   return fail("VALIDATION_ERROR", "Validation failed", 422, { fields: [...] });
 */
export function fail(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown,
  extraHeaders?: Record<string, string>
): NextResponse<ApiResponse<never>> {
  const requestId = generateRequestId();

  const body: ApiResponse<never> = {
    ok: false,
    error: {
      code,
      message,
      requestId,
      ...(details !== undefined ? { details } : {}),
    },
  };

  const headers: Record<string, string> = {
    "X-Request-Id": requestId,
    "API-Version": "2026-02-12",
    ...extraHeaders,
  };

  // Log server errors
  if (status >= 500) {
    console.error(`[API Error] ${code}: ${message}`, details);
  }

  return NextResponse.json(body, { status, headers });
}
