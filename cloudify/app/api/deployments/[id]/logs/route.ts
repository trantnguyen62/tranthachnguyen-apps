import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/deployments/[id]/logs - Stream logs via SSE
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (deployment.project.userId !== session.user.id) {
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

            for (const log of logs) {
              const data = JSON.stringify({
                id: log.id,
                level: log.level,
                message: log.message,
                timestamp: log.timestamp,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              lastLogId = log.id;
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
            console.error("SSE error:", error);
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
    console.error("Failed to stream logs:", error);
    return NextResponse.json(
      { error: "Failed to stream logs" },
      { status: 500 }
    );
  }
}

// POST /api/deployments/[id]/logs - Add a log entry (for build worker)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (deployment.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const log = await prisma.deploymentLog.create({
      data: {
        deploymentId: id,
        level: level || "info",
        message: message || "",
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Failed to add log:", error);
    return NextResponse.json(
      { error: "Failed to add log" },
      { status: 500 }
    );
  }
}
