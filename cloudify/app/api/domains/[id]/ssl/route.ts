/**
 * SSL Certificate Management API
 *
 * Endpoints:
 * - GET: Get SSL status and certificate information
 * - POST: Provision or renew SSL certificate
 * - DELETE: Revoke SSL certificate
 */

import { NextRequest } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("domains/ssl");
import { prisma } from "@/lib/prisma";
import {
  checkSslStatus,
  getSslCertificateInfo,
  provisionSslCertificate,
  forceRenewCertificate,
  revokeSslCertificate,
  triggerSslProvisioning,
  getSslStatus as getGlobalSslStatus,
} from "@/lib/domains/ssl";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/domains/[id]/ssl
 * Get SSL certificate status and information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: domainId } = await params;

    // Get domain and verify ownership
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: {
          select: { userId: true, name: true },
        },
      },
    });

    if (!domain) {
      return fail("NOT_FOUND", "Domain not found", 404);
    }

    if (domain.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
    }

    // Get detailed SSL info
    const sslStatus = await checkSslStatus(domainId);
    const certificateInfo = await getSslCertificateInfo(domainId);

    return ok({
      domain: domain.domain,
      verified: domain.verified,
      ssl: {
        status: domain.sslStatus,
        configured: sslStatus.configured,
        expires: sslStatus.expires?.toISOString(),
        daysUntilExpiry: sslStatus.daysUntilExpiry,
        certPath: domain.sslCertPath,
        keyPath: domain.sslKeyPath,
      },
      certificateInfo: certificateInfo
        ? {
            status: certificateInfo.status,
            issuedAt: certificateInfo.issuedAt?.toISOString(),
            expiresAt: certificateInfo.expiresAt?.toISOString(),
            daysUntilExpiry: certificateInfo.daysUntilExpiry,
          }
        : null,
    });
  } catch (error) {
    log.error("Failed to get SSL status", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to get SSL status", 500);
  }
}

/**
 * POST /api/domains/[id]/ssl
 * Provision or renew SSL certificate
 *
 * Body:
 * - action: "provision" | "renew" | "provision-async"
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: domainId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "provision-async";

    // Get domain and verify ownership
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: {
          select: { userId: true, name: true },
        },
      },
    });

    if (!domain) {
      return fail("NOT_FOUND", "Domain not found", 404);
    }

    if (domain.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
    }

    // Check if domain is verified
    if (!domain.verified) {
      return fail("BAD_REQUEST", "Domain must be verified before provisioning SSL", 400);
    }

    switch (action) {
      case "provision":
      case "renew": {
        // Synchronous provisioning (may take a while)
        const result =
          action === "renew"
            ? await forceRenewCertificate(domainId)
            : await provisionSslCertificate(domainId);

        if (!result.success) {
          return fail("INTERNAL_ERROR", result.error || "SSL provisioning failed", 500);
        }

        return ok({
          message: `SSL certificate ${action === "renew" ? "renewed" : "provisioned"} successfully`,
          certPath: result.certPath,
          method: result.method,
        });
      }

      case "provision-async": {
        // Asynchronous provisioning (returns immediately)
        if (domain.sslStatus === "PROVISIONING") {
          return fail("CONFLICT", "SSL provisioning already in progress", 409);
        }

        await triggerSslProvisioning(domainId);

        return ok({
          message: "SSL provisioning started",
          status: "provisioning",
        });
      }

      default:
        return fail("BAD_REQUEST", `Unknown action: ${action}`, 400);
    }
  } catch (error) {
    log.error("Failed to provision SSL", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to provision SSL", 500);
  }
}

/**
 * DELETE /api/domains/[id]/ssl
 * Revoke SSL certificate
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: domainId } = await params;

    // Get domain and verify ownership
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!domain) {
      return fail("NOT_FOUND", "Domain not found", 404);
    }

    if (domain.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
    }

    // Revoke certificate
    const success = await revokeSslCertificate(domainId);

    if (!success) {
      return fail("INTERNAL_ERROR", "Failed to revoke SSL certificate", 500);
    }

    return ok({
      message: "SSL certificate revoked",
    });
  } catch (error) {
    log.error("Failed to revoke SSL", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to revoke SSL", 500);
  }
}
