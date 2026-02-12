import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError, checkProjectAccess, meetsMinimumRole } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("projects/[id]/env");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/env - Get environment variables for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Check ownership or team membership (minimum role: admin for env secrets)
    const access = await checkProjectAccess(user.id, id);
    if (!access.hasAccess) {
      return fail("NOT_FOUND", "Project not found", 404);
    }
    if (!access.isOwner && (!access.teamRole || !meetsMinimumRole(access.teamRole, "admin"))) {
      return fail("AUTH_FORBIDDEN", "Insufficient role - viewing env vars requires admin role or higher", 403);
    }

    const envVariables = await prisma.envVariable.findMany({
      where: { projectId: id },
      select: {
        id: true,
        key: true,
        value: true,
        target: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({ envVariables });
  } catch (error) {
    log.error("Failed to fetch environment variables", error);
    return fail("INTERNAL_ERROR", "Failed to fetch environment variables", 500);
  }
}

// POST /api/projects/[id]/env - Create environment variable
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Check ownership or team membership (minimum role: admin for env secrets)
    const writeAccess = await checkProjectAccess(user.id, id);
    if (!writeAccess.hasAccess) {
      return fail("NOT_FOUND", "Project not found", 404);
    }
    if (!writeAccess.isOwner && (!writeAccess.teamRole || !meetsMinimumRole(writeAccess.teamRole, "admin"))) {
      return fail("AUTH_FORBIDDEN", "Insufficient role - editing env vars requires admin role or higher", 403);
    }

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { key, value, target = "production" } = body;

    if (!key || typeof key !== "string") {
      return fail("VALIDATION_MISSING_FIELD", "Key is required", 400);
    }

    const envVariable = await prisma.envVariable.create({
      data: {
        projectId: id,
        key,
        value: value || "",
        target,
      },
    });

    return ok(envVariable, { status: 201 });
  } catch (error) {
    log.error("Failed to create environment variable", error);
    return fail("INTERNAL_ERROR", "Failed to create environment variable", 500);
  }
}

// DELETE /api/projects/[id]/env - Delete an environment variable
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Check ownership or team membership (minimum role: admin for env secrets)
    const deleteAccess = await checkProjectAccess(user.id, id);
    if (!deleteAccess.hasAccess) {
      return fail("NOT_FOUND", "Project not found", 404);
    }
    if (!deleteAccess.isOwner && (!deleteAccess.teamRole || !meetsMinimumRole(deleteAccess.teamRole, "admin"))) {
      return fail("AUTH_FORBIDDEN", "Insufficient role - deleting env vars requires admin role or higher", 403);
    }

    const deleteParseResult = await parseJsonBody(request);
    if (isParseError(deleteParseResult)) return deleteParseResult;
    const body = deleteParseResult.data;
    const { envId, key, target } = body;

    // Delete by ID if provided, otherwise by key+target
    if (envId) {
      const envVar = await prisma.envVariable.findFirst({
        where: { id: envId, projectId: id },
      });
      if (!envVar) {
        return fail("NOT_FOUND", "Environment variable not found", 404);
      }
      await prisma.envVariable.delete({ where: { id: envId } });
    } else if (key && target) {
      const deleted = await prisma.envVariable.deleteMany({
        where: { projectId: id, key, target },
      });
      if (deleted.count === 0) {
        return fail("NOT_FOUND", "Environment variable not found", 404);
      }
    } else {
      return fail("VALIDATION_ERROR", "Either envId or both key and target are required", 400);
    }

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete environment variable", error);
    return fail("INTERNAL_ERROR", "Failed to delete environment variable", 500);
  }
}
