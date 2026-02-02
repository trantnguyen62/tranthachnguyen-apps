import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  signupTestUser,
  loginTestUser,
  logoutTestUser,
  createTestProject,
  deleteTestProject,
  cleanupTestProjects,
  generateProjectName,
} from '../helpers/test-utils';

/**
 * PROJECT MANAGEMENT FLOW TESTS
 *
 * These tests cover the complete project lifecycle:
 * - Creating projects
 * - Viewing project details
 * - Updating project settings
 * - Managing environment variables
 * - Deleting projects
 *
 * All tests create real data and clean up after themselves.
 */

test.describe('Project CRUD Operations', () => {
  let testUser: { email: string; password: string; name: string };
  const createdProjectIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    testUser = generateTestUser();
    await signupTestUser(request, testUser);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup all created projects
    await loginTestUser(request, testUser.email, testUser.password);
    await cleanupTestProjects(request, createdProjectIds);
    await logoutTestUser(request);
  });

  test.beforeEach(async ({ request }) => {
    // Ensure logged in before each test
    await loginTestUser(request, testUser.email, testUser.password);
  });

  test('26. Create project with minimal data', async ({ request }) => {
    const projectName = generateProjectName();

    const response = await request.post('/api/projects', {
      data: { name: projectName },
    });

    expect(response.status()).toBe(201);
    const project = await response.json();

    expect(project.name).toBe(projectName);
    expect(project.id).toBeTruthy();
    expect(project.slug).toBeTruthy();
    expect(project.framework).toBe('nextjs'); // default

    createdProjectIds.push(project.id);
  });

  test('27. Create project with full configuration', async ({ request }) => {
    const projectName = generateProjectName();

    const response = await request.post('/api/projects', {
      data: {
        name: projectName,
        repoUrl: 'https://github.com/facebook/react',
        framework: 'react',
        buildCmd: 'npm run build',
        outputDir: 'build',
        installCmd: 'npm ci',
        rootDir: './',
        nodeVersion: '18',
      },
    });

    expect(response.status()).toBe(201);
    const project = await response.json();

    expect(project.framework).toBe('react');
    expect(project.buildCmd).toBe('npm run build');
    expect(project.outputDir).toBe('build');
    expect(project.nodeVersion).toBe('18');

    createdProjectIds.push(project.id);
  });

  test('28. Cannot create project without name', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: { repoUrl: 'https://github.com/test/repo' },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('name');
  });

  test('29. Cannot create duplicate project names', async ({ request }) => {
    const projectName = generateProjectName();

    // Create first project
    const response1 = await request.post('/api/projects', {
      data: { name: projectName },
    });
    expect(response1.status()).toBe(201);
    const project1 = await response1.json();
    createdProjectIds.push(project1.id);

    // Try to create duplicate
    const response2 = await request.post('/api/projects', {
      data: { name: projectName },
    });
    expect(response2.status()).toBe(400);
  });

  test('30. Get project by ID returns full details', async ({ request }) => {
    // Create a project first
    const projectName = generateProjectName();
    const createResponse = await request.post('/api/projects', {
      data: { name: projectName },
    });
    const project = await createResponse.json();
    createdProjectIds.push(project.id);

    // Get project details
    const getResponse = await request.get(`/api/projects/${project.id}`);

    expect(getResponse.status()).toBe(200);
    const details = await getResponse.json();

    expect(details.id).toBe(project.id);
    expect(details.name).toBe(projectName);
    expect(details.deployments).toBeDefined();
    expect(details.envVariables).toBeDefined();
  });

  test('31. Cannot get other users project', async ({ request }) => {
    // Try to get a non-existent project ID
    const fakeId = 'non-existent-project-id-12345';
    const response = await request.get(`/api/projects/${fakeId}`);

    expect(response.status()).toBe(404);
  });

  test('32. Update project name', async ({ request }) => {
    // Create project
    const originalName = generateProjectName();
    const createResponse = await request.post('/api/projects', {
      data: { name: originalName },
    });
    const project = await createResponse.json();
    createdProjectIds.push(project.id);

    // Update name
    const newName = `${originalName}-Updated`;
    const updateResponse = await request.patch(`/api/projects/${project.id}`, {
      data: { name: newName },
    });

    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.name).toBe(newName);
  });

  test('33. Update project build configuration', async ({ request }) => {
    // Create project
    const createResponse = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const project = await createResponse.json();
    createdProjectIds.push(project.id);

    // Update build config
    const updateResponse = await request.patch(`/api/projects/${project.id}`, {
      data: {
        buildCmd: 'yarn build',
        installCmd: 'yarn install',
        nodeVersion: '20',
      },
    });

    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.buildCmd).toBe('yarn build');
    expect(updated.installCmd).toBe('yarn install');
    expect(updated.nodeVersion).toBe('20');
  });

  test('34. Delete project removes it completely', async ({ request }) => {
    // Create project
    const createResponse = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const project = await createResponse.json();

    // Delete it
    const deleteResponse = await request.delete(`/api/projects/${project.id}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify it's gone
    const getResponse = await request.get(`/api/projects/${project.id}`);
    expect(getResponse.status()).toBe(404);

    // Don't add to cleanup since it's already deleted
  });

  test('35. Cannot delete non-existent project', async ({ request }) => {
    const fakeId = 'fake-project-id-99999';
    const response = await request.delete(`/api/projects/${fakeId}`);

    expect(response.status()).toBe(404);
  });

  test('36. List projects returns all user projects', async ({ request }) => {
    // Create multiple projects
    const project1 = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const p1 = await project1.json();
    createdProjectIds.push(p1.id);

    const project2 = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const p2 = await project2.json();
    createdProjectIds.push(p2.id);

    // List all projects
    const listResponse = await request.get('/api/projects');

    expect(listResponse.status()).toBe(200);
    const projects = await listResponse.json();

    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThanOrEqual(2);

    // Verify our projects are in the list
    const ids = projects.map((p: { id: string }) => p.id);
    expect(ids).toContain(p1.id);
    expect(ids).toContain(p2.id);
  });

  test('37. Projects are ordered by most recent', async ({ request }) => {
    // Create two projects with a delay
    const project1 = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const p1 = await project1.json();
    createdProjectIds.push(p1.id);

    // Small delay
    await new Promise((r) => setTimeout(r, 100));

    const project2 = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const p2 = await project2.json();
    createdProjectIds.push(p2.id);

    // List projects
    const listResponse = await request.get('/api/projects');
    const projects = await listResponse.json();

    // Most recent should be first
    expect(projects[0].id).toBe(p2.id);
  });
});

test.describe('Project Access Control', () => {
  let user1: { email: string; password: string; name: string };
  let user2: { email: string; password: string; name: string };
  let user1ProjectId: string;

  test.beforeAll(async ({ request }) => {
    // Create two separate users
    user1 = generateTestUser();
    user2 = generateTestUser();

    await signupTestUser(request, user1);
    await signupTestUser(request, user2);

    // User 1 creates a project
    await loginTestUser(request, user1.email, user1.password);
    const response = await request.post('/api/projects', {
      data: { name: generateProjectName() },
    });
    const project = await response.json();
    user1ProjectId = project.id;
  });

  test.afterAll(async ({ request }) => {
    // Cleanup
    await loginTestUser(request, user1.email, user1.password);
    if (user1ProjectId) {
      await request.delete(`/api/projects/${user1ProjectId}`);
    }
  });

  test('38. User cannot access another users project', async ({ request }) => {
    // Login as user2
    await loginTestUser(request, user2.email, user2.password);

    // Try to access user1's project
    const response = await request.get(`/api/projects/${user1ProjectId}`);

    expect(response.status()).toBe(404); // Not found (not authorized)
  });

  test('39. User cannot update another users project', async ({ request }) => {
    await loginTestUser(request, user2.email, user2.password);

    const response = await request.patch(`/api/projects/${user1ProjectId}`, {
      data: { name: 'Hacked Project' },
    });

    expect(response.status()).toBe(404);
  });

  test('40. User cannot delete another users project', async ({ request }) => {
    await loginTestUser(request, user2.email, user2.password);

    const response = await request.delete(`/api/projects/${user1ProjectId}`);

    expect(response.status()).toBe(404);

    // Verify project still exists
    await loginTestUser(request, user1.email, user1.password);
    const getResponse = await request.get(`/api/projects/${user1ProjectId}`);
    expect(getResponse.status()).toBe(200);
  });

  test('41. User only sees their own projects in list', async ({ request }) => {
    // Login as user2
    await loginTestUser(request, user2.email, user2.password);

    const response = await request.get('/api/projects');
    const projects = await response.json();

    // Should not contain user1's project
    const ids = projects.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(user1ProjectId);
  });
});
