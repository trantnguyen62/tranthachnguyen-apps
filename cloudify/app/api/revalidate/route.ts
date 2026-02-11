/**
 * ISR Revalidation API
 *
 * POST /api/revalidate?path=/some/path&projectId=xxx
 * POST /api/revalidate (with body: { path: "/some/path", projectId: "xxx" })
 *
 * Triggers on-demand revalidation for ISR-enabled pages
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidatePaths, revalidateAll } from "@/lib/isr/revalidator";

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
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Missing projectId parameter" },
          { status: 400 }
        );
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check secret if configured
    const configuredSecret = project.envVariables[0]?.value;
    if (configuredSecret && secret !== configuredSecret) {
      // Also check X-Revalidate-Secret header
      const headerSecret = request.headers.get("x-revalidate-secret");
      if (headerSecret !== configuredSecret) {
        return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
      }
    }

    // Validate that we have something to revalidate
    if (!path && !paths) {
      return NextResponse.json(
        { error: "Missing path or paths parameter" },
        { status: 400 }
      );
    }

    // Perform revalidation
    let result;
    if (paths && Array.isArray(paths)) {
      result = await revalidatePaths(projectId!, paths, { purgeCloudflare, secret: secret || undefined });
    } else if (path) {
      result = await revalidatePath(projectId!, path, { purgeCloudflare, secret: secret || undefined });
    }

    return NextResponse.json({
      revalidated: true,
      ...result,
    });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json(
      { error: "Revalidation failed", revalidated: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate
 *
 * Health check / documentation endpoint
 */
export async function GET() {
  return NextResponse.json({
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
