import { test, expect } from '@playwright/test';
import {
  registerUser,
  loginUser,
  logoutUser,
  generateUniqueUser,
} from '../helpers/auth-helper';

/**
 * AUTH FLOW TESTS
 *
 * Comprehensive end-to-end tests for the authentication system:
 * - User registration (signup)
 * - Duplicate registration prevention
 * - Login with valid and invalid credentials
 * - Session retrieval (current user)
 * - Logout and session invalidation
 * - Protected route access control
 * - Verify no OAuth buttons on login page
 */

test.describe('Auth Flow - Registration', () => {
  test('Register with valid email and password returns success', async ({ request }) => {
    const user = generateUniqueUser();

    const response = await registerUser(request, user.email, user.password, user.name);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeTruthy();
    expect(data.user.email).toBe(user.email.toLowerCase());
    expect(data.user.name).toBe(user.name);
  });

  test('Register with duplicate email returns 409 Conflict', async ({ request }) => {
    const user = generateUniqueUser();

    // First registration should succeed
    const firstResponse = await registerUser(request, user.email, user.password, user.name);
    expect(firstResponse.status()).toBe(200);

    // Second registration with same email should fail
    const secondResponse = await registerUser(
      request,
      user.email,
      'AnotherPassword456!',
      'Another Name'
    );

    expect(secondResponse.status()).toBe(409);
    const data = await secondResponse.json();
    expect(data.error).toBeTruthy();
    expect(data.error.toLowerCase()).toContain('already exists');
  });

  test('Register with duplicate email (case-insensitive) returns 409', async ({ request }) => {
    const user = generateUniqueUser();

    await registerUser(request, user.email, user.password, user.name);

    // Try with uppercase email
    const response = await registerUser(
      request,
      user.email.toUpperCase(),
      user.password,
      user.name
    );

    expect(response.status()).toBe(409);
  });

  test('Register with missing name returns 400', async ({ request }) => {
    const user = generateUniqueUser();

    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: user.email,
        password: user.password,
        // name is missing
      },
    });

    expect(response.status()).toBe(400);
  });

  test('Register with short password returns 400', async ({ request }) => {
    const user = generateUniqueUser();

    const response = await registerUser(request, user.email, 'short', user.name);

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('8 characters');
  });

  test('Register with invalid email format returns 400', async ({ request }) => {
    const response = await registerUser(
      request,
      'not-an-email',
      'ValidPassword123!',
      'Test User'
    );

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('email');
  });
});

