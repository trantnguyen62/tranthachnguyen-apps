/**
 * GitHub App Integration
 * Provides authenticated GitHub API access for repository management,
 * commit status updates, and PR comments
 */

import { Octokit } from "@octokit/rest";
import { prisma } from "@/lib/prisma";

// Configuration
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Cache for installation tokens
const tokenCache = new Map<
  string,
  { token: string; expiresAt: Date }
>();

/**
 * Get Octokit instance for user (using their OAuth token)
 */
export function getOctokitForUser(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

/**
 * Get installation access token for a repository
 * This is used for GitHub App installations
 */
async function getInstallationToken(
  installationId: string
): Promise<string | null> {
  // Check cache
  const cached = tokenCache.get(installationId);
  if (cached && cached.expiresAt > new Date()) {
    return cached.token;
  }

  // For now, we use OAuth tokens from user accounts
  // GitHub App installation would require JWT signing with private key
  // This is a simplified version using user OAuth tokens
  return null;
}

/**
 * Create an authenticated Octokit instance for a project
 * Uses the project owner's GitHub access token
 */
export async function getOctokitForProject(
  projectId: string
): Promise<Octokit | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user: {
        include: {
          accounts: {
            where: { provider: "github" },
          },
        },
      },
    },
  });

  if (!project?.user?.accounts?.[0]?.access_token) {
    return null;
  }

  return getOctokitForUser(project.user.accounts[0].access_token);
}

/**
 * Parse repository owner and name from URL or full name
 */
export function parseRepoInfo(
  repoUrlOrName: string
): { owner: string; repo: string } | null {
  // Handle full name format: "owner/repo"
  if (repoUrlOrName.includes("/") && !repoUrlOrName.includes("://")) {
    const [owner, repo] = repoUrlOrName.split("/");
    return { owner, repo: repo.replace(".git", "") };
  }

  // Handle URL format
  const match = repoUrlOrName.match(
    /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/
  );
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}

// ============ Commit Status API ============

export type CommitState = "error" | "failure" | "pending" | "success";

export interface CommitStatus {
  state: CommitState;
  description: string;
  targetUrl?: string;
  context?: string;
}

/**
 * Update commit status on GitHub
 */
export async function updateCommitStatus(
  projectId: string,
  commitSha: string,
  status: CommitStatus
): Promise<boolean> {
  try {
    const octokit = await getOctokitForProject(projectId);
    if (!octokit) {
      console.error("No GitHub access for project:", projectId);
      return false;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.repoUrl) {
      return false;
    }

    const repoInfo = parseRepoInfo(project.repoUrl);
    if (!repoInfo) {
      return false;
    }

    await octokit.repos.createCommitStatus({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      sha: commitSha,
      state: status.state,
      description: status.description.substring(0, 140), // GitHub limit
      target_url: status.targetUrl,
      context: status.context || "Cloudify",
    });

    return true;
  } catch (error) {
    console.error("Failed to update commit status:", error);
    return false;
  }
}

/**
 * Update deployment status based on deployment state
 */
export async function updateDeploymentStatus(
  deploymentId: string,
  state: "queued" | "building" | "ready" | "error",
  deploymentUrl?: string
): Promise<boolean> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: { project: true },
  });

  if (!deployment?.commitSha || !deployment.project) {
    return false;
  }

  const statusMap: Record<string, CommitStatus> = {
    queued: {
      state: "pending",
      description: "Deployment queued",
      context: "Cloudify / Deploy",
    },
    building: {
      state: "pending",
      description: "Building...",
      context: "Cloudify / Deploy",
    },
    ready: {
      state: "success",
      description: "Deployment successful",
      targetUrl: deploymentUrl,
      context: "Cloudify / Deploy",
    },
    error: {
      state: "failure",
      description: "Deployment failed",
      targetUrl: deploymentUrl,
      context: "Cloudify / Deploy",
    },
  };

  const status = statusMap[state];
  if (!status) {
    return false;
  }

  return updateCommitStatus(deployment.projectId, deployment.commitSha, status);
}

