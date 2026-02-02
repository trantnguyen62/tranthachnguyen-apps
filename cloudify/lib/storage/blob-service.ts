/**
 * Blob Service - Object storage operations using MinIO
 * Provides Vercel Blob-like API for file storage
 */

import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { getMinioClient, ensureBucket } from "@/lib/build/artifact-manager";

const BLOBS_BUCKET = "cloudify-blobs";

export interface BlobUploadOptions {
  /** Content type (MIME type) */
  contentType?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Whether the blob should be publicly accessible */
  isPublic?: boolean;
  /** Cache control header */
  cacheControl?: string;
}

export interface BlobInfo {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  metadata?: Record<string, string>;
}

export interface BlobListResult {
  blobs: BlobInfo[];
  cursor?: string;
  hasMore: boolean;
}

/**
 * Upload a blob from a buffer or stream
 */
export async function uploadBlob(
  storeId: string,
  pathname: string,
  data: Buffer | Readable | string,
  options: BlobUploadOptions = {}
): Promise<BlobInfo> {
  const client = getMinioClient();
  await ensureBucket(BLOBS_BUCKET);

  const objectName = `${storeId}/${pathname}`;
  const buffer = typeof data === "string" ? Buffer.from(data) : data;

  // Prepare metadata
  const metadata: Record<string, string> = {
    ...options.metadata,
  };

  if (options.contentType) {
    metadata["Content-Type"] = options.contentType;
  }

  if (options.cacheControl) {
    metadata["Cache-Control"] = options.cacheControl;
  }

  // Upload to MinIO
  await client.putObject(
    BLOBS_BUCKET,
    objectName,
    buffer,
    Buffer.isBuffer(buffer) ? buffer.length : undefined,
    metadata
  );

  // Get object stats
  const stat = await client.statObject(BLOBS_BUCKET, objectName);

  // Generate URLs
  const baseUrl = process.env.MINIO_PUBLIC_URL || `http://minio:9000`;
  const url = `${baseUrl}/${BLOBS_BUCKET}/${objectName}`;
  const downloadUrl = await client.presignedGetObject(BLOBS_BUCKET, objectName, 24 * 60 * 60); // 24 hours

  // Store in database
  await prisma.blob.upsert({
    where: {
      storeId_pathname: { storeId, pathname },
    },
    create: {
      storeId,
      pathname,
      contentType: options.contentType || "application/octet-stream",
      size: stat.size,
      url,
      downloadUrl,
      metadata: options.metadata || {},
    },
    update: {
      contentType: options.contentType || "application/octet-stream",
      size: stat.size,
      url,
      downloadUrl,
      metadata: options.metadata || {},
    },
  });

  return {
    url,
    downloadUrl,
    pathname,
    contentType: options.contentType || "application/octet-stream",
    size: stat.size,
    uploadedAt: stat.lastModified,
    metadata: options.metadata,
  };
}

/**
 * Download a blob
 */
export async function downloadBlob(
  storeId: string,
  pathname: string
): Promise<{ stream: Readable; contentType: string; size: number } | null> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  try {
    const stat = await client.statObject(BLOBS_BUCKET, objectName);
    const stream = await client.getObject(BLOBS_BUCKET, objectName);

    return {
      stream,
      contentType: stat.metaData?.["content-type"] || "application/octet-stream",
      size: stat.size,
    };
  } catch (error) {
    console.error("Download blob error:", error);
    return null;
  }
}

/**
 * Download blob as buffer
 */
export async function downloadBlobAsBuffer(
  storeId: string,
  pathname: string
): Promise<Buffer | null> {
  const result = await downloadBlob(storeId, pathname);
  if (!result) return null;

  const chunks: Buffer[] = [];
  for await (const chunk of result.stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

/**
 * Get blob metadata without downloading
 */
export async function getBlobInfo(
  storeId: string,
  pathname: string
): Promise<BlobInfo | null> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  try {
    const stat = await client.statObject(BLOBS_BUCKET, objectName);
    const downloadUrl = await client.presignedGetObject(BLOBS_BUCKET, objectName, 24 * 60 * 60);

    const baseUrl = process.env.MINIO_PUBLIC_URL || `http://minio:9000`;
    const url = `${baseUrl}/${BLOBS_BUCKET}/${objectName}`;

    return {
      url,
      downloadUrl,
      pathname,
      contentType: stat.metaData?.["content-type"] || "application/octet-stream",
      size: stat.size,
      uploadedAt: stat.lastModified,
      metadata: stat.metaData,
    };
  } catch {
    return null;
  }
}

/**
 * Delete a blob
 */
export async function deleteBlob(storeId: string, pathname: string): Promise<boolean> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  try {
    await client.removeObject(BLOBS_BUCKET, objectName);

    // Remove from database
    await prisma.blob.deleteMany({
      where: { storeId, pathname },
    });

    return true;
  } catch (error) {
    console.error("Delete blob error:", error);
    return false;
  }
}

