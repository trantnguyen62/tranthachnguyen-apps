import { test, expect } from '@playwright/test';

test.describe('OAuth Redirect Tests', () => {
  test('GitHub OAuth button redirects to GitHub authorization', async ({ page }) => {
    // Go to login page
    await page.goto('https://cloudify.tranthachnguyen.com/login', { waitUntil: 'domcontentloaded' });

    // Wait for hydration
    await page.waitForTimeout(3000);

    // Find the GitHub button
    const githubButton = page.getByText('Continue with GitHub');

    // Verify button exists
    await expect(githubButton).toBeVisible();
    console.log('✓ GitHub button is visible');

    // Verify button is enabled
    await expect(githubButton).toBeEnabled();
    console.log('✓ GitHub button is enabled');

    // Check for any JavaScript errors before clicking
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('Page error:', error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Click the button and wait for navigation
    console.log('Clicking GitHub button...');

    // Use Promise.race to handle potential redirect
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth') || resp.url().includes('github.com'), { timeout: 10000 }).catch(() => null),
      githubButton.click(),
    ]);

    // Wait for any navigation to complete
    await page.waitForTimeout(3000);

    // Get current URL
    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);

    // Check if we're still on login page (problem!) or redirected
    if (currentUrl.includes('cloudify.tranthachnguyen.com/login')) {
      console.log('❌ STILL ON LOGIN PAGE - Button click did not trigger redirect');

      // Check if there are JS errors
      if (errors.length > 0) {
        console.log('JavaScript errors found:', errors);
      }

      // Try to get more info by checking network activity
      const requestsMade = await page.evaluate(() => {
        return (window as any).__requestLog || 'No request log available';
      });
      console.log('Requests:', requestsMade);
    }

    // The test should pass if we're redirected to GitHub
    expect(currentUrl).toMatch(/github\.com|api\/auth/);
  });

  test('Check button onClick is attached', async ({ page }) => {
    await page.goto('https://cloudify.tranthachnguyen.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check if onClick handler is attached
    const githubButton = page.getByText('Continue with GitHub');

    // Get button's event listeners info
    const hasClickHandler = await githubButton.evaluate((el) => {
      // Check if element has onclick or event listeners
      const hasOnClick = !!(el as any).onclick;
      // React attaches handlers differently, check for __reactFiber
      const hasReactProps = Object.keys(el).some(k => k.startsWith('__react'));
      return { hasOnClick, hasReactProps, tagName: el.tagName, type: (el as HTMLButtonElement).type };
    });

    console.log('Button info:', hasClickHandler);

    expect(hasClickHandler.hasReactProps).toBe(true);
  });
});
