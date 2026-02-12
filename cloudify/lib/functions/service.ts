/**
 * Function Service - High-level API for serverless functions
 * Integrates executor, pool manager, and database
 */

import { prisma } from "@/lib/prisma";
import {
  executeFunction,
  validateFunctionCode,
  FunctionEvent,
  ExecutionResult,
  Runtime,
} from "./executor";
import {
  uploadFunctionCode,
  downloadFunctionCode,
} from "@/lib/build/artifact-manager";
import { captureFunctionError } from "@/lib/integrations/sentry";
import { loggers } from "@/lib/logging/logger";

const log = loggers.functions;

export interface DeployFunctionParams {
  functionId: string;
  code: string;
  runtime?: Runtime;
  entrypoint?: string;
  memory?: number;
  timeout?: number;
  envVars?: Record<string, string>;
}

export interface InvokeFunctionParams {
  functionId: string;
  event?: FunctionEvent;
  sync?: boolean; // Wait for response
}

/**
 * Deploy function code
 */
export async function deployFunction(params: DeployFunctionParams): Promise<{
  success: boolean;
  version?: string;
  error?: string;
}> {
  const { functionId, code, runtime, entrypoint, memory, timeout, envVars } = params;

  try {
    // Get function from database
    const func = await prisma.serverlessFunction.findUnique({
      where: { id: functionId },
    });

    if (!func) {
      return { success: false, error: "Function not found" };
    }

    // Use provided runtime or function's default
    const effectiveRuntime = (runtime || func.runtime) as Runtime;

    // Validate code
    const validation = await validateFunctionCode(code, effectiveRuntime);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate version
    const version = `v${Date.now()}`;

    // Upload code to storage
    await uploadFunctionCode(functionId, version, code);

    // Update function in database
    await prisma.serverlessFunction.update({
      where: { id: functionId },
      data: {
        runtime: effectiveRuntime,
        entrypoint: entrypoint || func.entrypoint,
        memory: memory || func.memory,
        timeout: timeout || func.timeout,
        envVars: envVars || (func.envVars as Record<string, string>) || {},
        updatedAt: new Date(),
      },
    });

    return { success: true, version };
  } catch (error) {
    log.error("Deploy function failed", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Deploy failed",
    };
  }
}

/**
 * Invoke a function
 */
