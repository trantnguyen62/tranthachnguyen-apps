/**
 * Standardized API Error Response System
 *
 * Provides consistent error responses across all API routes with:
 * - Human-readable error messages
 * - Machine-readable error codes
 * - Optional details for debugging
 * - Request IDs for support reference
 * - Safe error logging (real errors logged server-side, safe messages returned to client)
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Standard API error response shape
 */
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Validation error details for field-level errors
 */
export interface ValidationFieldError {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function generateRequestId(): string {
  return randomUUID().slice(0, 8);
}

function createErrorResponse(
  status: number,
  error: string,
  code: string,
  details?: unknown,
  includeRequestId = false
): NextResponse<ApiError> {
  const body: ApiError = {
    error,
    code,
    ...(details !== undefined ? { details } : {}),
    ...(includeRequestId ? { requestId: generateRequestId() } : {}),
  };
  return NextResponse.json(body, { status });
}

// ---------------------------------------------------------------------------
// Error response helpers
// ---------------------------------------------------------------------------

/**
 * 400 Bad Request - Client sent invalid data
 */
export function badRequest(message: string, details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(400, message, "BAD_REQUEST", details);
}

/**
 * 401 Unauthorized - Authentication required or invalid
 */
export function unauthorized(message = "Authentication required"): NextResponse<ApiError> {
  return createErrorResponse(401, message, "UNAUTHORIZED");
}

/**
 * 402 Payment Required - Plan limit reached
 */
export function paymentRequired(message: string, details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(402, message, "PAYMENT_REQUIRED", details);
}

/**
 * 403 Forbidden - Authenticated but not allowed
 */
export function forbidden(message = "You do not have permission to perform this action"): NextResponse<ApiError> {
  return createErrorResponse(403, message, "FORBIDDEN");
}

/**
 * 404 Not Found - Resource does not exist
 */
export function notFound(message: string): NextResponse<ApiError> {
  return createErrorResponse(404, message, "NOT_FOUND");
}

/**
 * 409 Conflict - Resource already exists
 */
export function conflict(message: string, details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(409, message, "CONFLICT", details);
}

/**
 * 422 Unprocessable Entity - Validation failed with field-level errors
 */
export function validationError(fields: ValidationFieldError[]): NextResponse<ApiError> {
  return createErrorResponse(
    422,
    "Validation failed",
    "VALIDATION_ERROR",
    { fields }
  );
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export function rateLimited(message = "Too many requests. Please try again later."): NextResponse<ApiError> {
  return createErrorResponse(429, message, "RATE_LIMITED");
}

/**
 * 500 Internal Server Error - Something broke on our end
 *
 * Logs the real error server-side but returns a safe message to the client.
 * Always includes a requestId so support can trace the issue.
 */
export function serverError(
  message: string,
  error?: unknown
): NextResponse<ApiError> {
  // Log the real error server-side
  if (error) {
    console.error(`[API Error] ${message}:`, error);
  }

  return createErrorResponse(
    500,
    message,
    "INTERNAL_ERROR",
    undefined,
    true // always include requestId for 500s
  );
}

/**
 * 503 Service Unavailable - Downstream service is down
 */
export function serviceUnavailable(
  message = "Service temporarily unavailable. Please try again in a moment."
): NextResponse<ApiError> {
  return createErrorResponse(503, message, "SERVICE_UNAVAILABLE");
}

// ---------------------------------------------------------------------------
// Prisma error helper
// ---------------------------------------------------------------------------

/**
 * Handle common Prisma errors and return the appropriate API error response.
 * Returns null if the error is not a recognized Prisma error.
 */
export function handlePrismaError(error: unknown, context: string): NextResponse<ApiError> | null {
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    switch (prismaError.code) {
      case "P2002": // Unique constraint violation
        return conflict(
          `A ${context} with these details already exists`
        );
      case "P2025": // Record not found
        return notFound(`${context} not found`);
      case "P1001": // Connection refused
      case "P1002": // Connection timed out
        return serviceUnavailable();
      default:
        return null;
    }
  }
  return null;
}
