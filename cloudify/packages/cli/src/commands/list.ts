/**
 * List Command
 *
 * Lists all projects for the current user.
 */

import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest } from "../config.js";

interface Project {
  id: string;
  name: string;
  slug: string;
  framework: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  domains: Array<{ domain: string; isPrimary: boolean }>;
}

interface ProjectsResponse {
  projects: Project[];
}

export async function list(): Promise<void> {
  requireAuth();

  const spinner = ora("Fetching projects...").start();

  try {
    const response = await apiRequest<ProjectsResponse>("/projects");
    spinner.stop();

    if (response.projects.length === 0) {
      console.log(chalk.yellow("No projects found."));
      console.log(chalk.gray("Run `cloudify init` to create a new project."));
      return;
    }

    console.log("");
    console.log(chalk.cyan.bold("Your Projects"));
    console.log("");

    const maxNameLength = Math.max(...response.projects.map((p) => p.name.length), 10);
    const maxSlugLength = Math.max(...response.projects.map((p) => p.slug.length), 10);

    // Header
    console.log(
      chalk.gray(
        `${"NAME".padEnd(maxNameLength)}  ${"SLUG".padEnd(maxSlugLength)}  ${"STATUS".padEnd(10)}  FRAMEWORK`
      )
    );
    console.log(chalk.gray("-".repeat(maxNameLength + maxSlugLength + 30)));

    // Projects
    for (const project of response.projects) {
      const statusColor = project.status === "active" ? chalk.green : chalk.yellow;
      console.log(
        `${project.name.padEnd(maxNameLength)}  ${chalk.cyan(project.slug.padEnd(maxSlugLength))}  ${statusColor(project.status.padEnd(10))}  ${project.framework || "-"}`
      );

      // Show primary domain if exists
      const primaryDomain = project.domains?.find((d) => d.isPrimary);
      if (primaryDomain) {
        console.log(chalk.gray(`  └─ https://${primaryDomain.domain}`));
      }
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.projects.length} project(s)`));
  } catch (error) {
    spinner.fail("Failed to fetch projects");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
