/**
 * Blob Storage API - Object storage operations
 * Uses MinIO for S3-compatible blob storage
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";
import {
  uploadBlob,
  downloadBlob,
  getBlobInfo,
  deleteBlob,
  listBlobs,
  copyBlob,
  getUploadUrl,
  getDownloadUrl,
  getStorageUsed,
  deleteStore,
} from "@/lib/storage/blob-service";

const log = getRouteLogger("storage/blobs");

// GET /api/storage/blobs - List blob stores, blobs, or get specific blob
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const storeId = searchParams.get("storeId");
    const pathname = searchParams.get("pathname");
    const prefix = searchParams.get("prefix");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const download = searchParams.get("download") === "true";
    const info = searchParams.get("info") === "true";
    const presignedUrl = searchParams.get("presignedUrl") === "true";

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return fail("NOT_FOUND", "Project not found", 404);
      }
    }

    // Get specific blob
    if (storeId && pathname) {
      // Verify store access
      const store = await prisma.blobStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return fail("NOT_FOUND", "Store not found", 404);
      }

      // Get presigned download URL
      if (presignedUrl) {
        const expiresIn = parseInt(searchParams.get("expiresIn") || "3600", 10);
        const result = await getDownloadUrl(storeId, pathname, { expiresIn });

        if (!result) {
          return fail("NOT_FOUND", "Blob not found", 404);
        }

        return ok(result);
      }

      // Get blob info only
      if (info) {
        const blobInfo = await getBlobInfo(storeId, pathname);

        if (!blobInfo) {
          return fail("NOT_FOUND", "Blob not found", 404);
        }

        return ok(blobInfo);
      }

      // Download blob content
      if (download) {
        const result = await downloadBlob(storeId, pathname);

        if (!result) {
          return fail("NOT_FOUND", "Blob not found", 404);
        }

        // Stream the response
        const headers = new Headers();
        headers.set("Content-Type", result.contentType);
        headers.set("Content-Length", String(result.size));
        headers.set("Content-Disposition", `attachment; filename="${pathname.split("/").pop()}"`);

        // Convert Node.js stream to Web stream
        const webStream = new ReadableStream({
          async start(controller) {
            for await (const chunk of result.stream) {
              controller.enqueue(chunk);
            }
            controller.close();
          },
        });

        return new NextResponse(webStream, { headers });
      }

      // Default: return blob info from database
      const blob = await prisma.blob.findFirst({
        where: { storeId, pathname },
      });

      if (!blob) {
        return fail("NOT_FOUND", "Blob not found", 404);
      }

      return ok(blob);
    }

    // List blobs in a store
    if (storeId) {
      const store = await prisma.blobStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return fail("NOT_FOUND", "Store not found", 404);
      }

      const result = await listBlobs(storeId, {
        prefix: prefix || undefined,
        cursor: cursor || undefined,
        limit,
      });

      // Get storage usage
      const storageUsed = await getStorageUsed(storeId);

      return ok({
        blobs: result.blobs,
        cursor: result.cursor,
        hasMore: result.hasMore,
        storageUsed,
      });
    }

    // Get user's projects for store listing
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    // Get all stores (optionally filtered by project)
    const stores = await prisma.blobStore.findMany({
      where: projectId
        ? { projectId }
        : { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        _count: { select: { blobs: true } },
        blobs: {
          select: { size: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total size per store
    const storesWithSize = stores.map((store) => ({
      id: store.id,
      projectId: store.projectId,
      project: store.project,
      name: store.name,
      isPublic: store.isPublic,
      createdAt: store.createdAt,
      blobCount: store._count.blobs,
      totalSize: store.blobs.reduce((sum, blob) => sum + blob.size, 0),
    }));

    return ok(storesWithSize);
  } catch (error) {
    log.error("Failed to fetch blobs", error);
    return fail("INTERNAL_ERROR", "Failed to fetch blobs", 500);
  }
}

// POST /api/storage/blobs - Create a blob store, upload blob, or get upload URL
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const contentType = request.headers.get("content-type") || "";

    // Handle multipart form data uploads
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const storeId = formData.get("storeId") as string | null;
      const pathname = formData.get("pathname") as string | null;
      const projectId = formData.get("projectId") as string | null;

      if (!file || !storeId || !pathname || !projectId) {
        return fail("VALIDATION_MISSING_FIELD", "Missing required fields: file, storeId, pathname, projectId", 400);
      }

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return fail("NOT_FOUND", "Project not found", 404);
      }

      // Verify store access
      const store = await prisma.blobStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return fail("NOT_FOUND", "Store not found", 404);
      }

      // Upload to MinIO
      const buffer = Buffer.from(await file.arrayBuffer());
      const blobInfo = await uploadBlob(storeId, pathname, buffer, {
        contentType: file.type || "application/octet-stream",
        metadata: {
          originalName: file.name,
        },
      });

      await prisma.activity.create({
        data: {
          userId: user.id,
          projectId,
          type: "storage",
          action: "uploaded",
          description: `Uploaded blob "${pathname}" (${formatBytes(blobInfo.size)})`,
        },
      });

      return ok(blobInfo);
    }

    // Handle JSON requests
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const {
      projectId,
      storeName,
      storeId,
      pathname,
      content, // Base64 or string content for direct upload
      contentType: blobContentType,
      metadata,
      isPublic,
      getPresignedUrl, // Get presigned upload URL
      expiresIn, // For presigned URL
      copyFrom, // { storeId, pathname } for copy operation
    } = body;

    if (!projectId) {
      return fail("VALIDATION_MISSING_FIELD", "Project ID is required", 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Create a new store
    if (storeName && !storeId) {
      const store = await prisma.blobStore.create({
        data: {
          projectId,
          name: storeName,
          isPublic: isPublic || false,
        },
      });

      await prisma.activity.create({
        data: {
          userId: user.id,
          projectId,
          type: "storage",
          action: "created",
          description: `Created blob store "${storeName}"`,
        },
      });

      return ok(store);
    }

    // Operations on existing store
    if (storeId) {
      const store = await prisma.blobStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
      });

      if (!store) {
        return fail("NOT_FOUND", "Store not found", 404);
      }

      // Get presigned upload URL
      if (getPresignedUrl && pathname) {
        const result = await getUploadUrl(storeId, pathname, {
          expiresIn: expiresIn || 3600,
          contentType: blobContentType,
        });

        return ok(result);
      }

      // Copy blob
      if (copyFrom && pathname) {
        // Verify source store access
        const sourceStore = await prisma.blobStore.findFirst({
          where: {
            id: copyFrom.storeId,
            project: { userId: user.id },
          },
        });

        if (!sourceStore) {
          return fail("NOT_FOUND", "Source store not found", 404);
        }

        const blobInfo = await copyBlob(
          copyFrom.storeId,
          copyFrom.pathname,
          storeId,
          pathname
        );

        if (!blobInfo) {
          return fail("INTERNAL_ERROR", "Failed to copy blob", 500);
        }

        return ok(blobInfo);
      }

      // Direct upload with content
      if (pathname && content !== undefined) {
        // Decode base64 if needed
        const data = content.startsWith("data:")
          ? Buffer.from(content.split(",")[1], "base64")
          : content;

        const blobInfo = await uploadBlob(storeId, pathname, data, {
          contentType: blobContentType || "application/octet-stream",
          metadata,
          isPublic: store.isPublic,
        });

        await prisma.activity.create({
          data: {
            userId: user.id,
            projectId,
            type: "storage",
            action: "uploaded",
            description: `Uploaded blob "${pathname}" (${formatBytes(blobInfo.size)})`,
          },
        });

        return ok(blobInfo);
      }
    }

    return fail("BAD_REQUEST", "Invalid request", 400);
  } catch (error) {
    log.error("Failed to create blob", error);
    return fail("INTERNAL_ERROR", "Failed to create blob", 500);
  }
}

// DELETE /api/storage/blobs - Delete a blob or store
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const pathname = searchParams.get("pathname");

    // Delete specific blob
    if (storeId && pathname) {
      const store = await prisma.blobStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
        include: {
          project: { select: { id: true } },
        },
      });

      if (!store) {
        return fail("NOT_FOUND", "Store not found", 404);
      }

      const deleted = await deleteBlob(storeId, pathname);

      if (deleted) {
        await prisma.activity.create({
          data: {
            userId: user.id,
            projectId: store.projectId,
            type: "storage",
            action: "deleted",
            description: `Deleted blob "${pathname}"`,
          },
        });
      }

      return ok({ success: deleted });
    }

    // Delete entire store
    if (storeId) {
      const store = await prisma.blobStore.findFirst({
        where: {
          id: storeId,
          project: { userId: user.id },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      if (!store) {
        return fail("NOT_FOUND", "Store not found", 404);
      }

      // Delete all blobs from MinIO
      const deletedCount = await deleteStore(storeId);

      // Delete store from Postgres (cascades to blob records)
      await prisma.blobStore.delete({ where: { id: storeId } });

      await prisma.activity.create({
        data: {
          userId: user.id,
          projectId: store.projectId,
          type: "storage",
          action: "deleted",
          description: `Deleted blob store "${store.name}" (${deletedCount} blobs)`,
        },
      });

      return ok({ success: true, deletedCount });
    }

    return fail("VALIDATION_MISSING_FIELD", "ID required", 400);
  } catch (error) {
    log.error("Failed to delete blob", error);
    return fail("INTERNAL_ERROR", "Failed to delete", 500);
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
