/**
 * Build Executor
 * Handles secure execution of build commands with Docker isolation
 *
 * SECURITY NOTES:
 * - Commands are validated before execution using whitelist approach
 * - shell: false is used to prevent command injection
 * - Paths are validated to prevent traversal attacks
 * - Environment variables are sanitized
 * - Docker containers run with limited privileges
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import {
  isValidBuildCommand,
  isValidPath,
  sanitizeEnvValue,
  isValidEnvKey,
  isValidGitHubUrl,
  isValidUrl,
  sanitizeSlug,
} from "@/lib/security/validation";

const REPOS_DIR = process.env.REPOS_DIR || "/data/repos";
const BUILDS_DIR = process.env.BUILDS_DIR || "/data/builds";
const CACHE_DIR = process.env.CACHE_DIR || "/data/cache";
const BUILD_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Parse GitHub URL to extract owner and repo name
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Match patterns like:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  const sshMatch = url.match(/github\.com:([^/]+)\/([^/.]+)/);

  const match = httpsMatch || sshMatch;
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

/**
 * Fetch default branch from GitHub API
 * Falls back to "main" if API call fails
 */
export async function getGitHubDefaultBranch(repoUrl: string): Promise<string> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return "main";
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Cloudify-Build-System",
        },
      }
    );

    if (!response.ok) {
      console.warn(`GitHub API returned ${response.status} for ${repoUrl}`);
      return "main";
    }

    const data = await response.json();
    return data.default_branch || "main";
  } catch (error) {
    console.warn(`Failed to fetch default branch for ${repoUrl}:`, error);
    return "main";
  }
}
// Set to "false" to run commands directly without Docker isolation
// This is less secure but works when Docker is not available inside the container
const USE_DOCKER_ISOLATION = process.env.USE_DOCKER_ISOLATION !== "false";

export interface BuildConfig {
  repoUrl: string;
  branch: string;
  installCmd: string;
  buildCmd: string;
  outputDir: string;
  rootDir: string;
  nodeVersion: string;
  envVars: Record<string, string>;
}

export interface LogCallback {
  (level: "info" | "warn" | "error" | "success", message: string): Promise<void>;
}

/**
 * Allowed Node.js versions for builds
 */
const ALLOWED_NODE_VERSIONS = ["16", "18", "20", "21", "22"];

/**
 * Validate build configuration for security issues
 */
