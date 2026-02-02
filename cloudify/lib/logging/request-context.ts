/**
 * Request Context Middleware
 *
 * Wraps API route handlers to:
 * - Generate and track correlation IDs
 * - Add correlation ID to response headers
 * - Provide structured error handling
 * - Log request/response lifecycle
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateCorrelationId,
  withCorrelationIdAsync,
  loggers,
} from "./logger";

const CORRELATION_HEADER = "X-Correlation-ID";

/**
 * API Handler type
 */
type ApiHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Error response structure
 */
interface ApiError {
  error: string;
  message: string;
  correlationId?: string;
  details?: unknown;
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  status: number,
  error: string,
  message: string,
  correlationId?: string,
  details?: unknown
): NextResponse {
  const body: ApiError = {
    error,
    message,
    correlationId,
  };

  if (details && process.env.NODE_ENV !== "production") {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}

/**
 * Wrap an API handler with request context
 *
 * @example
 * ```ts
 * import { withRequestContext } from "@/lib/logging/request-context";
 *
 * export const GET = withRequestContext(async (request) => {
 *   // Your handler code here
 *   return NextResponse.json({ data: "..." });
 * });
 * ```
 */
export function withRequestContext(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    // Get or generate correlation ID
    const correlationId =
      request.headers.get(CORRELATION_HEADER) || generateCorrelationId();

    const startTime = performance.now();
    const { method, url } = request;
    const pathname = new URL(url).pathname;

    return withCorrelationIdAsync(correlationId, async () => {
      loggers.api.debug(`${method} ${pathname}`, {
        method,
        pathname,
        userAgent: request.headers.get("user-agent")?.substring(0, 100),
      });

      try {
        // Execute the handler
        const response = await handler(request, context);

        // Add correlation ID to response
        response.headers.set(CORRELATION_HEADER, correlationId);

        // Log completion
        const duration = Math.round(performance.now() - startTime);
        loggers.api.info(`${method} ${pathname} ${response.status}`, {
          method,
          pathname,
          status: response.status,
          durationMs: duration,
        });

        return response;
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        // Handle known error types
        if (error instanceof ApiException) {
          loggers.api.warn(`${method} ${pathname} ${error.status}`, {
            method,
            pathname,
            status: error.status,
            error: error.message,
            durationMs: duration,
          });

          const response = createErrorResponse(
            error.status,
            error.code,
            error.message,
            correlationId,
            error.details
          );
          response.headers.set(CORRELATION_HEADER, correlationId);
          return response;
        }

        // Handle unexpected errors
        const err = error instanceof Error ? error : new Error(String(error));
        loggers.api.error(`${method} ${pathname} 500`, err, {
          method,
          pathname,
          durationMs: duration,
        });

        const response = createErrorResponse(
          500,
          "INTERNAL_ERROR",
          "An unexpected error occurred",
          correlationId,
          process.env.NODE_ENV !== "production" ? err.message : undefined
        );
        response.headers.set(CORRELATION_HEADER, correlationId);
        return response;
      }
    });
  };
}

/**
 * Custom API exception for controlled error responses
 */
export class ApiException extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiException";
  }

  static badRequest(message: string, details?: unknown): ApiException {
    return new ApiException(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Unauthorized"): ApiException {
    return new ApiException(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden"): ApiException {
    return new ApiException(403, "FORBIDDEN", message);
  }

  static notFound(message = "Not found"): ApiException {
    return new ApiException(404, "NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown): ApiException {
    return new ApiException(409, "CONFLICT", message, details);
  }

  static tooManyRequests(message = "Too many requests"): ApiException {
    return new ApiException(429, "TOO_MANY_REQUESTS", message);
  }

  static internal(message = "Internal server error"): ApiException {
    return new ApiException(500, "INTERNAL_ERROR", message);
  }
}

/**
 * Helper to assert a condition and throw appropriate error
 */
export function assertRequest(
  condition: unknown,
  message: string,
  details?: unknown
): asserts condition {
  if (!condition) {
    throw ApiException.badRequest(message, details);
  }
}

/**
 * Helper to assert authentication
 */
export function assertAuthenticated(
  session: unknown
): asserts session is NonNullable<typeof session> {
  if (!session) {
    throw ApiException.unauthorized();
  }
}

/**
 * Helper to assert authorization
 */
export function assertAuthorized(condition: unknown, message = "Forbidden"): asserts condition {
  if (!condition) {
    throw ApiException.forbidden(message);
  }
}
