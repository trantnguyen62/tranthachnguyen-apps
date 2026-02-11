import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getPlanLimits } from "@/lib/billing/pricing";
import type { PlanType } from "@/lib/billing/pricing";

// GET /api/projects - List all projects for the user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    // Count total for pagination metadata
    const total = await prisma.project.count({
      where: { userId: user.id },
    });

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
      skip,
      take: limit,
    });

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
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

    // Check plan limits for project creation
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    const userPlan = (userRecord?.plan || "free") as PlanType;
    const planLimits = getPlanLimits(userPlan);
    const currentProjectCount = await prisma.project.count({
      where: { userId: user.id },
    });
    if (planLimits.projects !== -1 && currentProjectCount >= planLimits.projects) {
      return NextResponse.json(
        { error: `Project limit reached (${planLimits.projects} projects on ${userPlan} plan). Upgrade to create more projects.` },
        { status: 402 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { name, repoUrl, repoBranch, framework, buildCmd, outputDir, installCmd, rootDir, nodeVersion } = body;

    // Validate name is a non-empty string
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Sanitize name first - strip HTML tags to prevent XSS
    const sanitizedName = name.trim().replace(/<[^>]*>/g, "");

    if (!sanitizedName) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Validate sanitized name length
    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: "Project name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Validate framework against allowed values
    const VALID_FRAMEWORKS = [
      "nextjs", "react", "vue", "nuxt", "svelte", "astro",
      "gatsby", "remix", "docusaurus", "nodejs", "static", "other",
    ];
    const validFramework = framework && VALID_FRAMEWORKS.includes(framework) ? framework : "nextjs";

    // Generate slug from name
    const slug = sanitizedName
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

    // Validate repoBranch if provided (alphanumeric, dots, slashes, hyphens, underscores)
    const validBranch = repoBranch && /^[a-zA-Z0-9._\/-]+$/.test(repoBranch) ? repoBranch : "main";

    const project = await prisma.project.create({
      data: {
        name: sanitizedName,
        slug,
        userId: user.id,
        repoUrl: repoUrl || null,
        repoBranch: validBranch,
        framework: validFramework,
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
