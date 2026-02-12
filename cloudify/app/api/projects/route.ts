import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getPlanLimits } from "@/lib/billing/pricing";
import type { PlanType } from "@/lib/billing/pricing";
import { getRouteLogger } from "@/lib/api/logger";
import { withCache, noCache } from "@/lib/api/cache-headers";
import { handlePrismaError } from "@/lib/api/error-response";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

const log = getRouteLogger("projects");

// GET /api/projects - List all projects for the user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);

    // Count total for pagination metadata
    const total = await prisma.project.count({
      where: { userId: user.id },
    });

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        ...cursorWhere,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        framework: true,
        repositoryUrl: true,
        repositoryBranch: true,
        createdAt: true,
        updatedAt: true,
        deployments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            branch: true,
            siteSlug: true,
          },
        },
        _count: {
          select: { deployments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to detect hasMore
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    return withCache(
      ok(items, {
        pagination: {
          cursor: nextCursor,
          hasMore,
          total,
        },
      }),
      { maxAge: 10, staleWhileRevalidate: 30 }
    );
  } catch (error: unknown) {
    const prismaResp = handlePrismaError(error, "project");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to fetch projects", 500);
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
      return fail("PAYMENT_REQUIRED", `Project limit reached (${planLimits.projects} projects on ${userPlan} plan). Upgrade to create more projects.`, 402, {
        currentCount: currentProjectCount,
        limit: planLimits.projects,
        plan: userPlan,
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("BAD_REQUEST", "Invalid request body", 400);
    }
    const { name, repoUrl, repoBranch, framework, buildCmd, outputDir, installCmd, rootDir, nodeVersion } = body;

    // Validate name is a non-empty string
    if (typeof name !== "string" || !name.trim()) {
      return fail("VALIDATION_MISSING_FIELD", "Project name is required", 422, {
        fields: [{ field: "name", message: "Project name is required" }],
      });
    }

    // Sanitize name first - strip HTML tags to prevent XSS
    const sanitizedName = name.trim().replace(/<[^>]*>/g, "");

    if (!sanitizedName) {
      return fail("VALIDATION_MISSING_FIELD", "Project name is required", 422, {
        fields: [{ field: "name", message: "Project name is required" }],
      });
    }

    // Validate sanitized name length
    if (sanitizedName.length > 100) {
      return fail("VALIDATION_ERROR", "Project name must be 100 characters or less", 422, {
        fields: [{ field: "name", message: "Project name must be 100 characters or less" }],
      });
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
      return fail("CONFLICT", "A project with this name already exists", 409);
    }

    // Validate repoBranch if provided (alphanumeric, dots, slashes, hyphens, underscores)
    const validBranch = repoBranch && /^[a-zA-Z0-9._\/-]+$/.test(repoBranch) ? repoBranch : "main";

    const project = await prisma.project.create({
      data: {
        name: sanitizedName,
        slug,
        userId: user.id,
        repositoryUrl: repoUrl || null,
        repositoryBranch: validBranch,
        framework: validFramework,
        buildCommand: buildCmd || "npm run build",
        outputDirectory: outputDir || ".next",
        installCommand: installCmd || "npm install",
        rootDirectory: rootDir || "./",
        nodeVersion: nodeVersion || "20",
      },
    });

    return noCache(ok(project, { status: 201 }));
  } catch (error: unknown) {
    const prismaResp = handlePrismaError(error, "project");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to create project", 500);
  }
}
