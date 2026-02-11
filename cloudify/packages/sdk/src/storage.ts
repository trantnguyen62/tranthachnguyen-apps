/**
 * Storage API (Blob & KV)
 */

import type { HttpClient } from "./client.js";
import type {
  BlobStore,
  Blob,
  UploadBlobInput,
  KVStore,
  KVEntry,
} from "./types.js";

export class StorageApi {
  constructor(private client: HttpClient) {}

  // =========================================================================
  // Blob Storage
  // =========================================================================

  /**
   * List blob stores for a project
   */
  async listBlobStores(projectId: string): Promise<BlobStore[]> {
    const response = await this.client.get<{ stores: BlobStore[] }>(
      `/projects/${projectId}/storage/blobs`
    );
    return response.stores;
  }

  /**
   * Create a blob store
   */
  async createBlobStore(
    projectId: string,
    options: { name: string; isPublic?: boolean }
  ): Promise<BlobStore> {
    const response = await this.client.post<{ store: BlobStore }>(
      `/projects/${projectId}/storage/blobs`,
      options
    );
    return response.store;
  }

  /**
   * Delete a blob store
   */
  async deleteBlobStore(storeId: string): Promise<void> {
    await this.client.delete(`/storage/blobs/${storeId}`);
  }

  /**
   * List blobs in a store
   */
  async listBlobs(
    storeId: string,
    options?: { prefix?: string; limit?: number; cursor?: string }
  ): Promise<{ blobs: Blob[]; cursor?: string }> {
    const response = await this.client.get<{ blobs: Blob[]; cursor?: string }>(
      `/storage/blobs/${storeId}`,
      options
    );
    return response;
  }

  /**
   * Upload a blob
   */
  async uploadBlob(storeId: string, input: UploadBlobInput): Promise<Blob> {
    const formData = new FormData();

    let content: globalThis.Blob;
    if (typeof input.content === "string") {
      content = new globalThis.Blob([input.content], { type: input.contentType || "text/plain" });
    } else if (input.content instanceof Buffer) {
      content = new globalThis.Blob([input.content], { type: input.contentType || "application/octet-stream" });
    } else {
      content = input.content;
    }

    formData.append("file", content, input.pathname);
    formData.append("pathname", input.pathname);
    if (input.contentType) {
      formData.append("contentType", input.contentType);
    }

    const response = await this.client.post<{ blob: Blob }>(
      `/storage/blobs/${storeId}/upload`,
      formData
    );
    return response.blob;
  }

  /**
   * Get a blob's metadata
   */
  async getBlob(storeId: string, pathname: string): Promise<Blob> {
    const response = await this.client.get<{ blob: Blob }>(
      `/storage/blobs/${storeId}/${encodeURIComponent(pathname)}`
    );
    return response.blob;
  }

  /**
   * Delete a blob
   */
  async deleteBlob(storeId: string, pathname: string): Promise<void> {
    await this.client.delete(
      `/storage/blobs/${storeId}/${encodeURIComponent(pathname)}`
    );
  }

  /**
   * Get a blob's download URL
   */
  async getBlobUrl(storeId: string, pathname: string): Promise<string> {
    const response = await this.client.get<{ url: string }>(
      `/storage/blobs/${storeId}/${encodeURIComponent(pathname)}/url`
    );
    return response.url;
  }

  // =========================================================================
  // KV Storage
  // =========================================================================

  /**
   * List KV stores for a project
   */
  async listKVStores(projectId: string): Promise<KVStore[]> {
    const response = await this.client.get<{ stores: KVStore[] }>(
      `/projects/${projectId}/storage/kv`
    );
    return response.stores;
  }

  /**
   * Create a KV store
   */
  async createKVStore(projectId: string, name: string): Promise<KVStore> {
    const response = await this.client.post<{ store: KVStore }>(
      `/projects/${projectId}/storage/kv`,
      { name }
    );
    return response.store;
  }

  /**
   * Delete a KV store
   */
  async deleteKVStore(storeId: string): Promise<void> {
    await this.client.delete(`/storage/kv/${storeId}`);
  }

  /**
   * Get a value from KV store
   */
  async kvGet(storeId: string, key: string): Promise<string | null> {
    try {
      const response = await this.client.get<{ value: string }>(
        `/storage/kv/${storeId}/${encodeURIComponent(key)}`
      );
      return response.value;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Set a value in KV store
   */
  async kvSet(
    storeId: string,
    key: string,
    value: string,
    options?: { expiresIn?: number }
  ): Promise<void> {
    await this.client.put(`/storage/kv/${storeId}/${encodeURIComponent(key)}`, {
      value,
      expiresIn: options?.expiresIn,
    });
  }

  /**
   * Delete a value from KV store
   */
  async kvDelete(storeId: string, key: string): Promise<void> {
    await this.client.delete(`/storage/kv/${storeId}/${encodeURIComponent(key)}`);
  }

  /**
   * List keys in KV store
   */
  async kvList(
    storeId: string,
    options?: { prefix?: string; limit?: number; cursor?: string }
  ): Promise<{ keys: string[]; cursor?: string }> {
    const response = await this.client.get<{ keys: string[]; cursor?: string }>(
      `/storage/kv/${storeId}/keys`,
      options
    );
    return response;
  }

  /**
   * Get multiple values from KV store
   */
  async kvGetMany(storeId: string, keys: string[]): Promise<Record<string, string | null>> {
    const response = await this.client.post<{ entries: KVEntry[] }>(
      `/storage/kv/${storeId}/mget`,
      { keys }
    );
    return response.entries.reduce(
      (acc, entry) => ({ ...acc, [entry.key]: entry.value }),
      {} as Record<string, string | null>
    );
  }

  /**
   * Set multiple values in KV store
   */
  async kvSetMany(
    storeId: string,
    entries: Array<{ key: string; value: string; expiresIn?: number }>
  ): Promise<void> {
    await this.client.post(`/storage/kv/${storeId}/mset`, { entries });
  }
}
