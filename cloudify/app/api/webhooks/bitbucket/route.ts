/**
 * Bitbucket Webhook Handler
 *
 * Handles Bitbucket webhook events for:
 * - Push events (trigger deployments)
 * - Pull request events (preview deployments)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerBuild } from "@/lib/build/worker";
import {
  parseBitbucketWebhookEvent,
  BitbucketPushEvent,
  BitbucketPullRequestEvent,
} from "@/lib/integrations/bitbucket";

/**
 * POST /api/webhooks/bitbucket
 */
export async function POST(request: NextRequest) {
  try {
    // Get event type from header
    const eventKey = request.headers.get("x-event-key");
    const hookUuid = request.headers.get("x-hook-uuid");

    if (!eventKey) {
      return NextResponse.json(
        { error: "Missing X-Event-Key header" },
        { status: 400 }
      );
    }

    // Parse payload
    const payload = await request.json();

    // Find project by Bitbucket repository
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing repository in payload" },
        { status: 400 }
      );
    }

    // Look up the project by Bitbucket URL
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { repoUrl: { contains: `bitbucket.org/${repoFullName}` } },
          { repoUrl: { contains: repoFullName } },
        ],
      },
      include: {
        integrations: {
          where: { type: "bitbucket" },
        },
      },
    });

    if (!project) {
      console.log(`[Bitbucket Webhook] No project found for repository: ${repoFullName}`);
      return NextResponse.json({ message: "Project not found" }, { status: 200 });
    }

    // Parse the event
    const event = parseBitbucketWebhookEvent(eventKey, payload);

    if (!event) {
      console.log(`[Bitbucket Webhook] Ignoring unsupported event type: ${eventKey}`);
      return NextResponse.json({ message: "Event type not supported" }, { status: 200 });
    }

    // Handle push events
    if (eventKey === "repo:push") {
      const pushEvent = event as BitbucketPushEvent;
      const changes = pushEvent.push.changes;

      if (!changes || changes.length === 0) {
        return NextResponse.json({ message: "No changes in push" }, { status: 200 });
      }

      // Process the most recent change
      const latestChange = changes[0];
      if (!latestChange.new) {
        return NextResponse.json({ message: "Branch deleted, no action" }, { status: 200 });
      }

      const branch = latestChange.new.name;
      const commitSha = latestChange.new.target.hash;
      const commitMessage = latestChange.new.target.message;

      // Check if this is the production branch
      const isProductionBranch = branch === project.repoBranch;

      console.log(`[Bitbucket Webhook] Push to ${branch} on project ${project.slug}`, {
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

      return NextResponse.json({
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

      console.log(`[Bitbucket Webhook] Pull request ${pr.id} (${pr.state}) on project ${project.slug}`);

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

          return NextResponse.json({
            message: "Preview deployment triggered",
            deploymentId: deployment.id,
            branch: pr.source.branch.name,
            prNumber: pr.id,
          });
        }
      }

      return NextResponse.json({
        message: `Pull request ${pr.state.toLowerCase()}, no action taken`,
      });
    }

    return NextResponse.json({ message: "Event processed" });
  } catch (error) {
    console.error("[Bitbucket Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
