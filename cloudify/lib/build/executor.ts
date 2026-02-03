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
const BUILD_TIMEOUT = 10 * 60 * 1000; // 10 minutes

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
  (level: "info" | "error" | "success", message: string): Promise<void>;
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

  // Validate repository URL
  if (!isValidGitHubUrl(config.repoUrl) && !isValidUrl(config.repoUrl)) {
    errors.push("Invalid repository URL - must be a valid GitHub or HTTPS URL");
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
      lines.forEach((line) => options.onLog("error", line));
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
  onLog: LogCallback
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
    "-w", "/build",
    `node:${nodeVersion}-alpine`,
    "sh", "-c", installCmd,
  ];

  const result = await runCommand("docker", dockerArgs, {
    onLog,
    timeout: 5 * 60 * 1000, // 5 min for install
  });

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
  onLog: LogCallback
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

  // Build environment variables args for docker
  // SECURITY: Sanitize env var values to prevent injection
  const envArgs: string[] = [];
  for (const [key, value] of Object.entries(envVars)) {
    if (isValidEnvKey(key)) {
      const sanitizedValue = sanitizeEnvValue(value);
      envArgs.push("-e", `${key}=${sanitizedValue}`);
    } else {
      await onLog("error", `Skipping invalid env var: ${key}`);
    }
  }

  const dockerArgs = [
    "run",
    "--rm",
    "--network", "none", // Disable network during build
    "--memory", "4g", // Limit memory
    "--cpus", "4", // Limit CPU
    "--pids-limit", "1024", // Limit processes
    "-v", `${workDir}:/build:rw`,
    "-w", "/build",
    ...envArgs,
    `node:${nodeVersion}-alpine`,
    "sh", "-c", buildCmd,
  ];

  const result = await runCommand("docker", dockerArgs, {
    onLog,
    timeout: 8 * 60 * 1000, // 8 min for build
  });

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
  // SECURITY: Validate output directory to prevent path traversal
  const sourcePath = resolveSecurePath(workDir, outputDir);
  if (!sourcePath) {
    await onLog("error", `Invalid output directory: path traversal detected`);
    return { success: false, artifactPath: "" };
  }

  // Ensure source path is within workDir
  if (!sourcePath.startsWith(path.normalize(workDir))) {
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

  await onLog("info", `Copying build output from ${outputDir} to ${destPath}...`);

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
      await onLog("error", `Output directory ${outputDir} is not a directory`);
      return { success: false, artifactPath: "" };
    }
  } catch {
    await onLog("error", `Output directory ${outputDir} does not exist`);
    return { success: false, artifactPath: "" };
  }

  // Copy the output directory
  const result = await runCommand("cp", ["-r", sourcePath, destPath], {
    onLog,
    timeout: 60 * 1000, // 1 min for copy
  });

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
 * Generate site slug from project slug
 * Uses project slug only (not deployment ID) so each deployment updates the same site
 * This ensures DNS records and K8s resources are properly cleaned up on project deletion
 */
export function generateSiteSlug(projectSlug: string, _deploymentId?: string): string {
  return sanitizeSlug(projectSlug);
}

export function generateDeploymentUrl(siteSlug: string): string {
  const baseDomain = process.env.BASE_DOMAIN || process.env.DEPLOYMENT_BASE_URL || "tranthachnguyen.com";
  return `https://${siteSlug}.${baseDomain}`;
}
