/**
 * Configuration management for the CLI
 */

import Conf from "conf";
import chalk from "chalk";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";

interface CloudifyConfig {
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt?: string;
  };
  currentProject?: string;
  apiUrl: string;
}

// Global configuration stored in ~/.cloudify
export const config = new Conf<CloudifyConfig>({
  projectName: "cloudify",
  defaults: {
    apiUrl: "https://cloudify.tranthachnguyen.com",
  },
});

// Project-specific configuration stored in cloudify.json
const PROJECT_CONFIG_FILE = "cloudify.json";

interface ProjectConfig {
  projectId: string;
  projectSlug?: string;
  projectName?: string;
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
}

export function getProjectConfig(cwd?: string): ProjectConfig | null {
  const configPath = join(cwd || process.cwd(), PROJECT_CONFIG_FILE);
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

export function saveProjectConfig(cwd: string, projectConfig: Partial<ProjectConfig>): void {
  const configPath = join(cwd, PROJECT_CONFIG_FILE);
  const existing = getProjectConfig(cwd) || {};
  const merged = { ...existing, ...projectConfig };
  writeFileSync(configPath, JSON.stringify(merged, null, 2));
}

export function removeProjectConfig(cwd?: string): void {
  const configPath = join(cwd || process.cwd(), PROJECT_CONFIG_FILE);
  if (existsSync(configPath)) {
    unlinkSync(configPath);
  }
}

export function getToken(): string | undefined {
  return config.get("token");
}

export function setToken(token: string): void {
  config.set("token", token);
}

export function clearToken(): void {
  config.delete("token");
}

export function getUser(): CloudifyConfig["user"] | undefined {
  return config.get("user");
}

export function setUser(user: CloudifyConfig["user"]): void {
  config.set("user", user);
}

export function clearUser(): void {
  config.delete("user");
}

export function clearAuth(): void {
  config.delete("token");
  config.delete("user");
}

export function getApiUrl(): string {
  return process.env.CLOUDIFY_API_URL || config.get("apiUrl") || "https://cloudify.tranthachnguyen.com";
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

// API request helper
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const apiUrl = getApiUrl();

  const url = endpoint.startsWith("http") ? endpoint : `${apiUrl}/api${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || "API request failed");
  }

  return response.json();
}
