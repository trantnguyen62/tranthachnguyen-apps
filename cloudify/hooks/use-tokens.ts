"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiToken {
  id: string;
  name: string;
  token?: string; // Only present on creation
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function useTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tokens");
      if (!response.ok) {
        throw new Error("Failed to fetch tokens");
      }
      const data = await response.json();
      setTokens(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const createToken = async (
    name: string,
    scopes: string[] = ["read"],
    expiresIn?: number
  ): Promise<ApiToken> => {
    const response = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes, expiresIn }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create token");
    }

    const newToken = await response.json();
    // Add to list without the raw token (won't be shown again)
    setTokens((prev) => [
      {
        ...newToken,
        token: undefined,
      },
      ...prev,
    ]);
    return newToken; // Return with raw token for one-time display
  };

  const deleteToken = async (tokenId: string): Promise<void> => {
    const response = await fetch(`/api/tokens/${tokenId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete token");
    }

    setTokens((prev) => prev.filter((t) => t.id !== tokenId));
  };

  return {
    tokens,
    loading,
    error,
    createToken,
    deleteToken,
    refetch: fetchTokens,
  };
}
