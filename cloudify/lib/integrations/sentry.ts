/**
 * Sentry Integration
 * Error tracking and performance monitoring
 *
 * Provides:
 * - Error capture and reporting
 * - Performance transaction tracking
 * - User context management
 * - Deployment tracking
 */

// Configuration
const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const APP_ENV = process.env.NODE_ENV || "development";
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

// Sentry API base URL
const SENTRY_API_URL = "https://sentry.io/api/0";

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return !!SENTRY_DSN;
}

/**
 * Check if Sentry API is configured (for deployments, releases)
 */
export function isSentryApiConfigured(): boolean {
  return !!(SENTRY_ORG && SENTRY_AUTH_TOKEN);
}

/**
 * Sentry error levels
 */
export type SentryLevel = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Error context for Sentry
 */
export interface SentryContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SentryLevel;
}

/**
 * Sentry event payload
 */
interface SentryEventPayload {
  event_id?: string;
  timestamp?: string;
  platform?: string;
  level?: SentryLevel;
  logger?: string;
  transaction?: string;
  server_name?: string;
  release?: string;
  environment?: string;
  message?: {
    formatted: string;
  };
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  user?: {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
}

/**
 * Parse DSN to get project ID and public key
 */
function parseDsn(dsn: string): { publicKey: string; projectId: string; host: string } | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace("/", "");
    const host = url.host;
    return { publicKey, projectId, host };
  } catch {
    return null;
  }
}

/**
 * Generate a UUID for event ID
 */
function generateEventId(): string {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

/**
 * Parse error stack trace
 */
function parseStackTrace(
  error: Error
): Array<{ filename: string; function: string; lineno?: number; colno?: number }> {
  if (!error.stack) return [];

  const frames: Array<{
    filename: string;
    function: string;
    lineno?: number;
    colno?: number;
  }> = [];

  const lines = error.stack.split("\n").slice(1); // Skip the error message line

  for (const line of lines) {
    // Parse stack trace line: "at functionName (filename:line:col)"
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      frames.push({
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3]),
        colno: parseInt(match[4]),
      });
    } else {
      // Try simpler format: "at filename:line:col"
      const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
      if (simpleMatch) {
        frames.push({
          function: "<anonymous>",
          filename: simpleMatch[1],
          lineno: parseInt(simpleMatch[2]),
          colno: parseInt(simpleMatch[3]),
        });
      }
    }
  }

  return frames.reverse(); // Sentry expects frames in reverse order
}

/**
 * Capture an exception and send to Sentry
 */
export async function captureException(
  error: Error,
  context?: SentryContext
): Promise<string | null> {
  if (!SENTRY_DSN) {
    console.error("[Sentry] Not configured, skipping error capture:", error.message);
    return null;
  }

  const dsnInfo = parseDsn(SENTRY_DSN);
  if (!dsnInfo) {
    console.error("[Sentry] Invalid DSN");
    return null;
  }

  const eventId = generateEventId();

  const payload: SentryEventPayload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: "node",
    level: context?.level || "error",
    logger: "cloudify",
    release: APP_VERSION,
    environment: APP_ENV,
    exception: {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: {
            frames: parseStackTrace(error),
          },
        },
      ],
    },
    user: context?.user,
    tags: {
      app: "cloudify",
      ...context?.tags,
    },
    extra: context?.extra,
  };

  try {
    const storeUrl = `https://${dsnInfo.host}/api/${dsnInfo.projectId}/store/`;

    const response = await fetch(storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=cloudify/1.0, sentry_key=${dsnInfo.publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Sentry] Failed to send event:", errorText);
      return null;
    }

    console.log("[Sentry] Captured exception:", eventId);
    return eventId;
  } catch (err) {
    console.error("[Sentry] Error sending event:", err);
    return null;
  }
}

/**
 * Capture a message (non-exception event)
 */