export function validateBuildConfig(config: BuildConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate repository URL — must be HTTPS without embedded credentials
  if (!isValidGitHubUrl(config.repoUrl)) {
    try {
      const parsed = new URL(config.repoUrl);
      if (parsed.protocol !== "https:") {
        errors.push("Invalid repository URL - must use HTTPS");
      } else if (parsed.username || parsed.password) {
        errors.push("Invalid repository URL - must not contain credentials");
      }
    } catch {
      errors.push("Invalid repository URL - must be a valid GitHub or HTTPS URL");
    }
  }

  // Validate install command
  if (config.installCmd) {
    const installValidation = isValidBuildCommand(config.installCmd);
    if (!installValidation.valid) {
      errors.push(`Install command rejected: ${installValidation.reason}`);
    }
  }

  // Validate build command
  if (config.buildCmd) {
    const buildValidation = isValidBuildCommand(config.buildCmd);
    if (!buildValidation.valid) {
      errors.push(`Build command rejected: ${buildValidation.reason}`);
    }
  }

  // Validate output directory (prevent path traversal)
  if (!isValidPath(config.outputDir)) {
    errors.push("Invalid output directory - path traversal detected");
  }

  // Validate root directory
  if (config.rootDir && config.rootDir !== "./" && !isValidPath(config.rootDir)) {
    errors.push("Invalid root directory - path traversal detected");
  }

  // Validate node version (only allow specific versions)
  if (!ALLOWED_NODE_VERSIONS.includes(config.nodeVersion)) {
    errors.push(`Invalid Node.js version. Allowed: ${ALLOWED_NODE_VERSIONS.join(", ")}`);
  }

  // Validate branch name (prevent injection)
  if (!/^[a-zA-Z0-9._\/-]+$/.test(config.branch)) {
    errors.push("Invalid branch name - contains forbidden characters");
  }

  // Validate environment variable names
  for (const key of Object.keys(config.envVars)) {
    if (!isValidEnvKey(key)) {
      errors.push(`Invalid environment variable name: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Validate and resolve a path within a base directory
 * Prevents path traversal attacks
 */
function resolveSecurePath(basePath: string, relativePath: string): string | null {
  // Remove any null bytes
  const cleanPath = relativePath.replace(/\0/g, "");

  // Resolve the full path
  const resolved = path.resolve(basePath, cleanPath);

  // Normalize both paths
  const normalizedBase = path.normalize(basePath + path.sep);
  const normalizedResolved = path.normalize(resolved);

  // Check if resolved path is within base path
  if (!normalizedResolved.startsWith(normalizedBase) && normalizedResolved !== path.normalize(basePath)) {
    return null;
  }

  return resolved;
}

/**
 * Run command safely without shell interpretation
 * SECURITY: Uses shell: false to prevent command injection
 */
async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    onLog: LogCallback;
    timeout?: number;
  }
): Promise<{ success: boolean; code: number | null }> {
  return new Promise((resolve) => {
    // SECURITY: shell: false prevents command injection
    const proc: ChildProcess = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: false, // CRITICAL: Prevents shell metacharacter interpretation
    });

    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
      options.onLog("error", `Command timed out after ${(options.timeout || BUILD_TIMEOUT) / 1000}s`);
    }, options.timeout || BUILD_TIMEOUT);

    proc.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => options.onLog("info", line));
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => {
        // Git writes progress to stderr - classify as warn, not error
        const isGitProgress =
          /^(Cloning into|Receiving objects|Resolving deltas|remote:|Updating files|warning:)/i.test(line.trim());
        options.onLog(isGitProgress ? "warn" : "error", line);
      });
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        resolve({ success: false, code: -1 });
      } else {
        resolve({ success: code === 0, code });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      options.onLog("error", `Command failed: ${err.message}`);
      resolve({ success: false, code: -1 });
    });
  });
}

export async function cloneRepo(
  repoUrl: string,
  branch: string,
  targetDir: string,
  onLog: LogCallback
): Promise<boolean> {
  await ensureDir(REPOS_DIR);

  // Validate repo URL
  if (!isValidGitHubUrl(repoUrl) && !isValidUrl(repoUrl)) {
    await onLog("error", "Invalid repository URL");
    return false;
  }

  // Validate branch name
  if (!/^[a-zA-Z0-9._\/-]+$/.test(branch)) {
    await onLog("error", "Invalid branch name");
    return false;
  }

  // Clean up existing directory if it exists
  try {
    await fs.rm(targetDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, that's fine
  }

  await onLog("info", `Cloning ${repoUrl} (branch: ${branch})...`);

  const result = await runCommand(
    "git",
    ["clone", "--depth", "1", "--branch", branch, repoUrl, targetDir],
    { onLog, timeout: 2 * 60 * 1000 } // 2 min timeout for clone
  );

  if (result.success) {
    await onLog("success", "Repository cloned successfully");
  } else {
    await onLog("error", `Git clone failed with code ${result.code}`);
  }

  return result.success;
}

export async function runInstall(
  workDir: string,
  installCmd: string,
  nodeVersion: string,
  onLog: LogCallback,
  projectId?: string
): Promise<boolean> {
  // Validate install command
  const validation = isValidBuildCommand(installCmd);
  if (!validation.valid) {
    await onLog("error", `Install command rejected: ${validation.reason}`);
    return false;
  }

  // Validate node version
  if (!ALLOWED_NODE_VERSIONS.includes(nodeVersion)) {
    await onLog("error", `Invalid Node.js version: ${nodeVersion}`);
    return false;
  }

  await onLog("info", `Running: ${installCmd}`);

  let result: { success: boolean; code: number | null };

  if (USE_DOCKER_ISOLATION) {
    // Prepare cache volumes per project for faster rebuilds
    const cacheVolumes: string[] = [];
    if (projectId) {
      const projectCacheDir = path.join(CACHE_DIR, projectId);
      const nmCacheDir = path.join(projectCacheDir, "node_modules");
      await fs.mkdir(nmCacheDir, { recursive: true });
      cacheVolumes.push("-v", `${nmCacheDir}:/build/node_modules:rw`);
      await onLog("info", "Using cached node_modules volume");
    }

    // Run install command in Docker container with security options
    const dockerArgs = [
      "run",
      "--rm",
      "--network", "none", // Disable network during install (dependencies should be in package-lock)
      "--memory", "2g", // Limit memory
      "--cpus", "2", // Limit CPU
      "--pids-limit", "512", // Limit processes
      "--read-only", // Read-only root filesystem
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=512m", // Writable tmp
      "-v", `${workDir}:/build:rw`,
      ...cacheVolumes,
      "-w", "/build",
      `node:${nodeVersion}-alpine`,
      "sh", "-c", installCmd,
    ];

    result = await runCommand("docker", dockerArgs, {
      onLog,
      timeout: 5 * 60 * 1000, // 5 min for install
    });
  } else {
    // Run directly without Docker isolation (less secure, for environments without Docker)
    await onLog("info", "Running without Docker isolation");
    const cmdParts = installCmd.split(" ");
    const cmd = cmdParts[0];
    const args = cmdParts.slice(1);

    result = await runCommand(cmd, args, {
      cwd: workDir,
      onLog,
      timeout: 5 * 60 * 1000, // 5 min for install
    });
  }

  if (result.success) {
    await onLog("success", "Dependencies installed successfully");
  } else {
    await onLog("error", `Install failed with code ${result.code}`);
  }

  return result.success;
}

export async function runBuild(
  workDir: string,
  buildCmd: string,
  nodeVersion: string,
  envVars: Record<string, string>,
  onLog: LogCallback,
  projectId?: string
): Promise<boolean> {
  // Validate build command
  const validation = isValidBuildCommand(buildCmd);
  if (!validation.valid) {
    await onLog("error", `Build command rejected: ${validation.reason}`);
    return false;
  }

  // Validate node version
  if (!ALLOWED_NODE_VERSIONS.includes(nodeVersion)) {
    await onLog("error", `Invalid Node.js version: ${nodeVersion}`);
    return false;
  }

  await onLog("info", `Running: ${buildCmd}`);

  // Build environment variables
  // SECURITY: Sanitize env var values to prevent injection
  const sanitizedEnvVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(envVars)) {
    if (isValidEnvKey(key)) {
      sanitizedEnvVars[key] = sanitizeEnvValue(value);
    } else {
      await onLog("error", `Skipping invalid env var: ${key}`);
    }
  }

  let result: { success: boolean; code: number | null };

  if (USE_DOCKER_ISOLATION) {
    // Build environment variables args for docker
    const envArgs: string[] = [];
    for (const [key, value] of Object.entries(sanitizedEnvVars)) {
      envArgs.push("-e", `${key}=${value}`);
    }

    // Mount build cache volumes per project for incremental builds
    const cacheVolumes: string[] = [];
    if (projectId) {
      const projectCacheDir = path.join(CACHE_DIR, projectId);
      const buildCacheDir = path.join(projectCacheDir, "build-cache");
      const nmCacheDir = path.join(projectCacheDir, "node_modules");
      await fs.mkdir(buildCacheDir, { recursive: true });
      cacheVolumes.push("-v", `${nmCacheDir}:/build/node_modules:rw`);
      cacheVolumes.push("-v", `${buildCacheDir}:/build/.next/cache:rw`);
      await onLog("info", "Using cached build volumes");
    }

    const dockerArgs = [
      "run",
      "--rm",
      "--network", "none", // Disable network during build
      "--memory", "4g", // Limit memory
      "--cpus", "4", // Limit CPU
      "--pids-limit", "1024", // Limit processes
      "-v", `${workDir}:/build:rw`,
      ...cacheVolumes,
      "-w", "/build",
      ...envArgs,
      `node:${nodeVersion}-alpine`,
      "sh", "-c", buildCmd,
    ];

    result = await runCommand("docker", dockerArgs, {
      onLog,
      timeout: 8 * 60 * 1000, // 8 min for build
    });
  } else {
    // Run directly without Docker isolation (less secure, for environments without Docker)
    await onLog("info", "Running without Docker isolation");
    const cmdParts = buildCmd.split(" ");
    const cmd = cmdParts[0];
    const args = cmdParts.slice(1);

    result = await runCommand(cmd, args, {
      cwd: workDir,
      env: sanitizedEnvVars,
      onLog,
      timeout: 8 * 60 * 1000, // 8 min for build
    });
  }

  if (result.success) {
    await onLog("success", "Build completed successfully");
  } else {
    await onLog("error", `Build failed with code ${result.code}`);
  }

  return result.success;
}

export async function copyOutput(
  workDir: string,
  outputDir: string,
  siteSlug: string,
  onLog: LogCallback
): Promise<{ success: boolean; artifactPath: string }> {
  // Normalize outputDir: treat ".", "./", and empty string as root
  const normalizedOutputDir = outputDir.replace(/^\.?\/?$/, ".") || ".";
  const isRootDir = normalizedOutputDir === "." || normalizedOutputDir === "./";

  // SECURITY: Validate output directory to prevent path traversal
  const sourcePath = resolveSecurePath(workDir, normalizedOutputDir);
  if (!sourcePath) {
    await onLog("error", `Invalid output directory: path traversal detected`);
    return { success: false, artifactPath: "" };
  }

  // Ensure source path is within workDir (use normalized comparison)
  const normalizedWork = path.normalize(workDir);
  const normalizedSource = path.normalize(sourcePath);
  if (!normalizedSource.startsWith(normalizedWork)) {
    await onLog("error", `Output directory escapes work directory`);
    return { success: false, artifactPath: "" };
  }

  // Sanitize site slug
  const sanitizedSlug = sanitizeSlug(siteSlug);
  if (!sanitizedSlug) {
    await onLog("error", `Invalid site slug`);
    return { success: false, artifactPath: "" };
  }

  const destPath = path.join(BUILDS_DIR, sanitizedSlug);

  await onLog("info", `Copying build output from ${normalizedOutputDir} to ${destPath}...`);

  // Ensure builds directory exists
  await ensureDir(BUILDS_DIR);

  // Remove existing deployment if it exists
  try {
    await fs.rm(destPath, { recursive: true, force: true });
  } catch {
    // Doesn't exist, that's fine
  }

  // Check if source exists
  try {
    const stat = await fs.stat(sourcePath);
    if (!stat.isDirectory()) {
      await onLog("error", `Output directory ${normalizedOutputDir} is not a directory`);
      return { success: false, artifactPath: "" };
    }
  } catch {
    await onLog("error", `Output directory ${normalizedOutputDir} does not exist`);
    return { success: false, artifactPath: "" };
  }

  let result: { success: boolean; code: number | null };

  if (isRootDir) {
    // When outputDir is root, copy only deployable files (exclude .git, node_modules, etc.)
    // First create the destination directory
    await ensureDir(destPath);

    // Use rsync-style copy: cp contents excluding build artifacts
    // We use a two-step approach: copy everything, then remove unwanted dirs
    result = await runCommand("cp", ["-r", `${sourcePath}/.`, destPath], {
      onLog,
      timeout: 60 * 1000,
    });

    if (result.success) {
      // Clean up non-deployable directories from the copied output
      const excludeDirs = [".git", "node_modules", ".next", ".cache", ".turbo"];
      for (const dir of excludeDirs) {
        const excludePath = path.join(destPath, dir);
        try {
          await fs.rm(excludePath, { recursive: true, force: true });
        } catch {
          // Directory doesn't exist, that's fine
        }
      }
      await onLog("info", "Excluded non-deployable directories (.git, node_modules, etc.)");
    }
  } else {
    // For specific output directories (dist, out, build, .next, etc.),
    // copy the directory contents directly to destPath
    await ensureDir(destPath);
    result = await runCommand("cp", ["-r", `${sourcePath}/.`, destPath], {
      onLog,
      timeout: 60 * 1000,
    });
  }

  if (result.success) {
    await onLog("success", `Build artifacts copied to ${destPath}`);
  }

  return { success: result.success, artifactPath: destPath };
}

export async function cleanupRepo(workDir: string, onLog: LogCallback): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
    await onLog("info", "Cleaned up temporary files");
  } catch (err) {
    await onLog("error", `Failed to cleanup: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Generate site slug from project slug.
 *
 * For production deploys (no deploymentId), returns the bare project slug
 * so DNS records and K8s resources map 1:1 with the project.
 *
 * For preview deploys, appends a short deployment ID prefix to create a
 * unique slug (e.g. "my-project-abc1234") that won't overwrite production.
 */
export function generateSiteSlug(projectSlug: string, deploymentId?: string): string {
  if (deploymentId) {
    return sanitizeSlug(`${projectSlug}-${deploymentId.substring(0, 7)}`);
  }
  return sanitizeSlug(projectSlug);
}

export function generateDeploymentUrl(siteSlug: string): string {
  const baseDomain = process.env.BASE_DOMAIN || process.env.DEPLOYMENT_BASE_URL || "tranthachnguyen.com";
  return `https://${siteSlug}.${baseDomain}`;
}
