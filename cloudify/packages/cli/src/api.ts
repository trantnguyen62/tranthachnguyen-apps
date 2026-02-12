/**
 * API client for Cloudify
 */

import fetch from "node-fetch";
import { getToken, getApiUrl } from "./config.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = getToken();
  const baseUrl = getApiUrl();

  const { method = "GET", body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new ApiError(
      (data.error as string) || (data.message as string) || "API request failed",
      response.status,
      data.code as string | undefined
    );
  }

  return data as T;
}

// Convenience methods
export const get = <T>(endpoint: string) => api<T>(endpoint);
export const post = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: "POST", body });
export const put = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: "PUT", body });
export const del = <T>(endpoint: string) =>
  api<T>(endpoint, { method: "DELETE" });
