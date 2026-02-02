/**
 * Logs Command
 * Stream or fetch deployment logs
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest, getCurrentProject, getConfig } from "../config";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  deploymentId?: string;
}

interface LogsOptions {
  follow?: boolean;
  lines?: string;
  deployment?: string;
  filter?: string;
}

function getProjectId(): string {
  const cwd = process.cwd();
  const cloudifyConfigPath = path.join(cwd, "cloudify.json");

  if (fs.existsSync(cloudifyConfigPath)) {
    const config = JSON.parse(fs.readFileSync(cloudifyConfigPath, "utf-8"));
    return config.projectId;
  }

  const currentProject = getCurrentProject();
  if (currentProject) {
    return currentProject;
  }

  console.error(chalk.red("No project found. Run `cloudify init` or link to a project."));
  process.exit(1);
}

function formatLogLevel(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
      return chalk.red(level.toUpperCase().padEnd(5));
    case "warn":
      return chalk.yellow(level.toUpperCase().padEnd(5));
    case "info":
      return chalk.blue(level.toUpperCase().padEnd(5));
    case "debug":
      return chalk.gray(level.toUpperCase().padEnd(5));
    default:
      return chalk.white(level.toUpperCase().padEnd(5));
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return chalk.gray(date.toLocaleTimeString());
}

function printLogEntry(entry: LogEntry, filter?: string): void {
  // Apply filter if provided
  if (filter && !entry.message.toLowerCase().includes(filter.toLowerCase())) {
    return;
  }

  const time = formatTimestamp(entry.timestamp);
  const level = formatLogLevel(entry.level);
  const source = entry.source ? chalk.cyan(`[${entry.source}]`) : "";

  console.log(`${time} ${level} ${source} ${entry.message}`);
}

export async function logs(options: LogsOptions): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const lines = parseInt(options.lines || "100", 10);
  const deploymentId = options.deployment;

  if (options.follow) {
    // Stream logs in real-time using SSE
    await streamLogs(projectId, deploymentId, options.filter);
  } else {
    // Fetch recent logs
    await fetchLogs(projectId, lines, deploymentId, options.filter);
  }
}

async function fetchLogs(
  projectId: string,
  lines: number,
  deploymentId?: string,
  filter?: string
): Promise<void> {
  const spinner = ora("Fetching logs...").start();

  try {
    const query = new URLSearchParams();
    query.set("limit", lines.toString());
    if (deploymentId) {
      query.set("deploymentId", deploymentId);
    }

    const response = await apiRequest<{ logs: LogEntry[] }>(
      `/projects/${projectId}/logs?${query.toString()}`
    );

    spinner.stop();

    if (response.logs.length === 0) {
      console.log(chalk.yellow("No logs found."));
      return;
    }

    console.log(chalk.cyan(`Showing last ${response.logs.length} log entries:`));
    console.log("");

    for (const entry of response.logs) {
      printLogEntry(entry, filter);
    }

    console.log("");
    console.log(chalk.gray("Use --follow to stream logs in real-time"));
  } catch (error) {
    spinner.fail("Failed to fetch logs");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

async function streamLogs(
  projectId: string,
  deploymentId?: string,
  filter?: string
): Promise<void> {
  const config = getConfig();
  const apiUrl = config.get("apiUrl") || "https://cloudify.tranthachnguyen.com/api";
  const token = config.get("token");

  const query = new URLSearchParams();
  if (deploymentId) {
    query.set("deploymentId", deploymentId);
  }

  const url = `${apiUrl}/projects/${projectId}/logs/stream?${query.toString()}`;

  console.log(chalk.cyan("Streaming logs... (Ctrl+C to stop)"));
  console.log("");

  try {
    // Use fetch with streaming
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log(chalk.gray("Stream ended"));
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process SSE events
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            printLogEntry(data, filter);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.log(chalk.gray("\nStream stopped"));
    } else {
      console.error(chalk.red("Stream error: " + (error as Error).message));
      process.exit(1);
    }
  }
}

export async function buildLogs(deploymentId: string): Promise<void> {
  requireAuth();

  const spinner = ora("Fetching build logs...").start();

  try {
    const response = await apiRequest<{ logs: string }>(
      `/deployments/${deploymentId}/build-logs`
    );

    spinner.stop();

    console.log(chalk.cyan("Build Logs:"));
    console.log("");
    console.log(response.logs);
  } catch (error) {
    spinner.fail("Failed to fetch build logs");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
