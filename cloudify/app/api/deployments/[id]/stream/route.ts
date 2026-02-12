/**
 * Deployment Stream - Real-time SSE for deployment progress
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { fail } from "@/lib/api/response";

const log = getRouteLogger("deployments/[id]/stream");

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Verify deployment ownership
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true, name: true },
        },
      },
    });

    if (!deployment) {
      return fail("NOT_FOUND", "Deployment not found", 404);
    }

    if (deployment.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Unauthorized", 403);
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: object) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        // Send initial connection event
        sendEvent("connected", {
          deploymentId: id,
          projectName: deployment.project.name,
          status: deployment.status,
          branch: deployment.branch,
        });

        let lastLogId: string | null = null;
        let lastStatus = deployment.status;

        const pollLogs = async () => {
          try {
            // Get new logs
            const logs = await prisma.deploymentLog.findMany({
              where: {
                deploymentId: id,
                ...(lastLogId && { id: { gt: lastLogId } }),
              },
              orderBy: { timestamp: "asc" },
            });

            // Send each log as an event
            for (const logEntry of logs) {
              sendEvent("log", {
                id: logEntry.id,
                timestamp: logEntry.timestamp.toISOString(),
                level: logEntry.level,
                message: logEntry.message,
              });
              lastLogId = logEntry.id;
            }

            // Check deployment status
            const currentDeployment = await prisma.deployment.findUnique({
              where: { id },
              select: {
                status: true,
                url: true,
                buildTime: true,
                siteSlug: true,
              },
            });

            if (!currentDeployment) {
              sendEvent("error", { error: "Deployment not found" });
              controller.close();
              return false;
            }

            // Send status update if changed
            if (currentDeployment.status !== lastStatus) {
              const stepMap: Record<string, { step: string; progress: number }> = {
                QUEUED: { step: "queued", progress: 0 },
                BUILDING: { step: "building", progress: 30 },
                DEPLOYING: { step: "deploying", progress: 70 },
                READY: { step: "complete", progress: 100 },
                ERROR: { step: "error", progress: 0 },
                CANCELLED: { step: "cancelled", progress: 0 },
              };

              const stepInfo = stepMap[currentDeployment.status] || {
                step: "unknown",
                progress: 0,
              };

              sendEvent("step", {
                step: stepInfo.step,
                status: currentDeployment.status,
                progress: stepInfo.progress,
              });

              lastStatus = currentDeployment.status;
            }

            // Check if deployment is complete
            if (
              currentDeployment.status === "READY" ||
              currentDeployment.status === "ERROR" ||
              currentDeployment.status === "CANCELLED"
            ) {
              sendEvent("complete", {
                deploymentId: id,
                status: currentDeployment.status,
                url: currentDeployment.url,
                siteSlug: currentDeployment.siteSlug,
                buildTime: currentDeployment.buildTime
                  ? `${currentDeployment.buildTime}s`
                  : null,
              });
              return false; // Stop polling
            }

            return true; // Continue polling
          } catch (error) {
            log.error("Polling error", error);
            return true; // Continue polling on error
          }
        };

        // Initial poll
        let shouldContinue = await pollLogs();

        // Set up polling interval
        if (shouldContinue) {
          const interval = setInterval(async () => {
            shouldContinue = await pollLogs();
            if (!shouldContinue) {
              clearInterval(interval);
              controller.close();
            }
          }, 1000);

          // Clean up on client disconnect
          request.signal.addEventListener("abort", () => {
            clearInterval(interval);
            controller.close();
          });
        } else {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    log.error("Stream error", error);
    return fail("INTERNAL_ERROR", "Failed to create stream", 500);
  }
}
