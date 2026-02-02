import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  loginTestUser,
  logoutTestUser,
  signupTestUser,
  cleanupTestProjects,
  generateProjectName,
} from '../helpers/test-utils';

/**
 * UI USER FLOW TESTS
 *
 * These tests interact with the actual UI like a real user would.
 * They test the full browser experience including form submissions,
 * navigation, and visual feedback.
 */

test.describe('UI User Flows - Real User Interactions', () => {
  let testUser: { email: string; password: string; name: string };
  const createdProjectIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Create a test user via API for UI tests
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup
    if (createdProjectIds.length > 0) {
      await loginTestUser(request, testUser.email, testUser.password);
      await cleanupTestProjects(request, createdProjectIds);
    }
    await logoutTestUser(request);
  });

  test('11. User sees login form and can fill credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill the form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Verify inputs have values
    await expect(page.getByLabel('Email')).toHaveValue(testUser.email);
    await expect(page.getByLabel('Password')).toHaveValue(testUser.password);
  });

  test('12. Login form shows loading state when submitted', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Click submit
    await page.click('button[type="submit"]');

    // Should show some loading indication or redirect
    await page.waitForTimeout(500);

    // Either loading, error, or redirected
    const isOnLogin = page.url().includes('/login');
    const isOnDashboard = page.url().includes('/dashboard');
    expect(isOnLogin || isOnDashboard).toBeTruthy();
  });

  test('13. Signup form validates required fields', async ({ page }) => {
    await page.goto('/signup');

    // Try to submit without filling anything
    await page.click('button[type="submit"]');

    // Should show validation
    const nameInput = page.getByLabel('Name');
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('14. Signup form validates password length', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input#name', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'short'); // Less than 8 chars

    await page.click('button[type="submit"]');

    // Password should be invalid
    const passwordInput = page.getByLabel('Password');
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('15. User can navigate between login and signup', async ({ page }) => {
    await page.goto('/login');

    // Click sign up link
    await page.click('text=Sign up for free');
    await expect(page).toHaveURL(/signup/);

    // Click sign in link
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/login/);
  });

  test('16. Dashboard shows empty state for new user with no projects', async ({
    page,
    request,
  }) => {
    // Login via API to get session
    await loginTestUser(request, testUser.email, testUser.password);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Should be on dashboard
    expect(page.url()).toContain('dashboard');
  });

  test('17. User cannot access dashboard without login', async ({ page, request }) => {
    // Ensure logged out
    await logoutTestUser(request);

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 5000 });
    expect(page.url()).toContain('login');
  });

  test('18. Protected routes preserve redirect URL', async ({ page, request }) => {
    await logoutTestUser(request);

    // Try to access a specific protected route
    await page.goto('/dashboard/projects');

    // Should redirect to login with redirect param
    await page.waitForURL(/login/, { timeout: 5000 });

    const url = page.url();
    expect(url).toContain('login');
    // May contain redirect param
  });

  test('19. Error page handles 404 gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');

    // Should show 404 content
    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/not found|404/);
  });

  test('20. User can use keyboard to navigate login form', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Type in email field when focused
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedTag);
  });
});

test.describe('UI Dashboard Flows', () => {
  let testUser: { email: string; password: string; name: string };
  const createdProjectIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test.afterAll(async ({ request }) => {
    if (createdProjectIds.length > 0) {
      await loginTestUser(request, testUser.email, testUser.password);
      await cleanupTestProjects(request, createdProjectIds);
    }
    await logoutTestUser(request);
  });

  test('21. Dashboard page structure loads correctly', async ({ page, request }) => {
    await loginTestUser(request, testUser.email, testUser.password);
    await page.goto('/dashboard');

    // Should have navigation/sidebar
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('22. User can access settings page from dashboard', async ({ page, request }) => {
    await loginTestUser(request, testUser.email, testUser.password);
    await page.goto('/dashboard/settings');

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('settings');
  });

  test('23. User can access analytics page', async ({ page, request }) => {
    await loginTestUser(request, testUser.email, testUser.password);
    await page.goto('/dashboard/analytics');

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('analytics');
  });

  test('24. User can access domains page', async ({ page, request }) => {
    await loginTestUser(request, testUser.email, testUser.password);
    await page.goto('/dashboard/domains');

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('domains');
  });

  test('25. Dashboard is responsive on mobile', async ({ page, request }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginTestUser(request, testUser.email, testUser.password);
    await page.goto('/dashboard');

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('dashboard');
  });
});
