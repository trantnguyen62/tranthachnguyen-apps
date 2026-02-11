/**
 * Projects API
 */

import type { HttpClient } from "./client.js";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  PaginatedResponse,
} from "./types.js";

export class ProjectsApi {
  constructor(private client: HttpClient) {}

  /**
   * List all projects
   */
  async list(options?: {
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<Project>> {
    const response = await this.client.get<{ projects: Project[]; meta: PaginatedResponse<Project>["meta"] }>(
      "/projects",
      options
    );
    return { data: response.projects, meta: response.meta };
  }

  /**
   * Get a project by ID
   */
  async get(projectId: string): Promise<Project> {
    const response = await this.client.get<{ project: Project }>(`/projects/${projectId}`);
    return response.project;
  }

  /**
   * Get a project by slug
   */
  async getBySlug(slug: string): Promise<Project> {
    const response = await this.client.get<{ project: Project }>(`/projects/by-slug/${slug}`);
    return response.project;
  }

  /**
   * Create a new project
   */
  async create(input: CreateProjectInput): Promise<Project> {
    const response = await this.client.post<{ project: Project }>("/projects", input);
    return response.project;
  }

  /**
   * Update a project
   */
  async update(projectId: string, input: UpdateProjectInput): Promise<Project> {
    const response = await this.client.patch<{ project: Project }>(`/projects/${projectId}`, input);
    return response.project;
  }

  /**
   * Delete a project
   */
  async delete(projectId: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}`);
  }
}
