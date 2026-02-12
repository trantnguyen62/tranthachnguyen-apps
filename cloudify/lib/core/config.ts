/**
 * Validated application configuration.
 *
 * Centralizes environment variable access with validation.
 * Fails at import time if required variables are missing,
 * preventing silent runtime failures.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function optionalBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function optionalInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/** Lazy-loaded config to avoid crashing at import time in test environments */
let _config: AppConfig | null = null;

export interface AppConfig {
  /** Database connection URL */
  databaseUrl: string;
  /** NextAuth secret */
  authSecret: string;
  /** NextAuth URL (base URL of the app) */
  authUrl: string;

  /** Node environment */
  nodeEnv: "development" | "production" | "test";
  /** Whether this is a production deployment */
  isProduction: boolean;

  /** Redis connection URL */
  redisUrl: string;

  /** MinIO object storage */
  minio: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
  };

  /** Cloudflare integration */
  cloudflare: {
    apiToken: string | null;
    zoneId: string | null;
    tunnelId: string | null;
  };

  /** GitHub integration */
  github: {
    clientId: string | null;
    clientSecret: string | null;
    webhookSecret: string | null;
  };

  /** Stripe billing */
  stripe: {
    secretKey: string | null;
    webhookSecret: string | null;
  };

  /** Build configuration */
  build: {
    useK3s: boolean;
    useDockerIsolation: boolean;
  };

  /** Base domain for deployed sites */
  baseDomain: string;

  /** Log level */
  logLevel: "debug" | "info" | "warn" | "error";
}

function loadConfig(): AppConfig {
  const nodeEnv = optional("NODE_ENV", "development") as AppConfig["nodeEnv"];

  return {
    databaseUrl: required("DATABASE_URL"),
    authSecret: required("AUTH_SECRET"),
    authUrl: optional("AUTH_URL", "http://localhost:3000"),

    nodeEnv,
    isProduction: nodeEnv === "production",

    redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

    minio: {
      endpoint: optional("MINIO_ENDPOINT", "localhost"),
      port: optionalInt("MINIO_PORT", 9000),
      accessKey: optional("MINIO_ACCESS_KEY", "minioadmin"),
      secretKey: optional("MINIO_SECRET_KEY", "minioadmin"),
      useSSL: optionalBool("MINIO_USE_SSL", false),
    },

    cloudflare: {
      apiToken: process.env.CLOUDFLARE_API_TOKEN || null,
      zoneId: process.env.CLOUDFLARE_ZONE_ID || null,
      tunnelId: process.env.CLOUDFLARE_TUNNEL_ID || null,
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID || null,
      clientSecret: process.env.GITHUB_CLIENT_SECRET || null,
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || null,
    },

    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || null,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
    },

    build: {
      useK3s: optionalBool("USE_K3S_BUILDS", false) || optionalBool("K3S_ENABLED", false),
      useDockerIsolation: optionalBool("USE_DOCKER_ISOLATION", true),
    },

    baseDomain: optional("BASE_DOMAIN", "tranthachnguyen.com"),

    logLevel: optional("LOG_LEVEL", "info") as AppConfig["logLevel"],
  };
}

/** Get the validated application config (lazy-loaded, cached) */
export function getConfig(): AppConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}
