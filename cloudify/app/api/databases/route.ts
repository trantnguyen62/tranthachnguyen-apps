/**
 * Managed Databases API
 * GET - List databases for a project
 * POST - Create a new managed database
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { provisionDatabase } from "@/lib/database/provisioner";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";

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
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
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

    return NextResponse.json({ databases });
  } catch (error) {
    log.error("Failed to fetch databases", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Missing required fields: projectId, name, type, provider" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["postgresql", "mysql", "redis"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ["cloudify", "neon", "planetscale", "upstash"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate type-provider compatibility
    const providerTypes: Record<string, string[]> = {
      cloudify: ["postgresql", "mysql", "redis"],
      neon: ["postgresql"],
      planetscale: ["mysql"],
      upstash: ["redis"],
    };

    if (!providerTypes[provider].includes(type)) {
      return NextResponse.json(
        { error: `Provider ${provider} does not support ${type}` },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check for existing database with same name
    const existing = await prisma.managedDatabase.findFirst({
      where: {
        projectId,
        name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A database with this name already exists" },
        { status: 409 }
      );
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
      return NextResponse.json(
        { error: `Database limit reached for your plan (${maxDatabases})` },
        { status: 403 }
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

    return NextResponse.json(
      {
        success: true,
        databaseId: result.databaseId,
        message: "Database provisioning started",
      },
      { status: 201 }
    );
  } catch (error) {
    log.error("Failed to create database", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create database", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
