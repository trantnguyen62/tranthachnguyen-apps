/**
 * E2E Test Utilities for Cloudify
 *
 * Provides reusable helpers for authentication, project management,
 * deployment polling, domain management, storage operations, and cleanup
 * across all E2E test suites.
 */

import { Page, APIRequestContext, APIResponse } from '@playwright/test';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default timeout for deployment polling (5 minutes). */
const DEPLOYMENT_POLL_TIMEOUT_MS = 5 * 60 * 1000;

/** Interval between deployment status checks. */
const DEPLOYMENT_POLL_INTERVAL_MS = 3_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  /** The raw `cloudify_session=<jwt>` cookie pair for authenticated requests. */
  sessionCookie: string;
}

export interface TestProject {
  id: string;
  name: string;
  slug: string;
}

export interface TestDeployment {
  id: string;
  projectId: string;
  status: string;
  branch: string;
  createdAt: string;
}

export interface TestDomain {
  id: string;
  domain: string;
  projectId: string;
  verified: boolean;
  verificationToken: string;
}

export interface TestKVStore {
  id: string;
  projectId: string;
  name: string;
}

export interface TestBlobStore {
  id: string;
  projectId: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Unique ID Generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique identifier suitable for test entities.
 * Uses a timestamp + random suffix to avoid collisions across parallel runs.
 */
export function uniqueId(prefix = 'e2e'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

// Test user credentials - unique per test run
export function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `test-${timestamp}-${random}@e2e-test.cloudify.app`,
    password: 'TestPassword123!',
    name: `E2E Test User ${timestamp}`,
  };
}

// Generate unique project name for tests
export function generateProjectName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `E2E-Test-Project-${timestamp}-${random}`;
}

// ---------------------------------------------------------------------------
// Session Cookie Extraction
// ---------------------------------------------------------------------------

/**
 * Extract the `cloudify_session` cookie string from a Set-Cookie header array.
 * Returns the full `cloudify_session=<jwt>` pair so it can be sent in
 * subsequent requests via the `Cookie` header.
 */
function extractSessionCookie(response: APIResponse): string {
  const setCookies = response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value);

  for (const header of setCookies) {
    if (header.startsWith('cloudify_session=')) {
      // Only return "cloudify_session=<value>" (strip attributes like Path, HttpOnly, etc.)
      return header.split(';')[0];
    }
  }
  throw new Error(
    `Session cookie not found in Set-Cookie headers: ${JSON.stringify(setCookies)}`
  );
}

// ---------------------------------------------------------------------------
// Authentication — API helpers
// ---------------------------------------------------------------------------

/**
 * Register a new test user via `POST /api/auth` with `action: "signup"`.
 * Returns the user record and the session cookie for authenticated requests.
 */
export async function createTestUser(
  request: APIRequestContext,
  overrides?: { email?: string; password?: string; name?: string }
): Promise<TestUser> {
  const email =
    overrides?.email ?? `${uniqueId('user')}@e2e-test.cloudify.local`;
  const password = overrides?.password ?? 'TestPassword123!';
  const name = overrides?.name ?? `E2E User ${uniqueId()}`;

  const response = await request.post('/api/auth', {
    data: { action: 'signup', email, password, name },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create test user (${response.status()}): ${body}`
    );
  }

  const json = await response.json();
  const sessionCookie = extractSessionCookie(response);

  return {
    id: json.user.id,
    email: json.user.email,
    name: json.user.name,
    password,
    sessionCookie,
  };
}

// Legacy alias — sign up a test user (raw response)
export async function signupTestUser(
  request: APIRequestContext,
  user: { email: string; password: string; name: string }
) {
  const response = await request.post('/api/auth', {
    data: {
      action: 'signup',
      email: user.email,
      password: user.password,
      name: user.name,
    },
  });
  return response;
}

/**
 * Login an existing user via `POST /api/auth` with `action: "login"`.
 * Returns the raw APIResponse so callers can inspect `.status()` and `.json()`.
 * For typed access, use `createTestUser` instead.
 */
export async function loginTestUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<APIResponse> {
  const response = await request.post('/api/auth', {
    data: { action: 'login', email, password },
  });

  return response;
}

/**
 * Login an existing user and return a typed TestUser with session cookie.
 * Throws on failure. Use this for tests that need the full TestUser object.
 */
export async function loginAndGetTestUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<TestUser> {
  const response = await loginTestUser(request, email, password);

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status()}): ${body}`);
  }

  const json = await response.json();
  const sessionCookie = extractSessionCookie(response);

  return {
    id: json.user.id,
    email: json.user.email,
    name: json.user.name,
    password,
    sessionCookie,
  };
}

