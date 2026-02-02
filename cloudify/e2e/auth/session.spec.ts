import { test, expect } from '@playwright/test';

test.describe('Session & Protected Routes', () => {
  // Protected route access without auth
  test('36. /dashboard redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/);
    expect(page.url()).toContain('/login');
  });

  test('37. /dashboard/projects redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('38. /dashboard/deployments redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard/deployments', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('39. /dashboard/settings redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('40. /dashboard/analytics redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard/analytics', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('41. /dashboard/domains redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard/domains', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  // Redirect URL preservation
  test('42. preserves redirect URL when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login/);

    // URL should contain redirect parameter
    const url = page.url();
    expect(url).toMatch(/redirect|callbackUrl|from/i);
  });

  // Public routes should be accessible
  test('43. home page accessible without auth', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('44. docs page accessible without auth', async ({ page }) => {
    const response = await page.goto('/docs');
    expect(response?.status()).toBeLessThan(400);
  });

  test('45. pricing page accessible without auth', async ({ page }) => {
    const response = await page.goto('/pricing');
    expect(response?.status()).toBeLessThan(400);
  });

  test('46. login page accessible without auth', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });

  test('47. signup page accessible without auth', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);
  });

  // API routes protection
  test('48. /api/projects returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/projects');
    expect(response.status()).toBe(401);
  });

  test('49. /api/deployments/[id] returns 401 or 404 without auth', async ({ page }) => {
    // Note: /api/deployments requires an ID - there's no listing endpoint
    const response = await page.request.get('/api/deployments/test-id');
    // Should return 401 (unauthorized) or 404 (not found) - not 500
    expect([401, 404]).toContain(response.status());
  });

  test('50. /api/auth/session returns valid response', async ({ page }) => {
    const response = await page.request.get('/api/auth/session');
    // Should return 200 with empty session or session data
    expect(response.status()).toBeLessThan(500);
  });
});
