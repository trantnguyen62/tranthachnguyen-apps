/**
 * Domain Management E2E Test
 *
 * Tests the complete custom domain lifecycle:
 *   1. Add a custom domain to a project
 *   2. Get DNS instruction records
 *   3. Verify domain DNS configuration
 *   4. Delete the domain
 *
 * Also covers edge cases:
 *   - Invalid domain format rejection
 *   - Duplicate domain rejection
 *   - Cross-user domain access denial
 *   - Nonexistent domain/project handling
 *
 * All tests use Playwright's API request context (no browser UI).
 */

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestProject,
  addDomain,
  getDomain,
  verifyDomain,
  deleteDomain,
  authenticatedFetch,
  cleanupProject,
  logoutUser,
  uniqueId,
  type TestUser,
  type TestProject,
  type TestDomain,
} from '../helpers/test-utils';

test.describe('Domain Management Flow', () => {
  let user: TestUser;
  let project: TestProject;
  let domain: TestDomain;

  const testDomainName = `e2e-${uniqueId()}.example.com`;

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------
  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
    project = await createTestProject(request, user.sessionCookie, {
      name: `domain-test-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    // Cleanup domain if still exists
    if (domain?.id) {
      await deleteDomain(request, user.sessionCookie, domain.id).catch(
        () => {}
      );
    }
    // Cleanup project
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  // -------------------------------------------------------------------------
  // Step 1: Add Domain
  // -------------------------------------------------------------------------

  test('should add a custom domain to the project', async ({ request }) => {
    domain = await addDomain(
      request,
      user.sessionCookie,
      project.id,
      testDomainName
    );

    expect(domain.id).toBeTruthy();
    expect(domain.domain).toBe(testDomainName);
    expect(domain.projectId).toBe(project.id);
    expect(domain.verified).toBe(false);
    expect(domain.verificationToken).toBeTruthy();
    // Verification token should be a 32-char hex string (16 bytes)
    expect(domain.verificationToken).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should reject adding the same domain twice', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains',
      {
        method: 'POST',
        data: { domain: testDomainName, projectId: project.id },
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.error).toContain('already registered');
  });

  test('should reject invalid domain format', async ({ request }) => {
    const invalidDomains = [
      'not-a-domain',
      'http://example.com',
      '.example.com',
      'example..com',
      '',
    ];

    for (const invalid of invalidDomains) {
      const response = await authenticatedFetch(
        request,
        '/api/domains',
        {
          method: 'POST',
          data: { domain: invalid, projectId: project.id },
        },
        user.sessionCookie
      );

      expect(response.status()).toBe(400);
    }
  });

  test('should reject domain without projectId', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains',
      {
        method: 'POST',
        data: { domain: 'valid.example.com' },
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('required');
  });

  // -------------------------------------------------------------------------
  // Step 2: Get DNS Records
  // -------------------------------------------------------------------------

  test('should get domain details with DNS verification info', async ({
    request,
  }) => {
    const domainData = await getDomain(
      request,
      user.sessionCookie,
      domain.id
    );

    expect(domainData).toBeDefined();
    expect(domainData.id).toBe(domain.id);
    expect(domainData.domain).toBe(testDomainName);
    expect(domainData.verified).toBe(false);
    expect(domainData.verificationToken).toBeTruthy();
    expect(domainData.sslStatus).toBe('pending');

    // Should include project info
    const projectInfo = domainData.project as Record<string, unknown>;
    expect(projectInfo).toBeDefined();
    expect(projectInfo.id).toBe(project.id);
    expect(projectInfo.name).toBe(project.name);
  });

  test('should return 404 for nonexistent domain', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains/nonexistent-domain-id',
      { method: 'GET' },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should list all domains for the user', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains',
      { method: 'GET' },
      user.sessionCookie
    );

    expect(response.ok()).toBeTruthy();

    const domains = await response.json();
    expect(Array.isArray(domains)).toBeTruthy();

    const found = domains.find(
      (d: { id: string }) => d.id === domain.id
    );
    expect(found).toBeTruthy();
    expect(found.domain).toBe(testDomainName);
  });

  // -------------------------------------------------------------------------
  // Step 3: Verify Domain DNS
  // -------------------------------------------------------------------------

  test('should attempt DNS verification and return verification result', async ({
    request,
  }) => {
    const result = await verifyDomain(
      request,
      user.sessionCookie,
      domain.id
    );

    // The verification will likely fail in E2E since DNS records are not configured,
    // but the API should still return a well-formed response.
    expect(result).toBeDefined();
    expect(typeof result.verified).toBe('boolean');

    // The requiredRecords field should list the DNS records the user needs to configure
    if (result.requiredRecords) {
      const records = result.requiredRecords as Array<Record<string, unknown>>;
      expect(Array.isArray(records)).toBeTruthy();
      expect(records.length).toBeGreaterThan(0);

      // Each record should have type, name, and value
      for (const record of records) {
        expect(record.type).toBeTruthy();
        expect(record.name).toBeTruthy();
        expect(record.value).toBeTruthy();
      }
    }

    // Should report whether TXT record was found
    expect(typeof result.txtRecordFound).toBe('boolean');
  });

  test('should return 404 when verifying nonexistent domain', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains/nonexistent-domain-id/verify',
      { method: 'POST' },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  // -------------------------------------------------------------------------
  // Step 4: Delete Domain
  // -------------------------------------------------------------------------

  test('should delete the custom domain', async ({ request }) => {
    await deleteDomain(request, user.sessionCookie, domain.id);

    // Verify the domain no longer exists
    const response = await authenticatedFetch(
      request,
      `/api/domains/${domain.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.status()).toBe(404);

    // Mark as cleaned up
    domain = undefined as unknown as TestDomain;
  });

  test('should return 404 when deleting already-deleted domain', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains/nonexistent-domain-id',
      { method: 'DELETE' },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Cross-User Domain Access
// ---------------------------------------------------------------------------

test.describe('Cross-User Domain Access', () => {
  let userA: TestUser;
  let userB: TestUser;
  let projectA: TestProject;
  let domainA: TestDomain;

  const crossDomainName = `cross-${uniqueId()}.example.com`;

  test.beforeAll(async ({ request }) => {
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    projectA = await createTestProject(request, userA.sessionCookie, {
      name: `cross-domain-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });

    domainA = await addDomain(
      request,
      userA.sessionCookie,
      projectA.id,
      crossDomainName
    );
  });

  test.afterAll(async ({ request }) => {
    if (domainA?.id) {
      await deleteDomain(request, userA.sessionCookie, domainA.id).catch(
        () => {}
      );
    }
    if (projectA?.id) {
      await cleanupProject(request, userA.sessionCookie, projectA.id).catch(
        () => {}
      );
    }
    await logoutUser(request, userA.sessionCookie);
    await logoutUser(request, userB.sessionCookie);
  });

  test('should deny User B from viewing User A domain', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/domains/${domainA.id}`,
      { method: 'GET' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from deleting User A domain', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/domains/${domainA.id}`,
      { method: 'DELETE' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from verifying User A domain', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/domains/${domainA.id}/verify`,
      { method: 'POST' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny adding a domain to another user project', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/domains',
      {
        method: 'POST',
        data: {
          domain: `userb-${uniqueId()}.example.com`,
          projectId: projectA.id,
        },
      },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Multiple Domains Per Project
// ---------------------------------------------------------------------------

test.describe('Multiple Domains Per Project', () => {
  let user: TestUser;
  let project: TestProject;
  const domainIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
    project = await createTestProject(request, user.sessionCookie, {
      name: `multi-domain-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    // Cleanup domains
    for (const id of domainIds) {
      await deleteDomain(request, user.sessionCookie, id).catch(() => {});
    }
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  test('should add multiple domains to a single project', async ({
    request,
  }) => {
    const domain1 = await addDomain(
      request,
      user.sessionCookie,
      project.id,
      `multi1-${uniqueId()}.example.com`
    );
    domainIds.push(domain1.id);

    const domain2 = await addDomain(
      request,
      user.sessionCookie,
      project.id,
      `multi2-${uniqueId()}.example.com`
    );
    domainIds.push(domain2.id);

    expect(domain1.id).not.toBe(domain2.id);
    expect(domain1.projectId).toBe(project.id);
    expect(domain2.projectId).toBe(project.id);

    // List domains and verify both are present
    const response = await authenticatedFetch(
      request,
      '/api/domains',
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const allDomains = await response.json();
    const projectDomains = allDomains.filter(
      (d: { projectId: string }) => d.projectId === project.id
    );
    expect(projectDomains.length).toBeGreaterThanOrEqual(2);
  });
});