// Legacy alias — logout via POST
export async function logoutTestUser(request: APIRequestContext) {
  const response = await request.post('/api/auth', {
    data: { action: 'logout' },
  });
  return response;
}

// ---------------------------------------------------------------------------
// Authenticated Request Helper
// ---------------------------------------------------------------------------

/**
 * Send an authenticated HTTP request with the session cookie attached.
 * Wraps Playwright's APIRequestContext methods with consistent auth headers.
 */
export async function authenticatedFetch(
  request: APIRequestContext,
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD';
    data?: unknown;
    headers?: Record<string, string>;
    multipart?: { [key: string]: string | number | boolean | { name: string; mimeType: string; buffer: Buffer } };
  },
  sessionCookie: string
): Promise<APIResponse> {
  const headers: Record<string, string> = {
    Cookie: sessionCookie,
    ...options.headers,
  };

  const method = options.method ?? 'GET';

  switch (method) {
    case 'GET':
      return request.get(url, { headers });
    case 'POST':
      if (options.multipart) {
        return request.post(url, { headers, multipart: options.multipart });
      }
      return request.post(url, { headers, data: options.data });
    case 'PATCH':
      return request.patch(url, { headers, data: options.data });
    case 'PUT':
      return request.put(url, { headers, data: options.data });
    case 'DELETE':
      return request.delete(url, { headers });
    case 'HEAD':
      return request.head(url, { headers });
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// Project Management — API helpers
// ---------------------------------------------------------------------------

/**
 * Create a test project via `POST /api/projects`.
 *
 * Overloads:
 * - With sessionCookie (string) + overrides: Returns `TestProject` (throws on failure).
 * - With projectData (object): Returns raw `APIResponse` (legacy, caller checks status).
 */
export async function createTestProject(
  request: APIRequestContext,
  sessionCookieOrData: string,
  overrides?: {
    name?: string;
    repoUrl?: string;
    framework?: string;
    buildCmd?: string;
    outputDir?: string;
  }
): Promise<TestProject>;
export async function createTestProject(
  request: APIRequestContext,
  sessionCookieOrData: { name: string; repoUrl?: string; framework?: string },
): Promise<APIResponse>;
export async function createTestProject(
  request: APIRequestContext,
  sessionCookieOrData:
    | string
    | { name: string; repoUrl?: string; framework?: string },
  overrides?: {
    name?: string;
    repoUrl?: string;
    framework?: string;
    buildCmd?: string;
    outputDir?: string;
  }
): Promise<TestProject | APIResponse> {
  // Support both new and legacy calling conventions
  if (typeof sessionCookieOrData === 'string') {
    const sessionCookie = sessionCookieOrData;
    const name = overrides?.name ?? `test-project-${uniqueId()}`;

    const response = await authenticatedFetch(
      request,
      '/api/projects',
      {
        method: 'POST',
        data: {
          name,
          repoUrl:
            overrides?.repoUrl ??
            'https://github.com/cloudify-test/sample-nextjs-app',
          framework: overrides?.framework ?? 'nextjs',
          buildCmd: overrides?.buildCmd ?? 'npm run build',
          outputDir: overrides?.outputDir ?? '.next',
        },
      },
      sessionCookie
    );

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(
        `Failed to create project (${response.status()}): ${body}`
      );
    }

    const project = await response.json();
    return { id: project.id, name: project.name, slug: project.slug };
  }

  // Legacy: projectData passed directly (relies on stored cookies in the context)
  // Returns the raw APIResponse so callers can check .status() and .json()
  const projectData = sessionCookieOrData;
  const response = await request.post('/api/projects', {
    data: {
      name: projectData.name,
      repoUrl: projectData.repoUrl || 'https://github.com/test/repo',
      framework: projectData.framework || 'nextjs',
    },
  });

  return response;
}

// Legacy: delete a project (raw response)
export async function deleteTestProject(
  request: APIRequestContext,
  projectId: string
) {
  const response = await request.delete(`/api/projects/${projectId}`);
  return response;
}

// Legacy: get all projects
export async function getTestProjects(request: APIRequestContext) {
  const response = await request.get('/api/projects');
  return response;
}

// ---------------------------------------------------------------------------
// Deployment Helpers
// ---------------------------------------------------------------------------

/**
 * Trigger a deployment via `POST /api/deploy`.
 */
export async function triggerDeployment(
  request: APIRequestContext,
  sessionCookie: string,
  projectId: string,
  options?: { branch?: string; commitSha?: string; commitMsg?: string }
): Promise<TestDeployment> {
  const response = await authenticatedFetch(
    request,
    '/api/deploy',
    {
      method: 'POST',
      data: {
        projectId,
        branch: options?.branch,
        commitSha: options?.commitSha,
        commitMsg: options?.commitMsg,
      },
    },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to trigger deployment (${response.status()}): ${body}`
    );
  }

  const json = await response.json();
  return json.deployment;
}

/**
 * Poll `GET /api/deployments/[id]` until the deployment reaches a terminal
 * state (READY, ERROR, or CANCELLED) or the timeout expires.
 */
export async function waitForDeployment(
  request: APIRequestContext,
  sessionCookie: string,
  deploymentId: string,
  timeoutMs: number = DEPLOYMENT_POLL_TIMEOUT_MS
): Promise<{
  status: string;
  url?: string;
  buildTime?: number;
  deployment: Record<string, unknown>;
}> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await authenticatedFetch(
      request,
      `/api/deployments/${deploymentId}`,
      { method: 'GET' },
      sessionCookie
    );

    if (!response.ok()) {
      throw new Error(
        `Failed to poll deployment (${response.status()})`
      );
    }

    const deployment = await response.json();
    const status: string = deployment.status;

    if (['READY', 'ERROR', 'CANCELLED'].includes(status)) {
      return {
        status,
        url: deployment.url ?? deployment.siteSlug,
        buildTime: deployment.buildTime,
        deployment,
      };
    }

    // Wait before next poll
    await new Promise((resolve) =>
      setTimeout(resolve, DEPLOYMENT_POLL_INTERVAL_MS)
    );
  }

  throw new Error(
    `Deployment ${deploymentId} did not reach terminal state within ${timeoutMs}ms`
  );
}

/**
 * Get deployment with embedded logs via `GET /api/deploy?id=<deploymentId>`.
 */
export async function getDeploymentWithLogs(
  request: APIRequestContext,
  sessionCookie: string,
  deploymentId: string
): Promise<{
  deployment: Record<string, unknown>;
  logs: Array<{ id: string; level: string; message: string; timestamp: string }>;
}> {
  const response = await authenticatedFetch(
    request,
    `/api/deploy?id=${deploymentId}`,
    { method: 'GET' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to get deployment logs (${response.status()}): ${body}`
    );
  }

  const json = await response.json();
  return {
    deployment: json.deployment,
    logs: json.deployment?.logs ?? [],
  };
}

