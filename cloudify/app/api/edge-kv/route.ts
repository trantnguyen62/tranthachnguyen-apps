/**
 * Edge KV API
 * GET - List KV namespaces for a project
 * POST - Create a new KV namespace
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getKVStats } from "@/lib/edge/kv-client";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("edge-kv");

// GET /api/edge-kv - List KV namespaces
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

    const kvStores = await prisma.edgeKV.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        maxKeys: true,
        maxValueSize: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stats for each KV store
    const kvWithStats = await Promise.all(
      kvStores.map(async (kv) => {
        const stats = await getKVStats(kv.id);
        return {
          ...kv,
          keyCount: stats.keyCount,
          totalSize: stats.totalSize,
        };
      })
    );

    return NextResponse.json({ kvStores: kvWithStats });
  } catch (error) {
    log.error("Failed to fetch Edge KV stores", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch Edge KV stores" },
      { status: 500 }
    );
  }
}

// POST /api/edge-kv - Create KV namespace
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const body = await request.json();
    const { projectId, name } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, name" },
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

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check for existing
    const existing = await prisma.edgeKV.findFirst({
      where: {
        projectId,
        slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A KV namespace with this name already exists" },
        { status: 409 }
      );
    }

    // Check plan limits
    const kvCount = await prisma.edgeKV.count({
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

    const maxKV = limits[userPlan?.plan || "free"] || 1;
    if (kvCount >= maxKV) {
      return NextResponse.json(
        { error: `Edge KV limit reached for your plan (${maxKV})` },
        { status: 403 }
      );
    }

    // Create KV namespace
    const kv = await prisma.edgeKV.create({
      data: {
        projectId,
        name,
        slug,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId,
        type: "edge_kv",
        action: "edge_kv.created",
        description: `Created Edge KV namespace "${name}"`,
        metadata: { kvId: kv.id },
      },
    });

    return NextResponse.json({ kv }, { status: 201 });
  } catch (error) {
    log.error("Failed to create Edge KV", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create Edge KV namespace" },
      { status: 500 }
    );
  }
}
