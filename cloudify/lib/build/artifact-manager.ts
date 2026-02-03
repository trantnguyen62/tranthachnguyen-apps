/**
 * Artifact Manager - Handles MinIO operations for build artifacts
 * Used for storing and retrieving deployed site files
 */

import { Client as MinioClient, BucketItem } from "minio";
import { Readable } from "stream";

// MinIO configuration from environment
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "minio";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "cloudify";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "cloudify-minio-secret-key-change-in-production";

// Bucket names
const BUILDS_BUCKET = "cloudify-builds";
const BLOBS_BUCKET = "cloudify-blobs";
const FUNCTIONS_BUCKET = "cloudify-functions";

// Singleton MinIO client
let minioClient: MinioClient | null = null;

/**
 * Get MinIO client instance
 */
export function getMinioClient(): MinioClient {
  if (!minioClient) {
    minioClient = new MinioClient({
      endPoint: MINIO_ENDPOINT,
      port: MINIO_PORT,
      useSSL: MINIO_USE_SSL,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });
  }
  return minioClient;
}

/**
 * Ensure a bucket exists, create if not
 */
export async function ensureBucket(bucketName: string): Promise<void> {
  const client = getMinioClient();

  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      await client.makeBucket(bucketName);
      console.log(`Created bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName}:`, error);
    throw error;
  }
}

/**
 * Initialize all required buckets
 */
export async function initializeBuckets(): Promise<void> {
  await ensureBucket(BUILDS_BUCKET);
  await ensureBucket(BLOBS_BUCKET);
  await ensureBucket(FUNCTIONS_BUCKET);
}

/**
 * Check if build artifacts exist for a site
 */
