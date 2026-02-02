/**
 * Edge KV Keys API
 * GET - Get a key value
 * PUT - Set a key value
 * DELETE - Delete a key
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { EdgeKVStore } from "@/lib/edge/kv-client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/edge-kv/[id]/keys?key=mykey - Get key value
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    const kv = await prisma.edgeKV.findUnique({
      where: { id },
    });

    if (!kv) {
      return NextResponse.json(
        { error: "Edge KV namespace not found" },
        { status: 404 }
      );
    }

    // Verify ownership
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

    const kvStore = new EdgeKVStore({
      projectId: kv.projectId,
      kvName: kv.slug,
    });

    const result = await kvStore.getWithMetadata(key);

    if (result.value === null) {
      return NextResponse.json(
        { error: "Key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key,
      value: result.value,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Failed to get key:", error);
    return NextResponse.json(
      { error: "Failed to get key value" },
      { status: 500 }
    );
  }
}

// PUT /api/edge-kv/[id]/keys - Set key value
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { key, value, expirationTtl, metadata } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const kv = await prisma.edgeKV.findUnique({
      where: { id },
    });

    if (!kv) {
      return NextResponse.json(
        { error: "Edge KV namespace not found" },
        { status: 404 }
      );
    }

    // Verify ownership
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

    // Check value size
    const valueSize = typeof value === "string"
      ? value.length
      : JSON.stringify(value).length;

    if (valueSize > kv.maxValueSize) {
      return NextResponse.json(
        { error: `Value exceeds maximum size (${kv.maxValueSize} bytes)` },
        { status: 400 }
      );
    }

    // Check key count
    const keyCount = await prisma.edgeKVEntry.count({
      where: { kvId: id },
    });

    const existingKey = await prisma.edgeKVEntry.findUnique({
      where: { kvId_key: { kvId: id, key } },
    });

    if (!existingKey && keyCount >= kv.maxKeys) {
      return NextResponse.json(
        { error: `Key limit reached (${kv.maxKeys} keys)` },
        { status: 400 }
      );
    }

    const kvStore = new EdgeKVStore({
      projectId: kv.projectId,
      kvName: kv.slug,
    });

    await kvStore.put(key, value, { expirationTtl, metadata });

    return NextResponse.json({
      success: true,
      key,
    });
  } catch (error) {
    console.error("Failed to set key:", error);
    return NextResponse.json(
      { error: "Failed to set key value" },
      { status: 500 }
    );
  }
}

// DELETE /api/edge-kv/[id]/keys?key=mykey - Delete key
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    const kv = await prisma.edgeKV.findUnique({
      where: { id },
    });

    if (!kv) {
      return NextResponse.json(
        { error: "Edge KV namespace not found" },
        { status: 404 }
      );
    }

    // Verify ownership
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

    const kvStore = new EdgeKVStore({
      projectId: kv.projectId,
      kvName: kv.slug,
    });

    await kvStore.delete(key);

    return NextResponse.json({
      success: true,
      message: "Key deleted",
    });
  } catch (error) {
    console.error("Failed to delete key:", error);
    return NextResponse.json(
      { error: "Failed to delete key" },
      { status: 500 }
    );
  }
}
