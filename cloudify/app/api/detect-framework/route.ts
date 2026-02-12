/**
 * Framework Detection API
 *
 * POST /api/detect-framework
 * Body: { repoUrl: string } or { files: string[], packageJson?: string }
 *
 * Automatically detects the framework from a repository or file list.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import {
  detectFramework,
  getSupportedFrameworks,
  parseBuildConfig,
} from "@/lib/build/framework-detector";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("detect-framework");

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { repoUrl, files, packageJson, vercelJson, cloudifyJson } = body;

    // Option 1: Detect from GitHub repo URL
    if (repoUrl) {
      // Parse GitHub URL
      const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid GitHub URL" },
          { status: 400 }
        );
      }

      const [, owner, repo] = match;

      // Fetch repository file list from GitHub API
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN
              ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
              : {}),
          },
        }
      );

      if (!repoResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch repository contents" },
          { status: 400 }
        );
      }

      const contents = await repoResponse.json();
      const fileNames = contents.map((item: { name: string }) => item.name);

      // Try to fetch package.json
      let pkgJsonContent: string | undefined;
      const pkgJsonFile = contents.find(
        (item: { name: string }) => item.name === "package.json"
      );

      if (pkgJsonFile) {
        const pkgResponse = await fetch(pkgJsonFile.download_url);
        if (pkgResponse.ok) {
          pkgJsonContent = await pkgResponse.text();
        }
      }

      // Detect framework
      const result = await detectFramework(fileNames, pkgJsonContent);

      return NextResponse.json({
        detected: result,
        repoInfo: { owner, repo },
      });
    }

    // Option 2: Detect from provided file list
    if (files && Array.isArray(files)) {
      const result = await detectFramework(files, packageJson);

      // Apply overrides from vercel.json or cloudify.json
      let overrides = null;
      if (vercelJson) {
        overrides = parseBuildConfig(vercelJson);
      } else if (cloudifyJson) {
        overrides = parseBuildConfig(cloudifyJson);
      }

      if (overrides) {
        result.framework = { ...result.framework, ...overrides };
        result.detectedBy.push("config file overrides");
      }

      return NextResponse.json({ detected: result });
    }

    return NextResponse.json(
      { error: "Provide either repoUrl or files array" },
      { status: 400 }
    );
  } catch (error) {
    log.error("Framework detection error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List supported frameworks
export async function GET() {
  const frameworks = getSupportedFrameworks();
  return NextResponse.json({ frameworks });
}
