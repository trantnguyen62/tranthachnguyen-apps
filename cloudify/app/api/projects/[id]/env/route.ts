import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";

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

    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify ownership - prevent IDOR
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify ownership - prevent IDOR
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
