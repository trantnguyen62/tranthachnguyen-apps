/**
 * Comprehensive Real-World Testing for Cloudify
 * Tests the production app with real credentials
 */

import { test, expect, Page } from '@playwright/test';

const PROD_URL = 'https://cloudify.tranthachnguyen.com';
const TEST_EMAIL = 'Wardah34@ytmu.site';
const TEST_PASSWORD = 'GaPw74RmLq59vXy';

// Override base URL to use production
test.use({ baseURL: PROD_URL });

async function loginWithGoogle(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1000);

  // Click Google OAuth button
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
  await googleBtn.click();
  await page.waitForTimeout(2000);

  // Handle Google login if on Google page
  if (page.url().includes('accounts.google.com')) {
    // Enter email
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('#identifierNext, button:has-text("Next")');
    await page.waitForTimeout(3000);

    // Enter password
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('#passwordNext, button:has-text("Next")');
    await page.waitForTimeout(5000);
  }

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
}

test.describe('Cloudify Production Real-World Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginWithGoogle(page);
  });

  test.describe('Phase 1: Dashboard', () => {
    test('Dashboard loads without errors', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Check no "Failed to load" errors
      const content = await page.content();
      expect(content).not.toContain('Failed to load');

      // Take screenshot
      await page.screenshot({ path: '/tmp/cloudify-prod-dashboard.png', fullPage: true });
    });

    test('Usage page loads correctly (verifies date fix)', async ({ page }) => {
      await page.goto('/usage');
      await page.waitForTimeout(2000);

      const content = await page.content();
      expect(content).not.toContain('Failed to load');
      expect(content).not.toContain('Invalid Date');
    });

    test('Sidebar navigation works', async ({ page }) => {
      // Test Projects link
      const projectsLink = page.locator('a[href*="projects"]').first();
      if (await projectsLink.isVisible()) {
        await projectsLink.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('projects');
      }
    });
  });

  test.describe('Phase 2: Projects', () => {
    test('Can view projects list', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForTimeout(2000);

      const content = await page.content();
      expect(content).not.toContain('Failed to load');
    });

    test('Can access new project page', async ({ page }) => {
      // Try /projects/new first, then /new
      await page.goto('/projects/new');
      await page.waitForTimeout(1000);

      if (page.url().includes('404') || page.url().includes('error')) {
        await page.goto('/new');
        await page.waitForTimeout(1000);
      }

      // Should see a form or project creation interface
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      const hasInput = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasInput) {
        // Maybe need to click "New Project" button
        const newBtn = page.locator('button:has-text("New"), a:has-text("New Project")').first();
        if (await newBtn.isVisible()) {
          await newBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('Can create a test project', async ({ page }) => {
      await page.goto('/projects/new');
      await page.waitForTimeout(1000);

      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input#name').first();

      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        const projectName = `real-test-${Date.now()}`;
        await nameInput.fill(projectName);

        // Look for repo input
        const repoInput = page.locator('input[name="repoUrl"], input[placeholder*="github"], input[placeholder*="repo"]').first();
        if (await repoInput.isVisible().catch(() => false)) {
          await repoInput.fill('https://github.com/vercel/next.js');
        }

        // Submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Deploy")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(3000);

          // Should redirect or show success
          const content = await page.content();
          expect(content).not.toContain('error');
        }

        await page.screenshot({ path: '/tmp/cloudify-prod-project-created.png', fullPage: true });
      }
    });
  });

  test.describe('Phase 3: Storage', () => {
    test('Storage page loads', async ({ page }) => {
      await page.goto('/storage');
      await page.waitForTimeout(2000);

      const content = await page.content();
      expect(content).not.toContain('Failed to load');

      await page.screenshot({ path: '/tmp/cloudify-prod-storage.png', fullPage: true });
    });
  });

  test.describe('Phase 4: Settings', () => {
    test('Settings page loads', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(2000);

      const content = await page.content();
      expect(content).not.toContain('Failed to load');

      await page.screenshot({ path: '/tmp/cloudify-prod-settings.png', fullPage: true });
    });

    test('Can view profile settings', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(2000);

      // Should have profile form elements
      const settingsHeading = page.locator('h1:has-text("Settings"), h2:has-text("Settings")').first();
      const profileTab = page.locator('text=Profile').first();

      const hasHeading = await settingsHeading.isVisible({ timeout: 5000 }).catch(() => false);
      const hasProfileTab = await profileTab.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasHeading || hasProfileTab).toBe(true);

      // Take screenshot of settings page
      await page.screenshot({ path: '/tmp/cloudify-prod-settings-profile.png', fullPage: true });
    });
  });

  test.describe('Phase 5: API Verification', () => {
    test('Usage API returns valid data', async ({ page, request }) => {
      // First login to get session
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);

      // Get cookies from browser context
      const cookies = await page.context().cookies();
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Make API request with cookies
      const response = await request.get(`${PROD_URL}/api/usage`, {
        headers: { Cookie: cookieHeader }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.period).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
      expect(data.usage).toBeDefined();
    });

    test('Projects API returns valid data', async ({ page, request }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);

      const cookies = await page.context().cookies();
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      const response = await request.get(`${PROD_URL}/api/projects`, {
        headers: { Cookie: cookieHeader }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.projects) || Array.isArray(data)).toBe(true);
    });
  });
});