// ============ Pull Request API ============

/**
 * Post a comment on a pull request
 */
export async function postPRComment(
  projectId: string,
  prNumber: number,
  body: string
): Promise<boolean> {
  try {
    const octokit = await getOctokitForProject(projectId);
    if (!octokit) {
      return false;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.repoUrl) {
      return false;
    }

    const repoInfo = parseRepoInfo(project.repoUrl);
    if (!repoInfo) {
      return false;
    }

    await octokit.issues.createComment({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      issue_number: prNumber,
      body,
    });

    return true;
  } catch (error) {
    console.error("Failed to post PR comment:", error);
    return false;
  }
}

/**
 * Post deployment preview comment on PR
 */
export async function postDeploymentComment(
  projectId: string,
  prNumber: number,
  deploymentUrl: string,
  status: "building" | "ready" | "error",
  buildTime?: number
): Promise<boolean> {
  const statusEmoji = {
    building: "🔨",
    ready: "✅",
    error: "❌",
  };

  const statusText = {
    building: "Building preview deployment...",
    ready: "Preview deployment is ready!",
    error: "Preview deployment failed",
  };

  let body = `## ${statusEmoji[status]} Cloudify Preview

${statusText[status]}

`;

  if (status === "ready") {
    body += `**Preview URL:** ${deploymentUrl}

`;
    if (buildTime) {
      body += `⏱️ Built in ${(buildTime / 1000).toFixed(1)}s
`;
    }
  }

  body += `
---
<sub>Deployed with [Cloudify](https://cloudify.tranthachnguyen.com)</sub>`;

  return postPRComment(projectId, prNumber, body);
}

/**
 * Update existing PR comment (find and edit)
 */
export async function updatePRComment(
  projectId: string,
  prNumber: number,
  body: string
): Promise<boolean> {
  try {
    const octokit = await getOctokitForProject(projectId);
    if (!octokit) {
      return false;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.repoUrl) {
      return false;
    }

    const repoInfo = parseRepoInfo(project.repoUrl);
    if (!repoInfo) {
      return false;
    }

    // Find existing Cloudify comment
    const comments = await octokit.issues.listComments({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      issue_number: prNumber,
    });

    const cloudifyComment = comments.data.find(
      (c) =>
        c.body?.includes("Cloudify Preview") ||
        c.body?.includes("cloudify.tranthachnguyen.com")
    );

    if (cloudifyComment) {
      // Update existing comment
      await octokit.issues.updateComment({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        comment_id: cloudifyComment.id,
        body,
      });
    } else {
      // Create new comment
      await octokit.issues.createComment({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        issue_number: prNumber,
        body,
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to update PR comment:", error);
    return false;
  }
}

// ============ Repository API ============

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  updatedAt: string;
}

/**
 * List repositories accessible to the user
 */
export async function listUserRepositories(
  accessToken: string,
  options: {
    page?: number;
    perPage?: number;
    sort?: "created" | "updated" | "pushed" | "full_name";
    direction?: "asc" | "desc";
  } = {}
): Promise<Repository[]> {
  const octokit = getOctokitForUser(accessToken);

  const { page = 1, perPage = 30, sort = "updated", direction = "desc" } = options;

  const response = await octokit.repos.listForAuthenticatedUser({
    page,
    per_page: perPage,
    sort,
    direction,
    affiliation: "owner,collaborator,organization_member",
  });

  return response.data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    language: repo.language,
    updatedAt: repo.updated_at || new Date().toISOString(),
  }));
}

/**
 * Get repository details
 */
