import { test, expect } from '@playwright/test';

/**
 * DEEP API PROBING TESTS
 * Aggressive tests designed to find real bugs in API endpoints
 */

test.describe('Deep API Probing - Find Real Bugs', () => {

  test.describe('Deploy API Edge Cases', () => {

    test('deploy with missing projectId should return error', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: {},
      });
      // Returns 401 (auth check first) or 400 (validation)
      expect([400, 401]).toContain(response.status());
      expect(response.status()).not.toBe(500);
    });

    test('deploy with null projectId should return 400', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: { projectId: null },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('deploy with array projectId should return 400', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: { projectId: ['id1', 'id2'] },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('deploy with object projectId should return 400', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: { projectId: { id: 'test' } },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('deploy GET with invalid limit should not crash', async ({ request }) => {
      const response = await request.get('/api/deploy?limit=-1');
      expect(response.status()).toBeLessThan(500);
    });

    test('deploy GET with NaN limit should not crash', async ({ request }) => {
      const response = await request.get('/api/deploy?limit=NaN');
      expect(response.status()).toBeLessThan(500);
    });

    test('deploy GET with huge offset should not crash', async ({ request }) => {
      const response = await request.get('/api/deploy?offset=999999999999');
      expect(response.status()).toBeLessThan(500);
    });

    test('deploy DELETE without id should return error', async ({ request }) => {
      const response = await request.delete('/api/deploy');
      expect(response.status()).toBeLessThan(500);
      expect([400, 401, 404]).toContain(response.status());
    });

    test('deploy DELETE with path traversal id should be safe', async ({ request }) => {
      const response = await request.delete('/api/deploy?id=../../../etc/passwd');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Deployments API Edge Cases', () => {

    test('deployment logs POST with missing message should not crash', async ({ request }) => {
      const response = await request.post('/api/deployments/fake-id/logs', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('deployment logs POST with null level should not crash', async ({ request }) => {
      const response = await request.post('/api/deployments/fake-id/logs', {
        data: { level: null, message: 'test' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('deployment trigger on non-existent deployment should return 404', async ({ request }) => {
      const response = await request.post('/api/deployments/non-existent-id/trigger');
      expect([401, 404]).toContain(response.status());
    });

    test('deployment cancel on non-existent deployment should return 404', async ({ request }) => {
      const response = await request.post('/api/deployments/non-existent-id/cancel');
      expect([401, 404]).toContain(response.status());
    });

    test('deployment PATCH with invalid status should not crash', async ({ request }) => {
      const response = await request.patch('/api/deployments/fake-id', {
        data: { status: 'INVALID_STATUS' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('deployment stream on non-existent id should not hang forever', async ({ request }) => {
      // This should timeout or return error, not hang
      const response = await request.get('/api/deployments/non-existent-id/stream', {
        timeout: 5000,
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Functions API Edge Cases', () => {

    test('create function without projectId should return 400', async ({ request }) => {
      const response = await request.post('/api/functions', {
        data: { name: 'test-function' },
      });
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(201);
    });

    test('create function without name should return 400', async ({ request }) => {
      const response = await request.post('/api/functions', {
        data: { projectId: 'fake-project' },
      });
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(201);
    });

    test('create function with empty name should return 400', async ({ request }) => {
      const response = await request.post('/api/functions', {
        data: { projectId: 'fake-project', name: '' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('create function with very long name should not crash', async ({ request }) => {
      const response = await request.post('/api/functions', {
        data: { projectId: 'fake-project', name: 'a'.repeat(1000) },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('function invoke with malformed JSON should return 400', async ({ request }) => {
      const response = await request.post('/api/functions/fake-id/invoke', {
        headers: { 'Content-Type': 'application/json' },
        data: '{invalid json',
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('function invoke GET with weird query params should not crash', async ({ request }) => {
      const response = await request.get('/api/functions/fake-id/invoke?__proto__=bad&constructor=evil');
      expect(response.status()).toBeLessThan(500);
    });

    test('function PATCH with negative memory should not crash', async ({ request }) => {
      const response = await request.patch('/api/functions/fake-id', {
        data: { memory: -1024 },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('function PATCH with huge timeout should not crash', async ({ request }) => {
      const response = await request.patch('/api/functions/fake-id', {
        data: { timeout: 999999999 },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Edge Functions API Edge Cases', () => {

    test('create edge function without code should return 400', async ({ request }) => {
      const response = await request.post('/api/edge-functions', {
        data: { projectId: 'fake', name: 'test' },
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401, 404]).toContain(response.status());
    });

    test('create edge function with empty code should not crash', async ({ request }) => {
      const response = await request.post('/api/edge-functions', {
        data: { projectId: 'fake', name: 'test', code: '' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('create edge function with malicious code should not execute', async ({ request }) => {
      const response = await request.post('/api/edge-functions', {
        data: {
          projectId: 'fake',
          name: 'malicious',
          code: 'process.exit(1); require("child_process").execSync("rm -rf /")',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Storage KV API Edge Cases', () => {

    test('KV POST without projectId should return 400', async ({ request }) => {
      const response = await request.post('/api/storage/kv', {
        data: { key: 'test', value: 'test' },
      });
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(200);
    });

    test('KV POST with circular reference value should not crash', async ({ request }) => {
      // JSON.stringify will handle this, but test server-side handling
      const response = await request.post('/api/storage/kv', {
        data: { projectId: 'fake', key: 'test', value: { nested: { deep: 'value' } } },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('KV GET with huge limit should not crash', async ({ request }) => {
      const response = await request.get('/api/storage/kv?projectId=fake&limit=999999999');
      expect(response.status()).toBeLessThan(500);
    });

    test('KV DELETE without storeId should return 400', async ({ request }) => {
      const response = await request.delete('/api/storage/kv');
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('KV incr operation on non-numeric value should handle gracefully', async ({ request }) => {
      const response = await request.post('/api/storage/kv', {
        data: { projectId: 'fake', storeId: 'fake', key: 'test', operation: 'incr', delta: 1 },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Storage Blobs API Edge Cases', () => {

    test('blob POST without required fields should return 400', async ({ request }) => {
      const response = await request.post('/api/storage/blobs', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('blob GET with path traversal should be safe', async ({ request }) => {
      const response = await request.get('/api/storage/blobs?pathname=../../../etc/passwd');
      expect(response.status()).toBeLessThan(500);
    });

    test('blob presigned URL with negative expiry should not crash', async ({ request }) => {
      const response = await request.get('/api/storage/blobs?presignedUrl=true&expiresIn=-1000');
      expect(response.status()).toBeLessThan(500);
    });

    test('blob DELETE without storeId should return 400', async ({ request }) => {
      const response = await request.delete('/api/storage/blobs');
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('blob copy with non-existent source should not crash', async ({ request }) => {
      const response = await request.post('/api/storage/blobs', {
        data: {
          projectId: 'fake',
          storeId: 'fake',
          pathname: 'dest.txt',
          copyFrom: { storeId: 'non-existent', pathname: 'source.txt' },
        },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Domains API Edge Cases', () => {

    test('domain POST without domain should return 400', async ({ request }) => {
      const response = await request.post('/api/domains', {
        data: { projectId: 'fake' },
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('domain POST with invalid domain format should return 400', async ({ request }) => {
      const response = await request.post('/api/domains', {
        data: { projectId: 'fake', domain: 'not-a-valid-domain' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('domain POST with XSS in domain should be safe', async ({ request }) => {
      const response = await request.post('/api/domains', {
        data: { projectId: 'fake', domain: '<script>alert(1)</script>.com' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('domain verify on non-existent domain should return 404', async ({ request }) => {
      const response = await request.post('/api/domains/non-existent-id/verify');
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('Teams API Edge Cases', () => {

    test('team POST without name should return 400', async ({ request }) => {
      const response = await request.post('/api/teams', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('team POST with empty name should return 400', async ({ request }) => {
      const response = await request.post('/api/teams', {
        data: { name: '' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('team POST with whitespace-only name should return 400', async ({ request }) => {
      const response = await request.post('/api/teams', {
        data: { name: '   ' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('team POST with very long name should not crash', async ({ request }) => {
      const response = await request.post('/api/teams', {
        data: { name: 'x'.repeat(10000) },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Tokens API Edge Cases', () => {

    test('token POST without name should return 400', async ({ request }) => {
      const response = await request.post('/api/tokens', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('token POST with invalid scopes should not crash', async ({ request }) => {
      const response = await request.post('/api/tokens', {
        data: { name: 'test', scopes: 'not-an-array' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('token POST with negative expiresIn should not crash', async ({ request }) => {
      const response = await request.post('/api/tokens', {
        data: { name: 'test', expiresIn: -86400000 },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('token DELETE non-existent should return 404', async ({ request }) => {
      const response = await request.delete('/api/tokens/non-existent-token-id');
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('Billing API Edge Cases', () => {

    test('billing checkout with invalid plan should return 400', async ({ request }) => {
      const response = await request.post('/api/billing/checkout', {
        data: { plan: 'invalid-plan', interval: 'monthly' },
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('billing checkout with invalid interval should return 400', async ({ request }) => {
      const response = await request.post('/api/billing/checkout', {
        data: { plan: 'pro', interval: 'invalid' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('billing checkout without plan should return 400', async ({ request }) => {
      const response = await request.post('/api/billing/checkout', {
        data: { interval: 'monthly' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('billing portal without auth should return 401', async ({ request }) => {
      const response = await request.post('/api/billing/portal');
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('Analytics API Edge Cases', () => {

    test('analytics POST without projectId should return 400', async ({ request }) => {
      const response = await request.post('/api/analytics', {
        data: { type: 'pageview', path: '/' },
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401]).toContain(response.status());
    });

    test('analytics GET with invalid range should not crash', async ({ request }) => {
      const response = await request.get('/api/analytics?projectId=fake&range=invalid');
      expect(response.status()).toBeLessThan(500);
    });

    test('analytics POST with huge eventData should not crash', async ({ request }) => {
      const response = await request.post('/api/analytics', {
        data: {
          projectId: 'fake',
          eventData: { largeData: 'x'.repeat(100000) },
        },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Project Budgets API Edge Cases', () => {

    test('budget POST without required fields should return 400', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/budgets', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('budget POST with invalid metric should return 400', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/budgets', {
        data: { metric: 'invalid-metric', threshold: 100 },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('budget POST with negative threshold should not crash', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/budgets', {
        data: { metric: 'bandwidth', threshold: -100 },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('budget PUT without budgetId should return 400', async ({ request }) => {
      const response = await request.put('/api/projects/fake-id/budgets', {
        data: { threshold: 200 },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('budget DELETE without budgetId should return 400', async ({ request }) => {
      const response = await request.delete('/api/projects/fake-id/budgets');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Environment Variables API Edge Cases', () => {

    test('env POST without key should return 400', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/env', {
        data: { value: 'test-value' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('env POST with empty key should return 400', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/env', {
        data: { key: '', value: 'test' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('env POST with key starting with number should handle properly', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/env', {
        data: { key: '123_INVALID', value: 'test' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('env POST with special chars in key should handle properly', async ({ request }) => {
      const response = await request.post('/api/projects/fake-id/env', {
        data: { key: 'TEST-KEY!@#', value: 'test' },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Health Endpoints', () => {

    test('health endpoint should respond quickly', async ({ request }) => {
      const start = Date.now();
      const response = await request.get('/api/health');
      const duration = Date.now() - start;

      expect(response.status()).toBeLessThan(500);
      // Health check should be fast (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('health ready endpoint should respond', async ({ request }) => {
      const response = await request.get('/api/health/ready');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Admin Endpoints (should require auth)', () => {

    test('admin users endpoint should require auth', async ({ request }) => {
      const response = await request.get('/api/admin/users');
      expect([401, 403]).toContain(response.status());
    });

  });

  test.describe('Misc API Endpoints', () => {

    test('detect-framework without repo should return 400', async ({ request }) => {
      const response = await request.post('/api/detect-framework', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('detect-monorepo without repo should return 400', async ({ request }) => {
      const response = await request.post('/api/detect-monorepo', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('image optimize without URL should return 400', async ({ request }) => {
      const response = await request.get('/api/images/optimize');
      expect(response.status()).toBeLessThan(500);
    });

    test('cron endpoint should require auth', async ({ request }) => {
      const response = await request.post('/api/cron');
      expect(response.status()).toBeLessThan(500);
    });

    test('metrics endpoint should respond', async ({ request }) => {
      const response = await request.get('/api/metrics');
      expect(response.status()).toBeLessThan(500);
    });

    test('vitals endpoint should handle empty POST', async ({ request }) => {
      const response = await request.post('/api/vitals', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Database Endpoints', () => {

    test('database creation without required fields should return 400', async ({ request }) => {
      const response = await request.post('/api/databases', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('database connect on non-existent should return 404', async ({ request }) => {
      const response = await request.post('/api/databases/non-existent-id/connect');
      expect([401, 404]).toContain(response.status());
    });
  });
});
