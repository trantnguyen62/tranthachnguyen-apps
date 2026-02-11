/**
 * Env Command
 * Manage environment variables
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { requireAuth, apiRequest, getCurrentProject } from "../config.js";

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  target: string[];
  createdAt: string;
}

interface EnvListOptions {
  environment?: string;
}

interface EnvAddOptions {
  environment?: string;
}

interface EnvRemoveOptions {
  environment?: string;
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

export async function envList(options: EnvListOptions): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const target = options.environment || "all";

  const spinner = ora("Fetching environment variables...").start();

  try {
    const response = await apiRequest<{ variables: EnvVariable[] }>(
      `/projects/${projectId}/env${target !== "all" ? `?target=${target}` : ""}`
    );

    spinner.stop();

    if (response.variables.length === 0) {
      console.log(chalk.yellow("No environment variables found."));
      return;
    }

    console.log(chalk.cyan("Environment Variables:"));
    console.log("");

    // Group by key
    const grouped = new Map<string, EnvVariable[]>();
    for (const v of response.variables) {
      const existing = grouped.get(v.key) || [];
      existing.push(v);
      grouped.set(v.key, existing);
    }

    for (const [key, vars] of grouped) {
      const targets = vars.flatMap((v) => v.target).join(", ");
      // Mask the value for security
      const masked = vars[0].value.substring(0, 3) + "..." + vars[0].value.slice(-3);
      console.log(`  ${chalk.white(key)}=${chalk.gray(masked)} ${chalk.dim(`(${targets})`)}`);
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.variables.length} variables`));
  } catch (error) {
    spinner.fail("Failed to fetch environment variables");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function envAdd(
  key: string | undefined,
  value: string | undefined,
  options: EnvAddOptions
): Promise<void> {
  requireAuth();

  const projectId = getProjectId();

  // Interactive mode if key/value not provided
  if (!key || !value) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "key",
        message: "Variable name:",
        when: !key,
        validate: (input) => /^[A-Z_][A-Z0-9_]*$/i.test(input) || "Invalid variable name",
      },
      {
        type: "input",
        name: "value",
        message: "Value:",
        when: !value,
      },
      {
        type: "checkbox",
        name: "target",
        message: "Environments:",
        choices: [
          { name: "Production", value: "production", checked: true },
          { name: "Preview", value: "preview", checked: true },
          { name: "Development", value: "development", checked: true },
        ],
      },
    ]);

    key = key || answers.key;
    value = value || answers.value;
    options.environment = answers.target?.join(",") || options.environment;
  }

  const targets = options.environment?.split(",") || ["production", "preview", "development"];

  const spinner = ora("Adding environment variable...").start();

  try {
    await apiRequest(`/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify({
        key,
        value,
        target: targets,
      }),
    });

    spinner.succeed(`Added ${chalk.cyan(key)} to ${targets.join(", ")}`);
  } catch (error) {
    spinner.fail("Failed to add environment variable");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function envRemove(key: string, options: EnvRemoveOptions): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const target = options.environment;

  const spinner = ora("Removing environment variable...").start();

  try {
    await apiRequest(
      `/projects/${projectId}/env/${key}${target ? `?target=${target}` : ""}`,
      { method: "DELETE" }
    );

    spinner.succeed(`Removed ${chalk.cyan(key)}${target ? ` from ${target}` : ""}`);
  } catch (error) {
    spinner.fail("Failed to remove environment variable");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function envPull(filename?: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const outputFile = filename || ".env.local";

  const spinner = ora("Pulling environment variables...").start();

  try {
    const response = await apiRequest<{ variables: EnvVariable[] }>(
      `/projects/${projectId}/env?target=development`
    );

    // Write to file
    const content = response.variables
      .map((v) => `${v.key}=${v.value}`)
      .join("\n");

    fs.writeFileSync(path.join(process.cwd(), outputFile), content + "\n");

    spinner.succeed(`Wrote ${response.variables.length} variables to ${chalk.cyan(outputFile)}`);
  } catch (error) {
    spinner.fail("Failed to pull environment variables");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function envPush(options: { environment?: string }): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const cwd = process.cwd();
  const target = options.environment || "development";

  // Look for .env files
  const envFiles = [".env.local", ".env", `.env.${target}`];
  let envFile: string | null = null;

  for (const file of envFiles) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      envFile = filePath;
      break;
    }
  }

  if (!envFile) {
    console.log(chalk.yellow("No .env file found."));
    console.log(chalk.gray("Create a .env.local or .env file with your variables."));
    return;
  }

  const spinner = ora(`Pushing environment variables from ${path.basename(envFile)}...`).start();

  try {
    // Parse .env file
    const content = fs.readFileSync(envFile, "utf-8");
    const lines = content.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("#");
    });

    const variables: Array<{ key: string; value: string }> = [];
    for (const line of lines) {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim();
        let value = line.substring(eqIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        variables.push({ key, value });
      }
    }

    if (variables.length === 0) {
      spinner.warn("No variables found in .env file");
      return;
    }

    // Push each variable
    let successCount = 0;
    for (const { key, value } of variables) {
      try {
        await apiRequest(`/projects/${projectId}/env`, {
          method: "POST",
          body: JSON.stringify({
            key,
            value,
            target: [target],
          }),
        });
        successCount++;
      } catch {
        // Variable might already exist, try updating
        try {
          await apiRequest(`/projects/${projectId}/env/${key}`, {
            method: "PUT",
            body: JSON.stringify({
              value,
              target: [target],
            }),
          });
          successCount++;
        } catch (updateError) {
          console.log(chalk.yellow(`\nFailed to set ${key}: ${(updateError as Error).message}`));
        }
      }
    }

    spinner.succeed(`Pushed ${chalk.cyan(successCount)}/${variables.length} variables to ${chalk.cyan(target)}`);
  } catch (error) {
    spinner.fail("Failed to push environment variables");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
