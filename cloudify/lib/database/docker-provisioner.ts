/**
 * Docker-Based Database Provisioner
 *
 * Provides utilities for creating, managing, and monitoring database containers
 * using Docker. Used by the Cloudify provider for self-hosted databases.
 */

import { execFile } from "child_process";
import { randomBytes } from "crypto";
import { promisify } from "util";
import { createLogger } from "@/lib/logging/logger";

const execFileAsync = promisify(execFile);
const log = createLogger("database:docker");

const DOCKER_NETWORK = process.env.CLOUDIFY_DOCKER_NETWORK || "cloudify_default";
const CONTAINER_PREFIX = "cloudify-db";

/**
 * Database container configuration
 */
export interface DatabaseContainerConfig {
  databaseId: string;
  type: "postgresql" | "mysql" | "redis";
  name: string;
  username: string;
  password: string;
}

/**
 * Container creation result
 */
export interface ContainerResult {
  containerId: string;
  containerName: string;
  host: string;
  port: number;
}

/**
 * Container stats
 */
export interface ContainerStats {
  cpuPercent: number;
  memoryUsageMB: number;
  memoryLimitMB: number;
  memoryPercent: number;
  networkInputMB: number;
  networkOutputMB: number;
  blockInputMB: number;
  blockOutputMB: number;
}

/**
 * Sanitize a string for use as a Docker container name or database name.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
function sanitizeName(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 63);
}

/**
 * Validate that a database ID is safe for use in Docker commands.
 */
function validateDatabaseId(databaseId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(databaseId)) {
    throw new Error(`Invalid database ID format: ${databaseId}`);
  }
  if (databaseId.length > 128) {
    throw new Error("Database ID is too long");
  }
}

/**
 * Get the container name for a database ID
 */
export function getContainerName(databaseId: string): string {
  validateDatabaseId(databaseId);
  return `${CONTAINER_PREFIX}-${databaseId}`;
}

/**
 * Generate secure database credentials
 */
export function generateDatabaseCredentials(): {
  username: string;
  password: string;
} {
  const username = `cloudify_${randomBytes(4).toString("hex")}`;
  const password = randomBytes(32).toString("hex");
  return { username, password };
}

/**
 * Ensure the Docker network exists
 */
async function ensureNetwork(): Promise<void> {
  try {
    await execFileAsync("docker", ["network", "inspect", DOCKER_NETWORK]);
  } catch {
    log.info("Creating Docker network", { network: DOCKER_NETWORK });
    await execFileAsync("docker", [
      "network",
      "create",
      DOCKER_NETWORK,
    ]);
  }
}

/**
 * Create a database container
 */
export async function createDatabaseContainer(
  type: "postgresql" | "mysql" | "redis",
  config: DatabaseContainerConfig
): Promise<ContainerResult> {
  validateDatabaseId(config.databaseId);

  const containerName = getContainerName(config.databaseId);
  const dbName = sanitizeName(config.name);

  log.info("Creating database container", {
    type,
    containerName,
    dbName,
  });

  // Ensure network exists
  await ensureNetwork();

  let args: string[];

  switch (type) {
    case "postgresql":
      args = [
        "run",
        "-d",
        "--name",
        containerName,
        "--network",
        DOCKER_NETWORK,
        "--restart",
        "unless-stopped",
        "-e",
        `POSTGRES_USER=${config.username}`,
        "-e",
        `POSTGRES_PASSWORD=${config.password}`,
        "-e",
        `POSTGRES_DB=${dbName}`,
        // Disable Unix sockets (LXC compatibility)
        "postgres:16-alpine",
        "postgres",
        "-c",
        "unix_socket_directories=",
      ];
      break;

    case "mysql":
      args = [
        "run",
        "-d",
        "--name",
        containerName,
        "--network",
        DOCKER_NETWORK,
        "--restart",
        "unless-stopped",
        "-e",
        `MYSQL_ROOT_PASSWORD=${config.password}`,
        "-e",
        `MYSQL_USER=${config.username}`,
        "-e",
        `MYSQL_PASSWORD=${config.password}`,
        "-e",
        `MYSQL_DATABASE=${dbName}`,
        "mysql:8",
      ];
      break;

    case "redis":
      args = [
        "run",
        "-d",
        "--name",
        containerName,
        "--network",
        DOCKER_NETWORK,
        "--restart",
        "unless-stopped",
        "redis:7-alpine",
        "redis-server",
        "--requirepass",
        config.password,
      ];
      break;

    default:
      throw new Error(`Unsupported database type: ${type}`);
  }

  const { stdout } = await execFileAsync("docker", args);
  const containerId = stdout.trim();

  log.info("Container created", {
    containerId: containerId.slice(0, 12),
    containerName,
  });

  const port = getDefaultPort(type);

  return {
    containerId,
    containerName,
    host: containerName,
    port,
  };
}

/**
 * Remove a database container
 */
