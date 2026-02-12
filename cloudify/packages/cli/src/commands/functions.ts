/**
 * Functions Command
 * Manage edge functions for a project
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest, getCurrentProject } from "../config.js";

interface CloudifyFunction {
  id: string;
  name: string;
  status: string;
  runtime: string;
  lastDeployedAt?: string;
  createdAt: string;
  url?: string;
}

interface FunctionLogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  duration?: number;
}

interface InvokeResponse {
  requestId: string;
  status: number;
  body: unknown;
  duration: number;
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

export async function functionsList(): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora("Fetching functions...").start();

  try {
    const response = await apiRequest<{ functions: CloudifyFunction[] }>(
      `/projects/${projectId}/functions`
    );

    spinner.stop();

    if (response.functions.length === 0) {
      console.log(chalk.yellow("No functions found."));
      console.log(chalk.gray("Run `cloudify functions deploy <name> --file <path>` to create one."));
      return;
    }

    console.log(chalk.cyan.bold("Edge Functions"));
    console.log("");

    const maxNameLength = Math.max(...response.functions.map((f) => f.name.length), 10);

    // Header
    console.log(
      chalk.gray(
        `${"NAME".padEnd(maxNameLength)}  ${"STATUS".padEnd(10)}  ${"RUNTIME".padEnd(10)}  LAST DEPLOYED`
      )
    );
    console.log(chalk.gray("-".repeat(maxNameLength + 45)));

    for (const fn of response.functions) {
      const statusColor = fn.status === "active" ? chalk.green : fn.status === "error" ? chalk.red : chalk.yellow;
      const lastDeployed = fn.lastDeployedAt
        ? new Date(fn.lastDeployedAt).toLocaleString()
        : chalk.gray("never");

      console.log(
        `${chalk.white(fn.name.padEnd(maxNameLength))}  ${statusColor(fn.status.padEnd(10))}  ${chalk.gray(fn.runtime.padEnd(10))}  ${lastDeployed}`
      );

      if (fn.url) {
        console.log(chalk.gray(`  ${fn.url}`));
      }
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.functions.length} function(s)`));
  } catch (error) {
    spinner.fail("Failed to fetch functions");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function functionsDeploy(
  name: string,
  options: { file?: string }
): Promise<void> {
  requireAuth();

  const projectId = getProjectId();

  if (!options.file) {
    console.error(chalk.red("Missing required option: --file <path>"));
    console.log(chalk.gray("Example: cloudify functions deploy my-function --file ./handler.ts"));
    process.exit(1);
  }

  const filePath = path.resolve(options.file);

  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    process.exit(1);
  }

  const spinner = ora(`Deploying function "${name}"...`).start();

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);

    const response = await apiRequest<{ function: CloudifyFunction }>(
      `/projects/${projectId}/functions/deploy`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          code: fileContent,
          filename: fileName,
        }),
      }
    );

    spinner.succeed(`Function "${chalk.cyan(name)}" deployed successfully!`);
    console.log("");
    console.log(`  ${chalk.gray("ID:")}      ${response.function.id}`);
    console.log(`  ${chalk.gray("Status:")}  ${chalk.green(response.function.status)}`);
    console.log(`  ${chalk.gray("Runtime:")} ${response.function.runtime}`);

    if (response.function.url) {
      console.log(`  ${chalk.gray("URL:")}     ${chalk.cyan.underline(response.function.url)}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail(`Failed to deploy function "${name}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function functionsLogs(
  name: string,
  options: { lines?: string }
): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const limit = parseInt(options.lines || "50", 10);
  const spinner = ora(`Fetching logs for function "${name}"...`).start();

  try {
    const response = await apiRequest<{ logs: FunctionLogEntry[] }>(
      `/projects/${projectId}/functions/${encodeURIComponent(name)}/logs?limit=${limit}`
    );

    spinner.stop();

    if (response.logs.length === 0) {
      console.log(chalk.yellow(`No logs found for function "${name}".`));
      return;
    }

    console.log(chalk.cyan(`Logs for function "${name}":`));
    console.log("");

    for (const entry of response.logs) {
      const time = chalk.gray(new Date(entry.timestamp).toLocaleTimeString());
      const level = formatLogLevel(entry.level);
      const duration = entry.duration != null ? chalk.gray(` (${entry.duration}ms)`) : "";
      const reqId = entry.requestId ? chalk.dim(` [${entry.requestId.substring(0, 8)}]`) : "";

      console.log(`${time} ${level}${reqId} ${entry.message}${duration}`);
    }

    console.log("");
    console.log(chalk.gray(`Showing ${response.logs.length} log entries`));
  } catch (error) {
    spinner.fail(`Failed to fetch logs for function "${name}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function functionsInvoke(
  name: string,
  options: { data?: string }
): Promise<void> {
  requireAuth();

  const projectId = getProjectId();

  let payload: unknown = {};
  if (options.data) {
    try {
      payload = JSON.parse(options.data);
    } catch {
      console.error(chalk.red("Invalid JSON data. Provide valid JSON with --data."));
      process.exit(1);
    }
  }

  const spinner = ora(`Invoking function "${name}"...`).start();

  try {
    const response = await apiRequest<InvokeResponse>(
      `/projects/${projectId}/functions/${encodeURIComponent(name)}/invoke`,
      {
        method: "POST",
        body: JSON.stringify({ payload }),
      }
    );

    spinner.succeed(`Function "${chalk.cyan(name)}" invoked successfully`);
    console.log("");
    console.log(`  ${chalk.gray("Request ID:")} ${response.requestId}`);
    console.log(`  ${chalk.gray("Status:")}     ${response.status}`);
    console.log(`  ${chalk.gray("Duration:")}   ${response.duration}ms`);
    console.log("");
    console.log(chalk.cyan("Response:"));
    console.log(JSON.stringify(response.body, null, 2));
  } catch (error) {
    spinner.fail(`Failed to invoke function "${name}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
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
