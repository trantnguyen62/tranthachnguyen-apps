/**
 * GitHub Repository Details API
 * Get repository info, branches, and suggested settings
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("github/repos/[owner]/[repo]");
import { prisma } from "@/lib/prisma";
import {
  getRepository,
  listBranches,
  getSuggestedSettings,
} from "@/lib/integrations/github-app";

interface RouteParams {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

/**
 * GET /api/github/repos/[owner]/[repo] - Get repository details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { owner, repo } = await params;

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

    const { searchParams } = new URL(request.url);
    const includeBranches = searchParams.get("branches") === "true";
    const includeSettings = searchParams.get("settings") === "true";

    // Get repository details
    const repository = await getRepository(account.access_token, owner, repo);

    if (!repository) {
      return fail("NOT_FOUND", "Repository not found or not accessible", 404);
    }

    // Check if already imported
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: user.id,
        repositoryUrl: repository.htmlUrl,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    const response: Record<string, unknown> = {
      repository: {
        ...repository,
        imported: !!existingProject,
        projectId: existingProject?.id,
        projectSlug: existingProject?.slug,
      },
    };

    // Include branches if requested
    if (includeBranches) {
      const branches = await listBranches(account.access_token, owner, repo);
      response.branches = branches;
    }

    // Include suggested settings if requested
    if (includeSettings) {
      const settings = await getSuggestedSettings(
        account.access_token,
        owner,
        repo
      );
      response.suggestedSettings = settings;
    }

    return ok(response);
  } catch (error) {
    log.error("Failed to get repository", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to get repository", 500);
  }
}
