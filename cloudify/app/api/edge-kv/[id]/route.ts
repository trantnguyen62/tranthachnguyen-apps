/**
 * Individual Edge KV API
 * GET - Get KV namespace details and list keys
 * DELETE - Delete KV namespace
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { EdgeKVStore, getKVStats, deleteEdgeKV } from "@/lib/edge/kv-client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/edge-kv/[id] - Get KV details and list keys
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const cursor = searchParams.get("cursor") || undefined;

    const kv = await prisma.edgeKV.findUnique({
      where: { id },
    });

    if (!kv) {
      return NextResponse.json(
        { error: "Edge KV namespace not found" },
        { status: 404 }
      );
    }

    // Verify ownership through project
    const project = await prisma.project.findFirst({
      where: {
        id: kv.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get stats
    const stats = await getKVStats(id);

    // List keys
    const kvStore = new EdgeKVStore({
      projectId: kv.projectId,
      kvName: kv.slug,
    });

    const listResult = await kvStore.list({ prefix, limit, cursor });

    return NextResponse.json({
      kv: {
        id: kv.id,
        name: kv.name,
        slug: kv.slug,
        maxKeys: kv.maxKeys,
        maxValueSize: kv.maxValueSize,
        createdAt: kv.createdAt,
        updatedAt: kv.updatedAt,
      },
      stats,
      keys: listResult.keys,
      cursor: listResult.cursor,
      complete: listResult.complete,
    });
  } catch (error) {
    console.error("Failed to fetch Edge KV:", error);
    return NextResponse.json(
      { error: "Failed to fetch Edge KV namespace" },
      { status: 500 }
    );
  }
}

// DELETE /api/edge-kv/[id] - Delete KV namespace
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const kv = await prisma.edgeKV.findUnique({
      where: { id },
    });

    if (!kv) {
      return NextResponse.json(
        { error: "Edge KV namespace not found" },
        { status: 404 }
      );
    }

    // Verify ownership through project
    const project = await prisma.project.findFirst({
      where: {
        id: kv.projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the KV namespace
    await deleteEdgeKV(id);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: kv.projectId,
        type: "edge_kv",
        action: "edge_kv.deleted",
        description: `Deleted Edge KV namespace "${kv.name}"`,
        metadata: { kvId: id },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Edge KV namespace deleted",
    });
  } catch (error) {
    console.error("Failed to delete Edge KV:", error);
    return NextResponse.json(
      { error: "Failed to delete Edge KV namespace" },
      { status: 500 }
    );
  }
}
