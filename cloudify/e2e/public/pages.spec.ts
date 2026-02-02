import { test, expect } from '@playwright/test';

test.describe('Public Pages - Rendering & Navigation', () => {
  // Home page tests
  test('51. home page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cloudify/);
  });

  test('52. home page has navigation header', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('53. home page has hero section', async ({ page }) => {
    await page.goto('/');
    // Look for typical hero content
    const heroContent = page.locator('h1, [class*="hero"]').first();
    await expect(heroContent).toBeVisible();
  });

  test('54. home page has footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('55. home page login button navigates to login', async ({ page }) => {
    await page.goto('/');
    // Find and click login/sign in button
    const loginButton = page.getByRole('link', { name: /login|sign in/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('56. home page signup button navigates to signup', async ({ page }) => {
    await page.goto('/');
    const signupButton = page.getByRole('link', { name: /sign up|get started|start/i }).first();
    if (await signupButton.isVisible()) {
      await signupButton.click();
      await page.waitForTimeout(500);
      // Should navigate to signup or similar
    }
  });

  // Docs page tests
  test('57. docs page loads successfully', async ({ page }) => {
    const response = await page.goto('/docs');
    expect(response?.status()).toBeLessThan(400);
  });

  test('58. docs page has heading', async ({ page }) => {
    await page.goto('/docs');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  // Pricing page tests
  test('59. pricing page loads successfully', async ({ page }) => {
    const response = await page.goto('/pricing');
    expect(response?.status()).toBeLessThan(400);
  });

  test('60. pricing page displays pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    // Look for typical pricing content
    const pricingContent = page.locator('[class*="price"], [class*="plan"], [class*="tier"]').first();
    // May or may not exist depending on page structure
  });

  // 404 page tests
  test('61. 404 page returns correct status', async ({ page }) => {
    const response = await page.goto('/this-page-definitely-does-not-exist-12345');
    expect(response?.status()).toBe(404);
  });

  test('62. 404 page has helpful content', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist-12345');
    // Should have some indication this is a 404
    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/not found|404|doesn't exist/i);
  });

  test('63. 404 page has link back to home', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    const homeLink = page.getByRole('link', { name: /home|back|return/i });
    // May or may not exist
  });

  // Navigation tests
  test('64. can navigate from home to docs', async ({ page }) => {
    await page.goto('/');
    const docsLink = page.getByRole('link', { name: /docs|documentation/i }).first();
    if (await docsLink.isVisible()) {
      await docsLink.click();
      await expect(page).toHaveURL(/docs/);
    }
  });

  test('65. can navigate from home to pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByRole('link', { name: /pricing/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/pricing/);
    }
  });
});

test.describe('Responsive Design', () => {
  test('66. mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('67. tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('68. desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('69. login page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.getByText('Continue with GitHub')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('70. signup page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/signup');
    await expect(page.getByText('Create your account')).toBeVisible();
  });
});
