/**
 * Global SSL Status API
 *
 * Provides system-wide SSL certificate statistics and management
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
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
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Failed to get SSL status:", error);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Failed to perform SSL action:", error);
    return NextResponse.json(
      { error: "Failed to perform SSL action" },
      { status: 500 }
    );
  }
}
