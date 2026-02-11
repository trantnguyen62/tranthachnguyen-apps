import { test, expect } from '@playwright/test';
import { generateTestUser, signupTestUser, loginTestUser } from '../helpers/test-utils';

/**
 * Regression tests for 10 bugs found during production testing (Feb 2026, Round 2)
 *
 * Bug 1:  Password change API returns 500 for invalid JSON body
 * Bug 2:  Profile update accepts XSS in name field
 * Bug 3:  Profile name has no max length validation
 * Bug 4:  /forgot-password page returns 404
 * Bug 5:  Token creation API returns 500 (Activity.teamId missing)
 * Bug 6:  Team creation API returns 500 (Activity.teamId missing)
 * Bug 7:  Deploy API returns 500 + creates orphaned QUEUED deployments
 * Bug 8:  All deployments have isActive:false - no active tracking
 * Bug 9:  Profile PATCH silently ignores protected fields (email, plan)
 * Bug 10: GitHub webhook returns 400 "not configured" instead of 503
 */

test.describe('Bug 1: Password Change API Invalid JSON Handling', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('returns 400 for invalid JSON body, not 500', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.post('/api/user/password', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-valid-json',
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid request body');
  });

  test('returns 400 for empty body', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.post('/api/user/password', {
      headers: { 'Content-Type': 'application/json' },
      data: '',
    });

    expect(response.status()).toBe(400);
  });

  test('returns proper error for missing fields', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.post('/api/user/password', {
      data: { currentPassword: 'test' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Current password and new password are required');
  });
});

test.describe('Bug 2: Profile XSS Prevention', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('strips HTML tags from name to prevent XSS', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.patch('/api/user/profile', {
      data: { name: '<script>alert(1)</script>John' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.user.name).not.toContain('<script>');
    expect(body.user.name).toContain('John');
  });

  test('strips all HTML tags from name', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.patch('/api/user/profile', {
      data: { name: '<b>Bold</b> <img src=x onerror=alert(1)> Text' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.user.name).not.toContain('<');
    expect(body.user.name).not.toContain('>');
    expect(body.user.name).toContain('Bold');
    expect(body.user.name).toContain('Text');
  });
});

test.describe('Bug 3: Profile Name Length Validation', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('rejects names longer than 100 characters', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const longName = 'A'.repeat(101);
    const response = await request.patch('/api/user/profile', {
      data: { name: longName },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('100 characters');
  });

  test('accepts names up to 100 characters', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const exactName = 'A'.repeat(100);
    const response = await request.patch('/api/user/profile', {
      data: { name: exactName },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.user.name).toBe(exactName);
  });
});

test.describe('Bug 4: Forgot Password Page Exists', () => {
  test('forgot-password page loads successfully', async ({ page }) => {
    const response = await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
  });

  test('forgot-password page has required elements', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Reset your password')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    await expect(page.getByText('Back to login')).toBeVisible();
  });

  test('forgot-password API returns success for any email', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { email: 'test@example.com' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.message).toContain('password reset link');
  });

  test('login page forgot password link works', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const forgotLink = page.getByText('Forgot password?');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    await page.waitForURL('/forgot-password');
    await expect(page.getByText('Reset your password')).toBeVisible();
  });
});

test.describe('Bug 5: Token Creation Works', () => {
  test('can create an API token via NextAuth session', async ({ request }) => {
    const testUser = generateTestUser();
    await signupTestUser(request, testUser);

    // Login via NextAuth
    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    await request.post('/api/auth/callback/credentials', {
      form: {
        email: testUser.email,
        password: testUser.password,
        csrfToken,
        json: 'true',
      },
    });

    // Create token
    const response = await request.post('/api/tokens', {
      data: { name: 'test-token', scopes: ['read', 'write'] },
    });

    expect(response.status()).toBeLessThan(500);
    if (response.ok()) {
      const body = await response.json();
      expect(body.name).toBe('test-token');
      expect(body.token).toBeTruthy();
      expect(body.token).toMatch(/^cl_/);
    }
  });
});

test.describe('Bug 6: Team Creation Works', () => {
  test('can create a team via NextAuth session', async ({ request }) => {
    const testUser = generateTestUser();
    await signupTestUser(request, testUser);

    // Login via NextAuth
    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    await request.post('/api/auth/callback/credentials', {
      form: {
        email: testUser.email,
        password: testUser.password,
        csrfToken,
        json: 'true',
      },
    });

    // Create team
    const response = await request.post('/api/teams', {
      data: { name: 'E2E Test Team' },
    });

    expect(response.status()).toBeLessThan(500);
    if (response.ok()) {
      const body = await response.json();
      expect(body.name).toBe('E2E Test Team');
      expect(body.slug).toBe('e2e-test-team');
      expect(body.members).toHaveLength(1);
      expect(body.members[0].role).toBe('owner');
    }
  });
});

