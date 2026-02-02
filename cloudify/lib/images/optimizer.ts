/**
 * Image Optimization Service
 *
 * Provides on-the-fly image optimization similar to Vercel's Image Optimization API:
 * - Automatic format conversion (WebP, AVIF)
 * - Responsive image resizing
 * - Quality adjustment
 * - Caching with CDN-friendly headers
 */

import { createHash } from "crypto";
import { createLogger } from "@/lib/logging";
import sharp from "sharp";

const logger = createLogger("image-optimizer");

// Supported output formats
export type ImageFormat = "webp" | "avif" | "jpeg" | "png" | "auto";

// Device size presets (Vercel-compatible)
export const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];

// All valid widths
export const VALID_WIDTHS = [...IMAGE_SIZES, ...DEVICE_SIZES].sort((a, b) => a - b);

// Quality presets
export const QUALITY_PRESETS = {
  low: 60,
  medium: 75,
  high: 90,
  lossless: 100,
};

export interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface OptimizedImage {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
  format: string;
  size: number;
  cacheKey: string;
}

/**
 * Generate a cache key for an optimized image
 */
export function generateCacheKey(
  url: string,
  options: OptimizeOptions
): string {
  const params = `${url}|w=${options.width}|h=${options.height}|q=${options.quality}|f=${options.format}|fit=${options.fit}`;
  return createHash("sha256").update(params).digest("hex").substring(0, 16);
}

/**
 * Validate width parameter
 */
export function validateWidth(width: number): number {
  // Find the closest valid width
  if (VALID_WIDTHS.includes(width)) {
    return width;
  }
  // Find next larger size
  const nextSize = VALID_WIDTHS.find((w) => w >= width);
  return nextSize || VALID_WIDTHS[VALID_WIDTHS.length - 1];
}

/**
 * Detect best format based on Accept header
 */
export function detectBestFormat(acceptHeader: string | null): ImageFormat {
  if (!acceptHeader) return "webp";

  // AVIF has best compression but slower
  if (acceptHeader.includes("image/avif")) {
    return "avif";
  }
  // WebP is widely supported and fast
  if (acceptHeader.includes("image/webp")) {
    return "webp";
  }
  // Fallback to JPEG
  return "jpeg";
}

/**
 * Get content type for format
 */
export function getContentType(format: ImageFormat): string {
  const types: Record<ImageFormat, string> = {
    webp: "image/webp",
    avif: "image/avif",
    jpeg: "image/jpeg",
    png: "image/png",
    auto: "image/webp",
  };
  return types[format] || "image/webp";
}

/**
 * Optimize an image buffer
 */
export async function optimizeImage(
  input: Buffer,
  options: OptimizeOptions
): Promise<OptimizedImage> {
  const startTime = performance.now();

  const {
    width,
    height,
    quality = 75,
    format = "webp",
    fit = "cover",
  } = options;

  try {
    let pipeline = sharp(input);

    // Get original metadata
    const metadata = await pipeline.metadata();

    // Resize if dimensions specified
    if (width || height) {
      pipeline = pipeline.resize({
        width: width ? validateWidth(width) : undefined,
        height,
        fit,
        withoutEnlargement: true, // Don't upscale
      });
    }

    // Convert to output format
    const outputFormat = format === "auto" ? "webp" : format;

    switch (outputFormat) {
      case "webp":
        pipeline = pipeline.webp({ quality, effort: 4 });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality, effort: 4 });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case "png":
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
    }

    // Process the image
    const outputBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    const duration = Math.round(performance.now() - startTime);

    logger.debug("Image optimized", {
      originalSize: input.length,
      optimizedSize: outputBuffer.length,
      reduction: `${Math.round((1 - outputBuffer.length / input.length) * 100)}%`,
      width: outputMetadata.width,
      height: outputMetadata.height,
      format: outputFormat,
      duration,
    });

    return {
      buffer: outputBuffer,
      contentType: getContentType(outputFormat as ImageFormat),
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      format: outputFormat,
      size: outputBuffer.length,
      cacheKey: generateCacheKey("buffer", options),
    };
  } catch (error) {
    logger.error("Image optimization failed", error);
    throw error;
  }
}

/**
 * Fetch and optimize an image from a URL
 */
export async function optimizeImageFromUrl(
  url: string,
  options: OptimizeOptions
): Promise<OptimizedImage> {
  logger.info("Optimizing image from URL", { url, options });

  // Validate URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("Invalid image URL");
  }

  // Fetch the image
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Cloudify-Image-Optimizer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/")) {
    throw new Error("URL does not point to an image");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Set cache key with URL
  const result = await optimizeImage(buffer, options);
  result.cacheKey = generateCacheKey(url, options);

  return result;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = DEVICE_SIZES
): string {
  return widths
    .map((w) => `${baseUrl}?w=${w} ${w}w`)
    .join(", ");
}

/**
 * Generate sizes attribute based on common layouts
 */
export function generateSizes(layout: "full" | "half" | "third" | "fixed"): string {
  switch (layout) {
    case "full":
      return "100vw";
    case "half":
      return "(max-width: 768px) 100vw, 50vw";
    case "third":
      return "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
    case "fixed":
      return "";
    default:
      return "100vw";
  }
}
