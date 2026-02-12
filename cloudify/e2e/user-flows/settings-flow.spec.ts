import { test, expect } from '@playwright/test';
import {
  registerUser,
  loginUser,
  logoutUser,
  generateUniqueUser,
} from '../helpers/auth-helper';

/**
 * SETTINGS FLOW TESTS
 *
 * End-to-end tests for user profile and settings management:
 * - Get user profile
 * - Update profile (name, avatar)
 * - Change password (valid and invalid current password)
 * - Notification preferences (get and update)
 */

test.describe('Settings Flow - User Profile', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
  });

  test.beforeEach(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
  });

  test('Get profile returns user details', async ({ request }) => {
    const response = await request.get('/api/user/profile');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email.toLowerCase());
    expect(data.user.name).toBe(testUser.name);
    expect(data.user.id).toBeTruthy();
    // Profile should include plan info
    expect(data.user.plan).toBeDefined();
    expect(data.user.createdAt).toBeDefined();
  });

  test('Get profile without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/user/profile');

    expect(response.status()).toBe(401);
  });

  test('Update profile name returns updated user', async ({ request }) => {
    const newName = `Updated Name ${Date.now()}`;

    const response = await request.patch('/api/user/profile', {
      data: { name: newName },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.name).toBe(newName);

    // Verify the change persisted
    const getResponse = await request.get('/api/user/profile');
    const getData = await getResponse.json();
    expect(getData.user.name).toBe(newName);

    // Restore original name for other tests
    await request.patch('/api/user/profile', {
      data: { name: testUser.name },
    });
  });

  test('Update profile image returns updated user', async ({ request }) => {
    const imageUrl = 'https://example.com/avatar.png';

    const response = await request.patch('/api/user/profile', {
      data: { image: imageUrl },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.image).toBe(imageUrl);
  });

  test('Update profile with empty name returns 400', async ({ request }) => {
    const response = await request.patch('/api/user/profile', {
      data: { name: '' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('Update profile with very long name returns 400', async ({ request }) => {
    const longName = 'A'.repeat(101); // Exceeds 100 char limit

    const response = await request.patch('/api/user/profile', {
      data: { name: longName },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('100 characters');
  });

  test('Cannot update protected fields like email', async ({ request }) => {
    const response = await request.patch('/api/user/profile', {
      data: { email: 'hacker@evil.com' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('protected');
  });

  test('Update profile sanitizes HTML from name', async ({ request }) => {
    const xssName = '<script>alert("xss")</script>Test User';

    const response = await request.patch('/api/user/profile', {
      data: { name: xssName },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    // HTML tags should be stripped
    expect(data.user.name).not.toContain('<script>');
    expect(data.user.name).toContain('Test User');

    // Restore original name
    await request.patch('/api/user/profile', {
      data: { name: testUser.name },
    });
  });
});

test.describe('Settings Flow - Change Password', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
  });

  test.beforeEach(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
  });

  test('Change password with correct current password succeeds', async ({ request }) => {
    const newPassword = 'NewSecurePass456!';

    const response = await request.post('/api/user/password', {
      data: {
        currentPassword: testUser.password,
        newPassword,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.message).toContain('updated');

    // Verify login works with new password
    await logoutUser(request);
    const loginResponse = await loginUser(request, testUser.email, newPassword);
    expect(loginResponse.status()).toBe(200);

    // Restore original password for subsequent tests
    const restoreResponse = await request.post('/api/user/password', {
      data: {
        currentPassword: newPassword,
        newPassword: testUser.password,
      },
    });
    expect(restoreResponse.status()).toBe(200);
  });

  test('Change password with wrong current password fails', async ({ request }) => {
    const response = await request.post('/api/user/password', {
      data: {
        currentPassword: 'WrongCurrentPassword!',
        newPassword: 'NewPass789!',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('incorrect');
  });

  test('Change password with short new password fails', async ({ request }) => {
    const response = await request.post('/api/user/password', {
      data: {
        currentPassword: testUser.password,
        newPassword: 'short',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('8 characters');
  });

  test('Change password with missing fields returns 400', async ({ request }) => {
    // Missing newPassword
    const response1 = await request.post('/api/user/password', {
      data: {
        currentPassword: testUser.password,
      },
    });
    expect(response1.status()).toBe(400);

    // Missing currentPassword
    const response2 = await request.post('/api/user/password', {
      data: {
        newPassword: 'NewPass789!',
      },
    });
    expect(response2.status()).toBe(400);
  });

  test('Change password without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.post('/api/user/password', {
      data: {
        currentPassword: testUser.password,
        newPassword: 'NewPass789!',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('Settings Flow - Notification Preferences', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
  });

  test.beforeEach(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
  });

  test('Get notification preferences returns available types and channels', async ({ request }) => {
    const response = await request.get('/api/notifications/preferences');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.preferences).toBeDefined();
    expect(Array.isArray(data.preferences)).toBe(true);
    expect(data.availableTypes).toBeDefined();
    expect(Array.isArray(data.availableTypes)).toBe(true);
    expect(data.availableChannels).toBeDefined();
    expect(Array.isArray(data.availableChannels)).toBe(true);

    // Verify expected notification types exist
    expect(data.availableTypes).toContain('deployment_started');
    expect(data.availableTypes).toContain('deployment_success');
    expect(data.availableTypes).toContain('deployment_failure');

    // Verify expected channels exist
    expect(data.availableChannels).toContain('email');
  });

  test('Update notification preference creates a new preference', async ({ request }) => {
    const response = await request.post('/api/notifications/preferences', {
      data: {
        channel: 'email',
        type: 'deployment_success',
        enabled: true,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.id).toBeTruthy();
    expect(data.channel).toBe('email');
    expect(data.type).toBe('deployment_success');
    expect(data.enabled).toBe(true);
  });

  test('Update notification preference with destination succeeds', async ({ request }) => {
    const response = await request.post('/api/notifications/preferences', {
      data: {
        channel: 'slack',
        type: 'deployment_failure',
        enabled: true,
        destination: 'https://hooks.slack.com/services/TEST',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.channel).toBe('slack');
    expect(data.type).toBe('deployment_failure');
    expect(data.enabled).toBe(true);
    expect(data.destination).toBe('https://hooks.slack.com/services/TEST');
  });

  test('Update same preference upserts instead of creating duplicate', async ({ request }) => {
    // Create initial preference
    await request.post('/api/notifications/preferences', {
      data: {
        channel: 'email',
        type: 'security_alert',
        enabled: true,
      },
    });

    // Update same channel+type combination
    const response = await request.post('/api/notifications/preferences', {
      data: {
        channel: 'email',
        type: 'security_alert',
        enabled: false,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.enabled).toBe(false);

    // Verify only one preference exists for this channel+type
    const listResponse = await request.get('/api/notifications/preferences');
    const listData = await listResponse.json();
    const securityPrefs = listData.preferences.filter(
      (p: { channel: string; type: string }) =>
        p.channel === 'email' && p.type === 'security_alert'
    );
    expect(securityPrefs.length).toBe(1);
  });

  test('Update notification preference with invalid channel returns 400', async ({ request }) => {
    const response = await request.post('/api/notifications/preferences', {
      data: {
        channel: 'invalid-channel',
        type: 'deployment_success',
        enabled: true,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid channel');
  });

  test('Update notification preference with invalid type returns 400', async ({ request }) => {
    const response = await request.post('/api/notifications/preferences', {
      data: {
        channel: 'email',
        type: 'invalid-type',
        enabled: true,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid notification type');
  });

  test('Update notification preference with missing channel returns 400', async ({ request }) => {
    const response = await request.post('/api/notifications/preferences', {
      data: {
        type: 'deployment_success',
        enabled: true,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('Get notification preferences without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/notifications/preferences');

    expect(response.status()).toBe(401);
  });
});