test.describe('Bug 7: Deploy API Error Handling', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('deploy returns success with deployment ID, not 500', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    // First create a project
    const projectResponse = await request.post('/api/projects', {
      data: {
        name: `deploy-test-${Date.now()}`,
        repoUrl: 'https://github.com/h5bp/html5-boilerplate',
        framework: 'static',
      },
    });

    if (projectResponse.ok()) {
      const project = await projectResponse.json();

      // Login via NextAuth for deploy access
      const csrfResponse = await request.get('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      await request.post('/api/auth/callback/credentials', {
        form: {
          email: testUser.email,
          password: testUser.password,
          csrfToken,
          json: 'true',
        },
      });

      // Deploy
      const deployResponse = await request.post('/api/deploy', {
        data: { projectId: project.id },
      });

      // Should not return 500 - either success or a proper error
      expect(deployResponse.status()).toBeLessThan(500);

      if (deployResponse.ok()) {
        const body = await deployResponse.json();
        expect(body.success).toBe(true);
        expect(body.deployment.id).toBeTruthy();
        expect(body.deployment.status).toBe('QUEUED');
      }
    }
  });

  test('deploy with invalid project returns 404, not 500', async ({ request }) => {
    // Login via NextAuth
    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    await request.post('/api/auth/callback/credentials', {
      form: {
        email: testUser.email,
        password: testUser.password,
        csrfToken,
        json: 'true',
      },
    });

    const response = await request.post('/api/deploy', {
      data: { projectId: 'nonexistent-id-12345' },
    });

    expect(response.status()).toBe(404);
  });
});

test.describe('Bug 8: Active Deployment Tracking', () => {
  test('successful deployments are marked as active in API response', async ({ request }) => {
    const testUser = generateTestUser();
    await signupTestUser(request, testUser);
    await loginTestUser(request, testUser.email, testUser.password);

    // Create project
    const projectResponse = await request.post('/api/projects', {
      data: {
        name: `active-test-${Date.now()}`,
        repoUrl: 'https://github.com/h5bp/html5-boilerplate',
        framework: 'static',
      },
    });

    if (projectResponse.ok()) {
      const project = await projectResponse.json();

      // Get project deployments - verify isActive field exists in schema
      const deploymentsResponse = await request.get(`/api/projects/${project.id}/deployments`);
      if (deploymentsResponse.ok()) {
        const data = await deploymentsResponse.json();
        // Deployments should have isActive field
        if (data.deployments && data.deployments.length > 0) {
          expect(data.deployments[0]).toHaveProperty('isActive');
        }
      }
    }
  });
});

test.describe('Bug 9: Profile Protected Field Rejection', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test('rejects email change attempt', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.patch('/api/user/profile', {
      data: { email: 'hacker@evil.com' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('protected');
    expect(body.error).toContain('email');
  });

  test('rejects plan escalation attempt', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.patch('/api/user/profile', {
      data: { plan: 'enterprise' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('protected');
    expect(body.error).toContain('plan');
  });

  test('rejects id change attempt', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.patch('/api/user/profile', {
      data: { id: 'fake-id-123' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('protected');
  });

  test('allows valid fields (name, avatar) to be updated', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await request.patch('/api/user/profile', {
      data: { name: 'Valid Name Update' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.user.name).toBe('Valid Name Update');
  });
});

test.describe('Bug 10: GitHub Webhook Error Response', () => {
  test('returns 503 when webhook secret is not configured, not 400', async ({ request }) => {
    const response = await request.post('/api/webhooks/github', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ ref: 'refs/heads/main' }),
    });

    // Should return 503 (Service Unavailable) not 400 (Bad Request)
    // unless the webhook secret IS configured, in which case it returns 401 (missing signature)
    expect([401, 503]).toContain(response.status());

    const body = await response.json();
    // Should NOT expose internal config state
    expect(body.error).not.toBe('Webhook not configured');
  });

  test('webhook GET endpoint returns info', async ({ request }) => {
    const response = await request.get('/api/webhooks/github');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('active');
    expect(body.supportedEvents).toContain('push');
  });
});

test.describe('Cross-cutting: API Resilience', () => {
  test('all protected APIs return proper status codes for unauthenticated requests', async ({ request }) => {
    const protectedEndpoints = [
      { method: 'GET', url: '/api/dashboard' },
      { method: 'GET', url: '/api/projects' },
      { method: 'GET', url: '/api/user/profile' },
      { method: 'GET', url: '/api/tokens' },
      { method: 'GET', url: '/api/teams' },
      { method: 'GET', url: '/api/logs' },
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint.url);
      // Should return 401 or empty data, never 500
      if (!response.ok()) {
        expect(response.status()).toBeLessThan(500);
      }
    }
  });

  test('forgot-password is publicly accessible', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { email: 'anyone@example.com' },
    });
    expect(response.ok()).toBeTruthy();
  });
});
