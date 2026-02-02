/**
 * Monorepo Detection API
 *
 * POST /api/detect-monorepo
 * Body: { repoUrl: string } or { files: string[], fileContents?: Record<string, string> }
 *
 * Detects monorepo configuration and lists deployable packages.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  detectMonorepo,
  getSupportedMonorepoTools,
} from "@/lib/build/monorepo-detector";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repoUrl, files, fileContents } = body;

    // Option 1: Detect from GitHub repo URL
    if (repoUrl) {
      // Parse GitHub URL
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid GitHub URL" },
          { status: 400 }
        );
      }

      const [, owner, repo] = match;

      // Fetch repository file tree from GitHub API
      const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN
              ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
              : {}),
          },
        }
      );

      if (!treeResponse.ok) {
        // Try 'master' branch
        const masterResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              ...(process.env.GITHUB_TOKEN
                ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
                : {}),
            },
          }
        );

        if (!masterResponse.ok) {
          return NextResponse.json(
            { error: "Failed to fetch repository tree" },
            { status: 400 }
          );
        }

        const masterTree = await masterResponse.json();
        return await processGitHubTree(masterTree, owner, repo);
      }

      const tree = await treeResponse.json();
      return await processGitHubTree(tree, owner, repo);
    }

    // Option 2: Detect from provided file list
    if (files && Array.isArray(files)) {
      const result = await detectMonorepo(files, fileContents);

      return NextResponse.json({
        detected: result.config,
        detectedBy: result.detectedBy,
        suggestions: result.suggestions,
        packages: result.config.packages.map((pkg) => ({
          name: pkg.name,
          path: pkg.relativePath,
          framework: pkg.framework,
          isDeployable: pkg.isDeployable,
        })),
      });
    }

    return NextResponse.json(
      { error: "Provide either repoUrl or files array" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Monorepo detection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processGitHubTree(
  tree: { tree: Array<{ path: string; type: string }> },
  owner: string,
  repo: string
) {
  const files = tree.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  // Fetch key config files
  const configFiles = [
    "package.json",
    "turbo.json",
    "nx.json",
    "lerna.json",
    "pnpm-workspace.yaml",
  ];

  const fileContents: Record<string, string> = {};

  // Fetch package.json files
  const packageJsonFiles = files.filter((f) => f.endsWith("package.json"));
  const filesToFetch = [
    ...configFiles.filter((f) => files.includes(f)),
    ...packageJsonFiles.slice(0, 20), // Limit to 20 package.json files
  ];

  await Promise.all(
    filesToFetch.map(async (filePath) => {
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`,
          {
            headers: process.env.GITHUB_TOKEN
              ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
              : {},
          }
        );

        if (response.ok) {
          fileContents[filePath] = await response.text();
        }
      } catch {
        // Ignore fetch errors
      }
    })
  );

  const result = await detectMonorepo(files, fileContents);

  return NextResponse.json({
    detected: result.config,
    detectedBy: result.detectedBy,
    suggestions: result.suggestions,
    packages: result.config.packages.map((pkg) => ({
      name: pkg.name,
      path: pkg.relativePath,
      framework: pkg.framework,
      isDeployable: pkg.isDeployable,
    })),
    repoInfo: { owner, repo },
  });
}

// GET - List supported monorepo tools
export async function GET() {
  const tools = getSupportedMonorepoTools();
  return NextResponse.json({ tools });
}
