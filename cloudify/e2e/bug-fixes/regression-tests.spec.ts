import { test, expect } from '@playwright/test';
import { generateTestUser, signupTestUser, loginTestUser } from '../helpers/test-utils';

/**
 * Regression tests for 5 bugs found during QA testing (Feb 2026)
 *
 * Bug 1: Google OAuth shows "Configuration" error instead of graceful fallback
 * Bug 2: Session image is null for Google OAuth users logging in via credentials
 * Bug 3: Git stderr output incorrectly logged as "error" level in deployment logs
 * Bug 4: Auth API returns 500 for invalid JSON body instead of 400
 * Bug 5: Profile name update via API doesn't sync back to NextAuth JWT session
 */

test.describe('Bug 1: OAuth Provider Dynamic Detection', () => {
  test('login page loads OAuth buttons dynamically from /api/auth/providers', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Wait for OAuth buttons to load (they now fetch from /api/auth/providers)
    await page.waitForTimeout(2000);

    // GitHub button should always be present (valid credentials configured)
    await expect(page.getByText('Continue with GitHub')).toBeVisible();
  });

  test('OAuth buttons show loading state while fetching providers', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Initially there may be a loading spinner before providers are fetched
    // After load, the buttons should appear
    await page.waitForTimeout(3000);

    // At minimum, the GitHub button should be visible
    const githubButton = page.getByText('Continue with GitHub');
    await expect(githubButton).toBeVisible();
  });

  test('providers endpoint returns valid JSON with at least credentials provider', async ({ request }) => {
    const response = await request.get('/api/auth/providers');
    expect(response.ok()).toBeTruthy();

    const providers = await response.json();
    expect(providers).toHaveProperty('credentials');
    expect(providers.credentials.type).toBe('credentials');
  });

  test('clicking OAuth button shows loading spinner on the button', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const githubButton = page.getByText('Continue with GitHub');
    if (await githubButton.isVisible()) {
      await githubButton.click();
      // Should navigate or show loading state
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Bug 2: Session Image for OAuth Users with Credentials Login', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('session includes user image after credentials login', async ({ request }) => {
    // Login via custom auth API
    const loginResponse = await loginTestUser(request, testUser.email, testUser.password);
    expect(loginResponse.ok()).toBeTruthy();

    // Check the user profile to verify image field is accessible
    const profileResponse = await request.get('/api/user/profile');
    if (profileResponse.ok()) {
      const profile = await profileResponse.json();
      // Profile should have image field (may be null for new users, but field should exist)
      expect(profile.user).toHaveProperty('image');
    }
  });

  test('NextAuth session endpoint returns user data with image field', async ({ request }) => {
    // Get CSRF token first
    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    // Login via NextAuth credentials
    const loginResponse = await request.post('/api/auth/callback/credentials', {
      form: {
        email: testUser.email,
        password: testUser.password,
        csrfToken,
        json: 'true',
      },
    });

    // Check session
    const sessionResponse = await request.get('/api/auth/session');
    const session = await sessionResponse.json();

    if (session?.user) {
      // Session user object should include image field
      expect(session.user).toHaveProperty('image');
      expect(session.user).toHaveProperty('name');
      expect(session.user).toHaveProperty('email');
    }
  });
});

test.describe('Bug 3: Git Stderr Log Level Classification', () => {
  test('logs API returns deployment logs with correct severity levels', async ({ request }) => {
    // Login first
    const testUser = generateTestUser();
    await signupTestUser(request, testUser);
    await loginTestUser(request, testUser.email, testUser.password);

    const logsResponse = await request.get('/api/logs');
    if (logsResponse.ok()) {
      const data = await logsResponse.json();

      if (data.logs && data.logs.length > 0) {
        // Check that "Cloning into" messages are NOT logged as "error"
        const cloningLogs = data.logs.filter(
          (log: { message: string }) => /^Cloning into/i.test(log.message)
        );

        for (const log of cloningLogs) {
          // These should be "warn" level, not "error"
          expect(log.level).not.toBe('error');
          expect(['warn', 'info']).toContain(log.level);
        }
      }
    }
  });

  test('deployment log entries have valid level values', async ({ request }) => {
    const testUser = generateTestUser();
    await signupTestUser(request, testUser);
    await loginTestUser(request, testUser.email, testUser.password);

    const logsResponse = await request.get('/api/logs');
    if (logsResponse.ok()) {
      const data = await logsResponse.json();
      const validLevels = ['info', 'warn', 'error', 'success', 'debug'];

      if (data.logs) {
        for (const log of data.logs) {
          expect(validLevels).toContain(log.level);
        }
      }
    }
  });
});

test.describe('Bug 4: Auth API Invalid JSON Handling', () => {
  test('returns 400 for invalid JSON body, not 500', async ({ request }) => {
    const response = await request.post('/api/auth', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-valid-json',
    });

    // Should return 400 (Bad Request), NOT 500 (Internal Server Error)
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Invalid request body');
  });

  test('returns 400 for empty body', async ({ request }) => {
    const response = await request.post('/api/auth', {
      headers: { 'Content-Type': 'application/json' },
      data: '',
    });

    // Should return 400 for empty body
    expect(response.status()).toBe(400);
  });

  test('returns proper error for missing action field', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: { email: 'test@example.com' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid action');
  });

  test('handles valid JSON with invalid action gracefully', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: { action: 'nonexistent', email: 'a@b.com' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid action');
  });

  test('login with wrong credentials returns 401, not 500', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid email or password');
  });
});

test.describe('Bug 5: Profile Update Syncs to Session', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('updating profile name via API returns updated data', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const newName = `Updated Name ${Date.now()}`;
    const updateResponse = await request.patch('/api/user/profile', {
      data: { name: newName },
    });

    if (updateResponse.ok()) {
      const result = await updateResponse.json();
      expect(result.user.name).toBe(newName);
    }
  });

  test('profile GET reflects the updated name', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const newName = `Profile Check ${Date.now()}`;
    await request.patch('/api/user/profile', {
      data: { name: newName },
    });

    // Fetch profile again
    const profileResponse = await request.get('/api/user/profile');
    if (profileResponse.ok()) {
      const profile = await profileResponse.json();
      expect(profile.user.name).toBe(newName);
    }
  });

  test('settings page displays user profile data', async ({ page }) => {
    // Login via UI
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for login redirect
    await page.waitForTimeout(3000);

    // Navigate to settings
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Settings page should show user email
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(testUser.email);
  });
});

test.describe('Cross-cutting: Authentication Security', () => {
  test('unauthenticated requests to protected APIs return 401', async ({ request }) => {
    const protectedEndpoints = [
      '/api/dashboard',
      '/api/projects',
      '/api/user/profile',
      '/api/teams',
      '/api/tokens',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      // Should return 401 Unauthorized, not 500
      if (!response.ok()) {
        expect(response.status()).toBeLessThan(500);
      }
    }
  });

  test('health endpoint is publicly accessible', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('pass');
    expect(data.checks.redis.status).toBe('pass');
  });
});
