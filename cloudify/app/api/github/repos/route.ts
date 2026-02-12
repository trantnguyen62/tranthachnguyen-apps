/**
 * GitHub Repositories API
 * List and manage user's GitHub repositories for import
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("github/repos");
import { prisma } from "@/lib/prisma";
import {
  listUserRepositories,
  getRepository,
  getSuggestedSettings,
  createWebhook,
  parseRepoInfo,
} from "@/lib/integrations/github-app";

/**
 * GET /api/github/repos - List user's accessible repositories
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    // Get user's GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected. Please sign in with GitHub." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "30", 10);
    const sort = (searchParams.get("sort") || "updated") as
      | "created"
      | "updated"
      | "pushed"
      | "full_name";
    const direction = (searchParams.get("direction") || "desc") as
      | "asc"
      | "desc";
    const search = searchParams.get("search");

    let repos = await listUserRepositories(account.access_token, {
      page,
      perPage,
      sort,
      direction,
    });

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      repos = repos.filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchLower) ||
          repo.fullName.toLowerCase().includes(searchLower) ||
          repo.description?.toLowerCase().includes(searchLower)
      );
    }

    // Check which repos are already imported
    const existingProjects = await prisma.project.findMany({
      where: {
        userId: user.id,
        repoUrl: {
          in: repos.map((r) => r.htmlUrl),
        },
      },
      select: {
        id: true,
        repoUrl: true,
        slug: true,
      },
    });

    const importedUrls = new Map(
      existingProjects.map((p) => [p.repoUrl, { id: p.id, slug: p.slug }])
    );

    const reposWithStatus = repos.map((repo) => {
      const existing = importedUrls.get(repo.htmlUrl);
      return {
        ...repo,
        imported: !!existing,
        projectId: existing?.id,
        projectSlug: existing?.slug,
      };
    });

    return NextResponse.json({
      repos: reposWithStatus,
      page,
      perPage,
      hasMore: repos.length === perPage,
    });
  } catch (error) {
    log.error("Failed to list repositories", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to list repositories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/github/repos - Import a repository as a new project
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { repoFullName, projectName, branch } = body;

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    // Get user's GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    // Parse repo info
    const repoInfo = parseRepoInfo(repoFullName);
    if (!repoInfo) {
      return NextResponse.json(
        { error: "Invalid repository name format" },
        { status: 400 }
      );
    }

    // Get repository details
    const repo = await getRepository(
      account.access_token,
      repoInfo.owner,
      repoInfo.repo
    );

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found or not accessible" },
        { status: 404 }
      );
    }

    // Check if already imported
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: user.id,
        repoUrl: repo.htmlUrl,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          error: "Repository already imported",
          projectId: existingProject.id,
          projectSlug: existingProject.slug,
        },
        { status: 409 }
      );
    }

    // Get suggested settings based on package.json
    const settings = await getSuggestedSettings(
      account.access_token,
      repoInfo.owner,
      repoInfo.repo
    );

    // Generate unique project slug
    const baseSlug = repo.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.project.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: projectName || repo.name,
        slug,
        repoUrl: repo.htmlUrl,
        repoBranch: branch || repo.defaultBranch,
        framework: settings.framework || "other",
        buildCmd: settings.buildCommand,
        outputDir: settings.outputDir,
        installCmd: settings.installCommand,
        rootDir: ".",
        nodeVersion: "20",
      },
    });

    // Try to create webhook for automatic deployments
    const webhookUrl = `${process.env.AUTH_URL || "https://cloudify.tranthachnguyen.com"}/api/webhooks/github`;
    const webhookSecret =
      process.env.GITHUB_WEBHOOK_SECRET || "cloudify-webhook";

    let webhookCreated = false;
    try {
      const webhookId = await createWebhook(
        account.access_token,
        repoInfo.owner,
        repoInfo.repo,
        webhookUrl,
        webhookSecret
      );

      if (webhookId) {
        webhookCreated = true;
        // Store webhook ID for later management
        await prisma.project.update({
          where: { id: project.id },
          data: {
            // Using metadata or a dedicated field if available
          },
        });
      }
    } catch (webhookError) {
      log.warn("Failed to create webhook", { error: webhookError instanceof Error ? webhookError.message : String(webhookError) });
      // Continue without webhook - user can set up manually
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: project.id,
        type: "project",
        action: "project.imported",
        description: `Imported project from GitHub: ${repo.fullName}`,
        metadata: {
          repoFullName: repo.fullName,
          framework: settings.framework,
          webhookCreated,
        },
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        repoUrl: project.repoUrl,
        repoBranch: project.repoBranch,
        framework: project.framework,
        buildCmd: project.buildCmd,
        outputDir: project.outputDir,
      },
      webhookCreated,
      suggestedSettings: settings,
    });
  } catch (error) {
    log.error("Failed to import repository", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to import repository" },
      { status: 500 }
    );
  }
}
