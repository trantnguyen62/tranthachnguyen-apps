import { NextResponse } from "next/server";

export function apiError(message: string, status: number = 500, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function apiCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}
