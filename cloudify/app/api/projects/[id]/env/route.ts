import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError, checkProjectAccess, meetsMinimumRole } from "@/lib/auth/api-auth";

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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!access.isOwner && (!access.teamRole || !meetsMinimumRole(access.teamRole, "admin"))) {
      return NextResponse.json(
        { error: "Insufficient role - viewing env vars requires admin role or higher" },
        { status: 403 }
      );
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

    return NextResponse.json({ envVariables });
  } catch (error) {
    console.error("Failed to fetch environment variables:", error);
    return NextResponse.json(
      { error: "Failed to fetch environment variables" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!writeAccess.isOwner && (!writeAccess.teamRole || !meetsMinimumRole(writeAccess.teamRole, "admin"))) {
      return NextResponse.json(
        { error: "Insufficient role - editing env vars requires admin role or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value, target = "production" } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const envVariable = await prisma.envVariable.create({
      data: {
        projectId: id,
        key,
        value: value || "",
        target,
      },
    });

    return NextResponse.json(envVariable, { status: 201 });
  } catch (error) {
    console.error("Failed to create environment variable:", error);
    return NextResponse.json(
      { error: "Failed to create environment variable" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!deleteAccess.isOwner && (!deleteAccess.teamRole || !meetsMinimumRole(deleteAccess.teamRole, "admin"))) {
      return NextResponse.json(
        { error: "Insufficient role - deleting env vars requires admin role or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { envId, key, target } = body;

    // Delete by ID if provided, otherwise by key+target
    if (envId) {
      const envVar = await prisma.envVariable.findFirst({
        where: { id: envId, projectId: id },
      });
      if (!envVar) {
        return NextResponse.json({ error: "Environment variable not found" }, { status: 404 });
      }
      await prisma.envVariable.delete({ where: { id: envId } });
    } else if (key && target) {
      const deleted = await prisma.envVariable.deleteMany({
        where: { projectId: id, key, target },
      });
      if (deleted.count === 0) {
        return NextResponse.json({ error: "Environment variable not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json(
        { error: "Either envId or both key and target are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete environment variable:", error);
    return NextResponse.json(
      { error: "Failed to delete environment variable" },
      { status: 500 }
    );
  }
}
