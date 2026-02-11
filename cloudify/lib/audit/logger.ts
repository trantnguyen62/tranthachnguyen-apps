/**
 * Audit Logger Utility
 *
 * Provides comprehensive audit logging for enterprise compliance.
 * Captures IP address, user agent, and team context.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export interface AuditContext {
  userId: string;
  projectId?: string;
  teamId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEventData {
  type: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Activity types for categorization
 */
export const AuditTypes = {
  AUTH: "auth",
  PROJECT: "project",
  DEPLOYMENT: "deployment",
  DOMAIN: "domain",
  ENV_VAR: "env_var",
  TEAM: "team",
  BILLING: "billing",
  FUNCTION: "function",
  DATABASE: "database",
  INTEGRATION: "integration",
  SETTINGS: "settings",
  API_KEY: "api_key",
} as const;

/**
 * Common actions for audit events
 */
export const AuditActions = {
  // Auth actions
  LOGIN: "login",
  LOGOUT: "logout",
  LOGIN_FAILED: "login_failed",
  PASSWORD_RESET: "password_reset",

  // CRUD actions
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",

  // Deployment actions
  DEPLOYED: "deployed",
  ROLLBACK: "rollback",
  CANCELLED: "cancelled",

  // Domain actions
  VERIFIED: "verified",
  SSL_ISSUED: "ssl_issued",

  // Team actions
  MEMBER_ADDED: "member_added",
  MEMBER_REMOVED: "member_removed",
  ROLE_CHANGED: "role_changed",
  INVITED: "invited",

  // Settings actions
  CONFIGURED: "configured",
  ENABLED: "enabled",
  DISABLED: "disabled",

  // API actions
  ACCESSED: "accessed",
  EXPORTED: "exported",
} as const;

/**
 * Extract request context (IP address, user agent) from a NextRequest
 */
export function extractRequestContext(request: NextRequest | Request): Partial<AuditContext> {
  const headers = request.headers;

  // Get IP address from various headers (in order of preference)
  const ipAddress =
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-client-ip") ||
    undefined;

  // Get user agent
  const userAgent = headers.get("user-agent") || undefined;

  return {
    ipAddress,
    userAgent,
  };
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(
  context: AuditContext,
  event: AuditEventData
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId: context.userId,
        projectId: context.projectId || null,
        teamId: context.teamId || null,
        type: event.type,
        action: event.action,
        description: event.description,
        metadata: event.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error("[Audit] Failed to log event:", error);
  }
}

/**
 * Helper to create audit context from a request and session
 */
export function createAuditContext(
  request: NextRequest | Request,
  userId: string,
  options?: {
    projectId?: string;
    teamId?: string;
  }
): AuditContext {
  const requestContext = extractRequestContext(request);

  return {
    userId,
    projectId: options?.projectId,
    teamId: options?.teamId,
    ...requestContext,
  };
}

/**
 * Shorthand helpers for common audit events
 */
export const audit = {
  /**
   * Log authentication event
   */
  async auth(
    context: AuditContext,
    action: "login" | "logout" | "login_failed" | "password_reset",
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.AUTH,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log project event
   */
  async project(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.PROJECT,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log deployment event
   */
  async deployment(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.DEPLOYMENT,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log domain event
   */
  async domain(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.DOMAIN,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log environment variable event
   */
  async envVar(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.ENV_VAR,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log team event
   */
  async team(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.TEAM,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log billing event
   */
  async billing(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.BILLING,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log settings event
   */
  async settings(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.SETTINGS,
      action,
      description,
      metadata,
    });
  },

  /**
   * Log API key event
   */
  async apiKey(
    context: AuditContext,
    action: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await logAuditEvent(context, {
      type: AuditTypes.API_KEY,
      action,
      description,
      metadata,
    });
  },
};