export async function getRepository(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Repository | null> {
  try {
    const octokit = getOctokitForUser(accessToken);

    const response = await octokit.repos.get({
      owner,
      repo,
    });

    const data = response.data;
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      private: data.private,
      defaultBranch: data.default_branch,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
      language: data.language,
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * List branches for a repository
 */
export async function listBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const octokit = getOctokitForUser(accessToken);

  const response = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  return response.data.map((b) => b.name);
}

/**
 * Get the default package.json from a repository
 */
export async function getPackageJson(
  accessToken: string,
  owner: string,
  repo: string,
  branch?: string
): Promise<Record<string, unknown> | null> {
  try {
    const octokit = getOctokitForUser(accessToken);

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
      ref: branch,
    });

    if ("content" in response.data) {
      const content = Buffer.from(response.data.content, "base64").toString(
        "utf-8"
      );
      return JSON.parse(content);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect framework from package.json
 */
export function detectFramework(
  packageJson: Record<string, unknown>
): string | null {
  const deps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  if (deps.next) return "next";
  if (deps.nuxt) return "nuxt";
  if (deps.gatsby) return "gatsby";
  if (deps["@sveltejs/kit"]) return "sveltekit";
  if (deps.svelte) return "svelte";
  if (deps.vue) return "vue";
  if (deps.react) return "react";
  if (deps.astro) return "astro";
  if (deps.vite) return "vite";

  return null;
}

/**
 * Get suggested build settings for a repository
 */
export async function getSuggestedSettings(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{
  framework: string | null;
  buildCommand: string;
  outputDir: string;
  installCommand: string;
}> {
  const packageJson = await getPackageJson(accessToken, owner, repo);

  if (!packageJson) {
    return {
      framework: null,
      buildCommand: "npm run build",
      outputDir: "dist",
      installCommand: "npm install",
    };
  }

  const framework = detectFramework(packageJson);
  const scripts = (packageJson.scripts as Record<string, string>) || {};

  // Framework-specific defaults
  const frameworkSettings: Record<
    string,
    { buildCommand: string; outputDir: string }
  > = {
    next: { buildCommand: "npm run build", outputDir: ".next" },
    nuxt: { buildCommand: "npm run build", outputDir: ".output" },
    gatsby: { buildCommand: "npm run build", outputDir: "public" },
    sveltekit: { buildCommand: "npm run build", outputDir: "build" },
    svelte: { buildCommand: "npm run build", outputDir: "public" },
    vue: { buildCommand: "npm run build", outputDir: "dist" },
    react: { buildCommand: "npm run build", outputDir: "build" },
    astro: { buildCommand: "npm run build", outputDir: "dist" },
    vite: { buildCommand: "npm run build", outputDir: "dist" },
  };

  const settings = framework
    ? frameworkSettings[framework]
    : { buildCommand: "npm run build", outputDir: "dist" };

  // Check for custom build script
  const buildCommand = scripts.build
    ? "npm run build"
    : settings.buildCommand;

  return {
    framework,
    buildCommand,
    outputDir: settings.outputDir,
    installCommand: "npm install",
  };
}

// ============ Webhook Management ============

/**
 * Create a webhook for a repository
 */
export async function createWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
): Promise<number | null> {
  try {
    const octokit = getOctokitForUser(accessToken);

    const response = await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
      },
      events: ["push", "pull_request"],
      active: true,
    });

    return response.data.id;
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return null;
  }
}

/**
 * Delete a webhook from a repository
 */
export async function deleteWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  webhookId: number
): Promise<boolean> {
  try {
    const octokit = getOctokitForUser(accessToken);

    await octokit.repos.deleteWebhook({
      owner,
      repo,
      hook_id: webhookId,
    });

    return true;
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return false;
  }
}

/**
 * List existing webhooks for a repository
 */
export async function listWebhooks(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Array<{ id: number; url: string; events: string[] }>> {
  try {
    const octokit = getOctokitForUser(accessToken);

    const response = await octokit.repos.listWebhooks({
      owner,
      repo,
    });

    return response.data.map((hook) => ({
      id: hook.id,
      url: hook.config.url || "",
      events: hook.events,
    }));
  } catch {
    return [];
  }
}
