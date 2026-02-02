import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  signupTestUser,
  loginTestUser,
  logoutTestUser,
} from '../helpers/test-utils';

/**
 * AUTHENTICATION SECURITY TESTS
 *
 * These tests verify authentication security:
 * - Password validation
 * - Session management
 * - Rate limiting awareness
 * - Input sanitization
 */

test.describe('Authentication Security', () => {
  test('42. Signup rejects weak passwords', async ({ request }) => {
    const user = generateTestUser();

    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: user.email,
        password: 'short', // Too short
        name: user.name,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('8 characters');
  });

  test('43. Signup rejects invalid email format', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: 'not-an-email',
        password: 'ValidPassword123!',
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('email');
  });

  test('44. Signup rejects missing required fields', async ({ request }) => {
    // Missing name
    const response1 = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: 'test@example.com',
        password: 'ValidPassword123!',
      },
    });
    expect(response1.status()).toBe(400);

    // Missing password
    const response2 = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    expect(response2.status()).toBe(400);

    // Missing email
    const response3 = await request.post('/api/auth', {
      data: {
        action: 'signup',
        password: 'ValidPassword123!',
        name: 'Test User',
      },
    });
    expect(response3.status()).toBe(400);
  });

  test('45. Cannot signup with existing email', async ({ request }) => {
    const user = generateTestUser();

    // First signup
    await signupTestUser(request, user);

    // Try duplicate signup
    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: user.email,
        password: 'DifferentPassword123!',
        name: 'Different Name',
      },
    });

    expect(response.status()).toBe(409); // Conflict
  });

  test('46. Login fails with wrong password', async ({ request }) => {
    const user = generateTestUser();
    await signupTestUser(request, user);

    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: user.email,
        password: 'WrongPassword123!',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('47. Login fails with non-existent email', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: 'nonexistent-user-12345@example.com',
        password: 'SomePassword123!',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('48. Email is case-insensitive for login', async ({ request }) => {
    const user = generateTestUser();
    await signupTestUser(request, user);

    // Login with uppercase email
    const response = await loginTestUser(
      request,
      user.email.toUpperCase(),
      user.password
    );

    expect(response.status()).toBe(200);
  });

  test('49. Session persists after login', async ({ request }) => {
    const user = generateTestUser();
    await signupTestUser(request, user);
    await loginTestUser(request, user.email, user.password);

    // Check session
    const response = await request.get('/api/auth');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user.email).toBe(user.email.toLowerCase());
  });

  test('50. Logout clears session', async ({ request }) => {
    const user = generateTestUser();
    await signupTestUser(request, user);
    await loginTestUser(request, user.email, user.password);

    // Logout
    await logoutTestUser(request);

    // Check session is cleared
    const response = await request.get('/api/auth');
    expect(response.status()).toBe(401);
  });

  test('51. Cannot access protected routes after logout', async ({ request }) => {
    const user = generateTestUser();
    await signupTestUser(request, user);
    await loginTestUser(request, user.email, user.password);
    await logoutTestUser(request);

    // Try to access projects
    const response = await request.get('/api/projects');
    expect(response.status()).toBe(401);
  });
});

test.describe('Input Sanitization', () => {
  test('52. XSS in signup name is handled', async ({ request }) => {
    const user = generateTestUser();
    const xssName = '<script>alert("xss")</script>';

    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: user.email,
        password: user.password,
        name: xssName,
      },
    });

    // Should either reject or sanitize
    if (response.status() === 200) {
      const data = await response.json();
      // Name should be stored without executing JS
      expect(data.user.name).not.toContain('<script>');
    }
  });

  test('53. SQL injection in login is handled', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: {
        action: 'login',
        email: "'; DROP TABLE users; --@example.com",
        password: "' OR '1'='1",
      },
    });

    // Should fail login, not crash
    expect(response.status()).toBeLessThan(500);
  });

  test('54. Very long email is handled', async ({ request }) => {
    const longEmail = 'a'.repeat(1000) + '@example.com';

    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: longEmail,
        password: 'ValidPassword123!',
        name: 'Test User',
      },
    });

    // Should reject or truncate, not crash
    expect(response.status()).toBeLessThan(500);
  });

  test('55. Unicode characters in name are preserved', async ({ request }) => {
    const user = generateTestUser();
    const unicodeName = '测试用户 José García Müller';

    const response = await request.post('/api/auth', {
      data: {
        action: 'signup',
        email: user.email,
        password: user.password,
        name: unicodeName,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user.name).toBe(unicodeName);
  });
});

test.describe('Rate Limiting Awareness', () => {
  test('56. Multiple rapid login attempts are handled', async ({ request }) => {
    // Make 10 rapid login attempts
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      attempts.push(
        request.post('/api/auth', {
          data: {
            action: 'login',
            email: `test${i}@example.com`,
            password: 'password',
          },
        })
      );
    }

    const responses = await Promise.all(attempts);

    // All should respond (not hang or crash)
    responses.forEach((r) => {
      expect(r.status()).toBeLessThan(500);
    });
  });

  test('57. Multiple rapid signup attempts are handled', async ({ request }) => {
    const attempts = [];
    for (let i = 0; i < 5; i++) {
      const user = generateTestUser();
      attempts.push(
        request.post('/api/auth', {
          data: {
            action: 'signup',
            email: user.email,
            password: user.password,
            name: user.name,
          },
        })
      );
    }

    const responses = await Promise.all(attempts);

    // All should complete
    responses.forEach((r) => {
      expect(r.status()).toBeLessThan(500);
    });
  });
});
