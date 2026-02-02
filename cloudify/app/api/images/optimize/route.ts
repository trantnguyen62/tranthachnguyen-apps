/**
 * Image Optimization API
 *
 * GET /api/images/optimize?url=...&w=...&q=...
 *
 * Vercel-compatible image optimization endpoint.
 * Supports:
 * - url: Source image URL (required)
 * - w: Width in pixels (optional, uses closest valid size)
 * - h: Height in pixels (optional)
 * - q: Quality 1-100 (optional, default 75)
 * - f: Format - webp, avif, jpeg, png, auto (optional, default auto)
 * - fit: cover, contain, fill, inside, outside (optional, default cover)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  optimizeImageFromUrl,
  detectBestFormat,
  validateWidth,
  VALID_WIDTHS,
  type ImageFormat,
} from "@/lib/images/optimizer";
import { createLogger } from "@/lib/logging";

const logger = createLogger("api:images");

// Cache control settings
const CACHE_CONTROL_SUCCESS = "public, max-age=31536000, immutable"; // 1 year
const CACHE_CONTROL_ERROR = "no-cache";

// Rate limiting (simple in-memory)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse parameters
    const url = searchParams.get("url");
    const widthParam = searchParams.get("w");
    const heightParam = searchParams.get("h");
    const qualityParam = searchParams.get("q");
    const formatParam = searchParams.get("f") as ImageFormat | null;
    const fitParam = searchParams.get("fit") as "cover" | "contain" | "fill" | "inside" | "outside" | null;

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: "Missing required parameter: url" },
        { status: 400 }
      );
    }

    // Validate width if provided
    let width: number | undefined;
    if (widthParam) {
      width = parseInt(widthParam, 10);
      if (isNaN(width) || width < 1) {
        return NextResponse.json(
          { error: `Invalid width. Valid widths: ${VALID_WIDTHS.join(", ")}` },
          { status: 400 }
        );
      }
      width = validateWidth(width);
    }

    // Validate height if provided
    let height: number | undefined;
    if (heightParam) {
      height = parseInt(heightParam, 10);
      if (isNaN(height) || height < 1 || height > 4096) {
        return NextResponse.json(
          { error: "Invalid height. Must be between 1 and 4096" },
          { status: 400 }
        );
      }
    }

    // Validate quality
    let quality = 75;
    if (qualityParam) {
      quality = parseInt(qualityParam, 10);
      if (isNaN(quality) || quality < 1 || quality > 100) {
        return NextResponse.json(
          { error: "Invalid quality. Must be between 1 and 100" },
          { status: 400 }
        );
      }
    }

    // Determine output format
    const acceptHeader = request.headers.get("accept");
    const format = formatParam || detectBestFormat(acceptHeader);

    // Validate fit
    const validFits = ["cover", "contain", "fill", "inside", "outside"];
    const fit = fitParam && validFits.includes(fitParam) ? fitParam : "cover";

    // Optimize the image
    const result = await optimizeImageFromUrl(url, {
      width,
      height,
      quality,
      format,
      fit,
    });

    const duration = Math.round(performance.now() - startTime);

    logger.info("Image optimized", {
      url: url.substring(0, 100),
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.size,
      duration,
    });

    // Return optimized image
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": result.size.toString(),
        "Cache-Control": CACHE_CONTROL_SUCCESS,
        "X-Cloudify-Cache": "MISS", // Would be HIT from CDN
        "X-Cloudify-Width": result.width.toString(),
        "X-Cloudify-Height": result.height.toString(),
        "X-Cloudify-Format": result.format,
        "X-Response-Time": `${duration}ms`,
        // Vary by Accept header for format negotiation
        Vary: "Accept",
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Image optimization failed", err);

    return NextResponse.json(
      { error: err.message || "Failed to optimize image" },
      {
        status: 500,
        headers: { "Cache-Control": CACHE_CONTROL_ERROR },
      }
    );
  }
}

// HEAD request for cache validation
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": CACHE_CONTROL_SUCCESS,
    },
  });
}
