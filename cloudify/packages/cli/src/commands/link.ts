/**
 * Link/Unlink Commands
 *
 * Link or unlink the current directory to a Cloudify project.
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { requireAuth, apiRequest, getProjectConfig, saveProjectConfig } from "../config.js";

interface LinkOptions {
  project?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ProjectsResponse {
  projects: Project[];
}

export async function link(options: LinkOptions): Promise<void> {
  requireAuth();

  const cwd = process.cwd();
  const existingConfig = getProjectConfig(cwd);

  if (existingConfig?.projectId) {
    console.log(chalk.yellow(`This directory is already linked to project: ${existingConfig.projectSlug || existingConfig.projectId}`));

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Do you want to link to a different project?",
        default: false,
      },
    ]);

    if (!confirm) return;
  }

  let projectSlug = options.project;

  if (!projectSlug) {
    const spinner = ora("Fetching your projects...").start();

    try {
      const response = await apiRequest<ProjectsResponse>("/projects");
      spinner.stop();

      if (response.projects.length === 0) {
        console.log(chalk.yellow("No projects found."));
        console.log(chalk.gray("Run `cloudify init` to create a new project."));
        return;
      }

      const { selectedProject } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedProject",
          message: "Select a project to link:",
          choices: response.projects.map((p) => ({
            name: `${p.name} (${p.slug})`,
            value: p.slug,
          })),
        },
      ]);

      projectSlug = selectedProject;
    } catch (error) {
      spinner.fail("Failed to fetch projects");
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  }

  const spinner = ora(`Linking to ${projectSlug}...`).start();

  try {
    // Verify the project exists
    const response = await apiRequest<{ project: Project }>(`/projects/by-slug/${projectSlug}`);

    // Save the link in cloudify.json
    saveProjectConfig(cwd, {
      projectId: response.project.id,
      projectSlug: response.project.slug,
      projectName: response.project.name,
    });

    spinner.succeed(`Linked to ${chalk.cyan(response.project.name)} (${response.project.slug})`);
    console.log("");
    console.log(chalk.gray("Configuration saved to cloudify.json"));
    console.log(chalk.gray("Run `cloudify deploy` to deploy your project."));
  } catch (error) {
    spinner.fail(`Failed to link to ${projectSlug}`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function unlink(): Promise<void> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "cloudify.json");

  if (!fs.existsSync(configPath)) {
    console.log(chalk.yellow("This directory is not linked to any Cloudify project."));
    return;
  }

  const config = getProjectConfig(cwd);
  const projectName = config?.projectSlug || config?.projectId || "unknown";

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Unlink from project "${projectName}"?`,
      default: false,
    },
  ]);

  if (!confirm) return;

  try {
    fs.unlinkSync(configPath);
    console.log(chalk.green("Successfully unlinked from project."));
  } catch (error) {
    console.error(chalk.red("Failed to remove cloudify.json"));
    process.exit(1);
  }
}
