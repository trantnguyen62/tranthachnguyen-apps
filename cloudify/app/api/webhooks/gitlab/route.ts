/**
 * GitLab Webhook Handler
 *
 * Handles GitLab webhook events for:
 * - Push events (trigger deployments)
 * - Merge request events (preview deployments)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerBuild } from "@/lib/build/worker";
import {
  verifyGitLabWebhookSignature,
  parseGitLabWebhookEvent,
  GitLabPushEvent,
  GitLabMergeRequestEvent,
} from "@/lib/integrations/gitlab";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("webhooks/gitlab");

/**
 * POST /api/webhooks/gitlab
 */
export async function POST(request: NextRequest) {
  try {
    // Get event type from header
    const eventType = request.headers.get("x-gitlab-event");
    const webhookToken = request.headers.get("x-gitlab-token");

    if (!eventType) {
      return fail("BAD_REQUEST", "Missing X-GitLab-Event header", 400);
    }

    // Parse payload
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const payload = parseResult.data;

    // Find project by GitLab project ID
    const gitlabProjectId = payload.project?.id;
    if (!gitlabProjectId) {
      return fail("BAD_REQUEST", "Missing project ID in payload", 400);
    }

    // Look up the project by GitLab URL
    const gitlabProjectUrl = payload.project?.web_url;
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { repositoryUrl: gitlabProjectUrl },
          { repositoryUrl: { contains: `gitlab.com/${payload.project?.path_with_namespace}` } },
        ],
      },
      include: {
        integrations: {
          where: { type: "gitlab" },
        },
      },
    });

    if (!project) {
      log.info(`No project found for GitLab project: ${gitlabProjectUrl}`);
      return ok({ message: "Project not found" });
    }

    // Verify webhook token - required when configured, reject unsigned webhooks
    const integration = project.integrations[0];
    if (integration?.config) {
      const config = integration.config as { webhookSecret?: string };
      if (config.webhookSecret) {
        if (!webhookToken || webhookToken !== config.webhookSecret) {
          return fail("AUTH_REQUIRED", "Invalid webhook token", 401);
        }
      }
    } else if (!webhookToken) {
      // No integration config and no token - reject unsigned webhooks
      log.warn(`Unsigned webhook for project ${project.slug} - rejecting`);
      return fail("AUTH_REQUIRED", "Webhook token required", 401);
    }

    // Parse the event
    const event = parseGitLabWebhookEvent(eventType, payload);

    if (!event) {
      log.info(`Ignoring unsupported event type: ${eventType}`);
      return ok({ message: "Event type not supported" });
    }

    // Handle push events
    if (eventType === "Push Hook") {
      const pushEvent = event as GitLabPushEvent;
      const branch = pushEvent.ref.replace("refs/heads/", "");

      // Check if this is the production branch
      const isProductionBranch = branch === project.repositoryBranch;

      log.info(`Push to ${branch} on project ${project.slug}`, {
        commits: pushEvent.total_commits_count,
        isProduction: isProductionBranch,
      });

      // Create a deployment
      const deployment = await prisma.deployment.create({
        data: {
          projectId: project.id,
          status: "QUEUED",
          branch,
          commitSha: pushEvent.checkout_sha,
          commitMessage: pushEvent.commits[0]?.message || "Push from GitLab",
          isPreview: !isProductionBranch,
        },
      });

      await triggerBuild(deployment.id);

      return ok({
        message: "Deployment triggered",
        deploymentId: deployment.id,
        branch,
        commitSha: pushEvent.checkout_sha,
      });
    }

    // Handle merge request events
    if (eventType === "Merge Request Hook") {
      const mrEvent = event as GitLabMergeRequestEvent;
      const { object_attributes: mr } = mrEvent;

      log.info(`Merge request ${mr.iid} (${mr.state}) on project ${project.slug}`);

      // Only create preview deployments for opened/updated MRs
      if (mr.state === "opened") {
        const deployment = await prisma.deployment.create({
          data: {
            projectId: project.id,
            status: "QUEUED",
            branch: mr.source_branch,
            commitSha: mr.last_commit.id,
            commitMessage: mr.title,
            isPreview: true,
            prNumber: mr.iid,
          },
        });

        return ok({
          message: "Preview deployment triggered",
          deploymentId: deployment.id,
          branch: mr.source_branch,
          mrNumber: mr.iid,
        });
      }

      return ok({
        message: `Merge request ${mr.state}, no action taken`,
      });
    }

    return ok({ message: "Event processed" });
  } catch (error) {
    log.error("Webhook processing failed", error);
    return fail("INTERNAL_ERROR", "Webhook processing failed", 500);
  }
}
