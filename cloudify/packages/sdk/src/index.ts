/**
 * Cloudify SDK
 *
 * Official JavaScript/TypeScript SDK for the Cloudify deployment platform.
 *
 * @example
 * ```typescript
 * import { Cloudify } from '@cloudify/sdk';
 *
 * const cloudify = new Cloudify({ token: 'your-api-token' });
 *
 * // List projects
 * const projects = await cloudify.projects.list();
 *
 * // Create a deployment
 * const deployment = await cloudify.deployments.create('project-id', {
 *   branch: 'main',
 *   commitSha: 'abc123',
 * });
 * ```
 */

import { HttpClient } from "./client.js";
import { ProjectsApi } from "./projects.js";
import { DeploymentsApi } from "./deployments.js";
import { DomainsApi } from "./domains.js";
import { EnvApi } from "./env.js";
import { FunctionsApi } from "./functions.js";
import { StorageApi } from "./storage.js";
import type { CloudifyOptions } from "./types.js";

export class Cloudify {
  private client: HttpClient;

  /** Projects API */
  public readonly projects: ProjectsApi;

  /** Deployments API */
  public readonly deployments: DeploymentsApi;

  /** Domains API */
  public readonly domains: DomainsApi;

  /** Environment Variables API */
  public readonly env: EnvApi;

  /** Serverless Functions API */
  public readonly functions: FunctionsApi;

  /** Storage API (Blob & KV) */
  public readonly storage: StorageApi;

  constructor(options: CloudifyOptions) {
    this.client = new HttpClient(options);
    this.projects = new ProjectsApi(this.client);
    this.deployments = new DeploymentsApi(this.client);
    this.domains = new DomainsApi(this.client);
    this.env = new EnvApi(this.client);
    this.functions = new FunctionsApi(this.client);
    this.storage = new StorageApi(this.client);
  }
}

// Re-export all types
export * from "./types.js";

// Re-export error class
export { CloudifyError } from "./client.js";

// Default export
export default Cloudify;
