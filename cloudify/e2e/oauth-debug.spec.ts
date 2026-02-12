import { test, expect } from '@playwright/test';

// OAuth was removed in favor of credentials-only auth. Skip entire suite.
test.skip();

test.setTimeout(60000);

test('GitHub OAuth button redirects to GitHub', async ({ page }) => {
  // Capture console
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Go to login page
  await page.goto('https://cloudify.tranthachnguyen.com/login');
  
  // Wait for JS to load
  await page.waitForTimeout(3000);
  
  // Find the GitHub button
  const githubButton = page.getByRole('button', { name: /continue with github/i });
  
  console.log('Button visible:', await githubButton.isVisible());
  console.log('Button enabled:', await githubButton.isEnabled());
  
  // Click the button
  await githubButton.click();
  console.log('Button clicked');
  
  // Wait and check URL
  await page.waitForTimeout(5000);
  
  const currentUrl = page.url();
  console.log('Final URL:', currentUrl);
  
  // Check if navigated to GitHub
  const navigatedToGitHub = currentUrl.includes('github.com');
  const stayedOnLogin = currentUrl.includes('/login');
  
  console.log('Navigated to GitHub:', navigatedToGitHub);
  console.log('Stayed on login:', stayedOnLogin);
  
  if (stayedOnLogin) {
    // Take screenshot to see what happened
    await page.screenshot({ path: 'oauth-failed.png', fullPage: true });
  }
  
  expect(navigatedToGitHub || !stayedOnLogin).toBe(true);
});