// ---------------------------------------------------------------------------
// Domain Helpers
// ---------------------------------------------------------------------------

/**
 * Add a custom domain to a project via `POST /api/domains`.
 */
export async function addDomain(
  request: APIRequestContext,
  sessionCookie: string,
  projectId: string,
  domain: string
): Promise<TestDomain> {
  const response = await authenticatedFetch(
    request,
    '/api/domains',
    {
      method: 'POST',
      data: { domain, projectId },
    },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to add domain (${response.status()}): ${body}`
    );
  }

  const json = await response.json();
  return {
    id: json.id,
    domain: json.domain,
    projectId: json.projectId,
    verified: json.verified,
    verificationToken: json.verificationToken,
  };
}

/**
 * Get domain details via `GET /api/domains/[id]`.
 */
export async function getDomain(
  request: APIRequestContext,
  sessionCookie: string,
  domainId: string
): Promise<Record<string, unknown>> {
  const response = await authenticatedFetch(
    request,
    `/api/domains/${domainId}`,
    { method: 'GET' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to get domain (${response.status()}): ${body}`
    );
  }

  return response.json();
}

/**
 * Verify domain DNS via `POST /api/domains/[id]/verify`.
 */
export async function verifyDomain(
  request: APIRequestContext,
  sessionCookie: string,
  domainId: string
): Promise<Record<string, unknown>> {
  const response = await authenticatedFetch(
    request,
    `/api/domains/${domainId}/verify`,
    { method: 'POST' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to verify domain (${response.status()}): ${body}`
    );
  }

  return response.json();
}

/**
 * Delete a domain via `DELETE /api/domains/[id]`.
 */
export async function deleteDomain(
  request: APIRequestContext,
  sessionCookie: string,
  domainId: string
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    `/api/domains/${domainId}`,
    { method: 'DELETE' },
    sessionCookie
  );

  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(
      `Failed to delete domain (${response.status()}): ${body}`
    );
  }
}

// ---------------------------------------------------------------------------
// KV Storage Helpers
// ---------------------------------------------------------------------------

/**
 * Create a KV store via `POST /api/storage/kv`.
 */
export async function createKVStore(
  request: APIRequestContext,
  sessionCookie: string,
  projectId: string,
  storeName: string
): Promise<TestKVStore> {
  const response = await authenticatedFetch(
    request,
    '/api/storage/kv',
    {
      method: 'POST',
      data: { projectId, storeName },
    },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create KV store (${response.status()}): ${body}`
    );
  }

  const json = await response.json();
  return { id: json.id, projectId: json.projectId, name: json.name };
}