export async function invokeFunction(params: InvokeFunctionParams): Promise<{
  success: boolean;
  result?: ExecutionResult;
  invocationId?: string;
  error?: string;
}> {
  const { functionId, event = {}, sync = true } = params;
  const startTime = Date.now();

  try {
    // Get function from database
    const func = await prisma.serverlessFunction.findUnique({
      where: { id: functionId },
      include: {
        project: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!func) {
      return { success: false, error: "Function not found" };
    }

    // Get latest code version
    const versions = await listFunctionVersions(functionId);
    const latestVersion = versions[0];

    if (!latestVersion) {
      return { success: false, error: "No deployed code found" };
    }

    // Download code
    const code = await downloadFunctionCode(functionId, latestVersion);
    if (!code) {
      return { success: false, error: "Failed to load function code" };
    }

    // Execute function
    const result = await executeFunction(
      {
        functionId,
        runtime: func.runtime as Runtime,
        entrypoint: func.entrypoint,
        memory: func.memory,
        timeout: func.timeout,
        envVars: (func.envVars as Record<string, string>) || {},
      },
      code,
      event
    );

    // Record invocation
    const invocation = await prisma.functionInvocation.create({
      data: {
        functionId,
        status: result.success ? "success" : "error",
        duration: result.duration,
        memory: result.memoryUsed,
        region: "default",
        statusCode: result.result?.statusCode || (result.success ? 200 : 500),
        error: result.error,
      },
    });

    return {
      success: result.success,
      result,
      invocationId: invocation.id,
    };
  } catch (error) {
    log.error("Function invocation failed", error, { functionId });

    // Record failed invocation
    try {
      await prisma.functionInvocation.create({
        data: {
          functionId,
          status: "error",
          duration: Date.now() - startTime,
          memory: 0,
          region: "default",
          statusCode: 500,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch {
      // Ignore recording error
    }

    // Report to Sentry (non-blocking)
    if (error instanceof Error) {
      captureFunctionError(error, {
        functionId,
        functionName: functionId,
        projectId: "",
        duration: Date.now() - startTime,
      }).catch(() => {});
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Invocation failed",
    };
  }
}

/**
 * List function versions
 */
async function listFunctionVersions(functionId: string): Promise<string[]> {
  const { getMinioClient } = await import("@/lib/build/artifact-manager");
  const client = getMinioClient();

  const versions: string[] = [];

  try {
    const stream = client.listObjects("cloudify-functions", `${functionId}/`, false);

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj: { prefix?: string }) => {
        if (obj.prefix) {
          const version = obj.prefix.replace(`${functionId}/`, "").replace("/", "");
          if (version.startsWith("v")) {
            versions.push(version);
          }
        }
      });
      stream.on("end", () => resolve());
      stream.on("error", (err: Error) => reject(err));
    });

    // Sort by version (newest first)
    versions.sort((a, b) => {
      const numA = parseInt(a.slice(1), 10);
      const numB = parseInt(b.slice(1), 10);
      return numB - numA;
    });

    return versions;
  } catch {
    return [];
  }
}

/**
 * Get function statistics
 */
export async function getFunctionStats(functionId: string): Promise<{
  totalInvocations: number;
  successRate: number;
  avgDuration: number;
  errorRate: number;
  last24hInvocations: number;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalStats, recentStats] = await Promise.all([
    prisma.functionInvocation.aggregate({
      where: { functionId },
      _count: true,
      _avg: { duration: true },
    }),
    prisma.functionInvocation.groupBy({
      by: ["status"],
      where: {
        functionId,
        createdAt: { gte: since },
      },
      _count: true,
    }),
  ]);

  const total = totalStats._count || 0;
  const avgDuration = totalStats._avg.duration || 0;

  const recentTotal = recentStats.reduce((sum, r) => sum + r._count, 0);
  const recentSuccess = recentStats.find((r) => r.status === "success")?._count || 0;
  const recentErrors = recentStats.find((r) => r.status === "error")?._count || 0;

  return {
    totalInvocations: total,
    successRate: recentTotal > 0 ? (recentSuccess / recentTotal) * 100 : 100,
    avgDuration,
    errorRate: recentTotal > 0 ? (recentErrors / recentTotal) * 100 : 0,
    last24hInvocations: recentTotal,
  };
}

/**
 * Get function logs
 */
export async function getFunctionLogs(
  functionId: string,
  options: {
    limit?: number;
    since?: Date;
    cursorWhere?: Record<string, unknown>;
  } = {}
): Promise<Array<{
  id: string;
  status: string;
  duration: number;
  statusCode: number | null;
  error: string | null;
  createdAt: Date;
}>> {
  const { limit = 50, since, cursorWhere } = options;

  const invocations = await prisma.functionInvocation.findMany({
    where: {
      functionId,
      ...(since && { createdAt: { gte: since } }),
      ...cursorWhere,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      id: true,
      status: true,
      duration: true,
      statusCode: true,
      error: true,
      createdAt: true,
    },
  });

  return invocations;
}

/**
 * Delete a function
 */
export async function deleteFunction(functionId: string): Promise<boolean> {
  try {
    // Delete from database (cascades to invocations)
    await prisma.serverlessFunction.delete({
      where: { id: functionId },
    });

    // Delete code from storage
    const { getMinioClient } = await import("@/lib/build/artifact-manager");
    const client = getMinioClient();

    const objects: string[] = [];
    const stream = client.listObjects("cloudify-functions", `${functionId}/`, true);

    await new Promise<void>((resolve) => {
      stream.on("data", (obj: { name?: string }) => {
        if (obj.name) objects.push(obj.name);
      });
      stream.on("end", () => resolve());
      stream.on("error", () => resolve());
    });

    if (objects.length > 0) {
      await client.removeObjects("cloudify-functions", objects);
    }

    return true;
  } catch (error) {
    log.error("Delete function failed", error, { functionId });
    return false;
  }
}
