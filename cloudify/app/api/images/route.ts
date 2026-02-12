/**
 * Image Optimization API
 *
 * GET /api/images?url=<source>&w=<width>&h=<height>&q=<quality>&f=<format>
 *
 * Provides on-the-fly image optimization similar to Vercel's Image Optimization API:
 * - Automatic format conversion (WebP, AVIF, JPEG)
 * - Responsive image resizing
 * - Quality adjustment
 * - CDN-friendly caching
 */

import { NextRequest, NextResponse } from "next/server";
import {
  optimizeImageFromUrl,
  optimizeImage,
  detectBestFormat,
  validateWidth,
  VALID_WIDTHS,
  ImageFormat,
} from "@/lib/images/optimizer";
import {
  generateImageCacheKey,
  getFromMemoryCache,
  setInMemoryCache,
  getCacheControlHeaders,
  generateETag,
  shouldReturn304,
} from "@/lib/images/cache";
import { createLogger } from "@/lib/logging";
import { ok, fail } from "@/lib/api/response";

const logger = createLogger("image-api");

// Allowed external domains for remote images
const ALLOWED_DOMAINS = [
  "localhost",
  "cloudify.tranthachnguyen.com",
  "*.cloudify.tranthachnguyen.com",
  "*.projects.tranthachnguyen.com",
  "github.com",
  "*.githubusercontent.com",
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
  "images.unsplash.com",
  "*.unsplash.com",
  "cdn.jsdelivr.net",
];

/**
 * Check if a URL's domain is allowed
 */
function isDomainAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);

    for (const pattern of ALLOWED_DOMAINS) {
      if (pattern.startsWith("*.")) {
        // Wildcard match
        const suffix = pattern.slice(1); // Remove *
        if (hostname.endsWith(suffix) || hostname === suffix.slice(1)) {
          return true;
        }
      } else if (hostname === pattern) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * GET /api/images
 *
 * Query parameters:
 * - url: Source image URL (required)
 * - w: Width in pixels (optional, must be valid width)
 * - h: Height in pixels (optional)
 * - q: Quality 1-100 (optional, default: 75)
 * - f: Format webp|avif|jpeg|png|auto (optional, default: auto)
 * - fit: cover|contain|fill|inside|outside (optional, default: cover)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { searchParams } = request.nextUrl;

    // Get parameters
    const url = searchParams.get("url");
    const width = searchParams.get("w");
    const height = searchParams.get("h");
    const quality = searchParams.get("q");
    const format = searchParams.get("f") as ImageFormat | null;
    const fit = searchParams.get("fit") as "cover" | "contain" | "fill" | "inside" | "outside" | null;

    // Validate required parameters
    if (!url) {
      return fail("VALIDATION_MISSING_FIELD", "Missing required parameter: url", 400);
    }

    // Validate URL domain
    if (!isDomainAllowed(url)) {
      return fail("AUTH_FORBIDDEN", "Image domain not allowed", 403);
    }

    // Parse and validate width
    let parsedWidth: number | undefined;
    if (width) {
      parsedWidth = parseInt(width, 10);
      if (isNaN(parsedWidth) || parsedWidth < 1) {
        return fail("VALIDATION_ERROR", "Invalid width parameter", 400);
      }
      parsedWidth = validateWidth(parsedWidth);
    }

    // Parse and validate height
    let parsedHeight: number | undefined;
    if (height) {
      parsedHeight = parseInt(height, 10);
      if (isNaN(parsedHeight) || parsedHeight < 1 || parsedHeight > 4096) {
        return fail("VALIDATION_ERROR", "Invalid height parameter", 400);
      }
    }

    // Parse and validate quality
    let parsedQuality = 75;
    if (quality) {
      parsedQuality = parseInt(quality, 10);
      if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
        return fail("VALIDATION_ERROR", "Invalid quality parameter (1-100)", 400);
      }
    }

    // Determine output format
    let outputFormat: ImageFormat = format || "auto";
    if (outputFormat === "auto") {
      outputFormat = detectBestFormat(request.headers.get("accept"));
    }

    // Validate format
    const validFormats: ImageFormat[] = ["webp", "avif", "jpeg", "png", "auto"];
    if (!validFormats.includes(outputFormat)) {
      return fail("VALIDATION_ERROR", "Invalid format parameter (webp, avif, jpeg, png, auto)", 400);
    }

    // Generate cache key
    const cacheKey = generateImageCacheKey(
      url,
      parsedWidth,
      parsedHeight,
      parsedQuality,
      outputFormat
    );

    // Check memory cache first
    const cachedBuffer = getFromMemoryCache(cacheKey);
    if (cachedBuffer) {
      const etag = generateETag(cachedBuffer);

      // Check for 304 Not Modified
      if (shouldReturn304(request.headers, etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            ...getCacheControlHeaders({}),
          },
        });
      }

      logger.debug("Serving from memory cache", { cacheKey });

      const contentType = outputFormat === "auto" ? "image/webp" :
        outputFormat === "avif" ? "image/avif" :
        outputFormat === "jpeg" ? "image/jpeg" :
        outputFormat === "png" ? "image/png" : "image/webp";

      return new NextResponse(new Uint8Array(cachedBuffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": cachedBuffer.length.toString(),
          ETag: etag,
          "X-Cache": "HIT",
          ...getCacheControlHeaders({}),
        },
      });
    }

    // Optimize the image
    const optimized = await optimizeImageFromUrl(url, {
      width: parsedWidth,
      height: parsedHeight,
      quality: parsedQuality,
      format: outputFormat,
      fit: fit || "cover",
    });

    // Store in memory cache
    setInMemoryCache(cacheKey, optimized.buffer);

    const etag = generateETag(optimized.buffer);
    const duration = Math.round(performance.now() - startTime);

    logger.info("Image optimized", {
      url: url.substring(0, 100),
      width: optimized.width,
      height: optimized.height,
      format: optimized.format,
      originalSize: undefined,
      optimizedSize: optimized.size,
      duration,
    });

    return new NextResponse(new Uint8Array(optimized.buffer), {
      status: 200,
      headers: {
        "Content-Type": optimized.contentType,
        "Content-Length": optimized.size.toString(),
        ETag: etag,
        "X-Cache": "MISS",
        "X-Optimization-Time": `${duration}ms`,
        "X-Image-Width": optimized.width.toString(),
        "X-Image-Height": optimized.height.toString(),
        ...getCacheControlHeaders({}),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Image optimization failed", err);

    // Return appropriate error
    if (err.message.includes("fetch")) {
      return fail("INTERNAL_ERROR", "Failed to fetch source image", 502);
    }

    if (err.message.includes("format") || err.message.includes("unsupported")) {
      return fail("INTERNAL_ERROR", "Unsupported image format", 415);
    }

    return fail("INTERNAL_ERROR", "Image optimization failed", 500);
  }
}

/**
 * POST /api/images
 *
 * Upload and optimize an image directly
 * Body: FormData with 'image' file
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get optimization parameters
    const width = searchParams.get("w");
    const height = searchParams.get("h");
    const quality = searchParams.get("q");
    const format = searchParams.get("f") as ImageFormat | null;
    const fit = searchParams.get("fit") as "cover" | "contain" | "fill" | "inside" | "outside" | null;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return fail("BAD_REQUEST", "No image file provided", 400);
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return fail("VALIDATION_ERROR", "File must be an image", 400);
    }

    // Get buffer from file
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse parameters
    const parsedWidth = width ? parseInt(width, 10) : undefined;
    const parsedHeight = height ? parseInt(height, 10) : undefined;
    const parsedQuality = quality ? parseInt(quality, 10) : 75;

    // Determine output format
    let outputFormat: ImageFormat = format || "auto";
    if (outputFormat === "auto") {
      outputFormat = detectBestFormat(request.headers.get("accept"));
    }

    // Optimize the image
    const optimized = await optimizeImage(buffer, {
      width: parsedWidth ? validateWidth(parsedWidth) : undefined,
      height: parsedHeight,
      quality: parsedQuality,
      format: outputFormat,
      fit: fit || "cover",
    });

    return new NextResponse(new Uint8Array(optimized.buffer), {
      status: 200,
      headers: {
        "Content-Type": optimized.contentType,
        "Content-Length": optimized.size.toString(),
        "X-Image-Width": optimized.width.toString(),
        "X-Image-Height": optimized.height.toString(),
        "X-Original-Size": buffer.length.toString(),
        "X-Optimized-Size": optimized.size.toString(),
        "X-Size-Reduction": `${Math.round((1 - optimized.size / buffer.length) * 100)}%`,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Image upload optimization failed", err);

    return fail("INTERNAL_ERROR", "Image optimization failed", 500);
  }
}
