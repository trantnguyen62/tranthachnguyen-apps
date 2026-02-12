/**
 * Managed Databases API
 * GET - List databases for a project
 * POST - Create a new managed database
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { provisionDatabase } from "@/lib/database/provisioner";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import {
  badRequest,
  notFound,
  conflict,
  paymentRequired,
  validationError,
  serverError,
  handlePrismaError,
} from "@/lib/api/error-response";

const log = getRouteLogger("databases");

// GET /api/databases - List databases
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return badRequest("Project ID is required");
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return notFound("Project not found");
    }

    const databases = await prisma.managedDatabase.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        status: true,
        plan: true,
        region: true,
        version: true,
        storageUsed: true,
        storageLimit: true,
        connectionsActive: true,
        connectionLimit: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ databases });
  } catch (error) {
    return serverError("Failed to fetch databases", error);
  }
}

// POST /api/databases - Create database
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, name, type, provider, plan, region } = body;

    if (!projectId || !name || !type || !provider) {
      const fields = [];
      if (!projectId) fields.push({ field: "projectId", message: "Project ID is required" });
      if (!name) fields.push({ field: "name", message: "Database name is required" });
      if (!type) fields.push({ field: "type", message: "Database type is required" });
      if (!provider) fields.push({ field: "provider", message: "Provider is required" });
      return validationError(fields);
    }

    // Validate type
    const validTypes = ["postgresql", "mysql", "redis"];
    if (!validTypes.includes(type)) {
      return validationError([{
        field: "type",
        message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      }]);
    }

    // Validate provider
    const validProviders = ["cloudify", "neon", "planetscale", "upstash"];
    if (!validProviders.includes(provider)) {
      return validationError([{
        field: "provider",
        message: `Invalid provider. Must be one of: ${validProviders.join(", ")}`,
      }]);
    }

    // Validate type-provider compatibility
    const providerTypes: Record<string, string[]> = {
      cloudify: ["postgresql", "mysql", "redis"],
      neon: ["postgresql"],
      planetscale: ["mysql"],
      upstash: ["redis"],
    };

    if (!providerTypes[provider].includes(type)) {
      return badRequest(`Provider ${provider} does not support ${type}`);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return notFound("Project not found");
    }

    // Check for existing database with same name
    const existing = await prisma.managedDatabase.findFirst({
      where: {
        projectId,
        name,
      },
    });

    if (existing) {
      return conflict("A database with this name already exists");
    }

    // Check plan limits
    const dbCount = await prisma.managedDatabase.count({
      where: { projectId },
    });

    const limits: Record<string, number> = {
      free: 1,
      pro: 5,
      team: 20,
      enterprise: 100,
    };

    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    const maxDatabases = limits[userPlan?.plan || "free"] || 1;
    if (dbCount >= maxDatabases) {
      return paymentRequired(
        `Database limit reached for your plan (${maxDatabases})`,
        { currentCount: dbCount, limit: maxDatabases }
      );
    }

    // Provision database
    const result = await provisionDatabase({
      projectId,
      name,
      type: type as "postgresql" | "mysql" | "redis",
      provider: provider as "cloudify" | "neon" | "planetscale" | "upstash",
      plan: plan || "hobby",
      region,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "database",
        action: "database.created",
        description: `Created ${type} database "${name}" on ${provider}`,
        metadata: {
          databaseId: result.databaseId,
          type,
          provider,
        },
      },
    });

    return ok({
        success: true,
        databaseId: result.databaseId,
        message: "Database provisioning started",
      }, { status: 201 });
  } catch (error) {
    const prismaResp = handlePrismaError(error, "database");
    if (prismaResp) return prismaResp;

    return serverError("Failed to create database", error);
  }
}
