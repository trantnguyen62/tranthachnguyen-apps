import { Page, APIRequestContext } from '@playwright/test';

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

// API helper to signup a test user
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

// API helper to login
export async function loginTestUser(
  request: APIRequestContext,
  email: string,
  password: string
) {
  const response = await request.post('/api/auth', {
    data: {
      action: 'login',
      email,
      password,
    },
  });
  return response;
}

// API helper to logout
export async function logoutTestUser(request: APIRequestContext) {
  const response = await request.post('/api/auth', {
    data: { action: 'logout' },
  });
  return response;
}

// API helper to create a project
export async function createTestProject(
  request: APIRequestContext,
  projectData: {
    name: string;
    repoUrl?: string;
    framework?: string;
  }
) {
  const response = await request.post('/api/projects', {
    data: {
      name: projectData.name,
      repoUrl: projectData.repoUrl || 'https://github.com/test/repo',
      framework: projectData.framework || 'nextjs',
    },
  });
  return response;
}

// API helper to delete a project
export async function deleteTestProject(
  request: APIRequestContext,
  projectId: string
) {
  const response = await request.delete(`/api/projects/${projectId}`);
  return response;
}

// API helper to get all projects (for cleanup)
export async function getTestProjects(request: APIRequestContext) {
  const response = await request.get('/api/projects');
  return response;
}

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
    page.waitForSelector('[data-testid="login-error"], .error-message, [role="alert"]', { timeout: 10000 }),
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
    page.waitForSelector('[data-testid="signup-error"], .error-message, [role="alert"]', { timeout: 10000 }),
  ]).catch(() => {
    // If neither happens, the page state will be checked by the test
  });
}

// Cleanup helper - delete all projects created during test
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

// Generate unique project name for tests
export function generateProjectName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `E2E-Test-Project-${timestamp}-${random}`;
}
