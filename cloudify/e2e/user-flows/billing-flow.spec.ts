import { test, expect } from '@playwright/test';
import {
  registerUser,
  loginUser,
  logoutUser,
  generateUniqueUser,
} from '../helpers/auth-helper';

/**
 * BILLING FLOW TESTS
 *
 * End-to-end tests for the billing and subscription system:
 * - Get current plan (subscription details)
 * - Get usage stats
 * - Get invoice history
 *
 * Note: These tests verify the API responses for a free-tier user.
 * Stripe integration tests (checkout, portal, cancel) are not covered
 * here as they require real Stripe credentials and webhook flows.
 */

test.describe('Billing Flow', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
  });

  test.beforeEach(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
  });

  test('Get current plan returns free plan info', async ({ request }) => {
    const response = await request.get('/api/billing');

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify subscription info exists
    expect(data.subscription).toBeDefined();
    expect(data.subscription.plan).toBe('free');
    expect(data.subscription.planName).toBeTruthy();
    expect(data.subscription.priceMonthly).toBeDefined();

    // Free plan should have $0 pricing
    expect(data.subscription.priceMonthly).toBe(0);

    // Verify usage info exists
    expect(data.usage).toBeDefined();
    expect(data.limits).toBeDefined();
    expect(data.percentages).toBeDefined();
    expect(data.exceeded).toBeDefined();
  });

  test('Get current plan includes plan details and limits', async ({ request }) => {
    const response = await request.get('/api/billing');
    const data = await response.json();

    // Verify plan config fields
    expect(data.subscription.planDescription).toBeTruthy();
    expect(typeof data.subscription.priceYearly).toBe('number');

    // Verify limits are present (they define what the free plan allows)
    expect(typeof data.limits).toBe('object');
  });

  test('Get usage returns usage stats', async ({ request }) => {
    const response = await request.get('/api/billing/usage');

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify summary usage info
    expect(data.summary).toBeDefined();
    expect(data.limits).toBeDefined();
    expect(data.percentages).toBeDefined();
    expect(data.exceeded).toBeDefined();

    // Verify overage charges info
    expect(data.overageCharges).toBeDefined();
    expect(typeof data.overageCharges.total).toBe('number');

    // New user should have no overages
    expect(data.overageCharges.total).toBe(0);

    // Verify billing period
    expect(data.billingPeriod).toBeDefined();
    expect(data.billingPeriod.start).toBeTruthy();
    expect(data.billingPeriod.end).toBeTruthy();

    // Verify usage by project is an array (may be empty for new user)
    expect(Array.isArray(data.usageByProject)).toBe(true);
  });

  test('Get usage with type filter returns daily breakdown', async ({ request }) => {
    const response = await request.get('/api/billing/usage?type=build_minutes');

    expect(response.status()).toBe(200);
    const data = await response.json();

    // When a type is specified, dailyBreakdown should be returned
    expect(data.dailyBreakdown).toBeDefined();
    expect(Array.isArray(data.dailyBreakdown)).toBe(true);
  });

  test('Get usage with days parameter works', async ({ request }) => {
    const response = await request.get('/api/billing/usage?days=7');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.summary).toBeDefined();
  });

  test('Get invoices returns list (possibly empty for free plan)', async ({ request }) => {
    const response = await request.get('/api/billing/invoices');

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify response structure
    expect(data.invoices).toBeDefined();
    expect(Array.isArray(data.invoices)).toBe(true);

    // For a free-plan user with no Stripe customer, invoices should be empty
    // The upcoming invoice may be null
    expect(data).toHaveProperty('upcoming');
  });

  test('Get invoices with limit parameter works', async ({ request }) => {
    const response = await request.get('/api/billing/invoices?limit=5');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.invoices)).toBe(true);
  });

  test('Get billing without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/billing');

    expect(response.status()).toBe(401);
  });

  test('Get usage without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/billing/usage');

    expect(response.status()).toBe(401);
  });

  test('Get invoices without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/billing/invoices');

    expect(response.status()).toBe(401);
  });
});
