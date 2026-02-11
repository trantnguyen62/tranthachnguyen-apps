/**
 * Serverless Functions API
 */

import type { HttpClient } from "./client.js";
import type {
  ServerlessFunction,
  CreateFunctionInput,
  FunctionInvocation,
} from "./types.js";

export class FunctionsApi {
  constructor(private client: HttpClient) {}

  /**
   * List all functions for a project
   */
  async list(projectId: string): Promise<ServerlessFunction[]> {
    const response = await this.client.get<{ functions: ServerlessFunction[] }>(
      `/projects/${projectId}/functions`
    );
    return response.functions;
  }

  /**
   * Get a function by ID
   */
  async get(functionId: string): Promise<ServerlessFunction> {
    const response = await this.client.get<{ function: ServerlessFunction }>(
      `/functions/${functionId}`
    );
    return response.function;
  }

  /**
   * Create a new function
   */
  async create(projectId: string, input: CreateFunctionInput): Promise<ServerlessFunction> {
    const response = await this.client.post<{ function: ServerlessFunction }>(
      `/projects/${projectId}/functions`,
      input
    );
    return response.function;
  }

  /**
   * Update a function
   */
  async update(
    functionId: string,
    input: Partial<CreateFunctionInput>
  ): Promise<ServerlessFunction> {
    const response = await this.client.patch<{ function: ServerlessFunction }>(
      `/functions/${functionId}`,
      input
    );
    return response.function;
  }

  /**
   * Delete a function
   */
  async delete(functionId: string): Promise<void> {
    await this.client.delete(`/functions/${functionId}`);
  }

  /**
   * Deploy a function
   */
  async deploy(functionId: string): Promise<ServerlessFunction> {
    const response = await this.client.post<{ function: ServerlessFunction }>(
      `/functions/${functionId}/deploy`
    );
    return response.function;
  }

  /**
   * Invoke a function
   */
  async invoke<T = unknown>(
    functionId: string,
    payload?: unknown
  ): Promise<{ result: T; invocation: FunctionInvocation }> {
    const response = await this.client.post<{
      result: T;
      invocation: FunctionInvocation;
    }>(`/functions/${functionId}/invoke`, payload);
    return response;
  }

  /**
   * Get function invocation logs
   */
  async getLogs(
    functionId: string,
    options?: { limit?: number; startTime?: string; endTime?: string }
  ): Promise<FunctionInvocation[]> {
    const response = await this.client.get<{ invocations: FunctionInvocation[] }>(
      `/functions/${functionId}/logs`,
      options
    );
    return response.invocations;
  }
}
