import { NextRequest, NextResponse } from "next/server";

export async function parseJsonBody<T = any>(
  request: NextRequest
): Promise<{ data: T } | NextResponse> {
  try {
    const data = await request.json();
    return { data: data as T };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }
}

export function isParseError(
  result: { data: unknown } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
