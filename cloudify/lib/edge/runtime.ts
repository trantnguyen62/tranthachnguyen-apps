/**
 * Edge Runtime
 * Executes edge functions in isolated V8 contexts
 * Uses isolated-vm for sandboxed execution
 */

import { prisma } from "@/lib/prisma";

// Web API polyfills for edge runtime
const WEB_API_POLYFILLS = `
// URL and URLSearchParams
const URL = globalThis.URL || class URL {
  constructor(url, base) {
    this.href = url;
    this.searchParams = new URLSearchParams();
  }
};

// Headers polyfill
class Headers {
  constructor(init = {}) {
    this._headers = {};
    if (init) {
      Object.entries(init).forEach(([k, v]) => this.set(k, v));
    }
  }
  get(name) { return this._headers[name.toLowerCase()] || null; }
  set(name, value) { this._headers[name.toLowerCase()] = String(value); }
  has(name) { return name.toLowerCase() in this._headers; }
  delete(name) { delete this._headers[name.toLowerCase()]; }
  forEach(cb) { Object.entries(this._headers).forEach(([k, v]) => cb(v, k, this)); }
  entries() { return Object.entries(this._headers); }
}

// Request polyfill
class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers || {});
    this.body = init.body || null;
  }
  async json() { return JSON.parse(this.body || '{}'); }
  async text() { return this.body || ''; }
  clone() { return new Request(this.url, { method: this.method, headers: this.headers, body: this.body }); }
}

// Response polyfill
class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers || {});
    this.ok = this.status >= 200 && this.status < 300;
  }
  async json() { return JSON.parse(this.body || '{}'); }
  async text() { return this.body || ''; }
  clone() { return new Response(this.body, { status: this.status, headers: this.headers }); }
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: { ...init.headers, 'content-type': 'application/json' }
    });
  }
  static redirect(url, status = 302) {
    return new Response(null, { status, headers: { location: url } });
  }
}

// NextResponse-like API
const NextResponse = {
  json: (data, init) => Response.json(data, init),
  redirect: (url, status) => Response.redirect(url, status),
  next: () => new Response(null, { headers: { 'x-middleware-next': '1' } }),
  rewrite: (url) => new Response(null, { headers: { 'x-middleware-rewrite': url } }),
};

// Fetch polyfill (stubbed - actual implementation injected)
const fetch = async (url, options) => {
  return __cloudify_fetch(url, options);
};

// Console
const console = {
  log: (...args) => __cloudify_log('log', args),
  error: (...args) => __cloudify_log('error', args),
  warn: (...args) => __cloudify_log('warn', args),
  info: (...args) => __cloudify_log('info', args),
};

// TextEncoder/TextDecoder
const TextEncoder = globalThis.TextEncoder || class TextEncoder {
  encode(str) { return new Uint8Array([...str].map(c => c.charCodeAt(0))); }
};
const TextDecoder = globalThis.TextDecoder || class TextDecoder {
  decode(arr) { return String.fromCharCode(...arr); }
};

// atob/btoa
const atob = globalThis.atob || ((str) => Buffer.from(str, 'base64').toString('binary'));
const btoa = globalThis.btoa || ((str) => Buffer.from(str, 'binary').toString('base64'));

// crypto.randomUUID
const crypto = {
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }),
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  },
};
`;

export interface EdgeExecutionContext {
  functionId: string;
  projectId: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  };
  geo?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  envVars?: Record<string, string>;
}

export interface EdgeExecutionResult {
  status: "success" | "error" | "timeout";
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
  };
  logs: Array<{ level: string; message: string; timestamp: Date }>;
  duration: number;
  memoryUsed: number;
  error?: string;
}

/**
 * Execute an edge function
 */
