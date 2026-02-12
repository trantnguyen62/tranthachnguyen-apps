import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("domains/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/domains/[id] - Get a single domain
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const domain = await prisma.domain.findFirst({
      where: {
        id,
        project: {
          userId: user.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            deployments: {
              where: { status: "READY" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                siteSlug: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!domain) {
      return fail("NOT_FOUND", "Domain not found", 404);
    }

    return ok(domain);
  } catch (error) {
    log.error("Failed to fetch domain", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch domain", 500);
  }
}

// DELETE /api/domains/[id] - Remove a domain
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Check if domain belongs to user's project
    const domain = await prisma.domain.findFirst({
      where: {
        id,
        project: {
          userId: user.id,
        },
      },
    });

    if (!domain) {
      return fail("NOT_FOUND", "Domain not found", 404);
    }

    await prisma.domain.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete domain", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to delete domain", 500);
  }
}