/**
 * List blobs in a store
 */
export async function listBlobs(
  storeId: string,
  options: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<BlobListResult> {
  const { prefix = "", limit = 100 } = options;
  const client = getMinioClient();

  const objectPrefix = prefix ? `${storeId}/${prefix}` : `${storeId}/`;
  const prefixLength = storeId.length + 1;

  const blobs: BlobInfo[] = [];
  let count = 0;
  let hasMore = false;

  const stream = client.listObjectsV2(BLOBS_BUCKET, objectPrefix, true);

  for await (const obj of stream) {
    if (count >= limit) {
      hasMore = true;
      break;
    }

    if (obj.name) {
      const pathname = obj.name.slice(prefixLength);
      const baseUrl = process.env.MINIO_PUBLIC_URL || `http://minio:9000`;

      blobs.push({
        url: `${baseUrl}/${BLOBS_BUCKET}/${obj.name}`,
        downloadUrl: await client.presignedGetObject(BLOBS_BUCKET, obj.name, 3600),
        pathname,
        contentType: "application/octet-stream", // Would need stat call for actual type
        size: obj.size,
        uploadedAt: obj.lastModified,
      });
      count++;
    }
  }

  return {
    blobs,
    hasMore,
    cursor: hasMore ? blobs[blobs.length - 1]?.pathname : undefined,
  };
}

/**
 * Copy a blob to a new location
 */
export async function copyBlob(
  sourceStoreId: string,
  sourcePathname: string,
  destStoreId: string,
  destPathname: string
): Promise<BlobInfo | null> {
  const client = getMinioClient();
  const sourceObject = `${sourceStoreId}/${sourcePathname}`;
  const destObject = `${destStoreId}/${destPathname}`;

  try {
    // Copy in MinIO
    await client.copyObject(
      BLOBS_BUCKET,
      destObject,
      `/${BLOBS_BUCKET}/${sourceObject}`
    );

    // Get info for the new blob
    return getBlobInfo(destStoreId, destPathname);
  } catch (error) {
    console.error("Copy blob error:", error);
    return null;
  }
}

/**
 * Get a presigned upload URL
 */
export async function getUploadUrl(
  storeId: string,
  pathname: string,
  options: {
    expiresIn?: number; // seconds
    contentType?: string;
  } = {}
): Promise<{ url: string; expiresAt: Date }> {
  const client = getMinioClient();
  await ensureBucket(BLOBS_BUCKET);

  const objectName = `${storeId}/${pathname}`;
  const expiresIn = options.expiresIn || 3600; // 1 hour default

  const url = await client.presignedPutObject(BLOBS_BUCKET, objectName, expiresIn);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return { url, expiresAt };
}

/**
 * Get a presigned download URL
 */
export async function getDownloadUrl(
  storeId: string,
  pathname: string,
  options: {
    expiresIn?: number; // seconds
  } = {}
): Promise<{ url: string; expiresAt: Date } | null> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;
  const expiresIn = options.expiresIn || 3600;

  try {
    // Verify object exists
    await client.statObject(BLOBS_BUCKET, objectName);

    const url = await client.presignedGetObject(BLOBS_BUCKET, objectName, expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { url, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Get total storage used by a store
 */
export async function getStorageUsed(storeId: string): Promise<number> {
  const client = getMinioClient();
  const objectPrefix = `${storeId}/`;

  let totalSize = 0;
  const stream = client.listObjectsV2(BLOBS_BUCKET, objectPrefix, true);

  for await (const obj of stream) {
    totalSize += obj.size;
  }

  return totalSize;
}

/**
 * Delete all blobs in a store
 */
export async function deleteStore(storeId: string): Promise<number> {
  const client = getMinioClient();
  const objectPrefix = `${storeId}/`;

  const objects: string[] = [];
  const stream = client.listObjectsV2(BLOBS_BUCKET, objectPrefix, true);

  for await (const obj of stream) {
    if (obj.name) {
      objects.push(obj.name);
    }
  }

  if (objects.length > 0) {
    await client.removeObjects(BLOBS_BUCKET, objects);
  }

  // Clean up database
  await prisma.blob.deleteMany({
    where: { storeId },
  });

  return objects.length;
}
