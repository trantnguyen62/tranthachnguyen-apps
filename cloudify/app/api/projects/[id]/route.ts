import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError, checkProjectAccess, meetsMinimumRole } from "@/lib/auth/api-auth";
import { deleteSite } from "@/lib/build/site-deployer";
import { sanitizeSlug } from "@/lib/security/validation";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { handlePrismaError } from "@/lib/api/error-response";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("projects/[id]");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get a single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Check ownership or team membership (any team member can view)
    const access = await checkProjectAccess(user.id, id);
    if (!access.hasAccess) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        deployments: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        envVariables: {
          select: {
            id: true,
            key: true,
            isSecret: true,
            target: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    return ok(project);
  } catch (error: unknown) {
    log.error("Failed to fetch project", error);

    const prismaResp = handlePrismaError(error, "project");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to fetch project", 500);
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;

    // Check ownership or team membership (minimum role: admin to update settings)
    const patchAccess = await checkProjectAccess(user.id, id);
    if (!patchAccess.hasAccess) {
      return fail("NOT_FOUND", "Project not found", 404);
    }
    if (!patchAccess.isOwner && (!patchAccess.teamRole || !meetsMinimumRole(patchAccess.teamRole, "admin"))) {
      return fail("AUTH_FORBIDDEN", "Insufficient role - updating project requires admin role or higher", 403);
    }

    const { name, repoUrl, repoBranch, framework, buildCmd, outputDir, installCmd, rootDir, nodeVersion } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(repoUrl !== undefined && { repositoryUrl: repoUrl }),
        ...(repoBranch && { repositoryBranch: repoBranch }),
        ...(framework && { framework }),
        ...(buildCmd && { buildCommand: buildCmd }),
        ...(outputDir && { outputDirectory: outputDir }),
        ...(installCmd && { installCommand: installCmd }),
        ...(rootDir && { rootDirectory: rootDir }),
        ...(nodeVersion && { nodeVersion }),
      },
    });

    return ok(project);
  } catch (error: unknown) {
    log.error("Failed to update project", error);

    const prismaResp = handlePrismaError(error, "project");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to update project", 500);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Only project owner can delete (not team members)
    const deleteAccess = await checkProjectAccess(user.id, id);
    if (!deleteAccess.hasAccess || !deleteAccess.isOwner) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Clean up K8s deployment and DNS record using same slug format as deployment
    const siteSlug = sanitizeSlug(existing.slug || existing.name);
    try {
      await deleteSite(siteSlug);
    } catch (err) {
      log.warn(`Failed to cleanup K8s resources for ${siteSlug}`);
      // Continue with database deletion even if K8s cleanup fails
    }

    await prisma.project.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch (error: unknown) {
    log.error("Failed to delete project", error);

    const prismaResp = handlePrismaError(error, "project");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to delete project", 500);
  }
}
