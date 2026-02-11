/**
 * Cloudify HTTP Client
 */

import type { ApiError } from "./types.js";

export class CloudifyError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code = "CLOUDIFY_ERROR") {
    super(message);
    this.name = "CloudifyError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
}

export class HttpClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}/api${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, query } = options;

    const url = this.buildUrl(path, query);

    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...headers,
    };

    // Remove Content-Type for FormData
    if (body instanceof FormData) {
      delete requestHeaders["Content-Type"];
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: response.statusText,
          statusCode: response.status,
        };
      }

      throw new CloudifyError(
        errorData.message || errorData.error || "Request failed",
        response.status,
        "API_ERROR"
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  async get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: "GET", query });
  }

  async post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, { method: "POST", body, ...options });
  }

  async put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, { method: "PUT", body, ...options });
  }

  async patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body, ...options });
  }

  async delete<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { method: "DELETE", ...options });
  }
}
