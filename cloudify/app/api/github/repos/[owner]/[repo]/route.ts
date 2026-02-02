/**
 * GitHub Repository Details API
 * Get repository info, branches, and suggested settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo } = await params;

    // Get user's GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeBranches = searchParams.get("branches") === "true";
    const includeSettings = searchParams.get("settings") === "true";

    // Get repository details
    const repository = await getRepository(account.access_token, owner, repo);

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found or not accessible" },
        { status: 404 }
      );
    }

    // Check if already imported
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        repoUrl: repository.htmlUrl,
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get repository:", error);
    return NextResponse.json(
      { error: "Failed to get repository" },
      { status: 500 }
    );
  }
}
