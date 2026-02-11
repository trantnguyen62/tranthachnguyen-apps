/**
 * Deployments API
 */

import type { HttpClient } from "./client.js";
import type {
  Deployment,
  CreateDeploymentInput,
  DeploymentStatus,
  PaginatedResponse,
} from "./types.js";

export class DeploymentsApi {
  constructor(private client: HttpClient) {}

  /**
   * List all deployments
   */
  async list(options?: {
    projectId?: string;
    status?: DeploymentStatus;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResponse<Deployment>> {
    const response = await this.client.get<{ deployments: Deployment[]; meta: PaginatedResponse<Deployment>["meta"] }>(
      "/deployments",
      options
    );
    return { data: response.deployments, meta: response.meta };
  }

  /**
   * Get a deployment by ID
   */
  async get(deploymentId: string): Promise<Deployment> {
    const response = await this.client.get<{ deployment: Deployment }>(`/deployments/${deploymentId}`);
    return response.deployment;
  }

  /**
   * Create a new deployment
   */
  async create(input: CreateDeploymentInput): Promise<Deployment> {
    const response = await this.client.post<{ deployment: Deployment }>("/deployments", input);
    return response.deployment;
  }

  /**
   * Deploy from a file (tarball)
   */
  async deployFile(options: {
    projectId: string;
    file: Blob | Buffer;
    production?: boolean;
  }): Promise<Deployment> {
    const formData = new FormData();

    const blob = options.file instanceof Blob
      ? options.file
      : new Blob([options.file]);

    formData.append("file", blob, "deploy.tar.gz");
    formData.append("projectId", options.projectId);
    formData.append("production", String(options.production ?? false));

    const response = await this.client.post<{ deployment: Deployment }>(
      "/deploy",
      formData
    );
    return response.deployment;
  }

  /**
   * Get deployment build logs
   */
  async getLogs(deploymentId: string): Promise<string> {
    const response = await this.client.get<{ logs: string }>(`/deployments/${deploymentId}/build-logs`);
    return response.logs;
  }

  /**
   * Redeploy an existing deployment
   */
  async redeploy(deploymentId: string): Promise<Deployment> {
    const response = await this.client.post<{ deployment: Deployment }>(
      `/deployments/${deploymentId}/redeploy`
    );
    return response.deployment;
  }

  /**
   * Rollback to a previous deployment
   */
  async rollback(deploymentId: string): Promise<Deployment> {
    const response = await this.client.post<{ deployment: Deployment }>(
      `/deployments/${deploymentId}/rollback`
    );
    return response.deployment;
  }

  /**
   * Cancel a pending deployment
   */
  async cancel(deploymentId: string): Promise<void> {
    await this.client.delete(`/deployments/${deploymentId}`);
  }

  /**
   * Wait for a deployment to complete
   */
  async waitForReady(
    deploymentId: string,
    options?: {
      timeout?: number;
      pollInterval?: number;
      onStatusChange?: (status: DeploymentStatus) => void;
    }
  ): Promise<Deployment> {
    const timeout = options?.timeout ?? 600000; // 10 minutes
    const pollInterval = options?.pollInterval ?? 2000; // 2 seconds
    const startTime = Date.now();

    let lastStatus: DeploymentStatus | null = null;

    while (Date.now() - startTime < timeout) {
      const deployment = await this.get(deploymentId);

      if (deployment.status !== lastStatus) {
        lastStatus = deployment.status;
        options?.onStatusChange?.(deployment.status);
      }

      if (deployment.status === "READY" || deployment.status === "ERROR" || deployment.status === "CANCELLED") {
        return deployment;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Deployment timed out after ${timeout}ms`);
  }
}
