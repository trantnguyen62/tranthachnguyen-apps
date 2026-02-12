/**
 * Edge Function Invocation API
 * POST - Invoke an edge function directly
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";

const log = getRouteLogger("edge-functions/invoke");
import { executeEdgeFunction } from "@/lib/edge/runtime";
import { getGeoData, getClientIP } from "@/lib/edge/geo";
import { ok, fail } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/edge-functions/[id]/invoke - Invoke function
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    // Get the edge function
    const edgeFunction = await prisma.edgeFunction.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!edgeFunction) {
      return fail("NOT_FOUND", "Edge function not found", 404);
    }

    // Verify ownership
    if (edgeFunction.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Access denied", 403);
    }

    // Get request body for execution
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { url, method = "GET", headers = {}, requestBody } = body;

    // Get geo data from the current request
    const geo = getGeoData(request.headers);

    // Execute the function
    const result = await executeEdgeFunction({
      functionId: id,
      projectId: edgeFunction.projectId,
      request: {
        url: url || "https://test.cloudify.app/",
        method,
        headers,
        body: requestBody,
      },
      geo: {
        country: geo.country,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
      envVars: edgeFunction.envVars as Record<string, string> | undefined,
    });

    return ok({
      status: result.status,
      response: result.response,
      logs: result.logs,
      duration: result.duration,
      memoryUsed: result.memoryUsed,
      error: result.error,
    });
  } catch (error) {
    log.error("Failed to invoke edge function", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to invoke edge function", 500);
  }
}
