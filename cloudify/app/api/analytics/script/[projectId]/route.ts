/**
 * Analytics Script Endpoint
 * Serves the analytics SDK for a specific project
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMinifiedAnalyticsScript } from "@/lib/analytics/sdk-source";

// Cache the script for 1 hour
const CACHE_MAX_AGE = 3600;

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * GET /api/analytics/script/[projectId] - Get analytics SDK script
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;

  if (!projectId) {
    return new NextResponse("Project ID required", { status: 400 });
  }

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return new NextResponse("// Project not found", {
      status: 404,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }

  // Generate the script
  const script = generateMinifiedAnalyticsScript(projectId);

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
