/**
 * GitLab Integration
 *
 * Provides GitLab API integration for:
 * - Repository listing and access
 * - Webhook management
 * - Commit/branch information
 * - OAuth authentication flow
 */

import { createLogger } from "@/lib/logging";

const logger = createLogger("gitlab");

// GitLab API configuration
const GITLAB_API_URL = process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";
const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID;
const GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET;
const GITLAB_REDIRECT_URI = process.env.GITLAB_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/gitlab`;

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
  web_url: string;
}

export interface GitLabRepository {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  default_branch: string;
  visibility: "private" | "internal" | "public";
  web_url: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  created_at: string;
  last_activity_at: string;
}

export interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    message: string;
    author_name: string;
    authored_date: string;
  };
  protected: boolean;
  default: boolean;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committed_date: string;
  web_url: string;
}

export interface GitLabWebhook {
  id: number;
  url: string;
  project_id: number;
  push_events: boolean;
  merge_requests_events: boolean;
  enable_ssl_verification: boolean;
  created_at: string;
}

/**
 * Check if GitLab is configured
 */
export function isGitLabConfigured(): boolean {
  return !!(GITLAB_CLIENT_ID && GITLAB_CLIENT_SECRET);
}

/**
 * Get OAuth authorization URL
 */
export function getGitLabAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITLAB_CLIENT_ID!,
    redirect_uri: GITLAB_REDIRECT_URI,
    response_type: "code",
    scope: "read_user read_repository api",
    state,
  });

  return `https://gitlab.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGitLabCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch("https://gitlab.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: GITLAB_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitLab OAuth error: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshGitLabToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch("https://gitlab.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh GitLab token");
  }

  return response.json();
}

/**
 * Create GitLab API client
 */
export function createGitLabClient(accessToken: string) {
  async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${GITLAB_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  return {
    /**
     * Get current user
     */
    async getUser(): Promise<GitLabUser> {
      return request<GitLabUser>("/user");
    },

    /**
     * List user's repositories
     */
    async listRepositories(options?: {
      page?: number;
      perPage?: number;
      owned?: boolean;
      membership?: boolean;
      search?: string;
    }): Promise<GitLabRepository[]> {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.perPage) params.set("per_page", String(options.perPage));
      if (options?.owned !== undefined) params.set("owned", String(options.owned));
      if (options?.membership !== undefined) params.set("membership", String(options.membership));
      if (options?.search) params.set("search", options.search);

      return request<GitLabRepository[]>(`/projects?${params.toString()}`);
    },

    /**
     * Get a repository by ID
     */
    async getRepository(projectId: number | string): Promise<GitLabRepository> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      return request<GitLabRepository>(`/projects/${encodedId}`);
    },

    /**
     * List repository branches
     */
    async listBranches(projectId: number | string): Promise<GitLabBranch[]> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      return request<GitLabBranch[]>(`/projects/${encodedId}/repository/branches`);
    },

    /**
     * Get a specific branch
     */
    async getBranch(projectId: number | string, branchName: string): Promise<GitLabBranch> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      return request<GitLabBranch>(
        `/projects/${encodedId}/repository/branches/${encodeURIComponent(branchName)}`
      );
    },

    /**
     * List commits
     */
    async listCommits(
      projectId: number | string,
      options?: { ref?: string; since?: string; until?: string; perPage?: number }
    ): Promise<GitLabCommit[]> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;

      const params = new URLSearchParams();
      if (options?.ref) params.set("ref_name", options.ref);
      if (options?.since) params.set("since", options.since);
      if (options?.until) params.set("until", options.until);
      if (options?.perPage) params.set("per_page", String(options.perPage));

      return request<GitLabCommit[]>(`/projects/${encodedId}/repository/commits?${params.toString()}`);
    },

    /**
     * Get a specific commit
     */
    async getCommit(projectId: number | string, sha: string): Promise<GitLabCommit> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      return request<GitLabCommit>(`/projects/${encodedId}/repository/commits/${sha}`);
    },

    /**
     * Create a webhook
     */
    async createWebhook(
      projectId: number | string,
      webhookUrl: string,
      options?: {
        pushEvents?: boolean;
        mergeRequestsEvents?: boolean;
        tagPushEvents?: boolean;
        token?: string;
        enableSslVerification?: boolean;
      }
    ): Promise<GitLabWebhook> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;

      return request<GitLabWebhook>(`/projects/${encodedId}/hooks`, {
        method: "POST",
        body: JSON.stringify({
          url: webhookUrl,
          push_events: options?.pushEvents ?? true,
          merge_requests_events: options?.mergeRequestsEvents ?? true,
          tag_push_events: options?.tagPushEvents ?? false,
          token: options?.token,
          enable_ssl_verification: options?.enableSslVerification ?? true,
        }),
      });
    },

    /**
     * List webhooks
     */
    async listWebhooks(projectId: number | string): Promise<GitLabWebhook[]> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      return request<GitLabWebhook[]>(`/projects/${encodedId}/hooks`);
    },

    /**
     * Delete a webhook
     */
    async deleteWebhook(projectId: number | string, hookId: number): Promise<void> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      await request(`/projects/${encodedId}/hooks/${hookId}`, { method: "DELETE" });
    },

    /**
     * Download repository archive
     */
    async downloadArchive(
      projectId: number | string,
      options?: { sha?: string; format?: "tar.gz" | "tar.bz2" | "tbz" | "tbz2" | "tb2" | "bz2" | "tar" | "zip" }
    ): Promise<ArrayBuffer> {
      const encodedId = typeof projectId === "string"
        ? encodeURIComponent(projectId)
        : projectId;
      const format = options?.format || "tar.gz";

      const params = new URLSearchParams();
      if (options?.sha) params.set("sha", options.sha);

      const url = `${GITLAB_API_URL}/projects/${encodedId}/repository/archive.${format}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download archive: ${response.status}`);
      }

      return response.arrayBuffer();
    },
  };
}

/**
 * Verify GitLab webhook signature
 */
export function verifyGitLabWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // GitLab uses a simple token comparison
  return signature === secret;
}

/**
 * Parse GitLab webhook payload
 */
export interface GitLabPushEvent {
  object_kind: "push";
  event_name: "push";
  ref: string;
  checkout_sha: string;
  project: {
    id: number;
    name: string;
    web_url: string;
    default_branch: string;
  };
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
  }>;
  total_commits_count: number;
  user_name: string;
  user_email: string;
}

export interface GitLabMergeRequestEvent {
  object_kind: "merge_request";
  event_type: "merge_request";
  object_attributes: {
    id: number;
    iid: number;
    title: string;
    description: string;
    state: "opened" | "closed" | "merged";
    source_branch: string;
    target_branch: string;
    last_commit: {
      id: string;
      message: string;
    };
  };
  project: {
    id: number;
    name: string;
    web_url: string;
  };
}

export type GitLabWebhookEvent = GitLabPushEvent | GitLabMergeRequestEvent;

export function parseGitLabWebhookEvent(
  eventType: string,
  payload: unknown
): GitLabWebhookEvent | null {
  if (eventType === "Push Hook") {
    return payload as GitLabPushEvent;
  }
  if (eventType === "Merge Request Hook") {
    return payload as GitLabMergeRequestEvent;
  }
  return null;
}
