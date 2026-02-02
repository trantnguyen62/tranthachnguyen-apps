/**
 * Public Blob API - Serve public blobs without authentication
 * For images, static assets, and other publicly accessible files
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadBlob, getBlobInfo } from "@/lib/storage/blob-service";

interface RouteParams {
  params: Promise<{
    storeId: string;
    pathname: string[];
  }>;
}

/**
 * GET /api/public/blobs/[storeId]/[...pathname] - Serve public blob
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, pathname: pathParts } = await params;
    const pathname = pathParts.join("/");

    // Verify store is public
    const store = await prisma.blobStore.findUnique({
      where: { id: storeId },
      select: { isPublic: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!store.isPublic) {
      return NextResponse.json(
        { error: "This blob is not publicly accessible" },
        { status: 403 }
      );
    }

    // Download and stream the blob
    const result = await downloadBlob(storeId, pathname);
    if (!result) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", result.contentType);
    headers.set("Content-Length", String(result.size));
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    // Support range requests
    const range = request.headers.get("range");
    if (range) {
      headers.set("Accept-Ranges", "bytes");
    }

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
    console.error("Public blob error:", error);
    return NextResponse.json(
      { error: "Failed to serve blob" },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/public/blobs/[storeId]/[...pathname] - Get public blob metadata
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  try {
    const { storeId, pathname: pathParts } = await params;
    const pathname = pathParts.join("/");

    // Verify store is public
    const store = await prisma.blobStore.findUnique({
      where: { id: storeId },
      select: { isPublic: true },
    });

    if (!store || !store.isPublic) {
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
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(null, { status: 200, headers });
  } catch (error) {
    console.error("Public blob HEAD error:", error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Range");
  headers.set("Access-Control-Max-Age", "86400");

  return new NextResponse(null, { status: 204, headers });
}