export async function removeDatabaseContainer(
  containerIdOrName: string
): Promise<void> {
  // Validate input to prevent injection
  if (!/^[a-zA-Z0-9_.-]+$/.test(containerIdOrName)) {
    throw new Error(`Invalid container identifier: ${containerIdOrName}`);
  }

  log.info("Removing database container", { container: containerIdOrName });

  try {
    await execFileAsync("docker", ["rm", "-f", containerIdOrName]);
    log.info("Container removed", { container: containerIdOrName });
  } catch (error) {
    // Container may already be removed
    if (
      error instanceof Error &&
      error.message.includes("No such container")
    ) {
      log.warn("Container already removed", {
        container: containerIdOrName,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Get container stats (CPU, memory, etc.)
 */
export async function getDatabaseContainerStats(
  containerIdOrName: string
): Promise<ContainerStats> {
  // Validate input
  if (!/^[a-zA-Z0-9_.-]+$/.test(containerIdOrName)) {
    throw new Error(`Invalid container identifier: ${containerIdOrName}`);
  }

  const { stdout } = await execFileAsync("docker", [
    "stats",
    "--no-stream",
    "--format",
    "{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}",
    containerIdOrName,
  ]);

  const line = stdout.trim();
  if (!line) {
    throw new Error(`No stats returned for container: ${containerIdOrName}`);
  }

  const parts = line.split("\t");

  // Parse CPU percentage (e.g., "0.50%")
  const cpuPercent = parseFloat(parts[0]?.replace("%", "") || "0");

  // Parse memory usage (e.g., "25.6MiB / 512MiB")
  const memParts = parts[1]?.split("/").map((s) => s.trim()) || [];
  const memoryUsageMB = parseSizeToMB(memParts[0] || "0B");
  const memoryLimitMB = parseSizeToMB(memParts[1] || "0B");

  // Parse memory percentage
  const memoryPercent = parseFloat(parts[2]?.replace("%", "") || "0");

  // Parse network I/O (e.g., "1.5kB / 3.2kB")
  const netParts = parts[3]?.split("/").map((s) => s.trim()) || [];
  const networkInputMB = parseSizeToMB(netParts[0] || "0B");
  const networkOutputMB = parseSizeToMB(netParts[1] || "0B");

  // Parse block I/O (e.g., "8.19kB / 0B")
  const blockParts = parts[4]?.split("/").map((s) => s.trim()) || [];
  const blockInputMB = parseSizeToMB(blockParts[0] || "0B");
  const blockOutputMB = parseSizeToMB(blockParts[1] || "0B");

  return {
    cpuPercent,
    memoryUsageMB,
    memoryLimitMB,
    memoryPercent,
    networkInputMB,
    networkOutputMB,
    blockInputMB,
    blockOutputMB,
  };
}

/**
 * Check if a container exists and is running
 */
export async function isContainerRunning(
  containerIdOrName: string
): Promise<boolean> {
  if (!/^[a-zA-Z0-9_.-]+$/.test(containerIdOrName)) {
    return false;
  }

  try {
    const { stdout } = await execFileAsync("docker", [
      "inspect",
      "--format",
      "{{.State.Running}}",
      containerIdOrName,
    ]);
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

/**
 * Wait for a database to be ready to accept connections.
 * Polls the container until the database responds or the timeout is reached.
 */
export async function waitForDatabaseReady(
  type: "postgresql" | "mysql" | "redis",
  containerName: string,
  config: { username?: string; password?: string; database?: string },
  timeoutMs: number = 60000
): Promise<void> {
  validateDatabaseId(containerName.replace(`${CONTAINER_PREFIX}-`, ""));

  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds between checks

  log.info("Waiting for database readiness", {
    type,
    containerName,
    timeoutMs,
  });

  while (Date.now() - startTime < timeoutMs) {
    try {
      let isReady = false;

      switch (type) {
        case "postgresql":
          isReady = await checkPostgresReady(
            containerName,
            config.username || "postgres",
            config.database || "postgres"
          );
          break;

        case "mysql":
          isReady = await checkMysqlReady(
            containerName,
            config.password || ""
          );
          break;

        case "redis":
          isReady = await checkRedisReady(
            containerName,
            config.password || ""
          );
          break;
      }

      if (isReady) {
        const elapsed = Date.now() - startTime;
        log.info("Database is ready", {
          type,
          containerName,
          elapsedMs: elapsed,
        });
        return;
      }
    } catch {
      // Expected failures while DB is starting up
    }

    await sleep(pollInterval);
  }

  throw new Error(
    `Database ${containerName} did not become ready within ${timeoutMs}ms`
  );
}

/**
 * Check if PostgreSQL is ready using pg_isready inside the container
 */
async function checkPostgresReady(
  containerName: string,
  username: string,
  database: string
): Promise<boolean> {
  try {
    await execFileAsync("docker", [
      "exec",
      containerName,
      "pg_isready",
      "-h",
      "localhost",
      "-U",
      username,
      "-d",
      database,
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if MySQL is ready using mysqladmin ping inside the container
 */
async function checkMysqlReady(
  containerName: string,
  password: string
): Promise<boolean> {
  try {
    await execFileAsync("docker", [
      "exec",
      containerName,
      "mysqladmin",
      "ping",
      "-h",
      "localhost",
      `--password=${password}`,
      "--silent",
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Redis is ready using redis-cli ping inside the container
 */
async function checkRedisReady(
  containerName: string,
  password: string
): Promise<boolean> {
  try {
    const args = ["exec", containerName, "redis-cli"];
    if (password) {
      args.push("-a", password);
    }
    args.push("ping");

    const { stdout } = await execFileAsync("docker", args);
    return stdout.trim() === "PONG";
  } catch {
    return false;
  }
}

/**
 * Get default port for database type
 */
function getDefaultPort(type: "postgresql" | "mysql" | "redis"): number {
  switch (type) {
    case "postgresql":
      return 5432;
    case "mysql":
      return 3306;
    case "redis":
      return 6379;
  }
}

/**
 * Parse a Docker size string (e.g., "25.6MiB", "1.5GiB", "3.2kB") to megabytes
 */
function parseSizeToMB(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*([A-Za-z]+)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "b":
      return value / (1024 * 1024);
    case "kb":
    case "kib":
      return value / 1024;
    case "mb":
    case "mib":
      return value;
    case "gb":
    case "gib":
      return value * 1024;
    case "tb":
    case "tib":
      return value * 1024 * 1024;
    default:
      return value;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
