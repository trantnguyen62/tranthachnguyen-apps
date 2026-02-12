/**
 * Input Validation Middleware
 * Centralized request validation using Zod schemas
 */

import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema, ZodError } from "zod";
import { isCleanObject } from "./validation";

// ============ Common Validation Schemas ============

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const idSchema = z.object({
  id: z.string().uuid(),
});

export const slugSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/),
});

export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/),
  slug: z
    .string()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/)
    .optional(),
  repoUrl: z.string().url().refine(
    (url) => {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.hostname === "github.com";
    },
    { message: "Must be a valid GitHub HTTPS URL" }
  ),
  repoBranch: z.string().regex(/^[a-zA-Z0-9._\/-]+$/).default("main"),
  rootDir: z.string().default("./"),
  buildCmd: z.string().max(500).optional(),
  installCmd: z.string().max(500).default("npm install"),
  outputDir: z.string().max(100).default("dist"),
  nodeVersion: z.enum(["16", "18", "20", "21", "22"]).default("20"),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const deploymentTriggerSchema = z.object({
  branch: z.string().regex(/^[a-zA-Z0-9._\/-]+$/).optional(),
  force: z.boolean().optional(),
});

export const domainCreateSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i)
    .transform((d) => d.toLowerCase()),
  projectId: z.string().uuid(),
});

export const envVarSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Z_][A-Z0-9_]*$/i),
  value: z.string().max(32768),
  encrypted: z.boolean().default(true),
});

export const webhookConfigSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (url) => {
        const parsed = new URL(url);
        return parsed.protocol === "https:";
      },
      { message: "Webhook URL must use HTTPS" }
    ),
  secret: z.string().min(16).max(256).optional(),
  events: z.array(z.enum(["deployment.started", "deployment.success", "deployment.failed"])),
  enabled: z.boolean().default(true),
});

export const notificationSettingsSchema = z.object({
  email: z
    .object({
      enabled: z.boolean(),
      address: z.string().email().optional(),
      events: z.array(z.string()).optional(),
    })
    .optional(),
  slack: z
    .object({
      enabled: z.boolean(),
      channel: z.string().optional(),
      events: z.array(z.string()).optional(),
    })
    .optional(),
  discord: z
    .object({
      enabled: z.boolean(),
      webhookUrl: z.string().url().optional(),
      events: z.array(z.string()).optional(),
    })
    .optional(),
});

// ============ Validation Helpers ============

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Validate data against a Zod schema
 */
export function validateInput<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    // Check for prototype pollution
    if (typeof data === "object" && !isCleanObject(data)) {
      return {
        success: false,
        errors: [{ path: "_", message: "Invalid object structure" }],
      };
    }

    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      errors: result.error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      })),
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: "_",
          message: error instanceof Error ? error.message : "Validation error",
        },
      ],
    };
  }
}

/**
 * Parse and validate JSON body from request
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  maxSize: number = 1024 * 1024 // 1MB default
): Promise<ValidationResult<T> & { response?: NextResponse }> {
  try {
    // Check content length
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return {
        success: false,
        errors: [{ path: "_", message: "Request body too large" }],
        response: NextResponse.json(
          { error: "Request body too large" },
          { status: 413 }
        ),
      };
    }

    // Parse JSON
    const text = await request.text();
    if (text.length > maxSize) {
      return {
        success: false,
        errors: [{ path: "_", message: "Request body too large" }],
        response: NextResponse.json(
          { error: "Request body too large" },
          { status: 413 }
        ),
      };
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        errors: [{ path: "_", message: "Invalid JSON" }],
        response: NextResponse.json(
          { error: "Invalid JSON" },
          { status: 400 }
        ),
      };
    }

    // Validate
    const result = validateInput(schema, data);

    if (!result.success) {
      return {
        ...result,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: result.errors,
          },
          { status: 400 }
        ),
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      errors: [{ path: "_", message: "Failed to process request" }],
      response: NextResponse.json(
        { error: "Failed to process request" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> & { response?: NextResponse } {
  const params: Record<string, string | string[]> = {};

  request.nextUrl.searchParams.forEach((value, key) => {
    if (params[key]) {
      // Multiple values - convert to array
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  const result = validateInput(schema, params);

  if (!result.success) {
    return {
      ...result,
      response: NextResponse.json(
        {
          error: "Invalid query parameters",
          details: result.errors,
        },
        { status: 400 }
      ),
    };
  }

  return result;
}

/**
 * Parse and validate path parameters
 */
export function parsePathParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): ValidationResult<T> & { response?: NextResponse } {
  const result = validateInput(schema, params);

  if (!result.success) {
    return {
      ...result,
      response: NextResponse.json(
        {
          error: "Invalid path parameters",
          details: result.errors,
        },
        { status: 400 }
      ),
    };
  }

  return result;
}

// ============ Middleware Factory ============

/**
 * Create validation middleware for API routes
 */
export function withValidation<TBody = undefined, TQuery = undefined>(options: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  maxBodySize?: number;
}) {
  return async function validate(
    request: NextRequest,
    params?: Record<string, string>
  ): Promise<{
    body?: TBody;
    query?: TQuery;
    params?: Record<string, string>;
    error?: NextResponse;
  }> {
    // Validate body if schema provided
    let body: TBody | undefined;
    if (options.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
      const bodyResult = await parseJsonBody(
        request,
        options.body,
        options.maxBodySize
      );
      if (!bodyResult.success) {
        return { error: bodyResult.response };
      }
      body = bodyResult.data;
    }

    // Validate query params if schema provided
    let query: TQuery | undefined;
    if (options.query) {
      const queryResult = parseQueryParams(request, options.query);
      if (!queryResult.success) {
        return { error: queryResult.response };
      }
      query = queryResult.data;
    }

    return { body, query, params };
  };
}

// ============ Sanitization Utilities ============

/**
 * Sanitize user input for safe display
 */
export function sanitizeUserInput(input: string, maxLength = 1000): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  } = options;

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  // MIME type is the primary validation (harder to spoof than extension)
  if (allowedTypes.length && !allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  // Extension check as secondary validation — check ALL extensions in the filename
  // to prevent double-extension attacks like "malicious.php.jpg"
  const nameParts = file.name.split(".");
  if (nameParts.length > 1) {
    const allExtensions = nameParts.slice(1).map(ext => "." + ext.toLowerCase());
    const hasDisallowedExt = allExtensions.some(ext => !allowedExtensions.includes(ext));
    if (allowedExtensions.length && hasDisallowedExt) {
      return { valid: false, error: "File extension not allowed" };
    }
  }

  return { valid: true };
}
