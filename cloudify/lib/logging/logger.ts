/**
 * Structured Logging with Correlation IDs
 *
 * Provides consistent logging format across the application with:
 * - Correlation IDs for request tracing
 * - Structured JSON output for production
 * - Colored console output for development
 * - Log levels (debug, info, warn, error)
 * - Automatic context enrichment
 */

import { AsyncLocalStorage } from "async_hooks";

// Correlation ID storage (per-request context)
const correlationStorage = new AsyncLocalStorage<string>();

// Log levels
export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configuration
const LOG_LEVEL = (process.env.LOG_LEVEL || "info") as LogLevel;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SERVICE_NAME = process.env.SERVICE_NAME || "cloudify";

// Colors for development console output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
};

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Generate a correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current correlation ID from context
 */
export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore();
}

/**
 * Run a function with a correlation ID in context
 */
export function withCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationStorage.run(correlationId, fn);
}

/**
 * Run an async function with a correlation ID in context
 */
export async function withCorrelationIdAsync<T>(
  correlationId: string,
  fn: () => Promise<T>
): Promise<T> {
  return correlationStorage.run(correlationId, fn);
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (IS_PRODUCTION) {
    // JSON output for production (easy to parse by log aggregators)
    return JSON.stringify(entry);
  }

  // Pretty console output for development
  const levelColors: Record<LogLevel, string> = {
    debug: COLORS.gray,
    info: COLORS.blue,
    warn: COLORS.yellow,
    error: COLORS.red,
  };

  const color = levelColors[entry.level];
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const correlationPart = entry.correlationId
    ? `${COLORS.cyan}[${entry.correlationId.substring(0, 8)}]${COLORS.reset} `
    : "";

  let output = `${COLORS.gray}${timestamp}${COLORS.reset} ${color}${entry.level.toUpperCase().padEnd(5)}${COLORS.reset} ${correlationPart}${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${COLORS.gray}${JSON.stringify(entry.context)}${COLORS.reset}`;
  }

  if (entry.error) {
    output += `\n${COLORS.red}${entry.error.stack || entry.error.message}${COLORS.reset}`;
  }

  return output;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    correlationId: getCorrelationId(),
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

/**
 * Logger class for creating namespaced loggers
 */
export class Logger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!shouldLog(level)) return;

    const fullMessage = this.namespace ? `[${this.namespace}] ${message}` : message;
    const entry = createLogEntry(level, fullMessage, context, error);
    const output = formatLogEntry(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    const err = error instanceof Error ? error : undefined;
    const ctx = error instanceof Error ? context : (error as Record<string, unknown>);
    this.log("error", message, ctx, err);
  }

  /**
   * Create a child logger with additional namespace
   */
  child(childNamespace: string): Logger {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }

  /**
   * Time an async operation
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`${label} completed`, { durationMs: Math.round(duration) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, error, { durationMs: Math.round(duration) });
      throw error;
    }
  }
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

/**
 * Default logger instance
 */
export const logger = new Logger("");

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
  api: createLogger("api"),
  auth: createLogger("auth"),
  build: createLogger("build"),
  deploy: createLogger("deploy"),
  storage: createLogger("storage"),
  billing: createLogger("billing"),
  functions: createLogger("functions"),
  acme: createLogger("acme"),
  db: createLogger("db"),
};
