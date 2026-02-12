/**
 * Global SSL Status API
 *
 * Provides system-wide SSL certificate statistics and management
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ssl/status");
import {
  getSslStatus,
  checkAndRenewExpiring,
  getExpiringSslCertificates,
  sendSslExpirationWarnings,
} from "@/lib/domains/ssl";
import { getCloudflareStatus } from "@/lib/integrations/cloudflare";

/**
 * GET /api/ssl/status
 * Get global SSL status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const sslStatus = await getSslStatus();
    const cloudflareStatus = await getCloudflareStatus();
    const expiringCerts = await getExpiringSslCertificates(7); // Expiring within 7 days

    return NextResponse.json({
      ssl: sslStatus,
      cloudflare: {
        configured: cloudflareStatus.configured,
        zonesAvailable: cloudflareStatus.zones?.length || 0,
        error: cloudflareStatus.error,
      },
      expiringSoon: expiringCerts.map((cert) => ({
        domain: cert.domain,
        daysUntilExpiry: cert.daysUntilExpiry,
        expiresAt: cert.expiresAt?.toISOString(),
      })),
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
 * POST /api/ssl/status
 * Trigger SSL management actions
 *
 * Body:
 * - action: "check-renewals" | "send-warnings"
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    switch (action) {
      case "check-renewals": {
        const result = await checkAndRenewExpiring();
        return NextResponse.json({
          success: true,
          action: "check-renewals",
          result: {
            checked: result.checked,
            renewed: result.renewed,
            failed: result.failed,
          },
        });
      }

      case "send-warnings": {
        const warningsSent = await sendSslExpirationWarnings();
        return NextResponse.json({
          success: true,
          action: "send-warnings",
          warningsSent,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error("Failed to perform SSL action", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to perform SSL action" },
      { status: 500 }
    );
  }
}
