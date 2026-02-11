/**
 * Trigger a deployment for the created project
 * Run with: npx tsx scripts/trigger-deployment.ts
 */

import { chromium } from 'playwright';

const PROD_URL = 'https://cloudify.tranthachnguyen.com';
const TEST_EMAIL = 'Wardah34@ytmu.site';
const TEST_PASSWORD = 'GaPw74RmLq59vXy';
const PROJECT_ID = 'cml8kru1m0001y5lw6puf3uha';

async function main() {
  console.log('🚀 Triggering Deployment on Cloudify\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    await page.goto(`${PROD_URL}/login`);
    await page.waitForTimeout(2000);

    const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
    await googleBtn.click();
    await page.waitForTimeout(2000);

    if (page.url().includes('accounts.google.com')) {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.click('#identifierNext, button:has-text("Next")');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('#passwordNext, button:has-text("Next")');
      await page.waitForTimeout(5000);
    }

    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('   ✅ Logged in!');

    // Step 2: Trigger deployment via API
    console.log('\n2. Triggering deployment...');
    const deployResponse = await page.request.post(`${PROD_URL}/api/projects/${PROJECT_ID}/deployments`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        branch: 'main',
        commitSha: 'HEAD',
        commitMsg: 'Manual deployment from Cloudify'
      }
    });

    console.log(`   Response status: ${deployResponse.status()}`);

    if (deployResponse.status() === 200 || deployResponse.status() === 201) {
      const deployment = await deployResponse.json();
      console.log(`   ✅ Deployment triggered!`);
      console.log(`      ID: ${deployment.id}`);
      console.log(`      Status: ${deployment.status}`);

      // Step 3: Monitor deployment status
      console.log('\n3. Monitoring deployment...');
      let status = deployment.status;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (status !== 'READY' && status !== 'ERROR' && status !== 'FAILED' && attempts < maxAttempts) {
        await page.waitForTimeout(5000);
        attempts++;

        const statusResponse = await page.request.get(`${PROD_URL}/api/projects/${PROJECT_ID}/deployments`);
        if (statusResponse.status() === 200) {
          const data = await statusResponse.json();
          if (data.deployments && data.deployments.length > 0) {
            const latestDeployment = data.deployments[0];
            status = latestDeployment.status;
            console.log(`   [${attempts * 5}s] Status: ${status}`);

            if (status === 'READY') {
              console.log(`\n   ✅ Deployment complete!`);
              console.log(`      URL: ${latestDeployment.url || 'N/A'}`);
              break;
            }
          }
        }
      }

      if (status === 'ERROR' || status === 'FAILED') {
        console.log(`\n   ❌ Deployment failed with status: ${status}`);
      } else if (attempts >= maxAttempts) {
        console.log(`\n   ⚠️ Timeout - deployment still in progress`);
      }
    } else {
      const error = await deployResponse.json();
      console.log(`   ❌ Error: ${JSON.stringify(error)}`);
    }

    // Step 4: Navigate to project page
    console.log('\n4. Taking screenshot of project...');
    await page.goto(`${PROD_URL}/projects/my-nextjs-app`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/cloudify-deployment.png', fullPage: true });
    console.log('   📸 Screenshot saved to /tmp/cloudify-deployment.png');

  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: '/tmp/cloudify-deploy-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

main();
