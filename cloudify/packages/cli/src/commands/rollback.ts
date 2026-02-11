/**
 * Rollback Command
 * Rollback to a previous deployment
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { requireAuth, apiRequest, getCurrentProject } from "../config.js";

interface Deployment {
  id: string;
  status: string;
  createdAt: string;
  commitMessage?: string;
  commitSha?: string;
  isActive: boolean;
  url?: string;
}

interface RollbackOptions {
  yes?: boolean;
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString();
}

export async function rollback(
  deploymentId: string | undefined,
  options: RollbackOptions
): Promise<void> {
  requireAuth();

  const projectId = getProjectId();

  // If no deployment ID provided, show list of recent deployments
  if (!deploymentId) {
    const spinner = ora("Fetching deployments...").start();

    try {
      const response = await apiRequest<{ deployments: Deployment[] }>(
        `/projects/${projectId}/deployments?limit=10&status=ready`
      );

      spinner.stop();

      if (response.deployments.length === 0) {
        console.log(chalk.yellow("No deployments available for rollback."));
        return;
      }

      // Filter out the current active deployment
      const availableDeployments = response.deployments.filter((d) => !d.isActive);

      if (availableDeployments.length === 0) {
        console.log(chalk.yellow("No previous deployments available for rollback."));
        return;
      }

      // Let user select a deployment
      const { selectedDeployment } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedDeployment",
          message: "Select deployment to rollback to:",
          choices: availableDeployments.map((d) => ({
            name: `${d.id.substring(0, 8)} - ${formatDate(d.createdAt)} ${
              d.commitMessage ? `- ${d.commitMessage.substring(0, 40)}` : ""
            }`,
            value: d.id,
          })),
        },
      ]);

      deploymentId = selectedDeployment;
    } catch (error) {
      spinner.fail("Failed to fetch deployments");
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  }

  // Confirm rollback
  if (!options.yes) {
    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: `Are you sure you want to rollback to deployment ${deploymentId!.substring(0, 8)}?`,
        default: false,
      },
    ]);

    if (!confirmed) {
      console.log(chalk.gray("Rollback cancelled."));
      return;
    }
  }

  // Perform rollback
  const spinner = ora("Rolling back...").start();

  try {
    const response = await apiRequest<{
      success: boolean;
      deployment: Deployment;
      message: string;
    }>(`/deployments/${deploymentId}/rollback`, {
      method: "POST",
    });

    spinner.succeed(chalk.green("Rollback successful!"));
    console.log("");
    console.log(chalk.cyan("Deployment ID:"), response.deployment.id);
    if (response.deployment.url) {
      console.log(chalk.cyan("URL:"), response.deployment.url);
    }
    console.log("");
    console.log(chalk.gray(response.message));
  } catch (error) {
    spinner.fail("Rollback failed");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function listDeployments(): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora("Fetching deployments...").start();

  try {
    const response = await apiRequest<{ deployments: Deployment[] }>(
      `/projects/${projectId}/deployments?limit=20`
    );

    spinner.stop();

    if (response.deployments.length === 0) {
      console.log(chalk.yellow("No deployments found."));
      return;
    }

    console.log(chalk.cyan("Recent Deployments:"));
    console.log("");

    for (const d of response.deployments) {
      const statusColor =
        d.status === "ready"
          ? chalk.green
          : d.status === "error"
          ? chalk.red
          : d.status === "building"
          ? chalk.yellow
          : chalk.gray;

      const active = d.isActive ? chalk.cyan(" ● LIVE") : "";
      const commit = d.commitSha ? chalk.gray(` (${d.commitSha.substring(0, 7)})`) : "";

      console.log(
        `  ${chalk.white(d.id.substring(0, 8))} ${statusColor(d.status.padEnd(10))}${active}`
      );
      console.log(`    ${chalk.gray(formatDate(d.createdAt))}${commit}`);
      if (d.commitMessage) {
        console.log(`    ${chalk.gray(d.commitMessage.substring(0, 60))}`);
      }
      console.log("");
    }
  } catch (error) {
    spinner.fail("Failed to fetch deployments");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
