/**
 * Bitbucket Integration
 *
 * Provides Bitbucket API integration for:
 * - Repository listing and access
 * - Webhook management
 * - Commit/branch information
 * - OAuth 2.0 authentication flow
 */

import { createHash, timingSafeEqual } from "crypto";
import { createLogger } from "@/lib/logging";

const logger = createLogger("bitbucket");

// Bitbucket API configuration
const BITBUCKET_API_URL = "https://api.bitbucket.org/2.0";
const BITBUCKET_CLIENT_ID = process.env.BITBUCKET_CLIENT_ID;
const BITBUCKET_CLIENT_SECRET = process.env.BITBUCKET_CLIENT_SECRET;
const BITBUCKET_REDIRECT_URI = process.env.BITBUCKET_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/bitbucket`;

export interface BitbucketUser {
  uuid: string;
  username: string;
  display_name: string;
  account_id: string;
  links: {
    avatar: { href: string };
    html: { href: string };
  };
}

export interface BitbucketRepository {
  uuid: string;
  slug: string;
  name: string;
  full_name: string;
  description?: string;
  is_private: boolean;
  mainbranch?: { name: string };
  owner: {
    username: string;
    display_name: string;
  };
  links: {
    html: { href: string };
    clone: Array<{ href: string; name: string }>;
  };
  created_on: string;
  updated_on: string;
}

export interface BitbucketBranch {
  name: string;
  target: {
    hash: string;
    message: string;
    author: {
      raw: string;
      user?: BitbucketUser;
    };
    date: string;
  };
}

export interface BitbucketCommit {
  hash: string;
  message: string;
  author: {
    raw: string;
    user?: BitbucketUser;
  };
  date: string;
  links: {
    html: { href: string };
  };
  parents: Array<{ hash: string }>;
}

export interface BitbucketWebhook {
  uuid: string;
  url: string;
  description: string;
  subject: { type: string };
  active: boolean;
  events: string[];
  created_at: string;
}

interface BitbucketPaginatedResponse<T> {
  values: T[];
  page: number;
  pagelen: number;
  size: number;
  next?: string;
}

/**
 * Check if Bitbucket is configured
 */
export function isBitbucketConfigured(): boolean {
  return !!(BITBUCKET_CLIENT_ID && BITBUCKET_CLIENT_SECRET);
}

/**
 * Get OAuth authorization URL
 */
export function getBitbucketAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: BITBUCKET_CLIENT_ID!,
    redirect_uri: BITBUCKET_REDIRECT_URI,
    response_type: "code",
    scope: "account repository webhook",
    state,
  });

  return `https://bitbucket.org/site/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeBitbucketCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scopes: string;
}> {
  const basicAuth = Buffer.from(`${BITBUCKET_CLIENT_ID}:${BITBUCKET_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://bitbucket.org/site/oauth2/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: BITBUCKET_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bitbucket OAuth error: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshBitbucketToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const basicAuth = Buffer.from(`${BITBUCKET_CLIENT_ID}:${BITBUCKET_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://bitbucket.org/site/oauth2/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Bitbucket token");
  }

  return response.json();
}

/**
 * Create Bitbucket API client
 */
export function createBitbucketClient(accessToken: string) {
  async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${BITBUCKET_API_URL}${endpoint}`;

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
      throw new Error(`Bitbucket API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  return {
    /**
     * Get current user
     */
    async getUser(): Promise<BitbucketUser> {
      return request<BitbucketUser>("/user");
    },

    /**
     * List user's repositories
     */
    async listRepositories(options?: {
      page?: number;
      pagelen?: number;
      role?: "admin" | "contributor" | "member" | "owner";
      q?: string;
    }): Promise<BitbucketPaginatedResponse<BitbucketRepository>> {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.pagelen) params.set("pagelen", String(options.pagelen));
      if (options?.role) params.set("role", options.role);
      if (options?.q) params.set("q", options.q);

      return request<BitbucketPaginatedResponse<BitbucketRepository>>(
        `/repositories?${params.toString()}`
      );
    },

    /**
     * Get user's repositories (with workspace)
     */
    async listUserRepositories(
      workspace: string,
      options?: { page?: number; pagelen?: number }
    ): Promise<BitbucketPaginatedResponse<BitbucketRepository>> {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.pagelen) params.set("pagelen", String(options.pagelen || 25));

      return request<BitbucketPaginatedResponse<BitbucketRepository>>(
        `/repositories/${workspace}?${params.toString()}`
      );
    },

    /**
     * Get a repository
     */
    async getRepository(workspace: string, repoSlug: string): Promise<BitbucketRepository> {
      return request<BitbucketRepository>(`/repositories/${workspace}/${repoSlug}`);
    },

    /**
     * List repository branches
     */
    async listBranches(
      workspace: string,
      repoSlug: string,
      options?: { page?: number; pagelen?: number }
    ): Promise<BitbucketPaginatedResponse<BitbucketBranch>> {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.pagelen) params.set("pagelen", String(options.pagelen || 25));

      return request<BitbucketPaginatedResponse<BitbucketBranch>>(
        `/repositories/${workspace}/${repoSlug}/refs/branches?${params.toString()}`
      );
    },

    /**
     * Get a specific branch
     */
    async getBranch(
      workspace: string,
      repoSlug: string,
      branchName: string
    ): Promise<BitbucketBranch> {
      return request<BitbucketBranch>(
        `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`
      );
    },

    /**
     * List commits
     */
    async listCommits(
      workspace: string,
      repoSlug: string,
      options?: { branch?: string; page?: number; pagelen?: number }
    ): Promise<BitbucketPaginatedResponse<BitbucketCommit>> {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.pagelen) params.set("pagelen", String(options.pagelen || 25));
      const branchPath = options?.branch ? `/${encodeURIComponent(options.branch)}` : "";

      return request<BitbucketPaginatedResponse<BitbucketCommit>>(
        `/repositories/${workspace}/${repoSlug}/commits${branchPath}?${params.toString()}`
      );
    },

    /**
     * Get a specific commit
     */
    async getCommit(workspace: string, repoSlug: string, sha: string): Promise<BitbucketCommit> {
      return request<BitbucketCommit>(`/repositories/${workspace}/${repoSlug}/commit/${sha}`);
    },

    /**
     * Create a webhook
     */
    async createWebhook(
      workspace: string,
      repoSlug: string,
      webhookUrl: string,
      options?: {
        description?: string;
        events?: string[];
        active?: boolean;
      }
    ): Promise<BitbucketWebhook> {
      return request<BitbucketWebhook>(`/repositories/${workspace}/${repoSlug}/hooks`, {
        method: "POST",
        body: JSON.stringify({
          url: webhookUrl,
          description: options?.description || "Cloudify deployment webhook",
          active: options?.active ?? true,
          events: options?.events || ["repo:push", "pullrequest:created", "pullrequest:updated"],
        }),
      });
    },

    /**
     * List webhooks
     */
    async listWebhooks(
      workspace: string,
      repoSlug: string
    ): Promise<BitbucketPaginatedResponse<BitbucketWebhook>> {
      return request<BitbucketPaginatedResponse<BitbucketWebhook>>(
        `/repositories/${workspace}/${repoSlug}/hooks`
      );
    },

    /**
     * Delete a webhook
     */
    async deleteWebhook(workspace: string, repoSlug: string, hookUuid: string): Promise<void> {
      await request(`/repositories/${workspace}/${repoSlug}/hooks/${hookUuid}`, {
        method: "DELETE",
      });
    },

    /**
     * Download repository archive
     */
    async downloadArchive(
      workspace: string,
      repoSlug: string,
      options?: { ref?: string; format?: "zip" | "tar.gz" }
    ): Promise<ArrayBuffer> {
      const format = options?.format || "zip";
      const ref = options?.ref || "HEAD";

      // Bitbucket uses a different endpoint for downloads
      const url = `https://bitbucket.org/${workspace}/${repoSlug}/get/${ref}.${format}`;

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
 * Verify Bitbucket webhook signature
 */
export function verifyBitbucketWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Bitbucket uses HMAC-SHA256
  const expectedSignature = createHash("sha256")
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Parse Bitbucket webhook payload
 */
export interface BitbucketPushEvent {
  push: {
    changes: Array<{
      new: {
        type: "branch" | "tag";
        name: string;
        target: {
          hash: string;
          message: string;
          author: {
            raw: string;
            user?: BitbucketUser;
          };
          date: string;
        };
      };
      old?: {
        type: "branch" | "tag";
        name: string;
        target: { hash: string };
      };
    }>;
  };
  repository: BitbucketRepository;
  actor: BitbucketUser;
}

export interface BitbucketPullRequestEvent {
  pullrequest: {
    id: number;
    title: string;
    description: string;
    state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
    source: {
      branch: { name: string };
      commit: { hash: string };
    };
    destination: {
      branch: { name: string };
      commit: { hash: string };
    };
    links: {
      html: { href: string };
    };
  };
  repository: BitbucketRepository;
  actor: BitbucketUser;
}

export type BitbucketWebhookEvent = BitbucketPushEvent | BitbucketPullRequestEvent;

export function parseBitbucketWebhookEvent(
  eventKey: string,
  payload: unknown
): BitbucketWebhookEvent | null {
  if (eventKey === "repo:push") {
    return payload as BitbucketPushEvent;
  }
  if (eventKey.startsWith("pullrequest:")) {
    return payload as BitbucketPullRequestEvent;
  }
  return null;
}
