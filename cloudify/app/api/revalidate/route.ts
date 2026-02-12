/**
 * ISR Revalidation API
 *
 * POST /api/revalidate?path=/some/path&projectId=xxx
 * POST /api/revalidate (with body: { path: "/some/path", projectId: "xxx" })
 *
 * Triggers on-demand revalidation for ISR-enabled pages
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidatePaths, revalidateAll } from "@/lib/isr/revalidator";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("revalidate");

/**
 * POST /api/revalidate
 *
 * Revalidate a path or paths for a project
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get parameters from query string or body
    let path = searchParams.get("path");
    let paths: string[] | undefined;
    let projectId = searchParams.get("projectId");
    let secret = searchParams.get("secret");
    let purgeCloudflare = searchParams.get("purgeCloudflare") !== "false";

    // Parse body if present
    try {
      const body = await request.json();
      path = path || body.path;
      paths = body.paths;
      projectId = projectId || body.projectId;
      secret = secret || body.secret;
      if (body.purgeCloudflare !== undefined) {
        purgeCloudflare = body.purgeCloudflare;
      }
    } catch {
      // No body or invalid JSON
    }

    // Validate project access
    if (!projectId) {
      // Try to get project from session
      const authUser = await getAuthUser(request);
      if (!authUser) {
        return fail("VALIDATION_MISSING_FIELD", "Missing projectId parameter", 400);
      }
    }

    // Verify project exists and user has access
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
      // Also check X-Revalidate-Secret header
      const headerSecret = request.headers.get("x-revalidate-secret");
      if (headerSecret !== configuredSecret) {
        return fail("AUTH_REQUIRED", "Invalid secret", 401);
      }
    }

    // Validate that we have something to revalidate
    if (!path && !paths) {
      return fail("VALIDATION_MISSING_FIELD", "Missing path or paths parameter", 400);
    }

    // Perform revalidation
    let result;
    if (paths && Array.isArray(paths)) {
      result = await revalidatePaths(projectId!, paths, { purgeCloudflare, secret: secret || undefined });
    } else if (path) {
      result = await revalidatePath(projectId!, path, { purgeCloudflare, secret: secret || undefined });
    }

    return ok({
      revalidated: true,
      ...result,
    });
  } catch (error) {
    log.error("Revalidation failed", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Revalidation failed", 500);
  }
}

/**
 * GET /api/revalidate
 *
 * Health check / documentation endpoint
 */
export async function GET() {
  return ok({
    status: "ok",
    endpoints: {
      "POST /api/revalidate": {
        description: "Revalidate specific paths",
        parameters: {
          path: "Single path to revalidate (e.g., /blog/my-post)",
          paths: "Array of paths to revalidate",
          projectId: "Project ID (required)",
          secret: "Revalidation secret (if configured)",
          purgeCloudflare: "Whether to purge CDN cache (default: true)",
        },
        example: {
          path: "/blog/my-post",
          projectId: "proj_123",
        },
      },
      "POST /api/revalidate/tag": {
        description: "Revalidate by cache tag",
        parameters: {
          tag: "Cache tag to revalidate",
          projectId: "Project ID (required)",
        },
      },
    },
  });
}
