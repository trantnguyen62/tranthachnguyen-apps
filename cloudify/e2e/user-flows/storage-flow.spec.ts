/**
 * Storage E2E Test
 *
 * Tests the KV Store and Blob Store lifecycle:
 *
 * KV Store:
 *   1. Create a KV store for a project
 *   2. Set key-value pairs
 *   3. Get key-value pairs back
 *   4. Delete individual keys
 *   5. Delete the KV store
 *
 * Blob Store:
 *   1. Create a blob store for a project
 *   2. Upload a file (text and binary)
 *   3. Download and verify content
 *   4. Delete individual blobs
 *   5. Delete the blob store
 *
 * Also covers edge cases:
 *   - Nonexistent stores/keys
 *   - Cross-user access denial
 *   - Multiple keys and stores
 *
 * All tests use Playwright's API request context (no browser UI).
 */

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestProject,
  createKVStore,
  kvSet,
  kvGet,
  kvDelete,
  deleteKVStore,
  createBlobStore,
  uploadBlob,
  downloadBlob,
  deleteBlob,
  deleteBlobStore,
  authenticatedFetch,
  cleanupProject,
  logoutUser,
  uniqueId,
  type TestUser,
  type TestProject,
  type TestKVStore,
  type TestBlobStore,
} from '../helpers/test-utils';

// ============================================================================
// KV STORE TESTS
// ============================================================================