test.describe('Auth Flow - Login', () => {
  let registeredUser: { email: string; password: string; name: string };

  test.beforeAll(async ({ request }) => {
    registeredUser = generateUniqueUser();
    const response = await registerUser(
      request,
      registeredUser.email,
      registeredUser.password,
      registeredUser.name
    );
    expect(response.status()).toBe(200);
  });

  test('Login with valid credentials returns success', async ({ request }) => {
    const response = await loginUser(request, registeredUser.email, registeredUser.password);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(registeredUser.email.toLowerCase());
    expect(data.user.name).toBe(registeredUser.name);
  });

  test('Login with wrong password returns 401', async ({ request }) => {
    const response = await loginUser(request, registeredUser.email, 'WrongPassword999!');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeTruthy();
    expect(data.error.toLowerCase()).toContain('invalid');
  });

  test('Login with non-existent email returns 401', async ({ request }) => {
    const response = await loginUser(
      request,
      'nonexistent-user-xyz@test.cloudify.app',
      'SomePassword123!'
    );

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('Login with empty email returns 400', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: '',
        password: registeredUser.password,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('Login with empty password returns 400', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: registeredUser.email,
        password: '',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('Login is case-insensitive for email', async ({ request }) => {
    const response = await loginUser(
      request,
      registeredUser.email.toUpperCase(),
      registeredUser.password
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('Auth Flow - Session & Current User', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
  });

  test('Get current user after login returns user data', async ({ request }) => {
    // Login first to establish session
    await loginUser(request, testUser.email, testUser.password);

    // GET /api/auth returns current session user
    const response = await request.get('/api/auth');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeTruthy();
    expect(data.user.email).toBe(testUser.email.toLowerCase());
    expect(data.user.name).toBe(testUser.name);
  });

  test('Get current user without auth returns 401', async ({ request }) => {
    // Logout first to clear session
    await logoutUser(request);

    const response = await request.get('/api/auth');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});

test.describe('Auth Flow - Logout', () => {
  test('Logout clears session and subsequent auth check fails', async ({ request }) => {
    const user = generateUniqueUser();
    await registerUser(request, user.email, user.password, user.name);
    await loginUser(request, user.email, user.password);

    // Verify session is active
    const beforeLogout = await request.get('/api/auth');
    expect(beforeLogout.status()).toBe(200);

    // Logout
    const logoutResponse = await logoutUser(request);
    expect(logoutResponse.status()).toBe(200);
    const logoutData = await logoutResponse.json();
    expect(logoutData.success).toBe(true);

    // Verify session is cleared
    const afterLogout = await request.get('/api/auth');
    expect(afterLogout.status()).toBe(401);
  });

  test('Logout via DELETE also works', async ({ request }) => {
    const user = generateUniqueUser();
    await registerUser(request, user.email, user.password, user.name);
    await loginUser(request, user.email, user.password);

    // DELETE /api/auth is an alternative logout endpoint
    const response = await request.delete('/api/auth');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Session should be cleared
    const authCheck = await request.get('/api/auth');
    expect(authCheck.status()).toBe(401);
  });
});

test.describe('Auth Flow - Protected Route Access', () => {
  test('Access /api/projects without auth returns 401', async ({ request }) => {
    // Ensure no session exists
    await logoutUser(request);

    const response = await request.get('/api/projects');

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('Access /api/user/profile without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/user/profile');

    expect(response.status()).toBe(401);
  });

  test('Access /api/teams without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/teams');

    expect(response.status()).toBe(401);
  });

  test('Access /api/billing without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/billing');

    expect(response.status()).toBe(401);
  });

  test('Protected routes work after login', async ({ request }) => {
    const user = generateUniqueUser();
    await registerUser(request, user.email, user.password, user.name);
    await loginUser(request, user.email, user.password);

    // Should now be able to access protected routes
    const projectsResponse = await request.get('/api/projects');
    expect(projectsResponse.status()).toBe(200);

    const profileResponse = await request.get('/api/user/profile');
    expect(profileResponse.status()).toBe(200);
  });
});

test.describe('Auth Flow - No OAuth on Login Page', () => {
  test('Login page does not contain GitHub or Google OAuth buttons', async ({ page }) => {
    await page.goto('/login');

    // Wait for the page to fully render
    await page.waitForSelector('form', { timeout: 10000 });

    const pageContent = await page.content();
    const lowerContent = pageContent.toLowerCase();

    // Verify no GitHub OAuth button exists
    const githubButton = await page.locator('button:has-text("GitHub"), a:has-text("GitHub"), [data-provider="github"]').count();
    expect(githubButton).toBe(0);

    // Verify no Google OAuth button exists
    const googleButton = await page.locator('button:has-text("Google"), a:has-text("Google"), [data-provider="google"]').count();
    expect(googleButton).toBe(0);

    // Verify no generic "Sign in with" OAuth text for third-party providers
    expect(lowerContent).not.toContain('sign in with github');
    expect(lowerContent).not.toContain('sign in with google');
    expect(lowerContent).not.toContain('continue with github');
    expect(lowerContent).not.toContain('continue with google');

    // Verify the login form has email and password fields (credentials-only)
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
  });
});

test.describe('Auth Flow - Invalid Actions', () => {
  test('Invalid action returns 400', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'nonexistent-action',
        email: 'test@test.com',
        password: 'password',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid action');
  });

  test('Missing action returns 400', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        email: 'test@test.com',
        password: 'password',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('Invalid request body returns 400', async ({ request }) => {
    const response = await request.post('/api/auth', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-valid-json',
    });

    // The server should handle this gracefully (400 or similar)
    expect(response.status()).toBeLessThan(500);
  });
});
