/**
 * Retry Logic for Failed API Calls
 *
 * Provides `fetchWithRetry` which:
 * - Retries on network errors and 5xx responses
 * - Does NOT retry on 4xx (client errors)
 * - Supports exponential, linear, and fixed backoff strategies
 * - Emits callbacks for retry visibility (e.g. showing a retry indicator)
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Backoff strategy (default: "exponential") */
  backoff?: "exponential" | "linear" | "fixed";
  /** Base delay in ms between retries (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number;
  /** Called before each retry with the attempt number and delay */
  onRetry?: (attempt: number, delay: number, error: Error) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Errors that indicate a network-level failure (worth retrying)
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // "Failed to fetch" / "Load failed" indicate network issues
    const msg = error.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("load failed") ||
      msg.includes("network") ||
      msg.includes("aborted")
    );
  }
  return false;
}

/**
 * Determine whether a response status is retryable (5xx or 429)
 */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * Calculate delay for the given attempt
 */
function getDelay(
  attempt: number,
  backoff: "exponential" | "linear" | "fixed",
  baseDelay: number,
  maxDelay: number
): number {
  let delay: number;

  switch (backoff) {
    case "exponential":
      delay = baseDelay * Math.pow(2, attempt - 1);
      break;
    case "linear":
      delay = baseDelay * attempt;
      break;
    case "fixed":
    default:
      delay = baseDelay;
      break;
  }

  // Add jitter (up to 25%) to avoid thundering herd
  const jitter = delay * 0.25 * Math.random();
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Sleep for the given number of milliseconds, respecting an abort signal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

/**
 * Fetch with automatic retry on network errors and 5xx responses.
 *
 * Usage:
 * ```ts
 * const response = await fetchWithRetry("/api/deploy", {
 *   method: "POST",
 *   body: JSON.stringify({ projectId: "..." }),
 * }, {
 *   maxRetries: 3,
 *   backoff: "exponential",
 *   onRetry: (attempt, delay) => {
 *     showToast(`Retrying... (attempt ${attempt})`);
 *   },
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const {
    maxRetries = 3,
    backoff = "exponential",
    baseDelay = 1000,
    maxDelay = 30000,
    onRetry,
    signal,
  } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: signal || init?.signal,
      });

      // Don't retry on client errors (4xx) -- those are permanent
      if (!response.ok && isRetryableStatus(response.status) && attempt < maxRetries) {
        const retryError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
        lastError = retryError;

        const delay = getDelay(attempt + 1, backoff, baseDelay, maxDelay);
        onRetry?.(attempt + 1, delay, retryError);
        await sleep(delay, signal);
        continue;
      }

      // Return the response (even if it's a 4xx -- those shouldn't be retried)
      return response;
    } catch (error) {
      // Don't retry abort errors
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on network errors
      if (isNetworkError(error) && attempt < maxRetries) {
        const delay = getDelay(attempt + 1, backoff, baseDelay, maxDelay);
        onRetry?.(attempt + 1, delay, lastError);
        await sleep(delay, signal);
        continue;
      }

      // Non-retryable error or out of retries
      throw lastError;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error("Request failed after retries");
}
