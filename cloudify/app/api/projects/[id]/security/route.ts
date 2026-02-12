/**
 * Project Security Settings API
 *
 * GET - Get security settings for a project
 * PUT - Update security settings for a project
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import {
  getSecuritySettings,
  setSecurityLevel,
  listFirewallRules,
  createFirewallRule,
  deleteFirewallRule,
  createRateLimitRule,
  isCloudflareConfigured,
} from "@/lib/integrations/cloudflare";

const log = getRouteLogger("projects/[id]/security");

interface SecurityConfig {
  securityLevel: "off" | "essentially_off" | "low" | "medium" | "high" | "under_attack";
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    action: "block" | "challenge" | "managed_challenge" | "log";
  };
  ipBlocking: {
    enabled: boolean;
    blockedIps: string[];
  };
  countryBlocking: {
    enabled: boolean;
    blockedCountries: string[];
  };
  botProtection: {
    enabled: boolean;
    level: "low" | "medium" | "high";
  };
}

// GET /api/projects/[id]/security
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Check if Cloudflare is configured
    if (!isCloudflareConfigured()) {
      return ok({
        configured: false,
        message: "Cloudflare integration not configured. Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to enable security features.",
        settings: null,
      });
    }

    // Get current security settings from Cloudflare
    const cloudflareSettings = await getSecuritySettings();
    const firewallRules = await listFirewallRules();

    // Parse existing rules into structured format
    const ipBlockRules = firewallRules.filter((r) =>
      r.description.startsWith("Cloudify IP Block:")
    );
    const countryBlockRules = firewallRules.filter((r) =>
      r.description.startsWith("Cloudify Country Block:")
    );
    const rateLimitRules = firewallRules.filter((r) =>
      r.description.startsWith("Cloudify Rate Limit:")
    );

    return ok({
      configured: true,
      settings: {
        securityLevel: cloudflareSettings.securityLevel || "medium",
        wafEnabled: cloudflareSettings.wafEnabled || false,
        browserIntegrityCheck: cloudflareSettings.browserIntegrityCheck || false,
        challengeTTL: cloudflareSettings.challengeTTL || 1800,
        firewallRules: {
          total: firewallRules.length,
          ipBlocking: ipBlockRules.length,
          countryBlocking: countryBlockRules.length,
          rateLimiting: rateLimitRules.length,
        },
        rules: firewallRules.map((r) => ({
          id: r.id,
          description: r.description,
          action: r.action,
          paused: r.paused,
        })),
      },
    });
  } catch (error) {
    log.error("Failed to get security settings", error);
    return fail("INTERNAL_ERROR", "Failed to get security settings", 500);
  }
}

// PUT /api/projects/[id]/security
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Check if Cloudflare is configured
    if (!isCloudflareConfigured()) {
      return fail("BAD_REQUEST", "Cloudflare integration not configured", 400);
    }

    const results: {
      securityLevel?: { success: boolean; error?: string };
      rateLimiting?: { success: boolean; error?: string };
      ipBlocking?: { success: boolean; error?: string };
      countryBlocking?: { success: boolean; error?: string };
    } = {};

    // Update security level if provided
    if (body.securityLevel) {
      const validLevels = ["off", "essentially_off", "low", "medium", "high", "under_attack"];
      if (!validLevels.includes(body.securityLevel)) {
        return fail("VALIDATION_ERROR", `Invalid security level. Must be one of: ${validLevels.join(", ")}`, 400);
      }
      results.securityLevel = await setSecurityLevel(body.securityLevel);
    }

    // Add rate limiting rule if provided
    if (body.rateLimiting?.enabled) {
      results.rateLimiting = await createRateLimitRule({
        description: `Cloudify Rate Limit: ${project.slug}`,
        expression: `(http.host eq "${project.slug}.tranthachnguyen.com")`,
        requestsPerPeriod: body.rateLimiting.requestsPerMinute || 100,
        period: 60,
        action: body.rateLimiting.action || "challenge",
        timeout: 60,
      });
    }

    // Add IP blocking rules if provided
    if (body.ipBlocking?.enabled && body.ipBlocking.blockedIps?.length > 0) {
      const ips = body.ipBlocking.blockedIps.join(" ") || "";
      if (ips) {
        results.ipBlocking = await createFirewallRule({
          description: `Cloudify IP Block: ${project.slug}`,
          action: "block",
          expression: `(ip.src in {${ips}}) and (http.host eq "${project.slug}.tranthachnguyen.com")`,
        });
      }
    }

    // Add country blocking rules if provided
    if (body.countryBlocking?.enabled && body.countryBlocking.blockedCountries?.length > 0) {
      const countries = body.countryBlocking.blockedCountries
        .map((c: string) => `"${c}"`)
        .join(" ");
      if (countries) {
        results.countryBlocking = await createFirewallRule({
          description: `Cloudify Country Block: ${project.slug}`,
          action: "block",
          expression: `(ip.geoip.country in {${countries}}) and (http.host eq "${project.slug}.tranthachnguyen.com")`,
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "security",
        action: "security.updated",
        description: "Updated security settings",
        metadata: body,
      },
    });

    return ok({
      success: true,
      results,
    });
  } catch (error) {
    log.error("Failed to update security settings", error);
    return fail("INTERNAL_ERROR", "Failed to update security settings", 500);
  }
}

// DELETE /api/projects/[id]/security - Delete a specific firewall rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return fail("VALIDATION_MISSING_FIELD", "Rule ID is required", 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Delete the firewall rule
    const result = await deleteFirewallRule(ruleId);

    if (!result.success) {
      return fail("INTERNAL_ERROR", result.error || "Failed to delete rule", 500);
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "security",
        action: "security.rule_deleted",
        description: `Deleted firewall rule ${ruleId}`,
        metadata: { ruleId },
      },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete firewall rule", error);
    return fail("INTERNAL_ERROR", "Failed to delete firewall rule", 500);
  }
}
