/**
 * Result type for service layer returns.
 *
 * Replaces the inconsistent mix of boolean returns, thrown exceptions,
 * and ad-hoc { success, error } objects across the codebase.
 *
 * Usage:
 *   const result = await createDeployment(config);
 *   if (!result.ok) {
 *     return fail(result.error.code, result.error.message, 404);
 *   }
 *   return ok(result.data, { status: 201 });
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** Create a success result */
export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

/** Create a failure result */
export function failure(code: string, message: string, details?: Record<string, unknown>): Result<never> {
  return { ok: false, error: { code, message, details } };
}
