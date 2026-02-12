import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("feature-flags");

// GET /api/feature-flags - List feature flags for a project
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return fail("NOT_FOUND", "Project not found", 404);
      }

      const flags = await prisma.featureFlag.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, name: true, slug: true } } },
      });

      return ok(flags);
    }

    // Get all flags across all user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const projectIds = userProjects.map((p) => p.id);

    const flags = await prisma.featureFlag.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, name: true, slug: true } } },
    });

    return ok(flags);
  } catch (error) {
    log.error("Failed to fetch feature flags", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch feature flags", 500);
  }
}

// POST /api/feature-flags - Create a new feature flag
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const {
      projectId,
      key,
      name,
      description,
      enabled = false,
      percentage = 100,
      conditions,
    } = body;

    if (!projectId || !key || !name) {
      return fail("VALIDATION_MISSING_FIELD", "Project ID, key, and name are required", 400);
    }

    // Validate key format
    if (!/^[a-z0-9_-]+$/i.test(key)) {
      return fail("BAD_REQUEST", "Key must contain only letters, numbers, hyphens, and underscores", 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Check for duplicate key
    const existing = await prisma.featureFlag.findFirst({
      where: { projectId, key },
    });

    if (existing) {
      return fail("BAD_REQUEST", "A flag with this key already exists", 400);
    }

    const flag = await prisma.featureFlag.create({
      data: {
        projectId,
        key,
        name,
        description,
        enabled,
        percentage: Math.min(100, Math.max(0, percentage)),
        conditions,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "feature_flag",
        action: "created",
        description: `Created feature flag "${name}"`,
        metadata: { flagId: flag.id, key },
      },
    });

    return ok(flag);
  } catch (error) {
    log.error("Failed to create feature flag", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to create feature flag", 500);
  }
}
