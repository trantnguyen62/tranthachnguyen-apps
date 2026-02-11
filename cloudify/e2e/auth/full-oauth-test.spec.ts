import { test, expect } from '@playwright/test';

test('Full GitHub OAuth flow with credentials', async ({ page }) => {
  // Go to login page
  await page.goto('https://cloudify.tranthachnguyen.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  console.log('1. On Cloudify login page');
  
  // Click GitHub OAuth button
  const githubButton = page.getByText('Continue with GitHub');
  await githubButton.click();
  await page.waitForTimeout(5000);
  
  console.log('2. Current URL:', page.url());
  
  // Should be on GitHub login page
  if (page.url().includes('github.com')) {
    console.log('3. On GitHub, filling credentials...');
    
    // Fill GitHub credentials
    await page.fill('input[name="login"]', 'Wardah34@ytmu.site');
    await page.fill('input[name="password"]', 'GaPw74RmLq59vXy');
    
    // Click sign in
    await page.click('input[type="submit"]');
    await page.waitForTimeout(8000);
    
    console.log('4. After GitHub login, URL:', page.url());
    
    // Check for GitHub error messages
    const flashError = await page.locator('.flash-error, .js-flash-alert').textContent().catch(() => null);
    if (flashError) {
      console.log('GitHub error:', flashError.trim());
    }
    
    // Check page content
    const pageContent = await page.content();
    if (pageContent.includes('Incorrect username or password')) {
      console.log('✗ GitHub login failed: Wrong credentials');
    } else if (pageContent.includes('Two-factor')) {
      console.log('! GitHub requires 2FA');
    }
    
    // Check if we need to authorize the app
    if (page.url().includes('authorize')) {
      console.log('5. Authorizing app...');
      const authorizeBtn = page.locator('button:has-text("Authorize")');
      if (await authorizeBtn.isVisible()) {
        await authorizeBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    console.log('6. Final URL:', page.url());
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/oauth-result.png', fullPage: true });
    console.log('Screenshot saved to /tmp/oauth-result.png');
    
    // Check if we're back on Cloudify
    if (page.url().includes('cloudify.tranthachnguyen.com')) {
      if (page.url().includes('/dashboard')) {
        console.log('✓ SUCCESS: Logged in and redirected to dashboard!');
      } else if (page.url().includes('/login')) {
        console.log('✗ FAILED: Redirected back to login page');
      } else {
        console.log('? Redirected to:', page.url());
      }
    }
  }
});