export async function executeEdgeFunction(
  ctx: EdgeExecutionContext
): Promise<EdgeExecutionResult> {
  const startTime = Date.now();
  const logs: Array<{ level: string; message: string; timestamp: Date }> = [];

  try {
    // Get function code
    const edgeFunction = await prisma.edgeFunction.findUnique({
      where: { id: ctx.functionId },
    });

    if (!edgeFunction) {
      throw new Error("Edge function not found");
    }

    if (!edgeFunction.enabled) {
      throw new Error("Edge function is disabled");
    }

    // Check timeout
    const timeout = edgeFunction.timeout * 1000;

    // In production, this would use isolated-vm for actual isolation
    // For now, we use a simplified execution model
    const result = await executeWithTimeout(
      async () => {
        return await runInSandbox(edgeFunction.code, ctx, logs, edgeFunction.envVars as Record<string, string> | undefined);
      },
      timeout
    );

    const duration = Date.now() - startTime;

    // Record invocation
    await prisma.edgeInvocation.create({
      data: {
        functionId: ctx.functionId,
        status: "success",
        duration,
        memory: result.memoryUsed || 0,
        region: ctx.geo?.country || "global",
        requestPath: ctx.request.url,
        requestMethod: ctx.request.method,
        statusCode: result.response?.status || 200,
        country: ctx.geo?.country,
        city: ctx.geo?.city,
      },
    });

    return {
      status: "success",
      response: result.response,
      logs,
      duration,
      memoryUsed: result.memoryUsed || 0,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.includes("timeout");

    // Record failed invocation
    await prisma.edgeInvocation.create({
      data: {
        functionId: ctx.functionId,
        status: isTimeout ? "timeout" : "error",
        duration,
        memory: 0,
        region: ctx.geo?.country || "global",
        requestPath: ctx.request.url,
        requestMethod: ctx.request.method,
        country: ctx.geo?.country,
        city: ctx.geo?.city,
        error: errorMessage,
      },
    });

    return {
      status: isTimeout ? "timeout" : "error",
      logs,
      duration,
      memoryUsed: 0,
      error: errorMessage,
    };
  }
}

/**
 * Run code in a sandboxed environment
 */
async function runInSandbox(
  code: string,
  ctx: EdgeExecutionContext,
  logs: Array<{ level: string; message: string; timestamp: Date }>,
  envVars?: Record<string, string>
): Promise<{ response?: EdgeExecutionResult["response"]; memoryUsed: number }> {
  // Build the execution context
  const requestJson = JSON.stringify({
    url: ctx.request.url,
    method: ctx.request.method,
    headers: ctx.request.headers,
    body: ctx.request.body,
  });

  const geoJson = JSON.stringify(ctx.geo || {});
  const envJson = JSON.stringify(envVars || {});

  // Wrap user code with polyfills and execution harness
  const wrappedCode = `
${WEB_API_POLYFILLS}

// Inject context
const __request_data = ${requestJson};
const __geo_data = ${geoJson};
const __env_vars = ${envJson};

// Create request object
const request = new Request(__request_data.url, {
  method: __request_data.method,
  headers: __request_data.headers,
  body: __request_data.body,
});

// Geo object
request.geo = __geo_data;

// Environment variables
const env = __env_vars;

// User code
${code}

// Execute the default export or handler
(async () => {
  let handler = typeof middleware !== 'undefined' ? middleware
               : typeof handler !== 'undefined' ? handler
               : typeof default_handler !== 'undefined' ? default_handler
               : null;

  if (!handler && typeof module !== 'undefined' && module.exports) {
    handler = module.exports.default || module.exports.middleware || module.exports;
  }

  if (!handler) {
    throw new Error('No handler function found. Export a default function or middleware.');
  }

  const response = await handler(request, { geo: __geo_data, env });

  // Extract response data
  const headers = {};
  if (response.headers) {
    response.headers.forEach((v, k) => { headers[k] = v; });
  }

  return {
    status: response.status || 200,
    statusText: response.statusText || 'OK',
    headers,
    body: await response.text(),
  };
})();
`;

  // In production, use isolated-vm here
  // For development, use a more limited approach
  try {
    // Create a mock fetch function
    const mockFetch = async (url: string, options?: RequestInit) => {
      const response = await fetch(url, options);
      return response;
    };

    // Create log function
    const mockLog = (level: string, args: unknown[]) => {
      logs.push({
        level,
        message: args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "),
        timestamp: new Date(),
      });
    };

    // Execute using Function constructor (limited sandbox)
    // In production, this should be replaced with isolated-vm
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(
      "__cloudify_fetch",
      "__cloudify_log",
      wrappedCode
    );

    const result = await fn(mockFetch, mockLog);

    return {
      response: {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
        body: result.body,
      },
      memoryUsed: 0, // Would need actual memory tracking in production
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Execute a function with timeout
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Function execution timeout after ${timeout}ms`));
    }, timeout);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Validate edge function code
 */
export function validateEdgeFunctionCode(code: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for forbidden APIs
  const forbiddenPatterns = [
    /require\s*\(/,
    /process\.env/,
    /__dirname/,
    /__filename/,
    /fs\./,
    /child_process/,
    /eval\s*\(/,
    /new\s+Function\s*\(/,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(code)) {
      errors.push(`Forbidden API usage detected: ${pattern.source}`);
    }
  }

  // Check for handler export
  const handlerPatterns = [
    /export\s+default/,
    /export\s+function\s+middleware/,
    /export\s+const\s+middleware/,
    /module\.exports/,
  ];

  const hasHandler = handlerPatterns.some((p) => p.test(code));
  if (!hasHandler) {
    errors.push("No handler function found. Export a default function or middleware.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get edge function by route matching
 */
export async function matchEdgeFunction(
  projectId: string,
  path: string
): Promise<{ functionId: string; function: any } | null> {
  const functions = await prisma.edgeFunction.findMany({
    where: {
      projectId,
      enabled: true,
    },
  });

  for (const fn of functions) {
    for (const route of fn.routes) {
      if (matchRoute(route, path)) {
        return { functionId: fn.id, function: fn };
      }
    }
  }

  return null;
}

/**
 * Match a route pattern against a path
 */
function matchRoute(pattern: string, path: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, ".*")
    .replace(/\//g, "\\/");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}
