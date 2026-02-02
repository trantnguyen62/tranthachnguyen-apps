import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  signupTestUser,
  loginTestUser,
  createTestProject,
  deleteTestProject,
  generateProjectName,
} from '../helpers/test-utils';

/**
 * DATA INTEGRITY & RACE CONDITION TESTS
 * Tests designed to find data corruption and race condition bugs
 */

test.describe('Data Integrity Tests - Find Real Bugs', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async () => {
    testUser = generateTestUser();
  });

  test.describe('Concurrent Request Race Conditions', () => {

    test('should handle concurrent login attempts', async ({ request }) => {
      const timestamp = Date.now();
      const user = {
        email: `concurrent-login-${timestamp}@example.com`,
        password: 'TestPass123!',
        name: 'Concurrent Test',
      };

      // First signup
      await signupTestUser(request, user);

      // Try multiple concurrent logins
      const loginPromises = Array(5).fill(null).map(() =>
        loginTestUser(request, user.email, user.password)
      );

      const responses = await Promise.all(loginPromises);

      // All should succeed or fail gracefully (no 500s)
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }

      // At least one should succeed
      const successCount = responses.filter(r => r.status() === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle concurrent signup with same email', async ({ request }) => {
      const timestamp = Date.now();
      const email = `race-signup-${timestamp}@example.com`;

      // Try multiple concurrent signups with same email
      const signupPromises = Array(5).fill(null).map((_, i) =>
        request.post('/api/auth', {
          data: {
            action: 'signup',
            email,
            password: 'TestPass123!',
            name: `User ${i}`,
          },
        })
      );

      const responses = await Promise.all(signupPromises);

      // Only ONE should succeed (201), others should fail (400/409)
      const successCount = responses.filter(r => r.status() === 200 || r.status() === 201).length;
      expect(successCount).toBeLessThanOrEqual(1);

      // None should be 500
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should handle concurrent project creation', async ({ request }) => {
      // Login first
      await signupTestUser(request, testUser);
      await loginTestUser(request, testUser.email, testUser.password);

      // Try multiple concurrent project creations
      const projectPromises = Array(5).fill(null).map((_, i) =>
        createTestProject(request, {
          name: `Concurrent Project ${i} - ${Date.now()}`,
          repoUrl: 'https://github.com/test/repo',
        })
      );

      const responses = await Promise.all(projectPromises);

      // None should be 500
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should handle concurrent updates to same project', async ({ request }) => {
      // Create a project first
      await signupTestUser(request, testUser);
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Update Race Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();

      // Try concurrent updates
      const updatePromises = Array(5).fill(null).map((_, i) =>
        request.patch(`/api/projects/${project.id}`, {
          data: { buildCmd: `npm run build-${i}` },
        })
      );

      const responses = await Promise.all(updatePromises);

      // None should be 500
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }

      // Cleanup
      await deleteTestProject(request, project.id);
    });

    test('should handle concurrent delete and update', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Delete Race Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();

      // Try delete and update at the same time
      const [deleteResponse, updateResponse] = await Promise.all([
        request.delete(`/api/projects/${project.id}`),
        request.patch(`/api/projects/${project.id}`, {
          data: { buildCmd: 'npm run build' },
        }),
      ]);

      // Neither should be 500
      expect(deleteResponse.status()).toBeLessThan(500);
      expect(updateResponse.status()).toBeLessThan(500);
    });
  });

  test.describe('Data Consistency Tests', () => {

    test('should not allow duplicate project names for same user', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const projectName = `Duplicate Test - ${Date.now()}`;

      // Create first project
      const first = await createTestProject(request, { name: projectName });

      // Try to create second with same name
      const second = await createTestProject(request, { name: projectName });

      // Second should fail or create with different slug
      if (first.status() === 201) {
        // Either reject or create with modified name
        expect(second.status()).toBeLessThan(500);
      }

      // Cleanup
      if (first.status() === 201) {
        const firstProject = await first.json();
        await deleteTestProject(request, firstProject.id);
      }
      if (second.status() === 201) {
        const secondProject = await second.json();
        await deleteTestProject(request, secondProject.id);
      }
    });

    test('should maintain referential integrity on delete', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      // Create project
      const createResponse = await createTestProject(request, {
        name: `Integrity Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();

      // Delete the project
      await deleteTestProject(request, project.id);

      // Try to access the deleted project
      const getResponse = await request.get(`/api/projects/${project.id}`);

      // Should return 404, not 500 or stale data
      expect(getResponse.status()).toBe(404);
    });

    test('should handle project with missing required fields', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      // Create project with minimal data
      const response = await request.post('/api/projects', {
        data: {
          // Missing name
        },
      });

      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(201);
    });

    test('should validate foreign key constraints', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      // Try to create deployment for non-existent project
      const response = await request.post('/api/deploy', {
        data: {
          projectId: 'non-existent-project-id-12345',
        },
      });

      // Should fail with 400/404, not 500
      expect(response.status()).toBeLessThan(500);
      expect([400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Session State Consistency', () => {

    test('should invalidate session on logout', async ({ request }) => {
      const timestamp = Date.now();
      const user = {
        email: `session-test-${timestamp}@example.com`,
        password: 'TestPass123!',
        name: 'Session Test',
      };

      // Signup and login
      await signupTestUser(request, user);
      const loginResponse = await loginTestUser(request, user.email, user.password);
      expect(loginResponse.status()).toBe(200);

      // Create project while logged in
      const createBefore = await createTestProject(request, {
        name: `Before Logout - ${Date.now()}`,
      });
      expect(createBefore.status()).toBe(201);

      // Logout
      await request.post('/api/auth', {
        data: { action: 'logout' },
      });

      // Try to create project after logout
      const createAfter = await createTestProject(request, {
        name: `After Logout - ${Date.now()}`,
      });

      // Should fail with 401
      expect(createAfter.status()).toBe(401);
    });

    test('should maintain session across requests', async ({ request }) => {
      const timestamp = Date.now();
      const user = {
        email: `persist-session-${timestamp}@example.com`,
        password: 'TestPass123!',
        name: 'Persist Session',
      };

      await signupTestUser(request, user);
      await loginTestUser(request, user.email, user.password);

      // Make multiple requests in sequence
      for (let i = 0; i < 3; i++) {
        const response = await request.get('/api/projects');
        // All should succeed (session maintained)
        expect(response.status()).toBe(200);
      }
    });

    test('should handle expired session token', async ({ request }) => {
      // Try to access with invalid/expired token
      const response = await request.get('/api/projects', {
        headers: {
          'Authorization': 'Bearer expired-invalid-token-12345',
        },
      });

      // Should return 401, not 500
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('Pagination and Listing Edge Cases', () => {

    test('should handle page beyond available data', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/projects?page=99999');

      expect(response.status()).toBeLessThan(500);

      if (response.status() === 200) {
        const data = await response.json();
        // Should return empty array or proper pagination metadata
        expect(Array.isArray(data) || data.projects).toBeTruthy();
      }
    });

    test('should handle negative page number', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/projects?page=-1');

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle zero page number', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/projects?page=0');

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle very large limit', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/projects?limit=999999');

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle search with special characters', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/projects?search=%27%22%3C%3E');

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Webhook Data Integrity', () => {

    test('should reject webhook with invalid signature', async ({ request }) => {
      const response = await request.post('/api/webhooks/github', {
        headers: {
          'X-Hub-Signature-256': 'sha256=invalid',
          'X-GitHub-Event': 'push',
        },
        data: {
          ref: 'refs/heads/main',
          repository: { full_name: 'test/repo' },
        },
      });

      // Should reject with 401/403, not process
      expect(response.status()).toBeLessThan(500);
      expect([401, 403, 400]).toContain(response.status());
    });

    test('should reject webhook with missing signature', async ({ request }) => {
      const response = await request.post('/api/webhooks/github', {
        headers: {
          'X-GitHub-Event': 'push',
        },
        data: {
          ref: 'refs/heads/main',
        },
      });

      expect(response.status()).toBeLessThan(500);
      expect([401, 403, 400]).toContain(response.status());
    });

    test('should handle malformed webhook payload', async ({ request }) => {
      const response = await request.post('/api/webhooks/github', {
        headers: {
          'X-Hub-Signature-256': 'sha256=test',
          'X-GitHub-Event': 'push',
        },
        data: 'not json {{{{',
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle Stripe webhook with invalid signature', async ({ request }) => {
      const response = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'invalid-signature',
        },
        data: {
          type: 'checkout.session.completed',
        },
      });

      expect(response.status()).toBeLessThan(500);
      expect([401, 403, 400]).toContain(response.status());
    });
  });

  test.describe('File Upload Data Integrity', () => {

    test('should handle missing file in upload', async ({ request }) => {
      const response = await request.post('/api/storage/blobs', {
        multipart: {},
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle empty file upload', async ({ request }) => {
      const response = await request.post('/api/storage/blobs', {
        multipart: {
          file: {
            name: 'empty.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from(''),
          },
        },
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle file with dangerous extension', async ({ request }) => {
      const response = await request.post('/api/storage/blobs', {
        multipart: {
          file: {
            name: 'malicious.exe',
            mimeType: 'application/x-msdownload',
            buffer: Buffer.from('MZ'),
          },
        },
      });

      // Should either reject or handle safely
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Environment Variable Integrity', () => {

    test('should handle env var with very long value', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Env Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();

      // Try to set very long env var
      const response = await request.post(`/api/projects/${project.id}/env`, {
        data: {
          key: 'LONG_VALUE',
          value: 'x'.repeat(100000),
        },
      });

      expect(response.status()).toBeLessThan(500);

      // Cleanup
      await deleteTestProject(request, project.id);
    });

    test('should reject env var with invalid key', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Env Key Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();

      // Try to set env var with invalid key
      const response = await request.post(`/api/projects/${project.id}/env`, {
        data: {
          key: '1INVALID-KEY',  // Can't start with number
          value: 'test',
        },
      });

      expect(response.status()).toBeLessThan(500);
      // Should reject invalid key
      expect([400, 422]).toContain(response.status());

      // Cleanup
      await deleteTestProject(request, project.id);
    });

    test('should handle env var with special characters in value', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Env Special Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();

      // Set env var with special characters
      const response = await request.post(`/api/projects/${project.id}/env`, {
        data: {
          key: 'SPECIAL_VALUE',
          value: 'test"value\'with<special>&characters\nand\nnewlines',
        },
      });

      expect(response.status()).toBeLessThan(500);

      // Cleanup
      await deleteTestProject(request, project.id);
    });
  });
});
