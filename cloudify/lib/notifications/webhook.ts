/**
 * Custom Webhook Notification Provider
 * Sends notifications to custom HTTP endpoints with HMAC signing
 */

import crypto from "crypto";
import {
  CustomWebhookPayload,
  NotificationPayload,
  NotificationResult,
  WebhookDeliveryOptions,
} from "./types";

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Format notification as webhook payload
 */
export function formatWebhookPayload(notification: NotificationPayload): CustomWebhookPayload {
  return {
    event: notification.type,
    timestamp: new Date().toISOString(),
    data: {
      userId: notification.userId,
      projectId: notification.projectId,
      projectName: notification.projectName,
      deploymentId: notification.deploymentId,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    },
  };
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a webhook with retries
 */
async function sendWithRetry(
  url: string,
  payload: CustomWebhookPayload,
  options: WebhookDeliveryOptions
): Promise<{ statusCode: number; body?: string }> {
  const bodyString = JSON.stringify(payload);
  const retries = options.retries ?? DEFAULT_RETRIES;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Cloudify-Webhook/1.0",
    "X-Cloudify-Event": payload.event,
    "X-Cloudify-Timestamp": payload.timestamp,
    ...options.headers,
  };

  // Add HMAC signature if secret is provided
  if (options.secret) {
    const signature = generateSignature(bodyString, options.secret);
    headers["X-Cloudify-Signature"] = `sha256=${signature}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = await response.text();

      // Consider 2xx status codes as success
      if (response.status >= 200 && response.status < 300) {
        return { statusCode: response.status, body };
      }

      // For 4xx errors, don't retry (client error)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Webhook returned ${response.status}: ${body}`);
      }

      // For 5xx errors, retry
      lastError = new Error(`Webhook returned ${response.status}: ${body}`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(`Webhook timed out after ${timeout}ms`);
      } else {
        lastError = error instanceof Error ? error : new Error("Unknown error");
      }
    }

    // Wait before retrying (exponential backoff)
    if (attempt < retries) {
      await sleep(RETRY_DELAY * Math.pow(2, attempt));
    }
  }

  throw lastError || new Error("Webhook delivery failed");
}

/**
 * Send a notification to a custom webhook
 */
export async function sendWebhookNotification(
  url: string,
  notification: NotificationPayload,
  options?: Partial<WebhookDeliveryOptions>
): Promise<NotificationResult> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false,
        channel: "webhook",
        destination: url,
        error: "Invalid webhook URL: must be HTTP or HTTPS",
      };
    }

    const payload = formatWebhookPayload(notification);

    const result = await sendWithRetry(url, payload, {
      url,
      ...options,
    });

    console.log(`Webhook notification sent to ${url}: status ${result.statusCode}`);

    return {
      success: true,
      channel: "webhook",
      destination: url,
    };
  } catch (error) {
    console.error("Failed to send webhook notification:", error);
    return {
      success: false,
      channel: "webhook",
      destination: url,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a raw webhook payload
 */
export async function sendRawWebhook(
  url: string,
  payload: unknown,
  options?: Partial<WebhookDeliveryOptions>
): Promise<NotificationResult> {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false,
        channel: "webhook",
        destination: url,
        error: "Invalid webhook URL: must be HTTP or HTTPS",
      };
    }

    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const bodyString = JSON.stringify(payload);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Cloudify-Webhook/1.0",
      ...options?.headers,
    };

    if (options?.secret) {
      const signature = generateSignature(bodyString, options.secret);
      headers["X-Cloudify-Signature"] = `sha256=${signature}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: bodyString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        channel: "webhook",
        destination: url,
      };
    }

    const body = await response.text();
    return {
      success: false,
      channel: "webhook",
      destination: url,
      error: `Webhook returned ${response.status}: ${body}`,
    };
  } catch (error) {
    console.error("Failed to send raw webhook:", error);
    return {
      success: false,
      channel: "webhook",
      destination: url,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Signature format: "sha256=<hex>"
  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(parts[1], "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

/**
 * Test a webhook endpoint
 */
export async function testWebhook(
  url: string,
  options?: Partial<WebhookDeliveryOptions>
): Promise<NotificationResult> {
  const testPayload: CustomWebhookPayload = {
    event: "deployment_started",
    timestamp: new Date().toISOString(),
    data: {
      userId: "test-user",
      projectId: "test-project",
      projectName: "Test Project",
      deploymentId: "test-deployment",
      title: "Test Notification",
      message: "This is a test notification from Cloudify.",
    },
  };

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false,
        channel: "webhook",
        destination: url,
        error: "Invalid webhook URL",
      };
    }

    const result = await sendWithRetry(url, testPayload, {
      url,
      retries: 0, // No retries for test
      timeout: options?.timeout ?? 5000,
      ...options,
    });

    return {
      success: true,
      channel: "webhook",
      destination: url,
      messageId: `test-${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      channel: "webhook",
      destination: url,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate a webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
