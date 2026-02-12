import { APIRequestContext } from '@playwright/test';

/**
 * Shared Auth Helper for E2E Tests
 *
 * Provides utility functions for user registration, login, and
 * authenticated request headers across all test suites.
 */

/**
 * Register a new user via the /api/auth endpoint.
 * Returns the API response (which sets the session cookie on the request context).
 */
export async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string,
  name: string = 'E2E Test User'
) {
  const response = await request.post('/api/auth', {
    data: {
      action: 'signup',
      email,
      password,
      name,
    },
  });
  return response;
}

/**
 * Login a user via the /api/auth endpoint.
 * Returns the API response (which sets the session cookie on the request context).
 */
export async function loginUser(
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

/**
 * Logout the current user via the /api/auth endpoint.
 * Clears the session cookie from the request context.
 */
export async function logoutUser(request: APIRequestContext) {
  const response = await request.post('/api/auth', {
    data: { action: 'logout' },
  });
  return response;
}

/**
 * Generate a unique test user with timestamp-based credentials.
 * Ensures no collisions between test runs.
 */
export function generateUniqueUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return {
    email: `e2e-${timestamp}-${random}@test.cloudify.app`,
    password: 'SecureTestPass123!',
    name: `E2E User ${timestamp}`,
  };
}

/**
 * Register and login a user in one step.
 * Returns the user credentials for later use.
 */
export async function registerAndLogin(request: APIRequestContext) {
  const user = generateUniqueUser();
  await registerUser(request, user.email, user.password, user.name);
  // Registration auto-creates a session, but we login explicitly
  // to ensure the session is fresh on the request context.
  await loginUser(request, user.email, user.password);
  return user;
}
