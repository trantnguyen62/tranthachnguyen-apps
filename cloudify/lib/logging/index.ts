/**
 * Logging Module
 *
 * Exports structured logging utilities:
 * - Logger class with namespaces
 * - Correlation ID tracking
 * - Request context middleware
 * - API exception handling
 */

export {
  Logger,
  createLogger,
  logger,
  loggers,
  generateCorrelationId,
  getCorrelationId,
  withCorrelationId,
  withCorrelationIdAsync,
  type LogLevel,
  type LogEntry,
} from "./logger";

export {
  withRequestContext,
  ApiException,
  assertRequest,
  assertAuthenticated,
  assertAuthorized,
} from "./request-context";
