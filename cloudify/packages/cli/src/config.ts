/**
 * CLI Configuration
 *
 * Handles authentication tokens and project linking.
 */

import Conf from "conf";
import chalk from "chalk";

interface CloudifyConfig {
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  currentProject?: string;
  apiUrl: string;
}

const config = new Conf<CloudifyConfig>({
  projectName: "cloudify-cli",
  defaults: {
    apiUrl: "https://cloudify.tranthachnguyen.com/api",
  },
});

export function getApiUrl(): string {
  return process.env.CLOUDIFY_API_URL || config.get("apiUrl");
}

export function getToken(): string | undefined {
  return process.env.CLOUDIFY_TOKEN || config.get("token");
}

export function setToken(token: string): void {
  config.set("token", token);
}

export function clearToken(): void {
  config.delete("token");
  config.delete("user");
}

export function getUser(): CloudifyConfig["user"] | undefined {
  return config.get("user");
}

export function setUser(user: CloudifyConfig["user"]): void {
  config.set("user", user);
}

export function getCurrentProject(): string | undefined {
  return config.get("currentProject");
}

export function setCurrentProject(projectId: string): void {
  config.set("currentProject", projectId);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function requireAuth(): void {
  if (!isLoggedIn()) {
    console.log(chalk.red("Error: Not logged in."));
    console.log(chalk.gray("Run `cloudify login` to authenticate."));
    process.exit(1);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(errorBody.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getConfig(): typeof config {
  return config;
}

export { config };
