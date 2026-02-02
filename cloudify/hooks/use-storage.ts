"use client";

import { useState, useEffect, useCallback } from "react";

interface BlobStore {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  isPublic: boolean;
  createdAt: string;
  blobCount: number;
  totalSize: number;
}

interface Blob {
  id: string;
  storeId: string;
  pathname: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface KVStore {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  createdAt: string;
  _count?: {
    entries: number;
  };
}

interface KVEntry {
  id: string;
  storeId: string;
  key: string;
  value: string;
  expiresAt: string | null;
  createdAt: string;
}

export function useBlobStorage(projectId?: string) {
  const [stores, setStores] = useState<BlobStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = projectId
        ? `/api/storage/blobs?projectId=${projectId}`
        : "/api/storage/blobs";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch stores");
      setStores(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stores");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const createStore = async (projectId: string, name: string, isPublic = false) => {
    const response = await fetch("/api/storage/blobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, storeName: name, isPublic }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create store");
    }

    await fetchStores();
    return response.json();
  };

  const deleteStore = async (storeId: string) => {
    const response = await fetch(`/api/storage/blobs?storeId=${storeId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete store");
    setStores((prev) => prev.filter((s) => s.id !== storeId));
  };

  const getBlobs = async (storeId: string): Promise<Blob[]> => {
    const response = await fetch(`/api/storage/blobs?storeId=${storeId}`);
    if (!response.ok) throw new Error("Failed to fetch blobs");
    return response.json();
  };

  const deleteBlob = async (blobId: string) => {
    const response = await fetch(`/api/storage/blobs?blobId=${blobId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete blob");
  };

  return {
    stores,
    loading,
    error,
    createStore,
    deleteStore,
    getBlobs,
    deleteBlob,
    refetch: fetchStores,
  };
}

export function useKVStorage(projectId?: string) {
  const [stores, setStores] = useState<KVStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = projectId
        ? `/api/storage/kv?projectId=${projectId}`
        : "/api/storage/kv";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch KV stores");
      setStores(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch KV stores");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const createStore = async (projectId: string, name: string) => {
    const response = await fetch("/api/storage/kv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, storeName: name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create store");
    }

    await fetchStores();
    return response.json();
  };

  const deleteStore = async (storeId: string) => {
    const response = await fetch(`/api/storage/kv?storeId=${storeId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete store");
    setStores((prev) => prev.filter((s) => s.id !== storeId));
  };

  const getEntries = async (storeId: string): Promise<KVEntry[]> => {
    const response = await fetch(`/api/storage/kv?storeId=${storeId}`);
    if (!response.ok) throw new Error("Failed to fetch entries");
    return response.json();
  };

  const setKey = async (projectId: string, storeId: string, key: string, value: unknown, expiresIn?: number) => {
    const response = await fetch("/api/storage/kv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, storeId, key, value, expiresIn }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to set key");
    }

    return response.json();
  };

  const deleteKey = async (storeId: string, key: string) => {
    const response = await fetch(`/api/storage/kv?storeId=${storeId}&key=${key}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete key");
  };

  return {
    stores,
    loading,
    error,
    createStore,
    deleteStore,
    getEntries,
    setKey,
    deleteKey,
    refetch: fetchStores,
  };
}
