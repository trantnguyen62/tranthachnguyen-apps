import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getPlanLimits } from "@/lib/billing/pricing";
import type { PlanType } from "@/lib/billing/pricing";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("projects/clone");

/**
 * POST /api/projects/clone - Clone an existing project
 * Copies project configuration and env vars, generates new slug
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("BAD_REQUEST", "Invalid request body", 400);
    }

    const { projectId } = body;
    if (!projectId) {
      return fail("VALIDATION_MISSING_FIELD", "projectId is required", 400);
    }

    // Fetch source project with env vars (only if user owns it)
    const source = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: {
        envVariables: {
          select: {
            key: true,
            value: true,
            target: true,
            isSecret: true,
          },
        },
      },
    });

    if (!source) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Check plan limits before cloning
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
      return fail("PAYMENT_REQUIRED", `Project limit reached (${planLimits.projects} projects on ${userPlan} plan). Upgrade to create more projects.`, 402);
    }

    // Generate unique slug (with safety limit)
    const baseSlug = `${source.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    const MAX_ATTEMPTS = 50;
    while (counter <= MAX_ATTEMPTS) {
      const existing = await prisma.project.findUnique({
        where: { userId_slug: { userId: user.id, slug } },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    if (counter > MAX_ATTEMPTS) {
      return fail("BAD_REQUEST", "Too many copies of this project exist", 400);
    }

    // Clone the project (without deployments, domains, activities)
    const cloned = await prisma.project.create({
      data: {
        name: `${source.name} (Copy)`,
        slug,
        userId: user.id,
        repositoryUrl: source.repositoryUrl,
        repositoryBranch: source.repositoryBranch,
        framework: source.framework,
        buildCommand: source.buildCommand,
        outputDirectory: source.outputDirectory,
        installCommand: source.installCommand,
        rootDirectory: source.rootDirectory,
        nodeVersion: source.nodeVersion,
        monorepoTool: source.monorepoTool,
        monorepoPackage: source.monorepoPackage,
        // Clone env vars
        envVariables: {
          create: source.envVariables.map((env) => ({
            key: env.key,
            value: env.value,
            target: env.target,
            isSecret: env.isSecret,
          })),
        },
      },
    });

    return ok(cloned, { status: 201 });
  } catch (error) {
    log.error("Failed to clone project", error);
    return fail("INTERNAL_ERROR", "Failed to clone project", 500);
  }
}
