import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { sendDomainNotification } from "@/lib/notifications";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("domains/verify");
import { verifyDomainDnsWithCloudflare, getRequiredDnsRecords } from "@/lib/domains/dns";
import { triggerSslProvisioning } from "@/lib/domains/ssl";
import { updateNginxConfig } from "@/lib/domains/nginx";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/domains/[id]/verify - Verify DNS configuration for a domain
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Get the domain and verify ownership
    const domain = await prisma.domain.findFirst({
      where: {
        id,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: {
          select: { id: true, name: true, userId: true },
        },
      },
    });

    if (!domain) {
      return fail("NOT_FOUND", "Domain not found", 404);
    }

    // Perform DNS verification (uses Cloudflare API when available, falls back to DNS lookup)
    const result = await verifyDomainDnsWithCloudflare(domain.domain, domain.verificationToken);

    // Update domain status based on verification result
    if (result.verified && !domain.verified) {
      await prisma.domain.update({
        where: { id },
        data: {
          verified: true,
          sslStatus: "PROVISIONING",
        },
      });

      // Update nginx config to serve the domain
      await updateNginxConfig();

      // Trigger SSL provisioning in background
      triggerSslProvisioning(id);

      // Send domain verified notification (non-blocking)
      try {
        await sendDomainNotification("verified", {
          userId: domain.project.userId,
          projectId: domain.project.id,
          projectName: domain.project.name,
          domain: domain.domain,
        });
      } catch (notifError) {
        log.error("Failed to send domain verified notification", { error: notifError instanceof Error ? notifError.message : String(notifError) });
      }
    } else if (!result.verified && result.errors.length > 0) {
      // Send domain verification failure notification (non-blocking)
      try {
        await sendDomainNotification("error", {
          userId: domain.project.userId,
          projectId: domain.project.id,
          projectName: domain.project.name,
          domain: domain.domain,
          error: result.errors.join("; "),
        });
      } catch (notifError) {
        log.error("Failed to send domain error notification", { error: notifError instanceof Error ? notifError.message : String(notifError) });
      }
    }

    // Get required DNS records for user reference
    const requiredRecords = getRequiredDnsRecords(
      domain.domain,
      domain.verificationToken
    );

    return ok({
      verified: result.verified,
      txtRecordFound: result.txtRecordFound,
      domainResolvable: result.domainResolvable,
      pointsToServer: result.pointsToServer,
      errors: result.errors,
      warnings: result.warnings,
      requiredRecords,
    });
  } catch (error) {
    log.error("Failed to verify domain", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to verify domain DNS", 500);
  }
}
