/**
 * Function Logs API - Get function invocation logs
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import { getFunctionLogs, getFunctionStats } from "@/lib/functions/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/functions/[id]/logs - Get function invocation logs
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get function and verify ownership
    const func = await prisma.serverlessFunction.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!func) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    if (func.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : undefined;
    const includeStats = searchParams.get("stats") === "true";

    // Get logs
    const logs = await getFunctionLogs(id, { limit, offset, since });

    // Optionally get stats
    let stats = null;
    if (includeStats) {
      stats = await getFunctionStats(id);
    }

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: logs.length === limit,
      },
    });
  } catch (error) {
    console.error("Function logs error:", error);
    return NextResponse.json(
      { error: "Failed to get function logs" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/functions/[id]/logs/stream - Stream function logs via SSE
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const func = await prisma.serverlessFunction.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!func || func.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const encoder = new TextEncoder();
    let lastLogId: string | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const sendLogs = async () => {
          try {
            const invocations = await prisma.functionInvocation.findMany({
              where: {
                functionId: id,
                ...(lastLogId && { id: { gt: lastLogId } }),
              },
              orderBy: { createdAt: "asc" },
              take: 20,
            });

            for (const inv of invocations) {
              const data = JSON.stringify({
                id: inv.id,
                status: inv.status,
                duration: inv.duration,
                statusCode: inv.statusCode,
                error: inv.error,
                createdAt: inv.createdAt,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              lastLogId = inv.id;
            }
          } catch (error) {
            console.error("Log stream error:", error);
          }
        };

        // Send initial logs
        await sendLogs();

        // Poll for new logs
        const interval = setInterval(sendLogs, 2000);

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
    console.error("Log stream error:", error);
    return NextResponse.json(
      { error: "Failed to stream logs" },
      { status: 500 }
    );
  }
}