export async function artifactsExist(siteSlug: string): Promise<boolean> {
  const client = getMinioClient();

  try {
    const stream = client.listObjects(BUILDS_BUCKET, `${siteSlug}/`, false);

    return new Promise((resolve) => {
      let hasItems = false;

      stream.on("data", () => {
        hasItems = true;
      });

      stream.on("end", () => {
        resolve(hasItems);
      });

      stream.on("error", () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

/**
 * List all files in a deployment's artifacts
 */
export async function listArtifacts(siteSlug: string): Promise<BucketItem[]> {
  const client = getMinioClient();
  const items: BucketItem[] = [];

  try {
    const stream = client.listObjects(BUILDS_BUCKET, `${siteSlug}/`, true);

    return new Promise((resolve, reject) => {
      stream.on("data", (item: BucketItem) => {
        items.push(item);
      });

      stream.on("end", () => {
        resolve(items);
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error listing artifacts for ${siteSlug}:`, error);
    return [];
  }
}

/**
 * Get a specific artifact file
 */
export async function getArtifact(
  siteSlug: string,
  filePath: string
): Promise<Buffer | null> {
  const client = getMinioClient();
  const objectName = `${siteSlug}/${filePath}`;

  try {
    const stream = await client.getObject(BUILDS_BUCKET, objectName);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error getting artifact ${objectName}:`, error);
    return null;
  }
}

/**
 * Get presigned URL for an artifact (for direct download)
 */
export async function getArtifactUrl(
  siteSlug: string,
  filePath: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinioClient();
  const objectName = `${siteSlug}/${filePath}`;

  return client.presignedGetObject(BUILDS_BUCKET, objectName, expirySeconds);
}

/**
 * Delete all artifacts for a deployment
 */
export async function deleteArtifacts(siteSlug: string): Promise<void> {
  const client = getMinioClient();

  try {
    const objects = await listArtifacts(siteSlug);
    const objectNames = objects
      .filter((obj) => obj.name)
      .map((obj) => obj.name as string);

    if (objectNames.length > 0) {
      await client.removeObjects(BUILDS_BUCKET, objectNames);
      console.log(`Deleted ${objectNames.length} artifacts for ${siteSlug}`);
    }
  } catch (error) {
    console.error(`Error deleting artifacts for ${siteSlug}:`, error);
    throw error;
  }
}

/**
 * Copy artifacts from one deployment to another (for rollbacks)
 */
export async function copyArtifacts(
  sourceSiteSlug: string,
  destSiteSlug: string
): Promise<void> {
  const client = getMinioClient();

  try {
    const sourceObjects = await listArtifacts(sourceSiteSlug);

    for (const obj of sourceObjects) {
      if (!obj.name) continue;

      const sourcePath = obj.name;
      const destPath = sourcePath.replace(sourceSiteSlug, destSiteSlug);

      await client.copyObject(
        BUILDS_BUCKET,
        destPath,
        `/${BUILDS_BUCKET}/${sourcePath}`
      );
    }

    console.log(`Copied artifacts from ${sourceSiteSlug} to ${destSiteSlug}`);
  } catch (error) {
    console.error(`Error copying artifacts:`, error);
    throw error;
  }
}

/**
 * Get total size of artifacts for a deployment
 */
export async function getArtifactsSize(siteSlug: string): Promise<number> {
  const artifacts = await listArtifacts(siteSlug);
  return artifacts.reduce((total, item) => total + (item.size || 0), 0);
}

/**
 * Upload a single file to artifacts
 */
export async function uploadArtifact(
  siteSlug: string,
  filePath: string,
  content: Buffer | string,
  contentType?: string
): Promise<void> {
  const client = getMinioClient();
  const objectName = `${siteSlug}/${filePath}`;

  const buffer = typeof content === "string" ? Buffer.from(content) : content;

  await client.putObject(
    BUILDS_BUCKET,
    objectName,
    buffer,
    buffer.length,
    contentType ? { "Content-Type": contentType } : undefined
  );
}

// ============ Blob Storage API ============

export interface BlobMetadata {
  contentType?: string;
  size: number;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a blob to storage
 */
export async function uploadBlob(
  storeId: string,
  pathname: string,
  content: Buffer | Readable,
  metadata?: Record<string, string>
): Promise<{ etag: string; size: number }> {
  const client = getMinioClient();
  await ensureBucket(BLOBS_BUCKET);

  const objectName = `${storeId}/${pathname}`;

  const result = await client.putObject(
    BLOBS_BUCKET,
    objectName,
    content,
    undefined,
    metadata
  );

  // Get object stats for size
  const stat = await client.statObject(BLOBS_BUCKET, objectName);

  return {
    etag: result.etag,
    size: stat.size,
  };
}

/**
 * Download a blob from storage
 */
export async function downloadBlob(
  storeId: string,
  pathname: string
): Promise<{ stream: NodeJS.ReadableStream; metadata: BlobMetadata }> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  const stat = await client.statObject(BLOBS_BUCKET, objectName);
  const stream = await client.getObject(BLOBS_BUCKET, objectName);

  return {
    stream,
    metadata: {
      contentType: stat.metaData?.["content-type"],
      size: stat.size,
      lastModified: stat.lastModified,
      etag: stat.etag,
      metadata: stat.metaData,
    },
  };
}

/**
 * Delete a blob from storage
 */
export async function deleteBlob(storeId: string, pathname: string): Promise<void> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  await client.removeObject(BLOBS_BUCKET, objectName);
}

/**
 * List blobs in a store
 */
export async function listBlobs(
  storeId: string,
  prefix?: string,
  maxKeys?: number
): Promise<BucketItem[]> {
  const client = getMinioClient();
  const items: BucketItem[] = [];
  const fullPrefix = prefix ? `${storeId}/${prefix}` : `${storeId}/`;

  const stream = client.listObjects(BLOBS_BUCKET, fullPrefix, true);

  return new Promise((resolve, reject) => {
    stream.on("data", (item: BucketItem) => {
      if (maxKeys && items.length >= maxKeys) return;
      items.push(item);
    });

    stream.on("end", () => resolve(items));
    stream.on("error", (err: Error) => reject(err));
  });
}

/**
 * Get presigned URL for blob upload
 */
export async function getBlobUploadUrl(
  storeId: string,
  pathname: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  return client.presignedPutObject(BLOBS_BUCKET, objectName, expirySeconds);
}

/**
 * Get presigned URL for blob download
 */
export async function getBlobDownloadUrl(
  storeId: string,
  pathname: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinioClient();
  const objectName = `${storeId}/${pathname}`;

  return client.presignedGetObject(BLOBS_BUCKET, objectName, expirySeconds);
}

// ============ Function Code Storage ============

/**
 * Upload function code
 */
export async function uploadFunctionCode(
  functionId: string,
  version: string,
  code: string | Buffer
): Promise<void> {
  const client = getMinioClient();
  await ensureBucket(FUNCTIONS_BUCKET);

  const objectName = `${functionId}/${version}/code.js`;
  const buffer = typeof code === "string" ? Buffer.from(code) : code;

  await client.putObject(FUNCTIONS_BUCKET, objectName, buffer, buffer.length);
}

/**
 * Download function code
 */
export async function downloadFunctionCode(
  functionId: string,
  version: string
): Promise<string | null> {
  const client = getMinioClient();
  const objectName = `${functionId}/${version}/code.js`;

  try {
    const stream = await client.getObject(FUNCTIONS_BUCKET, objectName);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      stream.on("error", reject);
    });
  } catch {
    return null;
  }
}

/**
 * Health check for MinIO connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getMinioClient();
    await client.listBuckets();
    return true;
  } catch {
    return false;
  }
}
