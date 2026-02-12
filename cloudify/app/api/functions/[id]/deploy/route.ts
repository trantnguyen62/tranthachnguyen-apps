/**
 * Function Deploy API - Deploy code to a function
 */

import { NextRequest } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { deployFunction } from "@/lib/functions/service";
import { Runtime } from "@/lib/functions/executor";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

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
      return fail("NOT_FOUND", "Function not found", 404);
    }

    if (func.project.userId !== user.id) {
      return fail("AUTH_FORBIDDEN", "Unauthorized", 403);
    }

    // Parse request body
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { code, runtime, entrypoint, memory, timeout, envVars } = body;

    if (!code || typeof code !== "string") {
      return fail("VALIDATION_MISSING_FIELD", "Missing required field: code", 400);
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
      return fail("VALIDATION_ERROR", `Invalid runtime. Must be one of: ${validRuntimes.join(", ")}`, 400);
    }

    // Validate memory
    if (memory !== undefined && (memory < 128 || memory > 3008)) {
      return fail("VALIDATION_ERROR", "Memory must be between 128 and 3008 MB", 400);
    }

    // Validate timeout
    if (timeout !== undefined && (timeout < 1 || timeout > 60)) {
      return fail("VALIDATION_ERROR", "Timeout must be between 1 and 60 seconds", 400);
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
      return fail("BAD_REQUEST", error || "Deploy failed", 400);
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

    return ok({
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
    return fail("INTERNAL_ERROR", "Failed to deploy function", 500);
  }
}