export async function captureMessage(
  message: string,
  context?: SentryContext
): Promise<string | null> {
  if (!SENTRY_DSN) {
    console.log("[Sentry] Not configured, skipping message capture:", message);
    return null;
  }

  const dsnInfo = parseDsn(SENTRY_DSN);
  if (!dsnInfo) {
    return null;
  }

  const eventId = generateEventId();

  const payload: SentryEventPayload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: "node",
    level: context?.level || "info",
    logger: "cloudify",
    release: APP_VERSION,
    environment: APP_ENV,
    message: {
      formatted: message,
    },
    user: context?.user,
    tags: {
      app: "cloudify",
      ...context?.tags,
    },
    extra: context?.extra,
  };

  try {
    const storeUrl = `https://${dsnInfo.host}/api/${dsnInfo.projectId}/store/`;

    const response = await fetch(storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=cloudify/1.0, sentry_key=${dsnInfo.publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    console.log("[Sentry] Captured message:", eventId);
    return eventId;
  } catch {
    return null;
  }
}

/**
 * Create a Sentry release via API
 */
export async function createRelease(
  version: string,
  options?: {
    projects?: string[];
    refs?: Array<{ repository: string; commit: string }>;
  }
): Promise<boolean> {
  if (!isSentryApiConfigured()) {
    console.log("[Sentry] API not configured, skipping release creation");
    return false;
  }

  try {
    const response = await fetch(`${SENTRY_API_URL}/organizations/${SENTRY_ORG}/releases/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version,
        projects: options?.projects || ["cloudify"],
        refs: options?.refs,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Sentry] Failed to create release:", error);
      return false;
    }

    console.log("[Sentry] Created release:", version);
    return true;
  } catch (error) {
    console.error("[Sentry] Error creating release:", error);
    return false;
  }
}

/**
 * Associate commits with a release
 */
export async function setReleaseCommits(
  version: string,
  commits: Array<{
    id: string;
    repository: string;
    message?: string;
    author_name?: string;
    author_email?: string;
    timestamp?: string;
  }>
): Promise<boolean> {
  if (!isSentryApiConfigured()) {
    return false;
  }

  try {
    const response = await fetch(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/releases/${encodeURIComponent(
        version
      )}/commits/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commits }),
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Create a deployment for a release
 */
export async function createDeployment(
  version: string,
  environment: string,
  options?: {
    name?: string;
    url?: string;
    dateStarted?: string;
    dateFinished?: string;
  }
): Promise<boolean> {
  if (!isSentryApiConfigured()) {
    return false;
  }

  try {
    const response = await fetch(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/releases/${encodeURIComponent(
        version
      )}/deploys/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          environment,
          name: options?.name,
          url: options?.url,
          dateStarted: options?.dateStarted || new Date().toISOString(),
          dateFinished: options?.dateFinished || new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Sentry] Failed to create deployment:", error);
      return false;
    }

    console.log("[Sentry] Created deployment for release:", version, environment);
    return true;
  } catch (error) {
    console.error("[Sentry] Error creating deployment:", error);
    return false;
  }
}

/**
 * Track a Cloudify deployment in Sentry
 */
export async function trackDeployment(data: {
  projectName: string;
  deploymentId: string;
  version: string;
  environment: string;
  commitSha?: string;
  repoUrl?: string;
  url?: string;
  startedAt: Date;
  finishedAt?: Date;
}): Promise<boolean> {
  // Create release
  const releaseVersion = `${data.projectName}@${data.version}`;

  const refs = data.repoUrl && data.commitSha
    ? [{ repository: data.repoUrl, commit: data.commitSha }]
    : undefined;

  const releaseCreated = await createRelease(releaseVersion, {
    projects: ["cloudify"],
    refs,
  });

  if (!releaseCreated) {
    return false;
  }

  // Create deployment
  return createDeployment(releaseVersion, data.environment, {
    name: data.deploymentId,
    url: data.url,
    dateStarted: data.startedAt.toISOString(),
    dateFinished: data.finishedAt?.toISOString(),
  });
}

/**
 * Wrapper to capture errors with build/deployment context
 */
export async function captureDeploymentError(
  error: Error,
  data: {
    projectId: string;
    projectName: string;
    deploymentId: string;
    userId?: string;
    buildStep?: string;
  }
): Promise<string | null> {
  return captureException(error, {
    level: "error",
    user: data.userId ? { id: data.userId } : undefined,
    tags: {
      projectId: data.projectId,
      projectName: data.projectName,
      deploymentId: data.deploymentId,
      buildStep: data.buildStep || "unknown",
    },
    extra: {
      projectId: data.projectId,
      deploymentId: data.deploymentId,
    },
  });
}

/**
 * Capture function invocation error
 */
export async function captureFunctionError(
  error: Error,
  data: {
    functionId: string;
    functionName: string;
    projectId: string;
    userId?: string;
    duration?: number;
    region?: string;
  }
): Promise<string | null> {
  return captureException(error, {
    level: "error",
    user: data.userId ? { id: data.userId } : undefined,
    tags: {
      functionId: data.functionId,
      functionName: data.functionName,
      projectId: data.projectId,
      region: data.region || "default",
    },
    extra: {
      duration: data.duration,
    },
  });
}
