import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("edge-config");

// GET /api/edge-config - List edge configs or items
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const configId = searchParams.get("configId");

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return fail("NOT_FOUND", "Project not found", 404);
      }
    }

    // Get items in a specific config
    if (configId) {
      const config = await prisma.edgeConfig.findFirst({
        where: { id: configId },
        include: { items: true, project: { select: { id: true, name: true, slug: true } } },
      });
      return ok(config);
    }

    // Get user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    // Get all configs (optionally filtered by project)
    const configs = await prisma.edgeConfig.findMany({
      where: projectId
        ? { projectId }
        : { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(configs);
  } catch (error) {
    log.error("Failed to fetch edge config", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch edge config", 500);
  }
}

// POST /api/edge-config - Create config or set item
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, configName, configId, key, value } = body;

    if (!projectId) {
      return fail("VALIDATION_MISSING_FIELD", "Project ID is required", 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Create a new config
    if (configName && !configId) {
      const slug = configName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const config = await prisma.edgeConfig.create({
        data: {
          projectId,
          name: configName,
          slug,
        },
      });

      await prisma.activity.create({
        data: {
          userId: user.id,
          projectId,
          type: "edge_config",
          action: "created",
          description: `Created edge config "${configName}"`,
        },
      });

      return ok(config);
    }

    // Set an item in an existing config
    if (configId && key && value !== undefined) {
      const item = await prisma.edgeConfigItem.upsert({
        where: {
          configId_key: { configId, key },
        },
        update: { value },
        create: {
          configId,
          key,
          value,
        },
      });

      return ok(item);
    }

    return fail("BAD_REQUEST", "Invalid request", 400);
  } catch (error) {
    log.error("Failed to create edge config", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to create edge config", 500);
  }
}

// DELETE /api/edge-config - Delete config or item
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("configId");
    const key = searchParams.get("key");

    if (configId && key) {
      await prisma.edgeConfigItem.delete({
        where: { configId_key: { configId, key } },
      });
      return ok({ success: true });
    }

    if (configId) {
      const config = await prisma.edgeConfig.findFirst({
        where: {
          id: configId,
          project: { userId: user.id },
        },
      });

      if (!config) {
        return fail("NOT_FOUND", "Config not found", 404);
      }

      await prisma.edgeConfig.delete({ where: { id: configId } });
      return ok({ success: true });
    }

    return fail("VALIDATION_MISSING_FIELD", "ID required", 400);
  } catch (error) {
    log.error("Failed to delete", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to delete", 500);
  }
}
