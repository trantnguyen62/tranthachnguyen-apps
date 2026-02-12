import { test, expect } from '@playwright/test';
import {
  registerUser,
  loginUser,
  logoutUser,
  generateUniqueUser,
} from '../helpers/auth-helper';

/**
 * CRON JOB FLOW TESTS
 *
 * End-to-end tests for the cron job management system:
 * - Create a cron job (requires a project)
 * - List cron jobs
 * - Get a specific cron job
 * - Trigger a cron job manually
 * - Get execution history
 * - Disable/enable a cron job
 * - Delete a cron job
 *
 * These tests create a real project as a prerequisite since
 * cron jobs are scoped to projects.
 */

test.describe('Cron Flow', () => {
  let testUser: { email: string; password: string; name: string };
  let projectId: string;
  let cronJobId: string;
  const createdCronJobIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
    await loginUser(request, testUser.email, testUser.password);

    // Create a project to attach cron jobs to
    const projectResponse = await request.post('/api/projects', {
      data: { name: `E2E Cron Project ${Date.now()}` },
    });
    expect(projectResponse.status()).toBe(201);
    const project = await projectResponse.json();
    projectId = project.id;
  });

  test.beforeEach(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
  });

  test.afterAll(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
    // Clean up cron jobs
    for (const id of createdCronJobIds) {
      try {
        await request.delete(`/api/cron/${id}`);
      } catch {
        // Job may already be deleted
      }
    }
    // Clean up project
    try {
      await request.delete(`/api/projects/${projectId}`);
    } catch {
      // Project may already be deleted
    }
  });

  test('Create cron job with valid data succeeds', async ({ request }) => {
    const response = await request.post('/api/cron', {
      data: {
        projectId,
        name: 'E2E Test Cron Job',
        schedule: '*/5 * * * *', // Every 5 minutes
        path: '/api/cron/handler',
        timezone: 'UTC',
        timeout: 30,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.cronJob).toBeDefined();
    expect(data.cronJob.id).toBeTruthy();
    expect(data.cronJob.name).toBe('E2E Test Cron Job');
    expect(data.cronJob.schedule).toBe('*/5 * * * *');
    expect(data.cronJob.path).toBe('/api/cron/handler');
    expect(data.cronJob.timezone).toBe('UTC');
    expect(data.cronJob.enabled).toBe(true);
    expect(data.cronJob.scheduleDescription).toBeTruthy();
    expect(data.cronJob.project).toBeDefined();
    expect(data.cronJob.project.id).toBe(projectId);

    cronJobId = data.cronJob.id;
    createdCronJobIds.push(cronJobId);
  });

  test('Create cron job with missing fields returns 400', async ({ request }) => {
    // Missing schedule
    const response = await request.post('/api/cron', {
      data: {
        projectId,
        name: 'Missing Schedule Job',
        path: '/api/handler',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  test('Create cron job with invalid path returns 400', async ({ request }) => {
    const response = await request.post('/api/cron', {
      data: {
        projectId,
        name: 'Bad Path Job',
        schedule: '0 * * * *',
        path: 'no-leading-slash', // Path must start with /
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('/');
  });

  test('Create cron job with invalid project returns 404', async ({ request }) => {
    const response = await request.post('/api/cron', {
      data: {
        projectId: 'non-existent-project-id',
        name: 'Bad Project Job',
        schedule: '0 * * * *',
        path: '/api/handler',
      },
    });

    expect(response.status()).toBe(404);
  });

  test('List cron jobs returns jobs for the user', async ({ request }) => {
    const response = await request.get('/api/cron');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.cronJobs).toBeDefined();
    expect(Array.isArray(data.cronJobs)).toBe(true);
    expect(data.cronJobs.length).toBeGreaterThanOrEqual(1);

    // Find our cron job
    const found = data.cronJobs.find(
      (j: { id: string }) => j.id === cronJobId
    );
    expect(found).toBeTruthy();
    expect(found.name).toBe('E2E Test Cron Job');
    expect(found.schedule).toBe('*/5 * * * *');
    expect(found.project).toBeDefined();
    expect(found.scheduleDescription).toBeTruthy();
  });

  test('List cron jobs with projectId filter works', async ({ request }) => {
    const response = await request.get(`/api/cron?projectId=${projectId}`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.cronJobs).toBeDefined();
    expect(data.cronJobs.length).toBeGreaterThanOrEqual(1);

    // All jobs should belong to the specified project
    for (const job of data.cronJobs) {
      expect(job.project.id).toBe(projectId);
    }
  });

  test('Get specific cron job returns full details', async ({ request }) => {
    const response = await request.get(`/api/cron/${cronJobId}`);

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.cronJob).toBeDefined();
    expect(data.cronJob.id).toBe(cronJobId);
    expect(data.cronJob.name).toBe('E2E Test Cron Job');
    expect(data.cronJob.schedule).toBe('*/5 * * * *');
    expect(data.cronJob.path).toBe('/api/cron/handler');
    expect(data.cronJob.enabled).toBe(true);
    expect(data.cronJob.scheduleDescription).toBeTruthy();
    expect(data.cronJob.project).toBeDefined();
    expect(data.cronJob.executions).toBeDefined();
    expect(Array.isArray(data.cronJob.executions)).toBe(true);
  });

  test('Get non-existent cron job returns 404', async ({ request }) => {
    const response = await request.get('/api/cron/non-existent-id');

    expect(response.status()).toBe(404);
  });

  test('Trigger cron job manually creates execution', async ({ request }) => {
    const response = await request.post(`/api/cron/${cronJobId}/trigger`);

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.execution).toBeDefined();
    expect(data.execution.id).toBeTruthy();
    expect(data.execution.jobId).toBe(cronJobId);
    expect(data.execution.status).toBeTruthy();
    expect(data.execution.startedAt).toBeTruthy();
  });

  test('Trigger non-existent cron job returns 404', async ({ request }) => {
    const response = await request.post('/api/cron/non-existent-id/trigger');

    expect(response.status()).toBe(404);
  });

  test('Get execution history returns executions', async ({ request }) => {
    const response = await request.get(`/api/cron/${cronJobId}/executions`);

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.executions).toBeDefined();
    expect(Array.isArray(data.executions)).toBe(true);
    // Should have at least one execution from the manual trigger test
    expect(data.executions.length).toBeGreaterThanOrEqual(1);

    // Verify execution fields
    const execution = data.executions[0];
    expect(execution.id).toBeTruthy();
    expect(execution.status).toBeTruthy();
    expect(execution.startedAt).toBeTruthy();

    // Verify pagination
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBeDefined();
    expect(data.pagination.limit).toBeDefined();
    expect(data.pagination.total).toBeDefined();
    expect(data.pagination.totalPages).toBeDefined();
    expect(typeof data.pagination.hasMore).toBe('boolean');
  });

  test('Get execution history with pagination works', async ({ request }) => {
    const response = await request.get(
      `/api/cron/${cronJobId}/executions?page=1&limit=5`
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.executions.length).toBeLessThanOrEqual(5);
    expect(data.pagination.limit).toBe(5);
  });

  test('Get execution history for non-existent job returns 404', async ({ request }) => {
    const response = await request.get(
      '/api/cron/non-existent-id/executions'
    );

    expect(response.status()).toBe(404);
  });

  test('Disable cron job via PATCH succeeds', async ({ request }) => {
    const response = await request.patch(`/api/cron/${cronJobId}`, {
      data: { enabled: false },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.cronJob).toBeDefined();
    expect(data.cronJob.enabled).toBe(false);

    // Verify the change persisted
    const getResponse = await request.get(`/api/cron/${cronJobId}`);
    const getData = await getResponse.json();
    expect(getData.cronJob.enabled).toBe(false);
  });

  test('Re-enable cron job via PATCH succeeds', async ({ request }) => {
    const response = await request.patch(`/api/cron/${cronJobId}`, {
      data: { enabled: true },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.cronJob.enabled).toBe(true);
  });

  test('Update cron job name via PATCH succeeds', async ({ request }) => {
    const newName = 'Updated Cron Job Name';

    const response = await request.patch(`/api/cron/${cronJobId}`, {
      data: { name: newName },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.cronJob.name).toBe(newName);
  });

  test('Update cron job schedule via PATCH succeeds', async ({ request }) => {
    const newSchedule = '0 */2 * * *'; // Every 2 hours

    const response = await request.patch(`/api/cron/${cronJobId}`, {
      data: { schedule: newSchedule },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.cronJob.schedule).toBe(newSchedule);
    expect(data.cronJob.scheduleDescription).toBeTruthy();
  });

  test('PATCH with no valid fields returns 400', async ({ request }) => {
    const response = await request.patch(`/api/cron/${cronJobId}`, {
      data: {},
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('No valid fields');
  });

  test('Delete cron job succeeds', async ({ request }) => {
    // Create a new cron job to delete
    const createResponse = await request.post('/api/cron', {
      data: {
        projectId,
        name: 'Job To Delete',
        schedule: '0 0 * * *',
        path: '/api/delete-handler',
      },
    });
    const created = await createResponse.json();
    const deleteJobId = created.cronJob.id;

    // Delete it
    const deleteResponse = await request.delete(`/api/cron/${deleteJobId}`);

    expect(deleteResponse.status()).toBe(200);
    const data = await deleteResponse.json();
    expect(data.success).toBe(true);

    // Verify it's gone
    const getResponse = await request.get(`/api/cron/${deleteJobId}`);
    expect(getResponse.status()).toBe(404);
  });

  test('Delete non-existent cron job returns 404', async ({ request }) => {
    const response = await request.delete('/api/cron/non-existent-id');

    expect(response.status()).toBe(404);
  });
});

test.describe('Cron Flow - Access Control', () => {
  let user1: { email: string; password: string; name: string };
  let user2: { email: string; password: string; name: string };
  let user1ProjectId: string;
  let user1CronJobId: string;

  test.beforeAll(async ({ request }) => {
    user1 = generateUniqueUser();
    user2 = generateUniqueUser();

    await registerUser(request, user1.email, user1.password, user1.name);
    await registerUser(request, user2.email, user2.password, user2.name);

    // User1 creates a project and cron job
    await loginUser(request, user1.email, user1.password);
    const projectResponse = await request.post('/api/projects', {
      data: { name: `E2E Cron ACL Project ${Date.now()}` },
    });
    const project = await projectResponse.json();
    user1ProjectId = project.id;

    const cronResponse = await request.post('/api/cron', {
      data: {
        projectId: user1ProjectId,
        name: 'User1 Cron Job',
        schedule: '0 * * * *',
        path: '/api/handler',
      },
    });
    const cronJob = await cronResponse.json();
    user1CronJobId = cronJob.cronJob.id;
  });

  test.afterAll(async ({ request }) => {
    await loginUser(request, user1.email, user1.password);
    try {
      await request.delete(`/api/cron/${user1CronJobId}`);
    } catch {
      // May already be deleted
    }
    try {
      await request.delete(`/api/projects/${user1ProjectId}`);
    } catch {
      // May already be deleted
    }
  });

  test('User cannot access another users cron job', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.get(`/api/cron/${user1CronJobId}`);

    // Should be either 403 (access denied) or 404
    expect([403, 404]).toContain(response.status());
  });

  test('User cannot trigger another users cron job', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.post(`/api/cron/${user1CronJobId}/trigger`);

    expect([403, 404]).toContain(response.status());
  });

  test('User cannot delete another users cron job', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.delete(`/api/cron/${user1CronJobId}`);

    expect([403, 404]).toContain(response.status());
  });

  test('User cannot update another users cron job', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.patch(`/api/cron/${user1CronJobId}`, {
      data: { enabled: false },
    });

    expect([403, 404]).toContain(response.status());
  });

  test('Cron endpoints without auth return 401', async ({ request }) => {
    await logoutUser(request);

    const listResponse = await request.get('/api/cron');
    expect(listResponse.status()).toBe(401);

    const getResponse = await request.get(`/api/cron/${user1CronJobId}`);
    expect(getResponse.status()).toBe(401);

    const triggerResponse = await request.post(`/api/cron/${user1CronJobId}/trigger`);
    expect(triggerResponse.status()).toBe(401);
  });
});
