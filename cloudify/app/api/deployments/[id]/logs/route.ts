import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const routeLog = getRouteLogger("deployments/[id]/logs");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/deployments/[id]/logs - Stream logs via SSE
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
          select: { userId: true },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    if (deployment.project.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let lastLogId: string | null = null;

        const sendLogs = async () => {
          try {
            const logs = await prisma.deploymentLog.findMany({
              where: {
                deploymentId: id,
                ...(lastLogId && { id: { gt: lastLogId } }),
              },
              orderBy: { timestamp: "asc" },
            });

            for (const logEntry of logs) {
              const data = JSON.stringify({
                id: logEntry.id,
                level: logEntry.level,
                message: logEntry.message,
                timestamp: logEntry.timestamp,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              lastLogId = logEntry.id;
            }

            // Check deployment status
            const currentDeployment = await prisma.deployment.findUnique({
              where: { id },
              select: { status: true },
            });

            if (
              currentDeployment?.status === "READY" ||
              currentDeployment?.status === "ERROR" ||
              currentDeployment?.status === "CANCELLED"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ done: true, status: currentDeployment.status })}\n\n`)
              );
              controller.close();
              return;
            }
          } catch (error) {
            routeLog.error("SSE error", error);
          }
        };

        // Send initial logs
        await sendLogs();

        // Poll for new logs every second
        const interval = setInterval(async () => {
          await sendLogs();
        }, 1000);

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
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
    routeLog.error("Failed to stream logs", error);
    return NextResponse.json(
      { error: "Failed to stream logs" },
      { status: 500 }
    );
  }
}

// POST /api/deployments/[id]/logs - Add a log entry (for build worker)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { level, message } = body;

    // Verify deployment ownership
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    if (deployment.project.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logEntry = await prisma.deploymentLog.create({
      data: {
        deploymentId: id,
        level: level || "info",
        message: message || "",
      },
    });

    return NextResponse.json(logEntry, { status: 201 });
  } catch (error) {
    routeLog.error("Failed to add log", error);
    return NextResponse.json(
      { error: "Failed to add log" },
      { status: 500 }
    );
  }
}
