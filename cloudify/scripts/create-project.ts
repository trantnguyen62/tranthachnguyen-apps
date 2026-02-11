/**
 * Standalone script to create a real project on Cloudify
 * Run with: npx tsx scripts/create-project.ts
 */

import { chromium } from 'playwright';

const PROD_URL = 'https://cloudify.tranthachnguyen.com';
const TEST_EMAIL = 'Wardah34@ytmu.site';
const TEST_PASSWORD = 'GaPw74RmLq59vXy';
const GITHUB_REPO = 'https://github.com/vercel/next.js';
const PROJECT_NAME = 'my-nextjs-app';

async function main() {
  console.log('🚀 Creating Real Project on Cloudify\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login
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

      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.click('#identifierNext, button:has-text("Next")');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('#passwordNext, button:has-text("Next")');
      await page.waitForTimeout(5000);
    }

    console.log('4. Waiting for dashboard redirect...');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log(`   ✅ Logged in! URL: ${page.url()}`);

    // Step 2: Get session cookies
    console.log('\n5. Getting session cookies...');
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Step 3: Create project via API
    console.log('6. Creating project via API...');
    const createResponse = await page.request.post(`${PROD_URL}/api/projects`, {
      headers: {
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

    let projectId: string | null = null;
    let projectSlug: string | null = null;

    if (createResponse.status() === 400) {
      const error = await createResponse.json();
      if (error.error?.includes('already exists')) {
        console.log('   ⚠️ Project already exists, will fetch it...');
      } else {
        console.log(`   ❌ Error: ${JSON.stringify(error)}`);
      }
    } else if (createResponse.status() === 200) {
      const project = await createResponse.json();
      projectId = project.id;
      projectSlug = project.slug;
      console.log(`   ✅ Created project: ${project.name}`);
      console.log(`      ID: ${project.id}`);
      console.log(`      Slug: ${project.slug}`);
    }

    // Step 4: Verify project exists
    console.log('\n7. Verifying project exists...');
    const listResponse = await page.request.get(`${PROD_URL}/api/projects`);

    if (listResponse.status() === 200) {
      const projects = await listResponse.json();
      console.log(`   Found ${projects.length} project(s)`);

      const ourProject = projects.find((p: { name: string }) => p.name === PROJECT_NAME);
      if (ourProject) {
        projectId = ourProject.id;
        projectSlug = ourProject.slug;
        console.log(`   ✅ Project "${ourProject.name}" verified!`);
        console.log(`      ID: ${ourProject.id}`);
        console.log(`      Slug: ${ourProject.slug}`);
        console.log(`      Repo: ${ourProject.repoUrl || 'None'}`);
        console.log(`      Created: ${ourProject.createdAt}`);
      } else {
        console.log('   ❌ Project not found!');
      }
    }

    // Step 5: Navigate to project page
    if (projectSlug) {
      console.log('\n8. Navigating to project page...');
      await page.goto(`${PROD_URL}/projects/${projectSlug}`);
      await page.waitForTimeout(3000);

      await page.screenshot({ path: '/tmp/cloudify-real-project.png', fullPage: true });
      console.log('   📸 Screenshot saved to /tmp/cloudify-real-project.png');
    }

    console.log('\n✅ Done!');
    console.log(`   Project URL: ${PROD_URL}/projects/${projectSlug}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: '/tmp/cloudify-error.png', fullPage: true });
    console.log('   📸 Error screenshot saved to /tmp/cloudify-error.png');
  } finally {
    await browser.close();
  }
}

main();
