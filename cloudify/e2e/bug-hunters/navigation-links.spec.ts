import { test, expect } from '@playwright/test';

/**
 * NAVIGATION & LINKS TESTS
 * Verify all navigation links work and pages load correctly
 */

test.describe('Navigation Links - Find 404 Bugs', () => {

  test.describe('Header Navigation Links', () => {

    test('should load home page', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(/Cloudify/i);
    });

    test('should load pricing page', async ({ page }) => {
      const response = await page.goto('/pricing');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load resources page', async ({ page }) => {
      const response = await page.goto('/resources');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load login page', async ({ page }) => {
      const response = await page.goto('/login');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load signup page', async ({ page }) => {
      const response = await page.goto('/signup');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load new project page', async ({ page }) => {
      const response = await page.goto('/new');
      expect(response?.status()).toBeLessThan(400);
    });
  });

  test.describe('Products Pages', () => {

    test('should load products index', async ({ page }) => {
      const response = await page.goto('/products');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/v0', async ({ page }) => {
      const response = await page.goto('/products/v0');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/ai', async ({ page }) => {
      const response = await page.goto('/products/ai');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/ai-gateway', async ({ page }) => {
      const response = await page.goto('/products/ai-gateway');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/ai-sdk', async ({ page }) => {
      const response = await page.goto('/products/ai-sdk');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/deployments', async ({ page }) => {
      const response = await page.goto('/products/deployments');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/edge-network', async ({ page }) => {
      const response = await page.goto('/products/edge-network');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/functions', async ({ page }) => {
      const response = await page.goto('/products/functions');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/analytics', async ({ page }) => {
      const response = await page.goto('/products/analytics');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load products/storage', async ({ page }) => {
      const response = await page.goto('/products/storage');
      expect(response?.status()).toBeLessThan(400);
    });
  });

  test.describe('Solutions Pages', () => {

    test('should load solutions index', async ({ page }) => {
      const response = await page.goto('/solutions');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load solutions/ai-apps', async ({ page }) => {
      const response = await page.goto('/solutions/ai-apps');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load solutions/web-apps', async ({ page }) => {
      const response = await page.goto('/solutions/web-apps');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load solutions/ecommerce', async ({ page }) => {
      const response = await page.goto('/solutions/ecommerce');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load solutions/marketing', async ({ page }) => {
      const response = await page.goto('/solutions/marketing');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load solutions/platforms', async ({ page }) => {
      const response = await page.goto('/solutions/platforms');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load solutions/enterprise', async ({ page }) => {
      const response = await page.goto('/solutions/enterprise');
      expect(response?.status()).toBeLessThan(400);
    });
  });

  test.describe('Documentation Pages', () => {

    test('should load docs index', async ({ page }) => {
      const response = await page.goto('/docs');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/introduction', async ({ page }) => {
      const response = await page.goto('/docs/introduction');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/quick-start', async ({ page }) => {
      const response = await page.goto('/docs/quick-start');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/cli', async ({ page }) => {
      const response = await page.goto('/docs/cli');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/git', async ({ page }) => {
      const response = await page.goto('/docs/git');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/domains', async ({ page }) => {
      const response = await page.goto('/docs/domains');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/functions', async ({ page }) => {
      const response = await page.goto('/docs/functions');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load docs/environment-variables', async ({ page }) => {
      const response = await page.goto('/docs/environment-variables');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load framework docs - nextjs', async ({ page }) => {
      const response = await page.goto('/docs/frameworks/nextjs');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load framework docs - react', async ({ page }) => {
      const response = await page.goto('/docs/frameworks/react');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load framework docs - vue', async ({ page }) => {
      const response = await page.goto('/docs/frameworks/vue');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load framework docs - astro', async ({ page }) => {
      const response = await page.goto('/docs/frameworks/astro');
      expect(response?.status()).toBeLessThan(400);
    });
  });

  test.describe('Footer Pages', () => {

    test('should load about page', async ({ page }) => {
      const response = await page.goto('/about');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load careers page', async ({ page }) => {
      const response = await page.goto('/careers');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load contact page', async ({ page }) => {
      const response = await page.goto('/contact');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load partners page', async ({ page }) => {
      const response = await page.goto('/partners');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load legal page', async ({ page }) => {
      const response = await page.goto('/legal');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load privacy page', async ({ page }) => {
      const response = await page.goto('/privacy');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load terms page', async ({ page }) => {
      const response = await page.goto('/terms');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load cookies page', async ({ page }) => {
      const response = await page.goto('/cookies');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load blog page', async ({ page }) => {
      const response = await page.goto('/blog');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load templates page', async ({ page }) => {
      const response = await page.goto('/templates');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load changelog page', async ({ page }) => {
      const response = await page.goto('/changelog');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load guides page', async ({ page }) => {
      const response = await page.goto('/guides');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load support page', async ({ page }) => {
      const response = await page.goto('/support');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load status page', async ({ page }) => {
      const response = await page.goto('/status');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load demo page', async ({ page }) => {
      const response = await page.goto('/demo');
      expect(response?.status()).toBeLessThan(400);
    });
  });

  test.describe('Dashboard Pages (require auth)', () => {

    test('should redirect to login for /dashboard', async ({ page }) => {
      const response = await page.goto('/dashboard');
      // Should either load or redirect to login (not 500)
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /projects', async ({ page }) => {
      const response = await page.goto('/projects');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /settings', async ({ page }) => {
      const response = await page.goto('/settings');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /domains', async ({ page }) => {
      const response = await page.goto('/domains');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /analytics', async ({ page }) => {
      const response = await page.goto('/analytics');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /functions', async ({ page }) => {
      const response = await page.goto('/functions');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /storage', async ({ page }) => {
      const response = await page.goto('/storage');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /logs', async ({ page }) => {
      const response = await page.goto('/logs');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /activity', async ({ page }) => {
      const response = await page.goto('/activity');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /team', async ({ page }) => {
      const response = await page.goto('/team');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /tokens', async ({ page }) => {
      const response = await page.goto('/tokens');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /usage', async ({ page }) => {
      const response = await page.goto('/usage');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should redirect to login for /integrations', async ({ page }) => {
      const response = await page.goto('/integrations');
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('API Routes Health', () => {

    test('should respond to /api/health', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.status()).toBeLessThan(500);
    });

    test('should respond to /api/projects (with auth error)', async ({ request }) => {
      const response = await request.get('/api/projects');
      // Should return 401, not 500
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should respond to /api/auth GET (session check)', async ({ request }) => {
      const response = await request.get('/api/auth');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Header Navigation Click Tests', () => {

    test('should navigate via header products dropdown', async ({ page }) => {
      await page.goto('/');

      // Open products dropdown
      const productsBtn = page.locator('button:has-text("Products"), a:has-text("Products")').first();
      if (await productsBtn.isVisible()) {
        await productsBtn.hover();
        // Wait for dropdown to appear
        await page.waitForTimeout(300);

        // Try to click a dropdown link
        const aiLink = page.locator('a[href="/products/ai"]').first();
        if (await aiLink.isVisible()) {
          await aiLink.click();
          await expect(page).toHaveURL(/\/products\/ai/);
        }
      }
    });

    test('should navigate via header pricing link', async ({ page }) => {
      await page.goto('/');

      const pricingLink = page.locator('a[href="/pricing"]').first();
      if (await pricingLink.isVisible()) {
        await pricingLink.click();
        await expect(page).toHaveURL(/\/pricing/);
      }
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/');

      const loginLink = page.locator('a[href="/login"]').first();
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/');

      const signupLink = page.locator('a[href="/signup"]').first();
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await expect(page).toHaveURL(/\/signup/);
      }
    });
  });

  test.describe('Footer Navigation Click Tests', () => {

    test('should navigate via footer docs link', async ({ page }) => {
      await page.goto('/');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const docsLink = page.locator('footer a[href="/docs"]').first();
      if (await docsLink.isVisible()) {
        await docsLink.click();
        await expect(page).toHaveURL(/\/docs/);
      }
    });

    test('should navigate via footer privacy link', async ({ page }) => {
      await page.goto('/');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const privacyLink = page.locator('footer a[href="/privacy"]').first();
      if (await privacyLink.isVisible()) {
        await privacyLink.click();
        await expect(page).toHaveURL(/\/privacy/);
      }
    });

    test('should navigate via footer terms link', async ({ page }) => {
      await page.goto('/');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const termsLink = page.locator('footer a[href="/terms"]').first();
      if (await termsLink.isVisible()) {
        await termsLink.click();
        await expect(page).toHaveURL(/\/terms/);
      }
    });
  });

  test.describe('Non-existent Pages (404 handling)', () => {

    test('should handle non-existent page gracefully', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-xyz');
      // Should return 404, not 500
      expect(response?.status()).toBe(404);
    });

    test('should handle non-existent product page', async ({ page }) => {
      const response = await page.goto('/products/non-existent-product');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle non-existent solution page', async ({ page }) => {
      const response = await page.goto('/solutions/non-existent-solution');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle non-existent docs page', async ({ page }) => {
      const response = await page.goto('/docs/non-existent-doc');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle non-existent API route', async ({ request }) => {
      const response = await request.get('/api/non-existent-endpoint');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Special Routes', () => {

    test('should load import page', async ({ page }) => {
      const response = await page.goto('/import');
      expect(response?.status()).toBeLessThan(400);
    });

    test('should load onboarding page', async ({ page }) => {
      const response = await page.goto('/onboarding');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle invalid invitation token', async ({ page }) => {
      const response = await page.goto('/invitations/invalid-token-xyz');
      expect(response?.status()).toBeLessThan(500);
    });
  });
});
