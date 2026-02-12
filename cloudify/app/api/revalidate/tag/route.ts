/**
 * ISR Tag Revalidation API
 *
 * POST /api/revalidate/tag?tag=blog-posts&projectId=xxx
 *
 * Triggers on-demand revalidation by cache tag
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "@/lib/isr/revalidator";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("revalidate/tag");

/**
 * POST /api/revalidate/tag
 *
 * Revalidate all pages associated with a cache tag
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get parameters from query string or body
    let tag = searchParams.get("tag");
    let projectId = searchParams.get("projectId");
    let secret = searchParams.get("secret");
    let purgeCloudflare = searchParams.get("purgeCloudflare") !== "false";

    // Parse body if present
    try {
      const body = await request.json();
      tag = tag || body.tag;
      projectId = projectId || body.projectId;
      secret = secret || body.secret;
      if (body.purgeCloudflare !== undefined) {
        purgeCloudflare = body.purgeCloudflare;
      }
    } catch {
      // No body or invalid JSON
    }

    // Validate required parameters
    if (!tag) {
      return fail("VALIDATION_MISSING_FIELD", "Missing tag parameter", 400);
    }

    if (!projectId) {
      const authUser = await getAuthUser(request);
      if (!authUser) {
        return fail("VALIDATION_MISSING_FIELD", "Missing projectId parameter", 400);
      }
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId! },
      include: {
        envVariables: {
          where: { key: "REVALIDATE_SECRET" },
          select: { value: true },
        },
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Check secret if configured
    const configuredSecret = project.envVariables[0]?.value;
    if (configuredSecret && secret !== configuredSecret) {
      const headerSecret = request.headers.get("x-revalidate-secret");
      if (headerSecret !== configuredSecret) {
        return fail("AUTH_REQUIRED", "Invalid secret", 401);
      }
    }

    // Perform tag revalidation
    const result = await revalidateTag(projectId!, tag, { purgeCloudflare, secret: secret || undefined });

    return ok({
      tag,
      ...result,
      revalidated: result.success,
    });
  } catch (error) {
    log.error("Tag revalidation failed", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Tag revalidation failed", 500);
  }
}
