import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";
import { verifyDomainDnsWithCloudflare, getRequiredDnsRecords } from "@/lib/domains/dns";
import { triggerSslProvisioning } from "@/lib/domains/ssl";
import { updateNginxConfig } from "@/lib/domains/nginx";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/domains/[id]/verify - Verify DNS configuration for a domain
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the domain and verify ownership
    const domain = await prisma.domain.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Perform DNS verification (uses Cloudflare API when available, falls back to DNS lookup)
    const result = await verifyDomainDnsWithCloudflare(domain.domain, domain.verificationToken);

    // Update domain status based on verification result
    if (result.verified && !domain.verified) {
      await prisma.domain.update({
        where: { id },
        data: {
          verified: true,
          sslStatus: "provisioning",
        },
      });

      // Update nginx config to serve the domain
      await updateNginxConfig();

      // Trigger SSL provisioning in background
      triggerSslProvisioning(id);
    }

    // Get required DNS records for user reference
    const requiredRecords = getRequiredDnsRecords(
      domain.domain,
      domain.verificationToken
    );

    return NextResponse.json({
      verified: result.verified,
      txtRecordFound: result.txtRecordFound,
      domainResolvable: result.domainResolvable,
      pointsToServer: result.pointsToServer,
      errors: result.errors,
      warnings: result.warnings,
      requiredRecords,
    });
  } catch (error) {
    console.error("Failed to verify domain:", error);
    return NextResponse.json(
      { error: "Failed to verify domain DNS" },
      { status: 500 }
    );
  }
}