/**
 * Set a key-value pair in a KV store via `POST /api/storage/kv`.
 */
export async function kvSet(
  request: APIRequestContext,
  sessionCookie: string,
  projectId: string,
  storeId: string,
  key: string,
  value: string,
  options?: { expiresIn?: number; metadata?: Record<string, unknown> }
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    '/api/storage/kv',
    {
      method: 'POST',
      data: {
        projectId,
        storeId,
        key,
        value,
        expiresIn: options?.expiresIn,
        metadata: options?.metadata,
      },
    },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to set KV key (${response.status()}): ${body}`
    );
  }
}

/**
 * Get a key from a KV store via `GET /api/storage/kv?storeId=...&key=...`.
 */
export async function kvGet(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string,
  key: string
): Promise<{ key: string; value: string | null; exists: boolean }> {
  const response = await authenticatedFetch(
    request,
    `/api/storage/kv?storeId=${storeId}&key=${encodeURIComponent(key)}`,
    { method: 'GET' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to get KV key (${response.status()}): ${body}`
    );
  }

  return response.json();
}

/**
 * Delete a KV key via `DELETE /api/storage/kv?storeId=...&key=...`.
 */
export async function kvDelete(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string,
  key: string
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    `/api/storage/kv?storeId=${storeId}&key=${encodeURIComponent(key)}`,
    { method: 'DELETE' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to delete KV key (${response.status()}): ${body}`
    );
  }
}

/**
 * Delete a KV store via `DELETE /api/storage/kv?storeId=...`.
 */
export async function deleteKVStore(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    `/api/storage/kv?storeId=${storeId}`,
    { method: 'DELETE' },
    sessionCookie
  );

  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(
      `Failed to delete KV store (${response.status()}): ${body}`
    );
  }
}

// ---------------------------------------------------------------------------
// Blob Storage Helpers
// ---------------------------------------------------------------------------

/**
 * Create a blob store via `POST /api/storage/blobs`.
 */
export async function createBlobStore(
  request: APIRequestContext,
  sessionCookie: string,
  projectId: string,
  storeName: string,
  isPublic = false
): Promise<TestBlobStore> {
  const response = await authenticatedFetch(
    request,
    '/api/storage/blobs',
    {
      method: 'POST',
      data: { projectId, storeName, isPublic },
    },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create blob store (${response.status()}): ${body}`
    );
  }

  const json = await response.json();
  return { id: json.id, projectId: json.projectId, name: json.name };
}

