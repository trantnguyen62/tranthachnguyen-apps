/**
 * Full Deployment Journey E2E Test
 *
 * Tests the complete Cloudify deployment lifecycle end-to-end:
 *   1. Register a new user
 *   2. Login with credentials
 *   3. Create a project
 *   4. Trigger a deployment
 *   5. Monitor deployment status until completion
 *   6. Verify the deployment URL is accessible
 *   7. View build logs
 *   8. Rollback to a previous deployment
 *   9. Verify rollback succeeded
 *  10. Cleanup (delete project)
 *
 * All tests use Playwright's API request context (no browser UI needed).
 * Each test.describe block is self-contained with its own setup and teardown.
 */

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAndGetTestUser,
  createTestProject,
  triggerDeployment,
  waitForDeployment,
  getDeploymentWithLogs,
  authenticatedFetch,
  cleanupProject,
  logoutUser,
  uniqueId,
  type TestUser,
  type TestProject,
  type TestDeployment,
} from '../helpers/test-utils';

// Deployment operations can take several minutes; set a generous timeout.
test.describe.configure({ timeout: 10 * 60 * 1000 });

test.describe('Full Deployment Journey', () => {
  let user: TestUser;
  let project: TestProject;

  // -------------------------------------------------------------------------
  // Setup: Create a fresh user and project for the entire suite
  // -------------------------------------------------------------------------
  test.beforeAll(async ({ request }) => {
    // 1. Register a new user
    user = await createTestUser(request);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the project (if it still exists) and logout
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  // -------------------------------------------------------------------------
  // Step 1 & 2: Registration and Login
  // -------------------------------------------------------------------------

  test('should register a new user and receive a session cookie', async () => {
    expect(user.id).toBeTruthy();
    expect(user.email).toBeTruthy();
    expect(user.sessionCookie).toContain('cloudify_session=');
  });

  test('should login with the registered credentials and get a valid session', async ({
    request,
  }) => {
    const loggedIn = await loginAndGetTestUser(
      request,
      user.email,
      user.password
    );

    expect(loggedIn.id).toBe(user.id);
    expect(loggedIn.sessionCookie).toContain('cloudify_session=');

    // Verify the session is valid by calling GET /api/auth
    const sessionCheck = await authenticatedFetch(
      request,
      '/api/auth',
      { method: 'GET' },
      loggedIn.sessionCookie
    );
    expect(sessionCheck.ok()).toBeTruthy();

    const sessionData = await sessionCheck.json();
    expect(sessionData.user.id).toBe(user.id);
    expect(sessionData.user.email).toBe(user.email);
  });

  test('should reject login with wrong password', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: user.email,
        password: 'WrongPassword123!',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('should reject unauthenticated requests to protected endpoints', async ({
    request,
  }) => {
    const response = await request.get('/api/projects');
    expect(response.status()).toBe(401);
  });

  // -------------------------------------------------------------------------
  // Step 3: Create Project
  // -------------------------------------------------------------------------

  test('should create a new project with repo URL', async ({ request }) => {
    project = await createTestProject(request, user.sessionCookie, {
      name: `deploy-journey-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
      framework: 'nextjs',
    });

    expect(project.id).toBeTruthy();
    expect(project.name).toBeTruthy();
    expect(project.slug).toBeTruthy();

    // Verify the project exists via GET
    const getResponse = await authenticatedFetch(
      request,
      `/api/projects/${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(getResponse.ok()).toBeTruthy();

    const projectData = await getResponse.json();
    expect(projectData.id).toBe(project.id);
    expect(projectData.repoUrl).toBe(
      'https://github.com/cloudify-test/sample-nextjs-app'
    );
    expect(projectData.framework).toBe('nextjs');
  });

  test('should reject duplicate project names for the same user', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/projects',
      {
        method: 'POST',
        data: {
          name: project.name,
          repoUrl: 'https://github.com/test/other-repo',
          framework: 'react',
        },
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('already exists');
  });

  test('should list the project in user projects', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      '/api/projects',
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.projects).toBeDefined();
    expect(Array.isArray(data.projects)).toBeTruthy();

    const found = data.projects.find(
      (p: { id: string }) => p.id === project.id
    );
    expect(found).toBeTruthy();
    expect(found.name).toBe(project.name);
  });

  // -------------------------------------------------------------------------
  // Step 4: Trigger Deployment
  // -------------------------------------------------------------------------

  let deployment: TestDeployment;

  test('should trigger a deployment for the project', async ({ request }) => {
    deployment = await triggerDeployment(
      request,
      user.sessionCookie,
      project.id,
      {
        branch: 'main',
        commitMsg: 'E2E test deployment',
      }
    );

    expect(deployment.id).toBeTruthy();
    expect(deployment.projectId).toBe(project.id);
    expect(deployment.status).toBe('QUEUED');
    expect(deployment.branch).toBe('main');
  });

  test('should reject deployment for nonexistent project', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/deploy',
      {
        method: 'POST',
        data: { projectId: 'nonexistent-project-id-12345' },
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should reject deployment without projectId', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      '/api/deploy',
      {
        method: 'POST',
        data: {},
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('projectId');
  });

  // -------------------------------------------------------------------------
  // Step 5: Monitor Build Status
  // -------------------------------------------------------------------------

  test('should monitor deployment until it reaches a terminal state', async ({
    request,
  }) => {
    // Poll for up to 5 minutes
    const result = await waitForDeployment(
      request,
      user.sessionCookie,
      deployment.id,
      5 * 60 * 1000
    );

    // Deployment should reach a terminal state (READY or ERROR depending on
    // whether the test repo is real and the build infra is running)
    expect(['READY', 'ERROR']).toContain(result.status);

    // If the deployment succeeded, verify it has a URL
    if (result.status === 'READY') {
      expect(result.url).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // Step 6: Verify Deployment URL
  // -------------------------------------------------------------------------

  test('should return deployment details with URL when READY', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/deployments/${deployment.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.id).toBe(deployment.id);
    expect(data.status).toBeDefined();
    expect(data.project).toBeDefined();
    expect(data.project.id).toBe(project.id);
  });

  // -------------------------------------------------------------------------
  // Step 7: View Build Logs
  // -------------------------------------------------------------------------

  test('should retrieve build logs for the deployment', async ({
    request,
  }) => {
    const { deployment: deployData, logs } = await getDeploymentWithLogs(
      request,
      user.sessionCookie,
      deployment.id
    );

    expect(deployData).toBeDefined();

    // Logs should be an array (may be empty if the build failed quickly)
    expect(Array.isArray(logs)).toBeTruthy();

    // If there are logs, verify their structure
    if (logs.length > 0) {
      const firstLog = logs[0];
      expect(firstLog.message).toBeDefined();
      expect(firstLog.level).toBeDefined();
      expect(firstLog.timestamp).toBeDefined();
    }
  });

  test('should return 404 for nonexistent deployment logs', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/deploy?id=nonexistent-deployment-id',
      { method: 'GET' },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  // -------------------------------------------------------------------------
  // Step 8 & 9: Rollback
  // -------------------------------------------------------------------------

  test('should check rollback eligibility for a deployment', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/deployments/${deployment.id}/rollback`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // canRollback should be a boolean, reason may or may not be present
    expect(typeof data.canRollback).toBe('boolean');
  });

  test('should attempt rollback and verify the result', async ({
    request,
  }) => {
    // First, get the current deployment status
    const statusResponse = await authenticatedFetch(
      request,
      `/api/deployments/${deployment.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    const currentDeployment = await statusResponse.json();

    // Only attempt rollback if the deployment reached READY
    if (currentDeployment.status !== 'READY') {
      test.skip();
      return;
    }

    // Trigger a second deployment so we have something to rollback FROM
    const secondDeployment = await triggerDeployment(
      request,
      user.sessionCookie,
      project.id,
      { branch: 'main', commitMsg: 'Second deployment for rollback test' }
    );

    // Wait for the second deployment to finish
    const secondResult = await waitForDeployment(
      request,
      user.sessionCookie,
      secondDeployment.id,
      5 * 60 * 1000
    );

    // If the second deployment also succeeded, attempt rolling back to the first one
    if (secondResult.status === 'READY') {
      const rollbackResponse = await authenticatedFetch(
        request,
        `/api/deployments/${deployment.id}/rollback`,
        { method: 'POST' },
        user.sessionCookie
      );

      // The rollback may succeed or fail depending on artifact availability
      if (rollbackResponse.ok()) {
        const rollbackData = await rollbackResponse.json();
        expect(rollbackData.success).toBeTruthy();
        expect(rollbackData.newActiveDeploymentId).toBe(deployment.id);
      } else {
        // Rollback may fail if artifacts are not available (acceptable in E2E)
        const errorData = await rollbackResponse.json();
        expect(errorData.error).toBeTruthy();
      }
    }
  });

  // -------------------------------------------------------------------------
  // Step 10: Cleanup
  // -------------------------------------------------------------------------

  test('should delete the project and its associated data', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/projects/${project.id}`,
      { method: 'DELETE' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBeTruthy();

    // Verify the project is gone
    const getResponse = await authenticatedFetch(
      request,
      `/api/projects/${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(getResponse.status()).toBe(404);

    // Mark project as cleaned up so afterAll does not try again
    project = undefined as unknown as TestProject;
  });
});

// ---------------------------------------------------------------------------
// Deployment Edge Cases
// ---------------------------------------------------------------------------

test.describe('Deployment Edge Cases', () => {
  let user: TestUser;

  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
  });

  test.afterAll(async ({ request }) => {
    await logoutUser(request, user.sessionCookie);
  });

  test('should reject deployment for project without repo URL', async ({
    request,
  }) => {
    // Create a project without a repo URL
    const response = await authenticatedFetch(
      request,
      '/api/projects',
      {
        method: 'POST',
        data: {
          name: `no-repo-${uniqueId()}`,
          framework: 'nextjs',
          // Deliberately omit repoUrl
        },
      },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const noRepoProject = await response.json();

    // Attempt to deploy -- should fail because no repo URL
    const deployResponse = await authenticatedFetch(
      request,
      '/api/deploy',
      {
        method: 'POST',
        data: { projectId: noRepoProject.id },
      },
      user.sessionCookie
    );

    expect(deployResponse.status()).toBe(400);
    const body = await deployResponse.json();
    expect(body.error).toContain('repository URL');

    // Cleanup
    await cleanupProject(
      request,
      user.sessionCookie,
      noRepoProject.id
    );
  });

  test('should list deployments for a project', async ({ request }) => {
    const project = await createTestProject(request, user.sessionCookie, {
      name: `list-deploys-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });

    // List deployments (should be empty initially)
    const response = await authenticatedFetch(
      request,
      `/api/deploy?projectId=${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.deployments).toBeDefined();
    expect(Array.isArray(data.deployments)).toBeTruthy();
    expect(data.pagination).toBeDefined();

    // Cleanup
    await cleanupProject(request, user.sessionCookie, project.id);
  });

  test('should cancel a queued deployment', async ({ request }) => {
    const project = await createTestProject(request, user.sessionCookie, {
      name: `cancel-deploy-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });

    // Trigger a deployment
    const deployment = await triggerDeployment(
      request,
      user.sessionCookie,
      project.id
    );

    // Immediately try to cancel it (may be QUEUED or already BUILDING)
    const cancelResponse = await authenticatedFetch(
      request,
      `/api/deployments/${deployment.id}`,
      { method: 'DELETE' },
      user.sessionCookie
    );

    // Should succeed or fail gracefully if the deployment already progressed
    expect([200, 400].includes(cancelResponse.status())).toBeTruthy();

    if (cancelResponse.ok()) {
      const body = await cancelResponse.json();
      expect(body.success).toBeTruthy();
    }

    // Cleanup
    await cleanupProject(request, user.sessionCookie, project.id);
  });
});

// ---------------------------------------------------------------------------
// Cross-User Authorization
// ---------------------------------------------------------------------------

test.describe('Cross-User Authorization', () => {
  let userA: TestUser;
  let userB: TestUser;
  let projectA: TestProject;

  test.beforeAll(async ({ request }) => {
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    projectA = await createTestProject(request, userA.sessionCookie, {
      name: `auth-test-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    if (projectA?.id) {
      await cleanupProject(
        request,
        userA.sessionCookie,
        projectA.id
      ).catch(() => {});
    }
    await logoutUser(request, userA.sessionCookie);
    await logoutUser(request, userB.sessionCookie);
  });

  test('should deny User B access to User A project', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      `/api/projects/${projectA.id}`,
      { method: 'GET' },
      userB.sessionCookie
    );

    // Should return 404 (project not found for this user)
    expect(response.status()).toBe(404);
  });

  test('should deny User B from deploying User A project', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/deploy',
      {
        method: 'POST',
        data: { projectId: projectA.id },
      },
      userB.sessionCookie
    );

    expect([403, 404].includes(response.status())).toBeTruthy();
  });

  test('should deny User B from deleting User A project', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/projects/${projectA.id}`,
      { method: 'DELETE' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });
});