test.describe('KV Store Flow', () => {
  let user: TestUser;
  let project: TestProject;
  let store: TestKVStore;

  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
    project = await createTestProject(request, user.sessionCookie, {
      name: `kv-test-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    if (store?.id) {
      await deleteKVStore(request, user.sessionCookie, store.id).catch(
        () => {}
      );
    }
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  // -------------------------------------------------------------------------
  // Step 1: Create KV Store
  // -------------------------------------------------------------------------

  test('should create a KV store for the project', async ({ request }) => {
    const storeName = `test-kv-${uniqueId()}`;
    store = await createKVStore(
      request,
      user.sessionCookie,
      project.id,
      storeName
    );

    expect(store.id).toBeTruthy();
    expect(store.projectId).toBe(project.id);
    expect(store.name).toBe(storeName);
  });

  test('should list KV stores for the project', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/kv?projectId=${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const stores = await response.json();
    expect(Array.isArray(stores)).toBeTruthy();

    const found = stores.find(
      (s: { id: string }) => s.id === store.id
    );
    expect(found).toBeTruthy();
    expect(found.name).toBe(store.name);
  });

  // -------------------------------------------------------------------------
  // Step 2: Set Key-Value Pairs
  // -------------------------------------------------------------------------

  test('should set a string key-value pair', async ({ request }) => {
    await kvSet(
      request,
      user.sessionCookie,
      project.id,
      store.id,
      'greeting',
      'Hello, Cloudify!'
    );

    // Verify by reading it back
    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      'greeting'
    );

    expect(result.exists).toBe(true);
    expect(result.key).toBe('greeting');
    expect(result.value).toBe('Hello, Cloudify!');
  });

  test('should set a JSON-serializable value', async ({ request }) => {
    const jsonValue = JSON.stringify({
      count: 42,
      tags: ['deploy', 'test'],
      nested: { key: 'value' },
    });

    await kvSet(
      request,
      user.sessionCookie,
      project.id,
      store.id,
      'config',
      jsonValue
    );

    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      'config'
    );

    expect(result.exists).toBe(true);
    const parsed = JSON.parse(result.value as string);
    expect(parsed.count).toBe(42);
    expect(parsed.tags).toEqual(['deploy', 'test']);
    expect(parsed.nested.key).toBe('value');
  });

  test('should overwrite an existing key', async ({ request }) => {
    await kvSet(
      request,
      user.sessionCookie,
      project.id,
      store.id,
      'greeting',
      'Updated greeting!'
    );

    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      'greeting'
    );

    expect(result.exists).toBe(true);
    expect(result.value).toBe('Updated greeting!');
  });

  test('should set multiple keys', async ({ request }) => {
    const keys = ['key-a', 'key-b', 'key-c'];
    for (const key of keys) {
      await kvSet(
        request,
        user.sessionCookie,
        project.id,
        store.id,
        key,
        `value-for-${key}`
      );
    }

    // Verify each key
    for (const key of keys) {
      const result = await kvGet(
        request,
        user.sessionCookie,
        store.id,
        key
      );
      expect(result.exists).toBe(true);
      expect(result.value).toBe(`value-for-${key}`);
    }
  });

  // -------------------------------------------------------------------------
  // Step 3: Get Key-Value Pairs
  // -------------------------------------------------------------------------

  test('should return exists=false for nonexistent key', async ({
    request,
  }) => {
    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      'nonexistent-key'
    );

    expect(result.exists).toBe(false);
    expect(result.value).toBeNull();
  });

  test('should list keys in the store', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/kv?storeId=${store.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.keys).toBeDefined();
    expect(Array.isArray(data.keys)).toBeTruthy();
    // We set at least greeting, config, key-a, key-b, key-c
    expect(data.keys.length).toBeGreaterThanOrEqual(5);
  });

  test('should get key with metadata when requested', async ({ request }) => {
    // Set a key with metadata
    await kvSet(
      request,
      user.sessionCookie,
      project.id,
      store.id,
      'meta-key',
      'meta-value',
      { metadata: { source: 'e2e-test', version: '1.0' } }
    );

    const response = await authenticatedFetch(
      request,
      `/api/storage/kv?storeId=${store.id}&key=meta-key&metadata=true`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.value).toBe('meta-value');
    expect(data.exists).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Step 4: Delete Individual Keys
  // -------------------------------------------------------------------------

  test('should delete a specific key', async ({ request }) => {
    // Delete the 'greeting' key
    await kvDelete(
      request,
      user.sessionCookie,
      store.id,
      'greeting'
    );

    // Verify it is gone
    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      'greeting'
    );

    expect(result.exists).toBe(false);
    expect(result.value).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Step 5: Delete KV Store
  // -------------------------------------------------------------------------

  test('should delete the entire KV store', async ({ request }) => {
    await deleteKVStore(request, user.sessionCookie, store.id);

    // Verify the store is gone by listing stores
    const response = await authenticatedFetch(
      request,
      `/api/storage/kv?projectId=${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const stores = await response.json();
    const found = stores.find(
      (s: { id: string }) => s.id === store.id
    );
    expect(found).toBeUndefined();

    // Mark as cleaned up
    store = undefined as unknown as TestKVStore;
  });
});

// ============================================================================
// KV STORE EDGE CASES
// ============================================================================

test.describe('KV Store Edge Cases', () => {
  let user: TestUser;
  let project: TestProject;

  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
    project = await createTestProject(request, user.sessionCookie, {
      name: `kv-edge-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  test('should reject creating a store without projectId', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/storage/kv',
      {
        method: 'POST',
        data: { storeName: 'no-project-store' },
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(400);
  });

  test('should return 404 for nonexistent store access', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/storage/kv?storeId=nonexistent-store-id&key=test',
      { method: 'GET' },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should handle empty string values', async ({ request }) => {
    const store = await createKVStore(
      request,
      user.sessionCookie,
      project.id,
      `empty-val-${uniqueId()}`
    );

    await kvSet(
      request,
      user.sessionCookie,
      project.id,
      store.id,
      'empty-key',
      ''
    );

    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      'empty-key'
    );

    // Empty string is a valid value -- it should exist but be empty
    expect(result.exists).toBe(true);
    expect(result.value).toBe('');

    // Cleanup
    await deleteKVStore(request, user.sessionCookie, store.id);
  });

  test('should handle special characters in keys', async ({ request }) => {
    const store = await createKVStore(
      request,
      user.sessionCookie,
      project.id,
      `special-${uniqueId()}`
    );

    const specialKey = 'user:123:settings/theme';
    await kvSet(
      request,
      user.sessionCookie,
      project.id,
      store.id,
      specialKey,
      'dark'
    );

    const result = await kvGet(
      request,
      user.sessionCookie,
      store.id,
      specialKey
    );

    expect(result.exists).toBe(true);
    expect(result.value).toBe('dark');

    // Cleanup
    await deleteKVStore(request, user.sessionCookie, store.id);
  });
});

// ============================================================================
// KV STORE CROSS-USER ACCESS
// ============================================================================

test.describe('KV Store Cross-User Access', () => {
  let userA: TestUser;
  let userB: TestUser;
  let projectA: TestProject;
  let storeA: TestKVStore;

  test.beforeAll(async ({ request }) => {
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    projectA = await createTestProject(request, userA.sessionCookie, {
      name: `kv-cross-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });

    storeA = await createKVStore(
      request,
      userA.sessionCookie,
      projectA.id,
      `cross-kv-${uniqueId()}`
    );

    await kvSet(
      request,
      userA.sessionCookie,
      projectA.id,
      storeA.id,
      'secret-key',
      'secret-value'
    );
  });

  test.afterAll(async ({ request }) => {
    if (storeA?.id) {
      await deleteKVStore(request, userA.sessionCookie, storeA.id).catch(
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

  test('should deny User B from reading User A KV store', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/kv?storeId=${storeA.id}&key=secret-key`,
      { method: 'GET' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from writing to User A KV store', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/storage/kv',
      {
        method: 'POST',
        data: {
          projectId: projectA.id,
          storeId: storeA.id,
          key: 'hack',
          value: 'hacked',
        },
      },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from deleting User A KV store', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/kv?storeId=${storeA.id}`,
      { method: 'DELETE' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });
});

// ============================================================================
// BLOB STORE TESTS
// ============================================================================

test.describe('Blob Store Flow', () => {
  let user: TestUser;
  let project: TestProject;
  let store: TestBlobStore;

  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
    project = await createTestProject(request, user.sessionCookie, {
      name: `blob-test-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    if (store?.id) {
      await deleteBlobStore(request, user.sessionCookie, store.id).catch(
        () => {}
      );
    }
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  // -------------------------------------------------------------------------
  // Step 1: Create Blob Store
  // -------------------------------------------------------------------------

  test('should create a blob store for the project', async ({ request }) => {
    const storeName = `test-blob-${uniqueId()}`;
    store = await createBlobStore(
      request,
      user.sessionCookie,
      project.id,
      storeName
    );

    expect(store.id).toBeTruthy();
    expect(store.projectId).toBe(project.id);
    expect(store.name).toBe(storeName);
  });

  test('should list blob stores for the project', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?projectId=${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const stores = await response.json();
    expect(Array.isArray(stores)).toBeTruthy();

    const found = stores.find(
      (s: { id: string }) => s.id === store.id
    );
    expect(found).toBeTruthy();
    expect(found.name).toBe(store.name);
  });

  // -------------------------------------------------------------------------
  // Step 2: Upload Blobs
  // -------------------------------------------------------------------------

  test('should upload a text file via streaming PUT', async ({ request }) => {
    const textContent = 'Hello, Cloudify Blob Storage!\nThis is a test file.';

    const blobInfo = await uploadBlob(
      request,
      user.sessionCookie,
      store.id,
      'documents/hello.txt',
      textContent,
      'text/plain'
    );

    expect(blobInfo).toBeDefined();
    expect(blobInfo.pathname).toBe('documents/hello.txt');
    expect(blobInfo.contentType).toBe('text/plain');
    expect(blobInfo.size).toBe(Buffer.from(textContent, 'utf-8').length);
  });

  test('should upload a JSON file', async ({ request }) => {
    const jsonContent = JSON.stringify(
      { name: 'test', version: '1.0.0', dependencies: {} },
      null,
      2
    );

    const blobInfo = await uploadBlob(
      request,
      user.sessionCookie,
      store.id,
      'config/package.json',
      jsonContent,
      'application/json'
    );

    expect(blobInfo).toBeDefined();
    expect(blobInfo.pathname).toBe('config/package.json');
    expect(blobInfo.contentType).toBe('application/json');
  });

  test('should upload a binary file', async ({ request }) => {
    // Create a small binary buffer (simulating a PNG header)
    const binaryContent = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    ]);

    const blobInfo = await uploadBlob(
      request,
      user.sessionCookie,
      store.id,
      'images/test.png',
      binaryContent,
      'image/png'
    );

    expect(blobInfo).toBeDefined();
    expect(blobInfo.pathname).toBe('images/test.png');
    expect(blobInfo.contentType).toBe('image/png');
    expect(blobInfo.size).toBe(binaryContent.length);
  });

  // -------------------------------------------------------------------------
  // Step 3: Download and Verify Content
  // -------------------------------------------------------------------------

  test('should download a text file and verify content matches', async ({
    request,
  }) => {
    const expectedContent = 'Hello, Cloudify Blob Storage!\nThis is a test file.';

    const downloaded = await downloadBlob(
      request,
      user.sessionCookie,
      store.id,
      'documents/hello.txt'
    );

    expect(downloaded.toString('utf-8')).toBe(expectedContent);
  });

  test('should download a JSON file and verify content', async ({
    request,
  }) => {
    const downloaded = await downloadBlob(
      request,
      user.sessionCookie,
      store.id,
      'config/package.json'
    );

    const parsed = JSON.parse(downloaded.toString('utf-8'));
    expect(parsed.name).toBe('test');
    expect(parsed.version).toBe('1.0.0');
  });

  test('should download a binary file and verify content matches', async ({
    request,
  }) => {
    const expectedBinary = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    const downloaded = await downloadBlob(
      request,
      user.sessionCookie,
      store.id,
      'images/test.png'
    );

    expect(Buffer.compare(downloaded, expectedBinary)).toBe(0);
  });

  test('should list blobs in the store', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?storeId=${store.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.blobs).toBeDefined();
    expect(Array.isArray(data.blobs)).toBeTruthy();
    // We uploaded 3 blobs
    expect(data.blobs.length).toBeGreaterThanOrEqual(3);

    // Check storage usage is tracked
    expect(data.storageUsed).toBeDefined();
    expect(data.storageUsed).toBeGreaterThan(0);
  });

  test('should get blob info via HEAD-like endpoint', async ({ request }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?storeId=${store.id}&pathname=documents/hello.txt&info=true`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const info = await response.json();
    expect(info.contentType).toBe('text/plain');
    expect(info.size).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Step 4: Delete Individual Blobs
  // -------------------------------------------------------------------------

  test('should delete a specific blob', async ({ request }) => {
    await deleteBlob(
      request,
      user.sessionCookie,
      store.id,
      'documents/hello.txt'
    );

    // Verify it is gone
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?storeId=${store.id}&pathname=documents/hello.txt&info=true`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.status()).toBe(404);
  });

  test('should still serve remaining blobs after one is deleted', async ({
    request,
  }) => {
    const downloaded = await downloadBlob(
      request,
      user.sessionCookie,
      store.id,
      'config/package.json'
    );

    const parsed = JSON.parse(downloaded.toString('utf-8'));
    expect(parsed.name).toBe('test');
  });

  // -------------------------------------------------------------------------
  // Step 5: Delete Blob Store
  // -------------------------------------------------------------------------

  test('should delete the entire blob store', async ({ request }) => {
    await deleteBlobStore(request, user.sessionCookie, store.id);

    // Verify the store is gone
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?projectId=${project.id}`,
      { method: 'GET' },
      user.sessionCookie
    );
    expect(response.ok()).toBeTruthy();

    const stores = await response.json();
    const found = stores.find(
      (s: { id: string }) => s.id === store.id
    );
    expect(found).toBeUndefined();

    // Mark as cleaned up
    store = undefined as unknown as TestBlobStore;
  });
});

// ============================================================================
// BLOB STORE EDGE CASES
// ============================================================================

test.describe('Blob Store Edge Cases', () => {
  let user: TestUser;
  let project: TestProject;

  test.beforeAll(async ({ request }) => {
    user = await createTestUser(request);
    project = await createTestProject(request, user.sessionCookie, {
      name: `blob-edge-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });
  });

  test.afterAll(async ({ request }) => {
    if (project?.id) {
      await cleanupProject(request, user.sessionCookie, project.id).catch(
        () => {}
      );
    }
    await logoutUser(request, user.sessionCookie);
  });

  test('should reject creating a store without projectId', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/storage/blobs',
      {
        method: 'POST',
        data: { storeName: 'orphan-store' },
      },
      user.sessionCookie
    );

    expect(response.status()).toBe(400);
  });

  test('should return 404 for download from nonexistent store', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      '/api/storage/blobs?storeId=nonexistent-store&pathname=file.txt&download=true',
      { method: 'GET' },
      user.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should overwrite an existing blob with same pathname', async ({
    request,
  }) => {
    const store = await createBlobStore(
      request,
      user.sessionCookie,
      project.id,
      `overwrite-${uniqueId()}`
    );

    // Upload original
    await uploadBlob(
      request,
      user.sessionCookie,
      store.id,
      'data.txt',
      'original content',
      'text/plain'
    );

    // Overwrite
    await uploadBlob(
      request,
      user.sessionCookie,
      store.id,
      'data.txt',
      'updated content',
      'text/plain'
    );

    // Download and verify it is the updated version
    const downloaded = await downloadBlob(
      request,
      user.sessionCookie,
      store.id,
      'data.txt'
    );

    expect(downloaded.toString('utf-8')).toBe('updated content');

    // Cleanup
    await deleteBlobStore(request, user.sessionCookie, store.id);
  });

  test('should handle deeply nested pathnames', async ({ request }) => {
    const store = await createBlobStore(
      request,
      user.sessionCookie,
      project.id,
      `nested-${uniqueId()}`
    );

    const deepPath = 'a/b/c/d/e/f/deep-file.txt';
    await uploadBlob(
      request,
      user.sessionCookie,
      store.id,
      deepPath,
      'deep content',
      'text/plain'
    );

    const downloaded = await downloadBlob(
      request,
      user.sessionCookie,
      store.id,
      deepPath
    );

    expect(downloaded.toString('utf-8')).toBe('deep content');

    // Cleanup
    await deleteBlobStore(request, user.sessionCookie, store.id);
  });
});

// ============================================================================
// BLOB STORE CROSS-USER ACCESS
// ============================================================================

test.describe('Blob Store Cross-User Access', () => {
  let userA: TestUser;
  let userB: TestUser;
  let projectA: TestProject;
  let storeA: TestBlobStore;

  test.beforeAll(async ({ request }) => {
    userA = await createTestUser(request);
    userB = await createTestUser(request);

    projectA = await createTestProject(request, userA.sessionCookie, {
      name: `blob-cross-${uniqueId()}`,
      repoUrl: 'https://github.com/cloudify-test/sample-nextjs-app',
    });

    storeA = await createBlobStore(
      request,
      userA.sessionCookie,
      projectA.id,
      `cross-blob-${uniqueId()}`
    );

    await uploadBlob(
      request,
      userA.sessionCookie,
      storeA.id,
      'secret.txt',
      'top secret data',
      'text/plain'
    );
  });

  test.afterAll(async ({ request }) => {
    if (storeA?.id) {
      await deleteBlobStore(request, userA.sessionCookie, storeA.id).catch(
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

  test('should deny User B from listing User A blob stores', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?storeId=${storeA.id}`,
      { method: 'GET' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from downloading User A blobs', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?storeId=${storeA.id}&pathname=secret.txt&download=true`,
      { method: 'GET' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from uploading to User A blob store', async ({
    request,
  }) => {
    const response = await request.put(
      `/api/storage/blobs/${storeA.id}/hack.txt`,
      {
        headers: {
          Cookie: userB.sessionCookie,
          'Content-Type': 'text/plain',
        },
        data: Buffer.from('hacked'),
      }
    );

    expect(response.status()).toBe(404);
  });

  test('should deny User B from deleting User A blob store', async ({
    request,
  }) => {
    const response = await authenticatedFetch(
      request,
      `/api/storage/blobs?storeId=${storeA.id}`,
      { method: 'DELETE' },
      userB.sessionCookie
    );

    expect(response.status()).toBe(404);
  });
});
