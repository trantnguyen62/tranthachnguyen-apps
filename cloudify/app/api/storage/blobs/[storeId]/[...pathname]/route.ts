/**
 * Blob Streaming API - Direct upload/download with path-based routing
 * Supports streaming for large file transfers
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { Readable } from "stream";
import { getRouteLogger } from "@/lib/api/logger";
import {
  uploadBlob,
  downloadBlob,
  getBlobInfo,
  deleteBlob,
  getDownloadUrl,
} from "@/lib/storage/blob-service";

const log = getRouteLogger("storage/blobs/[storeId]/[...pathname]");

interface RouteParams {
  params: Promise<{
    storeId: string;
    pathname: string[];
  }>;
}

/**
 * GET /api/storage/blobs/[storeId]/[...pathname] - Download blob
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { storeId, pathname: pathParts } = await params;
    const pathname = pathParts.join("/");

    // Verify store access
    const store = await prisma.blobStore.findFirst({
      where: {
        id: storeId,
        project: { userId: user.id },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get("redirect") === "true";
    const info = searchParams.get("info") === "true";

    // Return blob info only
    if (info) {
      const blobInfo = await getBlobInfo(storeId, pathname);
      if (!blobInfo) {
        return NextResponse.json({ error: "Blob not found" }, { status: 404 });
      }
      return NextResponse.json(blobInfo);
    }

    // Redirect to presigned URL
    if (redirect) {
      const result = await getDownloadUrl(storeId, pathname, { expiresIn: 300 });
      if (!result) {
        return NextResponse.json({ error: "Blob not found" }, { status: 404 });
      }
      return NextResponse.redirect(result.url);
    }

    // Stream download
    const result = await downloadBlob(storeId, pathname);
    if (!result) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", result.contentType);
    headers.set("Content-Length", String(result.size));
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Support range requests for video/audio streaming
    const range = request.headers.get("range");
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : result.size - 1;
      const chunkSize = end - start + 1;

      headers.set("Content-Range", `bytes ${start}-${end}/${result.size}`);
      headers.set("Content-Length", String(chunkSize));
      headers.set("Accept-Ranges", "bytes");

      // Note: For proper range support, would need to modify blob-service
      // to support partial reads. For now, return full content.
    }

    // Add filename for download
    const filename = pathname.split("/").pop() || "download";
    const disposition = searchParams.get("download") === "true" ? "attachment" : "inline";
    headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(filename)}"`);

    // Convert Node.js stream to Web stream
    const webStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(webStream, { headers });
  } catch (error) {
    log.error("Blob download error", error);
    return NextResponse.json(
      { error: "Failed to download blob" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/storage/blobs/[storeId]/[...pathname] - Upload blob via streaming
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { storeId, pathname: pathParts } = await params;
    const pathname = pathParts.join("/");

    // Verify store access
    const store = await prisma.blobStore.findFirst({
      where: {
        id: storeId,
        project: { userId: user.id },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Get content type from header
    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const contentLength = request.headers.get("content-length");

    // Check size limit (100MB default)
    const maxSize = 100 * 1024 * 1024;
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Get custom metadata from headers
    const metadata: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.startsWith("x-cloudify-meta-")) {
        metadata[key.replace("x-cloudify-meta-", "")] = value;
      }
    });

    // Read request body as stream
    const body = request.body;
    if (!body) {
      return NextResponse.json({ error: "No body provided" }, { status: 400 });
    }

    // Convert Web stream to Node.js Readable
    const chunks: Buffer[] = [];
    const reader = body.getReader();

    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(Buffer.from(result.value));
      }
    }

    const buffer = Buffer.concat(chunks);

    // Upload to MinIO
    const blobInfo = await uploadBlob(storeId, pathname, buffer, {
      contentType,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      isPublic: store.isPublic,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: store.projectId,
        type: "storage",
        action: "uploaded",
        description: `Uploaded blob "${pathname}" (${formatBytes(blobInfo.size)})`,
      },
    });

    return NextResponse.json(blobInfo, { status: 201 });
  } catch (error) {
    log.error("Blob upload error", error);
    return NextResponse.json(
      { error: "Failed to upload blob" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storage/blobs/[storeId]/[...pathname] - Delete blob
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { storeId, pathname: pathParts } = await params;
    const pathname = pathParts.join("/");

    // Verify store access
    const store = await prisma.blobStore.findFirst({
      where: {
        id: storeId,
        project: { userId: user.id },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
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

    return NextResponse.json({ success: deleted });
  } catch (error) {
    log.error("Blob delete error", error);
    return NextResponse.json(
      { error: "Failed to delete blob" },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/storage/blobs/[storeId]/[...pathname] - Get blob metadata
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { storeId, pathname: pathParts } = await params;
    const pathname = pathParts.join("/");

    // Verify store access
    const store = await prisma.blobStore.findFirst({
      where: {
        id: storeId,
        project: { userId: user.id },
      },
    });

    if (!store) {
      return new NextResponse(null, { status: 404 });
    }

    const blobInfo = await getBlobInfo(storeId, pathname);
    if (!blobInfo) {
      return new NextResponse(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", blobInfo.contentType);
    headers.set("Content-Length", String(blobInfo.size));
    headers.set("Last-Modified", blobInfo.uploadedAt.toUTCString());
    headers.set("Accept-Ranges", "bytes");

    if (blobInfo.metadata) {
      Object.entries(blobInfo.metadata).forEach(([key, value]) => {
        headers.set(`X-Cloudify-Meta-${key}`, String(value));
      });
    }

    return new NextResponse(null, { status: 200, headers });
  } catch (error) {
    log.error("Blob HEAD error", error);
    return new NextResponse(null, { status: 500 });
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
