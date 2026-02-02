/**
 * Edge Function Invocation API
 * POST - Invoke an edge function directly
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { executeEdgeFunction } from "@/lib/edge/runtime";
import { getGeoData, getClientIP } from "@/lib/edge/geo";

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
      return NextResponse.json(
        { error: "Edge function not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (edgeFunction.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get request body for execution
    const body = await request.json();
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

    return NextResponse.json({
      status: result.status,
      response: result.response,
      logs: result.logs,
      duration: result.duration,
      memoryUsed: result.memoryUsed,
      error: result.error,
    });
  } catch (error) {
    console.error("Failed to invoke edge function:", error);
    return NextResponse.json(
      { error: "Failed to invoke edge function" },
      { status: 500 }
    );
  }
}
