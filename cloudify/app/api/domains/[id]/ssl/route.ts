/**
 * SSL Certificate Management API
 *
 * Endpoints:
 * - GET: Get SSL status and certificate information
 * - POST: Provision or renew SSL certificate
 * - DELETE: Revoke SSL certificate
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

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
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get detailed SSL info
    const sslStatus = await checkSslStatus(domainId);
    const certificateInfo = await getSslCertificateInfo(domainId);

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Failed to get SSL status" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if domain is verified
    if (!domain.verified) {
      return NextResponse.json(
        { error: "Domain must be verified before provisioning SSL" },
        { status: 400 }
      );
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
          return NextResponse.json(
            { error: result.error || "SSL provisioning failed" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `SSL certificate ${action === "renew" ? "renewed" : "provisioned"} successfully`,
          certPath: result.certPath,
          method: result.method,
        });
      }

      case "provision-async": {
        // Asynchronous provisioning (returns immediately)
        if (domain.sslStatus === "provisioning") {
          return NextResponse.json(
            { error: "SSL provisioning already in progress" },
            { status: 409 }
          );
        }

        await triggerSslProvisioning(domainId);

        return NextResponse.json({
          success: true,
          message: "SSL provisioning started",
          status: "provisioning",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error("Failed to provision SSL", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to provision SSL" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Revoke certificate
    const success = await revokeSslCertificate(domainId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to revoke SSL certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SSL certificate revoked",
    });
  } catch (error) {
    log.error("Failed to revoke SSL", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to revoke SSL" },
      { status: 500 }
    );
  }
}
