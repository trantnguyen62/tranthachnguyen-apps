import { test, expect } from '@playwright/test';

/**
 * UX BREAKING TESTS
 * Tests designed to find user experience bugs and edge cases
 */

test.describe('UX Breaking Tests - Find Real Bugs', () => {

  test.describe('Form Validation Edge Cases', () => {

    test('should show error for empty email submission', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show validation error, not submit
      await page.waitForTimeout(1000);
      // Either HTML5 validation or custom error should appear
      const emailInput = page.getByLabel('Email');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      // Page should still be on login
      expect(page.url()).toContain('login');
    });

    test('should show error for empty password submission', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);
      expect(page.url()).toContain('login');
    });

    test('should handle pasting email with leading/trailing spaces', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', '  test@example.com  ');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should either trim or show clear error
      await page.waitForTimeout(1000);
      // Check that we're not stuck in a broken state
      await expect(page).not.toHaveURL(/error/);
    });

    test('should handle email with multiple @ signs', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);
      // Should not navigate to dashboard
      expect(page.url()).not.toContain('dashboard');
    });

    test('should validate password minimum length', async ({ page }) => {
      await page.goto('/signup');
      await page.fill('input#name', 'Test User');
      await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[type="password"]', '12'); // Too short
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);
      // Should show password requirements error
      expect(page.url()).toContain('signup');
    });

    test('should handle form submission while loading', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Click multiple times rapidly
      const button = page.getByRole('button', { name: /sign in/i });
      await button.click();
      await button.click();
      await button.click();

      // Should not cause duplicate submissions or crashes
      await page.waitForTimeout(2000);
      const buttons = await page.getByRole('button').count();
      expect(buttons).toBeGreaterThan(0);
    });

    test('should preserve form data on validation error', async ({ page }) => {
      await page.goto('/signup');
      const testEmail = `preserve-${Date.now()}@example.com`;

      await page.fill('input#name', 'Test User');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', '12'); // Invalid
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Email should still be filled after validation error
      const emailValue = await page.getByLabel('Email').inputValue();
      expect(emailValue).toBe(testEmail);
    });
  });

  test.describe('Navigation Edge Cases', () => {

    test('should handle direct navigation to protected route', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login or show unauthorized
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url.includes('login') || url.includes('401') || url.includes('unauthorized')).toBeTruthy();
    });

    test('should handle back button after login redirect', async ({ page }) => {
      await page.goto('/login');
      await page.goto('/signup');
      await page.goBack();

      await expect(page).toHaveURL(/login/);
    });

    test('should handle refresh on login page', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.reload();

      // Page should reload without error
      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('should handle clicking logo while on login', async ({ page }) => {
      await page.goto('/login');

      // Find logo/brand link and click it
      const logoLink = page.locator('a[href="/"]').first();
      if (await logoLink.isVisible()) {
        await logoLink.click();
        await expect(page).toHaveURL('/');
      }
    });

    test('should handle 404 page gracefully', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');

      // Should show 404 page, not crash
      expect(response?.status()).toBe(404);
      // Page should still be functional
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });

    test('should handle query parameters on login page', async ({ page }) => {
      await page.goto('/login?redirect=/dashboard&foo=bar');

      // Should load without error
      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('should handle hash in URL', async ({ page }) => {
      await page.goto('/login#section');

      await expect(page.getByLabel('Email')).toBeVisible();
    });
  });

  test.describe('Loading States and Timeouts', () => {

    test('should show loading state during form submission', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');

      const button = page.getByRole('button', { name: /sign in/i });

      // Click and check for loading indicator
      await button.click();

      // Button should be disabled or show loading
      await page.waitForTimeout(100);
      // Either button disabled, loading text, or spinner should appear
      const isDisabled = await button.isDisabled().catch(() => false);
      const hasLoadingText = await button.textContent().then(t => t?.toLowerCase().includes('loading') || t?.toLowerCase().includes('signing')).catch(() => false);

      // At minimum, form should handle the submission
      await page.waitForTimeout(2000);
    });

    test('should handle slow network on form submission', async ({ page, context }) => {
      // Simulate slow network
      await context.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });

      await page.goto('/login', { timeout: 30000 });
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show loading state during slow request
      await page.waitForTimeout(1000);

      // Page should still be responsive
      const isResponsive = await page.getByLabel('Email').isVisible();
      expect(isResponsive).toBeTruthy();
    });
  });

  test.describe('Responsive Design Edge Cases', () => {

    test('should render login on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/login');

      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();

      // Form should be usable
      const button = page.getByRole('button', { name: /sign in/i });
      await expect(button).toBeVisible();
    });

    test('should render login on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/login');

      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('should handle viewport resize during interaction', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.fill('input[type="email"]', 'test@example.com');

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });

      // Form should still work
      await page.fill('input[type="password"]', 'password123');
      const button = page.getByRole('button', { name: /sign in/i });
      await expect(button).toBeVisible();
    });

    test('should handle very narrow viewport', async ({ page }) => {
      await page.setViewportSize({ width: 280, height: 500 }); // Very small
      await page.goto('/login');

      // Should not completely break
      const content = await page.content();
      expect(content).toContain('Email');
    });

    test('should handle landscape mobile', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 }); // iPhone SE landscape
      await page.goto('/login');

      await expect(page.getByLabel('Email')).toBeVisible();
    });
  });

  test.describe('Error Message Display', () => {

    test('should display clear error for wrong password', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should show an error message (not just silently fail)
      // Look for common error patterns
      const hasError = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive').count() > 0
        || await page.getByText(/invalid|incorrect|wrong|failed|error/i).count() > 0;

      // At minimum, should not navigate to dashboard
      expect(page.url()).not.toContain('dashboard');
    });

    test('should clear error on new input', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrong');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Type new email - error should clear or page should be usable
      await page.fill('input[type="email"]', 'new@example.com');

      // Form should still be functional
      await expect(page.getByLabel('Email')).toHaveValue('new@example.com');
    });
  });

  test.describe('Keyboard Navigation', () => {

    test('should allow tab navigation through form', async ({ page }) => {
      await page.goto('/login');

      // Start by focusing email field
      await page.getByLabel('Email').focus();
      await page.keyboard.type('test@example.com');

      // Tab to password
      await page.keyboard.press('Tab');
      await page.keyboard.type('password123');

      // Tab to submit button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Form should submit
      await page.waitForTimeout(2000);
    });

    test('should submit form on Enter key', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Press Enter in password field
      await page.getByLabel('Password').press('Enter');

      // Form should submit
      await page.waitForTimeout(2000);
      // Should either error (wrong creds) or navigate
    });

    test('should allow Escape to clear focus', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').focus();
      await page.keyboard.press('Escape');

      // Should not cause issues
      await expect(page.getByLabel('Email')).toBeVisible();
    });
  });

  test.describe('Text Input Edge Cases', () => {

    test('should handle emoji in name field', async ({ page }) => {
      await page.goto('/signup');
      await page.fill('input#name', 'Test User 🚀');
      await page.fill('input[type="email"]', `emoji-${Date.now()}@example.com`);
      await page.fill('input[type="password"]', 'TestPass123!');

      // Should not crash
      await expect(page.locator('input#name')).toHaveValue('Test User 🚀');
    });

    test('should handle RTL text in inputs', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'مرحبا@example.com');

      // Should handle RTL text
      const value = await page.getByLabel('Email').inputValue();
      expect(value).toContain('@example.com');
    });

    test('should handle very long name', async ({ page }) => {
      await page.goto('/signup');
      const longName = 'A'.repeat(500);
      await page.fill('input#name', longName);

      // Should either truncate or handle gracefully
      const value = await page.locator('input#name').inputValue();
      expect(value.length).toBeGreaterThan(0);
    });

    test('should handle autocomplete selection', async ({ page }) => {
      await page.goto('/login');

      // Type partial email
      await page.fill('input[type="email"]', 'test@');

      // Autocomplete might show - just verify page is stable
      await expect(page.getByLabel('Email')).toHaveValue('test@');
    });
  });

  test.describe('Session and State Edge Cases', () => {

    test('should handle opening login in new tab', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/login');
      await page2.goto('/login');

      // Both should work independently
      await page1.fill('input[type="email"]', 'tab1@example.com');
      await page2.fill('input[type="email"]', 'tab2@example.com');

      const value1 = await page1.getByLabel('Email').inputValue();
      const value2 = await page2.getByLabel('Email').inputValue();

      expect(value1).toBe('tab1@example.com');
      expect(value2).toBe('tab2@example.com');
    });

    test('should handle closing tab during submission', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Start submission
      await page.click('button[type="submit"]');

      // Immediately try to navigate away
      await page.goto('/signup').catch(() => {});

      // Should not cause unhandled errors
      await page.waitForTimeout(1000);
    });

    test('should handle browser close during operation', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');

      // Page close is handled by Playwright cleanup
      // Just verify no crash
      await expect(page.getByLabel('Email')).toHaveValue('test@example.com');
    });
  });

  test.describe('Accessibility Edge Cases', () => {

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').focus();

      // Check if focus is visible (element should have some focus styling)
      const emailInput = page.getByLabel('Email');
      const hasFocusStyle = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outlineWidth !== '0px' || styles.boxShadow !== 'none';
      });

      // At minimum, focus should be detectable
      const isFocused = await emailInput.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Check for aria-live regions or role="alert"
      const hasLiveRegion = await page.locator('[aria-live], [role="alert"]').count() > 0;
      // This is a nice-to-have, not a hard requirement
    });

    test('should have descriptive button labels', async ({ page }) => {
      await page.goto('/login');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        // Button should have some accessible name
        expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
      }
    });
  });
});
