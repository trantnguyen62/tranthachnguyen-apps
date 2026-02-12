/**
 * GitHub Webhook Handler
 * Handles push and pull request events for automatic deployments
 * Includes commit status updates and PR preview comments
 */

import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { triggerBuild } from "@/lib/build/worker";
import { generateSiteSlug, generateDeploymentUrl } from "@/lib/build/executor";
import {
  updateCommitStatus,
  postDeploymentComment,
} from "@/lib/integrations/github-app";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("webhooks/github");

// Types for GitHub webhook payloads
interface GitHubPushEvent {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    full_name: string;
    name: string;
    default_branch: string;
    clone_url: string;
    html_url: string;
    private: boolean;
  };
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    url: string;
  } | null;
  pusher: {
    name: string;
    email: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubPREvent {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    head: {
      ref: string;
      sha: string;
      repo: {
        full_name: string;
        clone_url: string;
      };
    };
    base: {
      ref: string;
      sha: string;
    };
    user: {
      login: string;
      avatar_url: string;
    };
    html_url: string;
  };
  repository: {
    id: number;
    full_name: string;
    name: string;
    clone_url: string;
    html_url: string;
    default_branch: string;
  };
  sender: {
    login: string;
  };
}

// Verify GitHub webhook signature
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Find project by repository URL or full name
async function findProjectByRepo(repoFullName: string) {
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { repositoryUrl: { contains: repoFullName } },
        { repositoryUrl: { contains: `github.com/${repoFullName}` } },
        { repositoryUrl: `https://github.com/${repoFullName}` },
        { repositoryUrl: `https://github.com/${repoFullName}.git` },
      ],
    },
    include: {
      user: true,
    },
  });

  return project;
}

interface DeploymentResult {
  deploymentId: string;
  projectId: string;
  projectName: string;
  status: string;
  url: string;
  prNumber?: number;
}

// Trigger a deployment with status updates
async function triggerDeployment(config: {
  project: NonNullable<Awaited<ReturnType<typeof findProjectByRepo>>>;
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  isPreview: boolean;
  prNumber?: number;
  prTitle?: string;
}): Promise<DeploymentResult | null> {
  const { project, branch, commit, commitMessage, author, isPreview, prNumber } =
    config;

  // Check if this is the right branch for production deployments
  if (!isPreview && branch !== project.repositoryBranch) {
    log.info(
      `Ignoring push to ${branch}, project configured for ${project.repositoryBranch}`
    );
    return null;
  }

  // Create deployment record
  const deployment = await prisma.deployment.create({
    data: {
      projectId: project.id,
      status: "QUEUED",
      branch,
      commitSha: commit,
      commitMessage: commitMessage.substring(0, 200),
    },
  });

  // Add initial log entries
  await prisma.deploymentLog.createMany({
    data: [
      {
        deploymentId: deployment.id,
        level: "info",
        message: `Deployment triggered`,
      },
      {
        deploymentId: deployment.id,
        level: "info",
        message: `Branch: ${branch}`,
      },
      {
        deploymentId: deployment.id,
        level: "info",
        message: `Commit: ${commit}`,
      },
      {
        deploymentId: deployment.id,
        level: "info",
        message: `Author: ${author}`,
      },
    ],
  });

  // Generate URL early for status updates
  const siteSlug = generateSiteSlug(project.slug, deployment.id);
  const url = generateDeploymentUrl(siteSlug);

  // Update commit status to pending
  await updateCommitStatus(project.id, commit, {
    state: "pending",
    description: isPreview ? "Building preview..." : "Building production...",
    targetUrl: url,
    context: isPreview ? "Cloudify / Preview" : "Cloudify / Production",
  });

  // Post PR comment for preview deployments
  if (isPreview && prNumber) {
    await postDeploymentComment(project.id, prNumber, url, "building");
  }

  // Log activity
  await prisma.activity.create({
    data: {
      userId: project.userId,
      projectId: project.id,
      type: "deployment",
      action: "deployment.webhook_triggered",
      description: `${isPreview ? "Preview" : "Production"} deployment triggered from GitHub`,
      metadata: {
        deploymentId: deployment.id,
        branch,
        commit,
        prNumber,
      },
    },
  });

  // Trigger the build process
  await triggerBuild(deployment.id);

  return {
    deploymentId: deployment.id,
    projectId: project.id,
    projectName: project.name,
    status: "queued",
    url,
    prNumber,
  };
}

