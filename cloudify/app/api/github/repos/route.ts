/**
 * GitHub Repositories API
 * List and manage user's GitHub repositories for import
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";

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
      return fail("BAD_REQUEST", "GitHub account not connected. Please sign in with GitHub.", 400);
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
        repositoryUrl: {
          in: repos.map((r) => r.htmlUrl),
        },
      },
      select: {
        id: true,
        repositoryUrl: true,
        slug: true,
      },
    });

    const importedUrls = new Map(
      existingProjects.map((p) => [p.repositoryUrl, { id: p.id, slug: p.slug }])
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

    return ok({
      repos: reposWithStatus,
      page,
      perPage,
      hasMore: repos.length === perPage,
    });
  } catch (error) {
    log.error("Failed to list repositories", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to list repositories", 500);
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

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { repoFullName, projectName, branch } = body;

    if (!repoFullName) {
      return fail("VALIDATION_MISSING_FIELD", "Repository name is required", 400);
    }

    // Get user's GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return fail("BAD_REQUEST", "GitHub account not connected", 400);
    }

    // Parse repo info
    const repoInfo = parseRepoInfo(repoFullName);
    if (!repoInfo) {
      return fail("VALIDATION_ERROR", "Invalid repository name format", 400);
    }

    // Get repository details
    const repo = await getRepository(
      account.access_token,
      repoInfo.owner,
      repoInfo.repo
    );

    if (!repo) {
      return fail("NOT_FOUND", "Repository not found or not accessible", 404);
    }

    // Check if already imported
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: user.id,
        repositoryUrl: repo.htmlUrl,
      },
    });

    if (existingProject) {
      return fail("CONFLICT", "Repository already imported", 409);
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
        repositoryUrl: repo.htmlUrl,
        repositoryBranch: branch || repo.defaultBranch,
        framework: settings.framework || "other",
        buildCommand: settings.buildCommand,
        outputDirectory: settings.outputDir,
        installCommand: settings.installCommand,
        rootDirectory: ".",
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

    return ok({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        repoUrl: project.repositoryUrl,
        repoBranch: project.repositoryBranch,
        framework: project.framework,
        buildCmd: project.buildCommand,
        outputDir: project.outputDirectory,
      },
      webhookCreated,
      suggestedSettings: settings,
    });
  } catch (error) {
    log.error("Failed to import repository", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to import repository", 500);
  }
}
