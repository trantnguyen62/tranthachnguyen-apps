import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  signupTestUser,
  loginTestUser,
  logoutTestUser,
  createTestProject,
  deleteTestProject,
  getTestProjects,
  generateProjectName,
  cleanupTestProjects,
} from '../helpers/test-utils';

/**
 * COMPLETE USER JOURNEY TESTS
 *
 * These tests simulate real user flows from signup to project management.
 * Each test creates its own data and cleans up after itself.
 */

test.describe('Complete User Journey - Signup to Project Management', () => {
  let testUser: { email: string; password: string; name: string };
  const createdProjectIds: string[] = [];

  test.beforeAll(async () => {
    // Generate unique test user for this test suite
    testUser = generateTestUser();
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all projects created during tests
    if (createdProjectIds.length > 0) {
      await cleanupTestProjects(request, createdProjectIds);
    }

    // Logout
    await logoutTestUser(request);
  });

  test('1. User can sign up via API', async ({ request }) => {
    const response = await signupTestUser(request, testUser);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testUser.email.toLowerCase());
  });

  test('2. User can login via API after signup', async ({ request }) => {
    const response = await loginTestUser(request, testUser.email, testUser.password);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('3. Authenticated user can access dashboard', async ({ page, request }) => {
    // First login via API to get session
    await loginTestUser(request, testUser.email, testUser.password);

    // Now access dashboard
    await page.goto('/dashboard');

    // Should not redirect to login
    await page.waitForTimeout(1000);
    // May or may not have projects - just check page loads
    expect(page.url()).toContain('dashboard');
  });

  test('4. User can create a new project via API', async ({ request }) => {
    // Ensure we're logged in
    await loginTestUser(request, testUser.email, testUser.password);

    const projectName = generateProjectName();
    const response = await createTestProject(request, {
      name: projectName,
      repoUrl: 'https://github.com/vercel/next.js',
      framework: 'nextjs',
    });

    expect(response.status()).toBe(201);
    const project = await response.json();
    expect(project.name).toBe(projectName);
    expect(project.id).toBeTruthy();

    // Store for cleanup
    createdProjectIds.push(project.id);
  });

  test('5. User can list their projects via API', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const response = await getTestProjects(request);

    expect(response.status()).toBe(200);
    const projects = await response.json();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  test('6. User can view project details via API', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    // Get the project we created
    const projectId = createdProjectIds[0];
    expect(projectId).toBeTruthy();

    const response = await request.get(`/api/projects/${projectId}`);

    expect(response.status()).toBe(200);
    const project = await response.json();
    expect(project.id).toBe(projectId);
  });

  test('7. User can update project settings via API', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    const projectId = createdProjectIds[0];
    const newBuildCmd = 'npm run build:production';

    const response = await request.patch(`/api/projects/${projectId}`, {
      data: { buildCmd: newBuildCmd },
    });

    expect(response.status()).toBe(200);
    const project = await response.json();
    expect(project.buildCmd).toBe(newBuildCmd);
  });

  test('8. User can delete a project via API', async ({ request }) => {
    await loginTestUser(request, testUser.email, testUser.password);

    // Create a project specifically to delete
    const projectName = generateProjectName();
    const createResponse = await createTestProject(request, {
      name: projectName,
    });
    const project = await createResponse.json();

    // Now delete it
    const deleteResponse = await deleteTestProject(request, project.id);

    expect(deleteResponse.status()).toBe(200);

    // Verify it's deleted
    const getResponse = await request.get(`/api/projects/${project.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('9. User can logout via API', async ({ request }) => {
    const response = await logoutTestUser(request);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('10. After logout, protected endpoints return 401', async ({ request }) => {
    // Make sure we're logged out
    await logoutTestUser(request);

    // Try to access projects
    const response = await request.get('/api/projects');

    expect(response.status()).toBe(401);
  });
});
