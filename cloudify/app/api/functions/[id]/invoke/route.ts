/**
 * Function Invoke API - Execute a serverless function
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { prisma } from "@/lib/prisma";
import { invokeFunction } from "@/lib/functions/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/functions/[id]/invoke - Invoke a function
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body as event
    let event = {};
    try {
      const body = await request.text();
      if (body) {
        event = JSON.parse(body);
      }
    } catch {
      // Use empty event if parsing fails
    }

    // Add HTTP context to event
    const fullEvent = {
      httpMethod: request.method,
      path: request.nextUrl.pathname,
      headers: Object.fromEntries(request.headers.entries()),
      queryStringParameters: Object.fromEntries(
        request.nextUrl.searchParams.entries()
      ),
      body: JSON.stringify(event),
      isBase64Encoded: false,
      ...event,
    };

    // Invoke function
    const { success, result, invocationId, error } = await invokeFunction({
      functionId: id,
      event: fullEvent,
      sync: true,
    });

    if (!success) {
      return NextResponse.json(
        {
          error: error || "Invocation failed",
          invocationId,
        },
        { status: 500 }
      );
    }

    // Return function result
    const response = result?.result;
    if (response) {
      const headers = new Headers(response.headers);
      headers.set("X-Cloudify-Invocation-Id", invocationId || "");
      headers.set("X-Cloudify-Duration", `${result.duration}ms`);

      return new NextResponse(
        response.isBase64Encoded
          ? Buffer.from(response.body, "base64")
          : response.body,
        {
          status: response.statusCode,
          headers,
        }
      );
    }

    return NextResponse.json({
      success: true,
      invocationId,
      duration: result?.duration,
    });
  } catch (error) {
    console.error("Function invoke error:", error);
    return NextResponse.json(
      { error: "Failed to invoke function" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/functions/[id]/invoke - Test invoke with query params
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Delegate to POST handler with query params as event
  const event = Object.fromEntries(request.nextUrl.searchParams.entries());

  // Create a new request with the event as body
  const newRequest = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(event),
  });

  return POST(newRequest, { params });
}
