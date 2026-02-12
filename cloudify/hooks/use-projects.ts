"use client";

import { useState, useEffect, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
  repositoryUrl: string | null;
  repositoryBranch: string;
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  rootDirectory: string;
  nodeVersion: string;
  createdAt: string;
  updatedAt: string;
  deployments?: Deployment[];
  _count?: { deployments: number };
}

interface Deployment {
  id: string;
  status: string;
  commitSha: string | null;
  commitMessage: string | null;
  branch: string;
  url: string | null;
  buildTime: number | null;
  createdAt: string;
  finishedAt: string | null;
}

interface CreateProjectData {
  name: string;
  repoUrl?: string;
  framework?: string;
  buildCmd?: string;
  outputDir?: string;
  installCmd?: string;
  rootDir?: string;
  nodeVersion?: string;
}

interface UpdateProjectData {
  name?: string;
  repoUrl?: string;
  repoBranch?: string;
  framework?: string;
  buildCmd?: string;
  outputDir?: string;
  installCmd?: string;
  rootDir?: string;
  nodeVersion?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const envelope = await response.json();
      setProjects(envelope.data ?? envelope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: CreateProjectData): Promise<Project> => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const envelope = await response.json();
      throw new Error(envelope.error?.message || "Failed to create project");
    }

    const envelope = await response.json();
    const project = envelope.data ?? envelope;
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const updateProject = async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const envelope = await response.json();
      throw new Error(envelope.error?.message || "Failed to update project");
    }

    const envelope = await response.json();
    const project = envelope.data ?? envelope;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...project } : p)));
    return project;
  };

  const deleteProject = async (id: string): Promise<void> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const envelope = await response.json();
      throw new Error(envelope.error?.message || "Failed to delete project");
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const envelope = await response.json();
      setProject(envelope.data ?? envelope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error, refetch: fetchProject };
}
