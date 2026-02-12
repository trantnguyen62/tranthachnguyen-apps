/**
 * Next.js Instrumentation Hook
 * Runs once on server startup for initialization tasks.
 *
 * Initializes:
 * - Sentry error tracking (when SENTRY_DSN is set)
 * - Datadog metrics forwarding (when DATADOG_API_KEY is set)
 * - Cron job scheduler (Node.js runtime only)
 */

export async function register() {
  // Initialize cron scheduler (Node.js runtime only, not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronScheduler } = await import("@/lib/cron/scheduler");
    startCronScheduler();
    console.log("[Instrumentation] Cron scheduler started");
  }

  // Initialize Sentry error tracking
  if (process.env.SENTRY_DSN) {
    const { captureMessage, isSentryConfigured } = await import(
      "@/lib/integrations/sentry"
    );

    if (isSentryConfigured()) {
      console.log("[Instrumentation] Sentry DSN detected, error tracking enabled");
      // Send a startup event to verify connectivity
      await captureMessage("Cloudify server started", {
        level: "info",
        tags: {
          lifecycle: "startup",
          nodeVersion: process.version,
        },
      });
    }
  }

  // Initialize Datadog integration
  if (process.env.DATADOG_API_KEY) {
    const { isDatadogConfigured, submitHealthCheck } = await import(
      "@/lib/integrations/datadog"
    );

    if (isDatadogConfigured()) {
      console.log("[Instrumentation] Datadog API key detected, metrics forwarding enabled");
      // Send an initial health check
      await submitHealthCheck(true, "Cloudify server started");
    }
  }

  // Add additional startup tasks below
}
