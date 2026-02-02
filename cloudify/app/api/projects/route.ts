import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";

// GET /api/projects - List all projects for the user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: {
        deployments: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { deployments: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error: unknown) {
    console.error("Failed to fetch projects:", error);

    // Handle Prisma connection errors
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
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json();
    const { name, repoUrl, framework, buildCmd, outputDir, installCmd, rootDir, nodeVersion } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists for this user
    const existing = await prisma.project.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A project with this name already exists" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        userId: user.id,
        repoUrl: repoUrl || null,
        framework: framework || "nextjs",
        buildCmd: buildCmd || "npm run build",
        outputDir: outputDir || ".next",
        installCmd: installCmd || "npm install",
        rootDir: rootDir || "./",
        nodeVersion: nodeVersion || "20",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create project:", error);

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      // Unique constraint violation
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "A project with this name already exists" },
          { status: 400 }
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
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