// Handle GitHub push events
async function handlePush(payload: GitHubPushEvent) {
  // Validate required fields
  if (!payload.ref || !payload.repository?.full_name) {
    return {
      message: "Invalid push event payload: missing required fields",
      triggered: false,
    };
  }

  const branch = payload.ref.replace("refs/heads/", "");
  const repoFullName = payload.repository.full_name;
  const isDefaultBranch = branch === payload.repository.default_branch;

  // Skip if no commits (e.g., branch deletion)
  if (!payload.head_commit) {
    return {
      message: "No commits in push event (possibly branch deletion)",
      triggered: false,
    };
  }

  // Find project
  const project = await findProjectByRepo(repoFullName);
  if (!project) {
    return {
      message: `No project found for repository: ${repoFullName}`,
      triggered: false,
    };
  }

  const deployment = await triggerDeployment({
    project,
    branch,
    commit: payload.head_commit.id.substring(0, 7),
    commitMessage: payload.head_commit.message,
    author: payload.head_commit.author.name,
    isPreview: !isDefaultBranch,
  });

  if (!deployment) {
    return {
      message: `Push to ${branch} ignored (not configured branch)`,
      triggered: false,
    };
  }

  return {
    message: `Deployment triggered for ${branch}`,
    triggered: true,
    deployment,
  };
}

// Handle GitHub pull request events
async function handlePullRequest(payload: GitHubPREvent) {
  const validActions = ["opened", "synchronize", "reopened"];

  if (!validActions.includes(payload.action)) {
    return {
      message: `Ignoring PR action: ${payload.action}`,
      triggered: false,
    };
  }

  const repoFullName = payload.repository.full_name;
  const branch = payload.pull_request.head.ref;
  const prNumber = payload.pull_request.number;
  const prTitle = payload.pull_request.title;

  // Find project
  const project = await findProjectByRepo(repoFullName);
  if (!project) {
    return {
      message: `No project found for repository: ${repoFullName}`,
      triggered: false,
    };
  }

  const deployment = await triggerDeployment({
    project,
    branch,
    commit: payload.pull_request.head.sha.substring(0, 7),
    commitMessage: `PR #${prNumber}: ${prTitle}`,
    author: payload.pull_request.user.login,
    isPreview: true,
    prNumber,
    prTitle,
  });

  if (!deployment) {
    return {
      message: `Failed to trigger deployment for PR #${prNumber}`,
      triggered: false,
    };
  }

  return {
    message: `Preview deployment triggered for PR #${prNumber}`,
    triggered: true,
    deployment,
  };
}

// Handle PR closed event (cleanup)
async function handlePRClosed(payload: GitHubPREvent) {
  const repoFullName = payload.repository.full_name;
  const prNumber = payload.pull_request.number;

  const project = await findProjectByRepo(repoFullName);
  if (!project) {
    return { message: "Project not found", triggered: false };
  }

  // Log the PR closure
  await prisma.activity.create({
    data: {
      userId: project.userId,
      projectId: project.id,
      type: "deployment",
      action: "pr.closed",
      description: `PR #${prNumber} closed`,
      metadata: { prNumber },
    },
  });

  return {
    message: `PR #${prNumber} closed`,
    triggered: false,
  };
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");
    const deliveryId = request.headers.get("x-github-delivery");

    log.info(`GitHub webhook received: ${event} (${deliveryId})`);

    // Verify signature - REQUIRED for all webhook requests
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    // Webhook secret must be configured - this is a server config issue, not a client error
    if (!webhookSecret) {
      log.error("GITHUB_WEBHOOK_SECRET is not configured");
      return fail("SERVICE_UNAVAILABLE", "Webhook service unavailable", 503);
    }

    // Signature header must be present
    if (!signature) {
      log.error("Missing webhook signature");
      return fail("AUTH_REQUIRED", "Missing signature", 401);
    }

    // Verify the signature
    if (!verifySignature(payload, signature, webhookSecret)) {
      log.error("Invalid webhook signature");
      return fail("AUTH_REQUIRED", "Invalid signature", 401);
    }

    // Parse JSON payload with error handling
    let data;
    try {
      data = JSON.parse(payload);
    } catch {
      log.error("Invalid JSON payload");
      return fail("BAD_REQUEST", "Invalid JSON payload", 400);
    }

    let result;

    switch (event) {
      case "push":
        result = await handlePush(data as GitHubPushEvent);
        break;

      case "pull_request":
        if (data.action === "closed") {
          result = await handlePRClosed(data as GitHubPREvent);
        } else {
          result = await handlePullRequest(data as GitHubPREvent);
        }
        break;

      case "ping":
        result = {
          message: "Webhook configured successfully!",
          triggered: false,
          zen: data.zen,
        };
        break;

      case "check_suite":
      case "check_run":
        result = { message: `Ignored event: ${event}`, triggered: false };
        break;

      default:
        result = { message: `Unhandled event: ${event}`, triggered: false };
    }

    return ok(result);
  } catch (error) {
    log.error("Webhook processing error", error);
    return fail("INTERNAL_ERROR", "Failed to process webhook", 500);
  }
}

// Webhook info endpoint
export async function GET() {
  return ok({
    message: "Cloudify GitHub Webhook Endpoint",
    status: "active",
    supportedEvents: ["push", "pull_request", "ping"],
    webhookUrl: `${process.env.AUTH_URL || "https://cloudify.tranthachnguyen.com"}/api/webhooks/github`,
    features: [
      "Automatic production deployments on push to default branch",
      "Preview deployments for pull requests",
      "Commit status checks",
      "PR comments with preview URLs",
    ],
  });
}
