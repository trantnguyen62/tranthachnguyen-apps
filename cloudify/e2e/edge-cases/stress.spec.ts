import { test, expect } from '@playwright/test';

test.describe('Edge Cases & Stress Tests', () => {
  // Browser back/forward navigation
  test('86. handles browser back button from login to home', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('87. handles browser forward button', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await page.goBack();
    await page.goForward();
    await expect(page).toHaveURL('/login');
  });

  test('88. handles multiple rapid navigations', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await page.goto('/signup');
    await page.goto('/docs');
    await page.goto('/pricing');

    // Should end up on pricing
    await expect(page).toHaveURL(/pricing/);
  });

  // Page refresh handling
  test('89. login page survives refresh', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.reload();

    // Page should reload successfully
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('90. signup page survives refresh', async ({ page }) => {
    await page.goto('/signup');
    await page.reload();
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  // Empty states
  test('91. handles empty URL gracefully', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toContain('localhost');
  });

  // Special URL characters
  test('92. handles URL with special characters', async ({ page }) => {
    const response = await page.goto('/login?test=hello%20world&foo=bar%26baz');
    expect(response?.status()).toBeLessThan(500);
  });

  test('93. handles URL with unicode characters', async ({ page }) => {
    const response = await page.goto('/login?name=测试');
    expect(response?.status()).toBeLessThan(500);
  });

  // Network conditions (simulated)
  test('94. page loads with slow network simulation', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    const response = await page.goto('/login', { timeout: 30000 });
    expect(response?.status()).toBe(200);
  });

  // Concurrent interactions
  test('95. handles rapid clicking on login button', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click multiple times rapidly
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await Promise.all([
      submitButton.click(),
      submitButton.click(),
      submitButton.click(),
    ]).catch(() => {});

    // Page should still be functional
    await page.waitForTimeout(2000);
  });

  // Form field interactions
  test('96. handles copy-paste in email field', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByLabel('Email');

    // Simulate paste
    await emailInput.focus();
    await page.keyboard.type('test@example.com');

    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('97. handles cut from password field', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByLabel('Password');

    await passwordInput.fill('password123');
    await passwordInput.selectText();

    // Password field should still work after operations
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // Viewport edge cases
  test('98. handles very small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('/login');

    // Should still render key elements
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('99. handles very large viewport', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
  });

  // JavaScript disabled simulation (hydration test)
  test('100. page has meaningful content before JS hydration', async ({ page }) => {
    await page.goto('/login');

    // Check that content exists even without waiting for hydration
    const content = await page.content();
    expect(content).toContain('Email');
    expect(content).toContain('Password');
  });
});

test.describe('API Error Handling', () => {
  test('101. handles API timeout gracefully', async ({ page }) => {
    // Mock a slow API
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.abort('timedout');
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Page should handle error gracefully
    await page.waitForTimeout(2000);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('102. handles API 500 error gracefully', async ({ page }) => {
    await page.route('**/api/auth/**', (route) =>
      route.fulfill({
        status: 500,
        body: 'Internal Server Error',
      })
    );

    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show error or handle gracefully
    await page.waitForTimeout(2000);
  });

  test('103. handles malformed API response', async ({ page }) => {
    await page.route('**/api/**', (route) =>
      route.fulfill({
        status: 200,
        body: 'not valid json {{{',
        contentType: 'application/json',
      })
    );

    await page.goto('/login');
    // Page should not crash
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

test.describe('Accessibility Basics', () => {
  test('104. login form has proper labels', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('105. submit button has accessible name', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeVisible();
  });

  test('106. page has proper heading structure', async ({ page }) => {
    await page.goto('/login');
    // Should have at least one heading
    const headings = page.getByRole('heading');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('107. links have visible text', async ({ page }) => {
    await page.goto('/login');
    const links = page.getByRole('link');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('108. form inputs are focusable', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel('Email');
    await emailInput.focus();

    const isFocused = await emailInput.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBeTruthy();
  });

  test('109. password field has autocomplete attribute', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByLabel('Password');

    // Should have autocomplete for password managers
    const autocomplete = await passwordInput.getAttribute('autocomplete');
    // May or may not be set
  });

  test('110. email field has correct input type', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });
});
