import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError, checkProjectAccess, meetsMinimumRole } from "@/lib/auth/api-auth";
import { deleteSite } from "@/lib/build/site-deployer";
import { sanitizeSlug } from "@/lib/security/validation";

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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error("Failed to fetch project:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P1001" || prismaError.code === "P1002") {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
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
    const body = await request.json();

    // Check ownership or team membership (minimum role: admin to update settings)
    const patchAccess = await checkProjectAccess(user.id, id);
    if (!patchAccess.hasAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!patchAccess.isOwner && (!patchAccess.teamRole || !meetsMinimumRole(patchAccess.teamRole, "admin"))) {
      return NextResponse.json(
        { error: "Insufficient role - updating project requires admin role or higher" },
        { status: 403 }
      );
    }

    const { name, repoUrl, repoBranch, framework, buildCmd, outputDir, installCmd, rootDir, nodeVersion } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(repoUrl !== undefined && { repoUrl }),
        ...(repoBranch && { repoBranch }),
        ...(framework && { framework }),
        ...(buildCmd && { buildCmd }),
        ...(outputDir && { outputDir }),
        ...(installCmd && { installCmd }),
        ...(rootDir && { rootDir }),
        ...(nodeVersion && { nodeVersion }),
      },
    });

    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error("Failed to update project:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      // Record not found (deleted by concurrent request)
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      // Connection errors
      if (prismaError.code === "P1001" || prismaError.code === "P1002") {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Clean up K8s deployment and DNS record using same slug format as deployment
    const siteSlug = sanitizeSlug(existing.slug || existing.name);
    try {
      await deleteSite(siteSlug);
    } catch (err) {
      console.warn(`Failed to cleanup K8s resources for ${siteSlug}:`, err);
      // Continue with database deletion even if K8s cleanup fails
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete project:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P1001" || prismaError.code === "P1002") {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
