"use client";

import { useState, useEffect, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Domain {
  id: string;
  domain: string;
  projectId: string;
  verified: boolean;
  sslStatus: string;
  verificationToken: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
}

interface DnsRecord {
  type: string;
  name: string;
  host: string;
  value: string;
  purpose: string;
  required: boolean;
}

interface VerificationResult {
  verified: boolean;
  txtRecordFound: boolean;
  domainResolvable: boolean;
  pointsToServer: boolean;
  errors: string[];
  warnings: string[];
  requiredRecords: DnsRecord[];
}

export function useDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/domains");
      if (!response.ok) {
        throw new Error("Failed to fetch domains");
      }
      const data = await response.json();
      setDomains(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch domains");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const addDomain = async (domain: string, projectId: string): Promise<Domain> => {
    const response = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, projectId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to add domain");
    }

    const newDomain = await response.json();
    setDomains((prev) => [newDomain, ...prev]);
    return newDomain;
  };

  const deleteDomain = async (domainId: string): Promise<void> => {
    const response = await fetch(`/api/domains/${domainId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete domain");
    }

    setDomains((prev) => prev.filter((d) => d.id !== domainId));
  };

  const verifyDomain = async (domainId: string): Promise<VerificationResult> => {
    const response = await fetch(`/api/domains/${domainId}/verify`, {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to verify domain");
    }

    const result = await response.json();

    // Update domain in local state if verified
    if (result.verified) {
      setDomains((prev) =>
        prev.map((d) =>
          d.id === domainId
            ? { ...d, verified: true, sslStatus: "provisioning" }
            : d
        )
      );
    }

    return result;
  };

  return {
    domains,
    loading,
    error,
    addDomain,
    deleteDomain,
    verifyDomain,
    refetch: fetchDomains,
  };
}
