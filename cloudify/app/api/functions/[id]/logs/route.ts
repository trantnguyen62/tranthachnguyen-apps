/**
 * Function Logs API - Get function invocation logs
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { getFunctionLogs, getFunctionStats } from "@/lib/functions/service";
import { getRouteLogger } from "@/lib/api/logger";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

const log = getRouteLogger("functions/[id]/logs");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/functions/[id]/logs - Get function invocation logs
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

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
      return fail("NOT_FOUND", "Function not found", 404);
    }

    if (func.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : undefined;
    const includeStats = searchParams.get("stats") === "true";

    // Get logs (fetch one extra to detect hasMore)
    const logs = await getFunctionLogs(id, {
      limit: limit + 1,
      since,
      cursorWhere: Object.keys(cursorWhere).length > 0 ? cursorWhere : undefined,
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    // Optionally get stats
    let stats = null;
    if (includeStats) {
      stats = await getFunctionStats(id);
    }

    return ok(
      { logs: items, stats },
      {
        pagination: {
          cursor: nextCursor,
          hasMore,
        },
      }
    );
  } catch (error) {
    log.error("Function logs error", error);
    return fail("INTERNAL_ERROR", "Failed to get function logs", 500);
  }
}

/**
 * GET /api/functions/[id]/logs/stream - Stream function logs via SSE
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

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

    if (!func || func.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Forbidden", 403);
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
            log.error("Log stream error", error);
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
    log.error("Log stream error", error);
    return fail("INTERNAL_ERROR", "Failed to stream logs", 500);
  }
}
