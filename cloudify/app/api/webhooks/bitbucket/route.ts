/**
 * Bitbucket Webhook Handler
 *
 * Handles Bitbucket webhook events for:
 * - Push events (trigger deployments)
 * - Pull request events (preview deployments)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerBuild } from "@/lib/build/worker";
import {
  parseBitbucketWebhookEvent,
  BitbucketPushEvent,
  BitbucketPullRequestEvent,
} from "@/lib/integrations/bitbucket";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("webhooks/bitbucket");

/**
 * POST /api/webhooks/bitbucket
 */
export async function POST(request: NextRequest) {
  try {
    // Get event type from header
    const eventKey = request.headers.get("x-event-key");
    const hookUuid = request.headers.get("x-hook-uuid");

    if (!eventKey) {
      return fail("BAD_REQUEST", "Missing X-Event-Key header", 400);
    }

    // Parse payload
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const payload = parseResult.data;

    // Find project by Bitbucket repository
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      return fail("BAD_REQUEST", "Missing repository in payload", 400);
    }

    // Look up the project by Bitbucket URL
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { repositoryUrl: { contains: `bitbucket.org/${repoFullName}` } },
          { repositoryUrl: { contains: repoFullName } },
        ],
      },
      include: {
        integrations: {
          where: { type: "bitbucket" },
        },
      },
    });

    if (!project) {
      log.info(`No project found for repository: ${repoFullName}`);
      return ok({ message: "Project not found" });
    }

    // Parse the event
    const event = parseBitbucketWebhookEvent(eventKey, payload);

    if (!event) {
      log.info(`Ignoring unsupported event type: ${eventKey}`);
      return ok({ message: "Event type not supported" });
    }

    // Handle push events
    if (eventKey === "repo:push") {
      const pushEvent = event as BitbucketPushEvent;
      const changes = pushEvent.push.changes;

      if (!changes || changes.length === 0) {
        return ok({ message: "No changes in push" });
      }

      // Process the most recent change
      const latestChange = changes[0];
      if (!latestChange.new) {
        return ok({ message: "Branch deleted, no action" });
      }

      const branch = latestChange.new.name;
      const commitSha = latestChange.new.target.hash;
      const commitMessage = latestChange.new.target.message;

      // Check if this is the production branch
      const isProductionBranch = branch === project.repositoryBranch;

      log.info(`Push to ${branch} on project ${project.slug}`, {
        commitSha,
        isProduction: isProductionBranch,
      });

      // Create a deployment
      const deployment = await prisma.deployment.create({
        data: {
          projectId: project.id,
          status: "QUEUED",
          branch,
          commitSha,
          commitMessage: commitMessage || "Push from Bitbucket",
          isPreview: !isProductionBranch,
        },
      });

      await triggerBuild(deployment.id);

      return ok({
        message: "Deployment triggered",
        deploymentId: deployment.id,
        branch,
        commitSha,
      });
    }

    // Handle pull request events
    if (eventKey.startsWith("pullrequest:")) {
      const prEvent = event as BitbucketPullRequestEvent;
      const { pullrequest: pr } = prEvent;

      log.info(`Pull request ${pr.id} (${pr.state}) on project ${project.slug}`);

      // Only create preview deployments for opened/updated PRs
      if (eventKey === "pullrequest:created" || eventKey === "pullrequest:updated") {
        if (pr.state === "OPEN") {
          const deployment = await prisma.deployment.create({
            data: {
              projectId: project.id,
              status: "QUEUED",
              branch: pr.source.branch.name,
              commitSha: pr.source.commit.hash,
              commitMessage: pr.title,
              isPreview: true,
              prNumber: pr.id,
            },
          });

          return ok({
            message: "Preview deployment triggered",
            deploymentId: deployment.id,
            branch: pr.source.branch.name,
            prNumber: pr.id,
          });
        }
      }

      return ok({
        message: `Pull request ${pr.state.toLowerCase()}, no action taken`,
      });
    }

    return ok({ message: "Event processed" });
  } catch (error) {
    log.error("Webhook processing failed", error);
    return fail("INTERNAL_ERROR", "Webhook processing failed", 500);
  }
}
