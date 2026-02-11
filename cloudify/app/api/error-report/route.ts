import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/integrations/sentry";
import { checkRateLimit } from "@/lib/auth/rate-limit";

/**
 * POST /api/error-report - Client-side error reporting endpoint
 * Forwards errors from the React error boundary to Sentry
 */
export async function POST(request: NextRequest) {
  // Rate limit to prevent abuse (10 reports per minute per IP)
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`error-report:${ip}`, {
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const body = await request.json();
    const { message, stack, digest } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const error = new Error(message);
    if (stack && typeof stack === "string") {
      error.stack = stack;
    }

    // Fire and forget — don't block the response
    captureException(error, {
      level: "error",
      tags: {
        source: "client",
        digest: digest || "none",
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
