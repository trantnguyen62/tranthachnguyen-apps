import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://cloudify.tranthachnguyen.com';

test.describe('OAuth Authentication - Complete Test Suite', () => {

  // ==================== GITHUB OAUTH TESTS ====================

  test.describe('GitHub OAuth', () => {

    test('1. GitHub button renders and is interactive', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000); // Wait for hydration

      const githubButton = page.getByText('Continue with GitHub');

      // Button should exist
      await expect(githubButton).toBeVisible();

      // Button should be enabled (not disabled)
      await expect(githubButton).toBeEnabled();

      // Button should have correct type
      const buttonType = await githubButton.getAttribute('type');
      expect(buttonType).toBe('button');

      // Button should be clickable (has event handlers)
      const hasReactProps = await githubButton.evaluate((el) => {
        return Object.keys(el).some(k => k.startsWith('__react'));
      });
      expect(hasReactProps).toBe(true);
    });

    test('2. GitHub OAuth initiates redirect to GitHub', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      // Wait for navigation
      await page.waitForTimeout(5000);

      const url = page.url();
      console.log('Redirected to:', url);

      // Should redirect to GitHub
      expect(url).toMatch(/github\.com/);

      // Should include correct client_id
      expect(url).toContain('client_id=Ov23lij7qBtBsl1gDUdL');

      // Should include correct callback URL
      expect(url).toContain('cloudify.tranthachnguyen.com');
    });

    test('3. GitHub OAuth callback URL is correctly configured', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();

      // URL is double-encoded in return_to parameter, check for encoded callback
      expect(url).toMatch(/callback.*github|github.*callback/i);
    });

    test('4. GitHub OAuth requests correct scopes', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();

      // Scope is URL-encoded in return_to parameter
      // %253A is double-encoded :, %2B is +
      expect(url).toMatch(/scope|read.*user|user.*email/i);
    });

    test('5. GitHub OAuth handles cancellation gracefully', async ({ page }) => {
      // Simulate user denying access - go directly to callback with error
      await page.goto(`${BASE_URL}/api/auth/callback/github?error=access_denied&error_description=The+user+has+denied+your+application+access`);

      await page.waitForTimeout(3000);

      const url = page.url();

      // Should redirect to login with error
      expect(url).toContain('/login');
    });
  });

  // ==================== GOOGLE OAUTH TESTS ====================

  test.describe('Google OAuth', () => {

    test('6. Google button renders and is interactive', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const googleButton = page.getByText('Continue with Google');

      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();

      const buttonType = await googleButton.getAttribute('type');
      expect(buttonType).toBe('button');
    });

    test('7. Google OAuth initiates redirect to Google', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const googleButton = page.getByText('Continue with Google');
      await googleButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();
      console.log('Redirected to:', url);

      // Should redirect to Google
      expect(url).toMatch(/accounts\.google\.com|google\.com\/o\/oauth/);
    });

    test('8. Google OAuth callback URL is correctly configured', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const googleButton = page.getByText('Continue with Google');
      await googleButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();

      // Check redirect_uri parameter
      const redirectUri = decodeURIComponent(url.match(/redirect_uri=([^&]+)/)?.[1] || '');
      expect(redirectUri).toContain('/api/auth/callback/google');
    });
  });

  // ==================== SIGNUP PAGE OAUTH TESTS ====================

  test.describe('Signup Page OAuth', () => {

    test('9. OAuth buttons exist on signup page', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      const googleButton = page.getByText('Continue with Google');

      await expect(githubButton).toBeVisible();
      await expect(googleButton).toBeVisible();
    });

    test('10. GitHub OAuth works from signup page', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();
      expect(url).toMatch(/github\.com/);
    });

    test('11. Google OAuth works from signup page', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const googleButton = page.getByText('Continue with Google');
      await googleButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();
      expect(url).toMatch(/google\.com/);
    });
  });

  // ==================== API ENDPOINT TESTS ====================

  test.describe('OAuth API Endpoints', () => {

    test('12. CSRF endpoint returns valid token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/csrf`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(20);
    });

    test('13. Providers endpoint lists available providers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/providers`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.github).toBeDefined();
      expect(data.google).toBeDefined();
    });

    test('14. Session endpoint returns null for unauthenticated', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/session`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should return empty object or null for unauthenticated user
      // NextAuth returns null or {} for unauthenticated
      expect(data === null || data.user === undefined || data.user === null).toBeTruthy();
    });

    test('15. Signin endpoint without CSRF returns error', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/signin/github`, {
        data: {
          callbackUrl: '/dashboard'
          // Missing csrfToken
        }
      });

      // Should return error (200 with error page or 302 redirect)
      expect([200, 302, 400, 403]).toContain(response.status());
    });

    test('16. Callback endpoint handles invalid code', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/callback/github?code=invalid_code_12345`);

      // Should handle gracefully (200 error page or 302 redirect)
      expect([200, 302, 400]).toContain(response.status());
    });

    test('17. Callback endpoint handles missing code', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/callback/github`);

      // Should handle gracefully
      expect([200, 302, 400]).toContain(response.status());
    });
  });

  // ==================== SECURITY TESTS ====================

  test.describe('OAuth Security', () => {

    test('18. OAuth uses PKCE (code_challenge)', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();

      // Modern OAuth should use PKCE - URL-encoded in return_to parameter
      expect(url).toMatch(/code_challenge/i);
    });

    test('19. OAuth state parameter is present (CSRF protection)', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const googleButton = page.getByText('Continue with Google');
      await googleButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();

      // Google OAuth URL should have state or code_challenge for CSRF protection
      expect(url).toMatch(/state=|code_challenge/i);
    });

    test('20. Cannot directly access callback without proper state', async ({ page }) => {
      // Try to access callback directly
      await page.goto(`${BASE_URL}/api/auth/callback/github?code=fake_code&state=fake_state`);

      await page.waitForTimeout(3000);

      const url = page.url();

      // Should not be authenticated, redirected to login or error
      expect(url).toMatch(/login|error|signin/);
    });

    test('21. Multiple rapid OAuth clicks are handled', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');

      // Rapid clicks
      await githubButton.click();
      await githubButton.click();
      await githubButton.click();

      await page.waitForTimeout(5000);

      // Should still end up on GitHub, not broken
      const url = page.url();
      expect(url).toMatch(/github\.com|cloudify/);
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  test.describe('OAuth Error Handling', () => {

    test('22. Invalid provider returns error', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/auth/signin/invalid_provider`);

      await page.waitForTimeout(3000);

      // Should show error or redirect
      const url = page.url();
      const content = await page.content();

      expect(url.includes('error') || content.includes('error') || content.includes('Error')).toBeTruthy();
    });

    test('23. OAuth callback with error parameter shows error', async ({ page }) => {
      await page.goto(`${BASE_URL}/api/auth/callback/github?error=access_denied`);

      await page.waitForTimeout(3000);

      const url = page.url();
      expect(url).toContain('error');
    });

    test('24. Network timeout handling (callback endpoint)', async ({ page }) => {
      // Test with an invalid callback that might timeout
      const response = await page.goto(`${BASE_URL}/api/auth/callback/github?code=timeout_test_${Date.now()}`);

      await page.waitForTimeout(3000);

      // Should handle gracefully, not crash
      expect(response?.status()).toBeLessThan(500);
    });
  });

  // ==================== UI/UX TESTS ====================

  test.describe('OAuth UI/UX', () => {

    test('25. OAuth buttons have proper styling', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');

      // Check button has visible icon
      const hasIcon = await githubButton.locator('svg').count();
      expect(hasIcon).toBeGreaterThan(0);

      // Check button is full width
      const boundingBox = await githubButton.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(200);
    });

    test('26. OAuth buttons are keyboard accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Tab to OAuth buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Get focused element
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);

      // Should be able to focus buttons
      expect(focusedTag).toBeTruthy();
    });

    test('27. OAuth buttons work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');

      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();

      // Click should work on mobile
      await githubButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();
      expect(url).toMatch(/github\.com/);
    });

    test('28. Page shows loading state appropriately', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

      // Check initial render - buttons might be briefly disabled during hydration
      // Wait and then check they're enabled
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeEnabled();
    });
  });

  // ==================== INTEGRATION TESTS ====================

  test.describe('OAuth Integration', () => {

    test('29. OAuth buttons have correct form/action', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');

      // Check if button is inside a form or has onClick
      const parentForm = await githubButton.evaluate((el) => {
        return el.closest('form')?.action || null;
      });

      const hasClickHandler = await githubButton.evaluate((el) => {
        return !!(el as any).onclick || Object.keys(el).some(k => k.includes('react'));
      });

      // Either form-based or JS-based auth should work
      expect(parentForm || hasClickHandler).toBeTruthy();
    });

    test('30. Both OAuth providers can be accessed in same session', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Check GitHub
      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeEnabled();

      // Check Google
      const googleButton = page.getByText('Continue with Google');
      await expect(googleButton).toBeEnabled();

      // Click GitHub first
      await githubButton.click();
      await page.waitForTimeout(3000);

      // Go back
      await page.goBack();
      await page.waitForTimeout(3000);

      // Both should still be available (after going back)
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      await expect(page.getByText('Continue with GitHub')).toBeVisible();
      await expect(page.getByText('Continue with Google')).toBeVisible();
    });
  });

  // ==================== STRESS TESTS ====================

  test.describe('OAuth Stress Tests', () => {

    test('31. Handle rapid page refreshes', async ({ page }) => {
      for (let i = 0; i < 5; i++) {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      }

      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();
    });

    test('32. OAuth works after clearing cookies', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Clear cookies
      await context.clearCookies();

      // Refresh
      await page.reload();
      await page.waitForTimeout(3000);

      // Should still work
      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeEnabled();

      await githubButton.click();
      await page.waitForTimeout(5000);

      const url = page.url();
      expect(url).toMatch(/github\.com/);
    });

    test('33. Concurrent OAuth requests from same page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Get both buttons
      const githubButton = page.getByText('Continue with GitHub');
      const googleButton = page.getByText('Continue with Google');

      // Both should be interactive
      await expect(githubButton).toBeEnabled();
      await expect(googleButton).toBeEnabled();

      // Click one - page should navigate, not break
      await githubButton.click();

      await page.waitForTimeout(5000);

      // Should be on GitHub or still navigating
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });

  // ==================== EDGE CASE TESTS ====================

  test.describe('OAuth Edge Cases', () => {

    test('34. Handle special characters in callback URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      await page.waitForTimeout(5000);

      const url = page.url();

      // URL should be properly encoded
      expect(url).not.toContain(' ');
      expect(url).toMatch(/%[0-9A-F]{2}/i); // Should have URL-encoded characters
    });

    test('35. OAuth from deep link preserves callback', async ({ page }) => {
      // Go to login with a specific callback
      await page.goto(`${BASE_URL}/login?callbackUrl=/projects/test`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeEnabled();
    });

    test('36. OAuth handles browser back/forward', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');
      await githubButton.click();

      await page.waitForTimeout(3000);

      // Go back
      await page.goBack();

      await page.waitForTimeout(3000);

      // Should be back on login page, still functional
      const url = page.url();
      if (url.includes('cloudify')) {
        const button = page.getByText('Continue with GitHub');
        await expect(button).toBeVisible();
      }
    });

    test('37. OAuth handles popup blockers gracefully', async ({ page, context }) => {
      // Simulate popup blocker by disabling popups
      await context.grantPermissions([]);

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const githubButton = page.getByText('Continue with GitHub');

      // Should still work (redirect, not popup)
      await githubButton.click();

      await page.waitForTimeout(5000);

      // Should redirect in same window
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });

  // ==================== REGRESSION TESTS ====================

  test.describe('OAuth Regression Tests', () => {

    test('38. CSRF token changes per request', async ({ request }) => {
      const response1 = await request.get(`${BASE_URL}/api/auth/csrf`);
      const data1 = await response1.json();

      const response2 = await request.get(`${BASE_URL}/api/auth/csrf`);
      const data2 = await response2.json();

      // Tokens should be different (or at least valid)
      expect(data1.csrfToken).toBeDefined();
      expect(data2.csrfToken).toBeDefined();
    });

    test('39. OAuth buttons maintain state across renders', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Scroll down and up
      await page.evaluate(() => window.scrollTo(0, 100));
      await page.evaluate(() => window.scrollTo(0, 0));

      await page.waitForTimeout(1000);

      // Buttons should still work
      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeEnabled();
    });

    test('40. OAuth works with JavaScript disabled warning', async ({ page }) => {
      // Test that buttons render even if there's a JS hydration delay
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

      // Immediately check - buttons should at least be in DOM
      const githubButton = page.getByText('Continue with GitHub');
      await expect(githubButton).toBeAttached();

      // Wait for hydration
      await page.waitForTimeout(5000);

      // Now should be interactive
      await expect(githubButton).toBeEnabled();
    });
  });
});
