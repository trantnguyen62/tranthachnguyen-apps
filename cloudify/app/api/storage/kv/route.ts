/**
 * KV Storage API - Key-Value store operations
 * Uses Redis for fast access with Postgres sync for durability
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import {
  kvGet,
  kvGetWithMetadata,
  kvSet,
  kvDelete,
  kvList,
  kvMget,
  kvMset,
  kvIncr,
  kvTtl,
  kvExpire,
  restoreFromPostgres,
} from "@/lib/storage/kv-service";

const log = getRouteLogger("storage/kv");

// GET /api/storage/kv - List KV stores, entries, or get specific key
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const storeId = searchParams.get("storeId");
    const key = searchParams.get("key");
    const keys = searchParams.get("keys"); // Comma-separated for mget
    const prefix = searchParams.get("prefix");
    const cursor = searchParams.get("cursor") || "0";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const withMetadata = searchParams.get("metadata") === "true";

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    // Get specific key from Redis
    if (storeId && key) {
      // Verify store access
      const store = await prisma.kVStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      if (withMetadata) {
        const result = await kvGetWithMetadata(storeId, key);
        const ttl = await kvTtl(storeId, key);

        return NextResponse.json({
          key,
          value: result.value,
          metadata: result.metadata,
          ttl: ttl > 0 ? ttl : null,
          exists: result.value !== null,
        });
      }

      const value = await kvGet(storeId, key);
      return NextResponse.json({
        key,
        value,
        exists: value !== null,
      });
    }

    // Get multiple keys at once
    if (storeId && keys) {
      const store = await prisma.kVStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const keyList = keys.split(",").map((k) => k.trim());
      const result = await kvMget(storeId, keyList);

      return NextResponse.json({
        entries: Object.fromEntries(result),
      });
    }

    // List keys in a store
    if (storeId) {
      const store = await prisma.kVStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const result = await kvList(storeId, { prefix: prefix || "", cursor, limit });

      return NextResponse.json({
        keys: result.keys,
        cursor: result.cursor,
        hasMore: result.hasMore,
      });
    }

    // Get user's projects for store listing
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    // Get all stores (optionally filtered by project)
    const stores = await prisma.kVStore.findMany({
      where: projectId
        ? { projectId }
        : { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stores);
  } catch (error) {
    log.error("Failed to fetch KV", error);
    return NextResponse.json(
      { error: "Failed to fetch KV data" },
      { status: 500 }
    );
  }
}

// POST /api/storage/kv - Create store, set key, or batch operations
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const {
      projectId,
      storeName,
      storeId,
      key,
      value,
      expiresIn, // seconds
      metadata,
      entries, // For batch set: [{ key, value, expiresIn?, metadata? }]
      operation, // incr, expire, restore
      delta, // For incr operation
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create a new store
    if (storeName && !storeId) {
      const store = await prisma.kVStore.create({
        data: {
          projectId,
          name: storeName,
        },
      });

      await prisma.activity.create({
        data: {
          userId: user.id,
          projectId,
          type: "storage",
          action: "created",
          description: `Created KV store "${storeName}"`,
        },
      });

      return NextResponse.json(store);
    }

    // Operations on existing store
    if (storeId) {
      // Verify store access
      const store = await prisma.kVStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      // Restore from Postgres (cold start recovery)
      if (operation === "restore") {
        const count = await restoreFromPostgres(storeId);
        return NextResponse.json({
          success: true,
          restored: count,
        });
      }

      // Increment operation
      if (operation === "incr" && key) {
        const newValue = await kvIncr(storeId, key, delta || 1);
        return NextResponse.json({
          key,
          value: newValue,
        });
      }

      // Expire operation
      if (operation === "expire" && key && expiresIn) {
        const success = await kvExpire(storeId, key, expiresIn);
        return NextResponse.json({ success });
      }

      // Batch set
      if (entries && Array.isArray(entries)) {
        const batchEntries = entries.map((e: {
          key: string;
          value: string;
          expiresIn?: number;
          metadata?: Record<string, unknown>;
        }) => ({
          key: e.key,
          value: typeof e.value === "string" ? e.value : JSON.stringify(e.value),
          options: {
            ex: e.expiresIn,
            metadata: e.metadata,
          },
        }));

        const success = await kvMset(storeId, batchEntries);

        return NextResponse.json({
          success,
          count: entries.length,
        });
      }

      // Single key set
      if (key && value !== undefined) {
        const success = await kvSet(
          storeId,
          key,
          typeof value === "string" ? value : JSON.stringify(value),
          {
            ex: expiresIn,
            metadata,
          }
        );

        return NextResponse.json({
          key,
          success,
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    log.error("Failed to create KV", error);
    return NextResponse.json(
      { error: "Failed to create KV" },
      { status: 500 }
    );
  }
}

// DELETE /api/storage/kv - Delete store or key
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const key = searchParams.get("key");

    // Delete specific key from Redis
    if (storeId && key) {
      // Verify store access
      const store = await prisma.kVStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const deleted = await kvDelete(storeId, key);
      return NextResponse.json({ success: deleted });
    }

    // Delete entire store
    if (storeId) {
      const store = await prisma.kVStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      // Delete all keys from Redis
      const result = await kvList(storeId, { limit: 10000 });
      for (const k of result.keys) {
        await kvDelete(storeId, k);
      }

      // Delete store from Postgres (cascades to entries)
      await prisma.kVStore.delete({ where: { id: storeId } });

      await prisma.activity.create({
        data: {
          userId: user.id,
          projectId: store.projectId,
          type: "storage",
          action: "deleted",
          description: `Deleted KV store "${store.name}"`,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID required" }, { status: 400 });
  } catch (error) {
    log.error("Failed to delete KV", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
