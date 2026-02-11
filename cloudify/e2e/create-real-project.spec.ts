/**
 * Create a REAL project on Cloudify with GitHub repository
 * This test actually creates a persistent project
 */

import { test, expect, Page } from '@playwright/test';

const PROD_URL = 'https://cloudify.tranthachnguyen.com';
const TEST_EMAIL = 'Wardah34@ytmu.site';
const TEST_PASSWORD = 'GaPw74RmLq59vXy';

// Use a simple, quick-to-build repo
const GITHUB_REPO = 'https://github.com/vercel/next.js';
const PROJECT_NAME = 'my-nextjs-app';

async function loginWithGoogle(page: Page) {
  console.log('1. Navigating to login page...');
  await page.goto(`${PROD_URL}/login`);
  await page.waitForTimeout(2000);

  console.log('2. Clicking Google OAuth button...');
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
  await googleBtn.click();
  await page.waitForTimeout(2000);

  // Handle Google login
  if (page.url().includes('accounts.google.com')) {
    console.log('3. On Google login page, entering credentials...');

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
  console.log('4. Waiting for dashboard redirect...');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  console.log(`5. Successfully logged in! URL: ${page.url()}`);
}

test.describe('Create Real Project', () => {
  test('Create a Next.js project from GitHub', async ({ page, request }) => {
    // Step 1: Login
    await loginWithGoogle(page);

    // Step 2: Get session cookies
    console.log('6. Getting session cookies...');
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Step 3: Create project via API
    console.log('7. Creating project via API...');
    const createResponse = await request.post(`${PROD_URL}/api/projects`, {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json'
      },
      data: {
        name: PROJECT_NAME,
        repoUrl: GITHUB_REPO,
        framework: 'nextjs',
        buildCmd: 'npm run build',
        outputDir: '.next',
        installCmd: 'npm install',
        rootDir: '/',
        nodeVersion: '18'
      }
    });

    console.log(`   Response status: ${createResponse.status()}`);

    if (createResponse.status() === 400) {
      const error = await createResponse.json();
      if (error.error?.includes('already exists')) {
        console.log('   Project already exists, continuing...');
      } else {
        console.log(`   Error: ${JSON.stringify(error)}`);
      }
    } else {
      expect(createResponse.status()).toBe(200);
      const project = await createResponse.json();
      console.log(`   Created project: ${project.name} (ID: ${project.id})`);
    }

    // Step 4: Verify project exists
    console.log('8. Verifying project exists...');
    const listResponse = await request.get(`${PROD_URL}/api/projects`, {
      headers: { Cookie: cookieHeader }
    });

    expect(listResponse.status()).toBe(200);
    const projects = await listResponse.json();
    console.log(`   Found ${projects.length} projects`);

    const ourProject = projects.find((p: { name: string }) => p.name === PROJECT_NAME);
    expect(ourProject).toBeDefined();
    console.log(`   Project "${ourProject.name}" verified!`);
    console.log(`   - ID: ${ourProject.id}`);
    console.log(`   - Slug: ${ourProject.slug}`);
    console.log(`   - Repo: ${ourProject.repoUrl}`);

    // Step 5: Navigate to project page
    console.log('9. Navigating to project page...');
    await page.goto(`${PROD_URL}/projects/${ourProject.slug}`);
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/cloudify-real-project.png', fullPage: true });
    console.log('10. Screenshot saved to /tmp/cloudify-real-project.png');

    // Step 6: Trigger deployment (optional - may take time)
    console.log('11. Project created successfully!');
    console.log(`    View at: ${PROD_URL}/projects/${ourProject.slug}`);
  });
});
