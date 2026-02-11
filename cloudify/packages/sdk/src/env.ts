/**
 * Environment Variables API
 */

import type { HttpClient } from "./client.js";
import type { EnvVariable, SetEnvInput, EnvTarget } from "./types.js";

export class EnvApi {
  constructor(private client: HttpClient) {}

  /**
   * List environment variables for a project
   */
  async list(projectId: string, options?: { target?: EnvTarget }): Promise<EnvVariable[]> {
    const response = await this.client.get<{ variables: EnvVariable[] }>(
      `/projects/${projectId}/env`,
      options
    );
    return response.variables;
  }

  /**
   * Get a single environment variable
   */
  async get(projectId: string, key: string): Promise<EnvVariable> {
    const response = await this.client.get<{ variable: EnvVariable }>(
      `/projects/${projectId}/env/${encodeURIComponent(key)}`
    );
    return response.variable;
  }

  /**
   * Set an environment variable
   */
  async set(projectId: string, input: SetEnvInput): Promise<EnvVariable> {
    const response = await this.client.post<{ variable: EnvVariable }>(
      `/projects/${projectId}/env`,
      {
        key: input.key,
        value: input.value,
        target: input.target ?? ["production", "preview", "development"],
      }
    );
    return response.variable;
  }

  /**
   * Set multiple environment variables at once
   */
  async setMany(projectId: string, variables: SetEnvInput[]): Promise<EnvVariable[]> {
    const results: EnvVariable[] = [];
    for (const variable of variables) {
      const result = await this.set(projectId, variable);
      results.push(result);
    }
    return results;
  }

  /**
   * Update an environment variable
   */
  async update(
    projectId: string,
    key: string,
    input: { value?: string; target?: EnvTarget[] }
  ): Promise<EnvVariable> {
    const response = await this.client.put<{ variable: EnvVariable }>(
      `/projects/${projectId}/env/${encodeURIComponent(key)}`,
      input
    );
    return response.variable;
  }

  /**
   * Delete an environment variable
   */
  async delete(projectId: string, key: string, target?: EnvTarget): Promise<void> {
    await this.client.delete(
      `/projects/${projectId}/env/${encodeURIComponent(key)}`,
      { query: target ? { target } : undefined }
    );
  }

  /**
   * Pull environment variables to a map (for local development)
   */
  async pull(projectId: string, target: EnvTarget = "development"): Promise<Record<string, string>> {
    const variables = await this.list(projectId, { target });
    return variables.reduce(
      (acc, v) => ({ ...acc, [v.key]: v.value }),
      {} as Record<string, string>
    );
  }
}
