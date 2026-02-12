import { test, expect } from '@playwright/test';

// OAuth was removed in favor of credentials-only auth. Skip entire suite.
test.skip();

test('Full Google OAuth flow - verify redirect to dashboard', async ({ page, context }) => {
  await page.goto('https://cloudify.tranthachnguyen.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('1. On Cloudify login page');

  const googleButton = page.getByText('Continue with Google');
  await googleButton.click();
  await page.waitForTimeout(5000);
  console.log('2. Redirected to:', page.url());

  if (page.url().includes('google.com') || page.url().includes('accounts.google')) {
    console.log('3. On Google, filling credentials...');

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('Wardah34@ytmu.site');
      await page.click('#identifierNext, button:has-text("Next")');
      await page.waitForTimeout(3000);
    }

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('GaPw74RmLq59vXy');
      await page.click('#passwordNext, button:has-text("Next")');
      await page.waitForTimeout(5000);
    }

    // Wait for redirect back to Cloudify
    await page.waitForURL(/cloudify/, { timeout: 15000 }).catch(() => {});
    console.log('4. Back on Cloudify:', page.url());

    // Wait for client-side redirect to dashboard
    console.log('5. Waiting for redirect to dashboard...');
    await page.waitForTimeout(5000);
    
    // Try navigating to dashboard directly
    await page.goto('https://cloudify.tranthachnguyen.com/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('6. Final URL:', page.url());
    
    if (page.url().includes('/dashboard')) {
      console.log('SUCCESS: On dashboard!');
    } else if (page.url().includes('/login')) {
      console.log('FAILED: Redirected back to login');
    }

    // Check session
    const sessionResponse = await page.request.get('https://cloudify.tranthachnguyen.com/api/auth/session');
    const session = await sessionResponse.json();
    console.log('7. Session:', session?.user?.email || 'No session');
  }
});
