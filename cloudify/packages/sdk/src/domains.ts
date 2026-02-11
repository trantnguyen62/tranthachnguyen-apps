/**
 * Domains API
 */

import type { HttpClient } from "./client.js";
import type { Domain, AddDomainInput, AddDomainResponse } from "./types.js";

export class DomainsApi {
  constructor(private client: HttpClient) {}

  /**
   * List all domains for a project
   */
  async list(projectId: string): Promise<Domain[]> {
    const response = await this.client.get<{ domains: Domain[] }>(
      `/projects/${projectId}/domains`
    );
    return response.domains;
  }

  /**
   * Get a domain by ID
   */
  async get(projectId: string, domainId: string): Promise<Domain> {
    const response = await this.client.get<{ domain: Domain }>(
      `/projects/${projectId}/domains/${domainId}`
    );
    return response.domain;
  }

  /**
   * Add a custom domain to a project
   */
  async add(projectId: string, input: AddDomainInput): Promise<AddDomainResponse> {
    const response = await this.client.post<AddDomainResponse>(
      `/projects/${projectId}/domains`,
      input
    );
    return response;
  }

  /**
   * Remove a domain from a project
   */
  async remove(projectId: string, domain: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/domains/${encodeURIComponent(domain)}`);
  }

  /**
   * Verify domain DNS configuration
   */
  async verify(projectId: string, domain: string): Promise<{ verified: boolean; message: string }> {
    const response = await this.client.post<{ verified: boolean; message: string }>(
      `/projects/${projectId}/domains/${encodeURIComponent(domain)}/verify`
    );
    return response;
  }

  /**
   * Set a domain as primary
   */
  async setPrimary(projectId: string, domainId: string): Promise<Domain> {
    const response = await this.client.patch<{ domain: Domain }>(
      `/projects/${projectId}/domains/${domainId}`,
      { isPrimary: true }
    );
    return response.domain;
  }
}