/**
 * Upload a blob via `PUT /api/storage/blobs/[storeId]/[...pathname]`.
 */
export async function uploadBlob(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string,
  pathname: string,
  content: Buffer | string,
  contentType = 'application/octet-stream'
): Promise<Record<string, unknown>> {
  const buffer =
    typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

  const response = await request.put(
    `/api/storage/blobs/${storeId}/${pathname}`,
    {
      headers: {
        Cookie: sessionCookie,
        'Content-Type': contentType,
      },
      data: buffer,
    }
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to upload blob (${response.status()}): ${body}`
    );
  }

  return response.json();
}

/**
 * Download a blob via `GET /api/storage/blobs?storeId=...&pathname=...&download=true`.
 */
export async function downloadBlob(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string,
  pathname: string
): Promise<Buffer> {
  const response = await authenticatedFetch(
    request,
    `/api/storage/blobs?storeId=${storeId}&pathname=${encodeURIComponent(pathname)}&download=true`,
    { method: 'GET' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to download blob (${response.status()}): ${body}`
    );
  }

  return Buffer.from(await response.body());
}

/**
 * Delete a blob via `DELETE /api/storage/blobs?storeId=...&pathname=...`.
 */
export async function deleteBlob(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string,
  pathname: string
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    `/api/storage/blobs?storeId=${storeId}&pathname=${encodeURIComponent(pathname)}`,
    { method: 'DELETE' },
    sessionCookie
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to delete blob (${response.status()}): ${body}`
    );
  }
}

/**
 * Delete a blob store via `DELETE /api/storage/blobs?storeId=...`.
 */
export async function deleteBlobStore(
  request: APIRequestContext,
  sessionCookie: string,
  storeId: string
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    `/api/storage/blobs?storeId=${storeId}`,
    { method: 'DELETE' },
    sessionCookie
  );

  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(
      `Failed to delete blob store (${response.status()}): ${body}`
    );
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Delete a project and all its associated data via `DELETE /api/projects/[id]`.
 * Silently handles already-deleted projects.
 */
export async function cleanupProject(
  request: APIRequestContext,
  sessionCookie: string,
  projectId: string
): Promise<void> {
  const response = await authenticatedFetch(
    request,
    `/api/projects/${projectId}`,
    { method: 'DELETE' },
    sessionCookie
  );

  // 404 is acceptable if the project was already cleaned up
  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(
      `Failed to cleanup project (${response.status()}): ${body}`
    );
  }
}

// Legacy alias for cleanup
export async function cleanupTestProjects(
  request: APIRequestContext,
  projectIds: string[]
) {
  for (const id of projectIds) {
    try {
      await request.delete(`/api/projects/${id}`);
    } catch (e) {
      console.log(`Failed to delete project ${id}:`, e);
    }
  }
}

/**
 * Logout the user via `DELETE /api/auth`.
 * Silently handles errors (best-effort cleanup).
 */
export async function logoutUser(
  request: APIRequestContext,
  sessionCookie: string
): Promise<void> {
  await authenticatedFetch(
    request,
    '/api/auth',
    { method: 'DELETE' },
    sessionCookie
  ).catch(() => {
    // Best-effort logout, ignore errors
  });
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

// UI helper to login via the web interface
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to dashboard or error message
  await Promise.race([
    page.waitForURL('/dashboard', { timeout: 10000 }),
    page.waitForSelector(
      '[data-testid="login-error"], .error-message, [role="alert"]',
      { timeout: 10000 }
    ),
  ]).catch(() => {
    // If neither happens, the page state will be checked by the test
  });
}

// UI helper to signup via the web interface
export async function signupViaUI(
  page: Page,
  name: string,
  email: string,
  password: string
) {
  await page.goto('/signup');
  await page.fill('input#name', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to dashboard or error message
  await Promise.race([
    page.waitForURL('/dashboard', { timeout: 10000 }),
    page.waitForSelector(
      '[data-testid="signup-error"], .error-message, [role="alert"]',
      { timeout: 10000 }
    ),
  ]).catch(() => {
    // If neither happens, the page state will be checked by the test
  });
}
