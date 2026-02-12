/**
 * Function Deploy API - Deploy code to a function
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { deployFunction } from "@/lib/functions/service";
import { Runtime } from "@/lib/functions/executor";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("functions/[id]/deploy");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/functions/[id]/deploy - Deploy function code
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Get function and verify ownership
    const func = await prisma.serverlessFunction.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true, id: true },
        },
      },
    });

    if (!func) {
      return NextResponse.json({ error: "Function not found" }, { status: 404 });
    }

    if (func.project.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse request body
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { code, runtime, entrypoint, memory, timeout, envVars } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing required field: code" },
        { status: 400 }
      );
    }

    // Validate runtime if provided
    const validRuntimes: Runtime[] = [
      "nodejs18",
      "nodejs20",
      "python3.9",
      "python3.10",
      "python3.11",
      "python3.12",
    ];

    if (runtime && !validRuntimes.includes(runtime)) {
      return NextResponse.json(
        { error: `Invalid runtime. Must be one of: ${validRuntimes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate memory
    if (memory !== undefined && (memory < 128 || memory > 3008)) {
      return NextResponse.json(
        { error: "Memory must be between 128 and 3008 MB" },
        { status: 400 }
      );
    }

    // Validate timeout
    if (timeout !== undefined && (timeout < 1 || timeout > 60)) {
      return NextResponse.json(
        { error: "Timeout must be between 1 and 60 seconds" },
        { status: 400 }
      );
    }

    // Deploy function
    const { success, version, error } = await deployFunction({
      functionId: id,
      code,
      runtime,
      entrypoint,
      memory,
      timeout,
      envVars,
    });

    if (!success) {
      return NextResponse.json(
        { error: error || "Deploy failed" },
        { status: 400 }
      );
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: func.project.id,
        type: "function",
        action: "function.deployed",
        description: `Deployed function "${func.name}" version ${version}`,
        metadata: {
          functionId: id,
          functionName: func.name,
          version,
          runtime: runtime || func.runtime,
        },
      },
    });

    // Get updated function
    const updatedFunc = await prisma.serverlessFunction.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      version,
      function: {
        id: updatedFunc?.id,
        name: updatedFunc?.name,
        runtime: updatedFunc?.runtime,
        entrypoint: updatedFunc?.entrypoint,
        memory: updatedFunc?.memory,
        timeout: updatedFunc?.timeout,
        updatedAt: updatedFunc?.updatedAt,
      },
    });
  } catch (error) {
    log.error("Function deploy error", error);
    return NextResponse.json(
      { error: "Failed to deploy function" },
      { status: 500 }
    );
  }
}
