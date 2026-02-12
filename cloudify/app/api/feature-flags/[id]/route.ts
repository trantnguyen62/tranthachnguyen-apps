import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("feature-flags/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/feature-flags/[id] - Get a feature flag
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!flag) {
      return fail("NOT_FOUND", "Feature flag not found", 404);
    }

    return ok(flag);
  } catch (error) {
    log.error("Failed to fetch feature flag", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch feature flag", 500);
  }
}

// PATCH /api/feature-flags/[id] - Update a feature flag
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!flag) {
      return fail("NOT_FOUND", "Feature flag not found", 404);
    }

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { name, description, enabled, percentage, conditions } = body;

    const updateData: {
      name?: string;
      description?: string;
      enabled?: boolean;
      percentage?: number;
      conditions?: object;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 100) {
        return fail("VALIDATION_ERROR", "Name must be a string (1-100 chars)", 400);
      }
      updateData.name = name;
    }
    if (description !== undefined) {
      if (typeof description !== "string") {
        return fail("VALIDATION_ERROR", "Description must be a string", 400);
      }
      updateData.description = description;
    }
    if (enabled !== undefined) {
      if (typeof enabled !== "boolean") {
        return fail("VALIDATION_ERROR", "Enabled must be a boolean", 400);
      }
      updateData.enabled = enabled;
    }
    if (percentage !== undefined) {
      if (typeof percentage !== "number" || isNaN(percentage)) {
        return fail("VALIDATION_ERROR", "Percentage must be a number", 400);
      }
      updateData.percentage = Math.min(100, Math.max(0, percentage));
    }
    if (conditions !== undefined) updateData.conditions = conditions;

    const updated = await prisma.featureFlag.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: flag.projectId,
        type: "feature_flag",
        action: "updated",
        description: `Updated feature flag "${updated.name}"`,
        metadata: { flagId: id, changes: updateData },
      },
    });

    return ok(updated);
  } catch (error) {
    log.error("Failed to update feature flag", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to update feature flag", 500);
  }
}

// DELETE /api/feature-flags/[id] - Delete a feature flag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const flag = await prisma.featureFlag.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!flag) {
      return fail("NOT_FOUND", "Feature flag not found", 404);
    }

    await prisma.featureFlag.delete({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: flag.projectId,
        type: "feature_flag",
        action: "deleted",
        description: `Deleted feature flag "${flag.name}"`,
        metadata: { flagId: id },
      },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete feature flag", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to delete feature flag", 500);
  }
}
