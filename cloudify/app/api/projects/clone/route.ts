import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";
import { getPlanLimits } from "@/lib/billing/pricing";
import type { PlanType } from "@/lib/billing/pricing";

/**
 * POST /api/projects/clone - Clone an existing project
 * Copies project configuration and env vars, generates new slug
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Fetch source project with env vars (only if user owns it)
    const source = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
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
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check plan limits before cloning
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const userPlan = (userRecord?.plan || "free") as PlanType;
    const planLimits = getPlanLimits(userPlan);
    const currentProjectCount = await prisma.project.count({
      where: { userId: session.user.id },
    });
    if (planLimits.projects !== -1 && currentProjectCount >= planLimits.projects) {
      return NextResponse.json(
        { error: `Project limit reached (${planLimits.projects} projects on ${userPlan} plan). Upgrade to create more projects.` },
        { status: 402 }
      );
    }

    // Generate unique slug (with safety limit)
    const baseSlug = `${source.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    const MAX_ATTEMPTS = 50;
    while (counter <= MAX_ATTEMPTS) {
      const existing = await prisma.project.findUnique({
        where: { userId_slug: { userId: session.user.id, slug } },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    if (counter > MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many copies of this project exist" },
        { status: 400 }
      );
    }

    // Clone the project (without deployments, domains, activities)
    const cloned = await prisma.project.create({
      data: {
        name: `${source.name} (Copy)`,
        slug,
        userId: session.user.id,
        repoUrl: source.repoUrl,
        repoBranch: source.repoBranch,
        framework: source.framework,
        buildCmd: source.buildCmd,
        outputDir: source.outputDir,
        installCmd: source.installCmd,
        rootDir: source.rootDir,
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

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error("Failed to clone project:", error);
    return NextResponse.json(
      { error: "Failed to clone project" },
      { status: 500 }
    );
  }
}
