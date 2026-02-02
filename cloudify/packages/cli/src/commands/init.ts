/**
 * Init Command
 * Initialize a new Cloudify project
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { requireAuth, apiRequest, setCurrentProject } from "../config";

interface InitOptions {
  yes?: boolean;
}

export async function init(options: InitOptions): Promise<void> {
  requireAuth();

  console.log(chalk.cyan("Initialize a new Cloudify project"));
  console.log("");

  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, "package.json");

  // Detect project info from package.json
  let defaultName = path.basename(cwd);
  let framework = "other";

  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    defaultName = pkg.name || defaultName;

    // Detect framework
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) framework = "nextjs";
    else if (deps.vite) framework = "vite";
    else if (deps.astro) framework = "astro";
    else if (deps.nuxt) framework = "nuxt";
  }

  const answers = options.yes
    ? { name: defaultName, framework }
    : await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Project name:",
          default: defaultName,
        },
        {
          type: "list",
          name: "framework",
          message: "Framework:",
          default: framework,
          choices: [
            { name: "Next.js", value: "nextjs" },
            { name: "Vite", value: "vite" },
            { name: "Astro", value: "astro" },
            { name: "Nuxt", value: "nuxt" },
            { name: "Remix", value: "remix" },
            { name: "Static", value: "static" },
            { name: "Other", value: "other" },
          ],
        },
      ]);

  const spinner = ora("Creating project...").start();

  try {
    const response = await apiRequest<{ project: { id: string; slug: string } }>(
      "/projects",
      {
        method: "POST",
        body: JSON.stringify({
          name: answers.name,
          framework: answers.framework,
        }),
      }
    );

    // Write cloudify.json
    const cloudifyConfig = {
      projectId: response.project.id,
      framework: answers.framework,
    };

    fs.writeFileSync(
      path.join(cwd, "cloudify.json"),
      JSON.stringify(cloudifyConfig, null, 2)
    );

    setCurrentProject(response.project.id);

    spinner.succeed("Project initialized!");
    console.log("");
    console.log(chalk.cyan("Project ID:"), response.project.id);
    console.log(chalk.cyan("Slug:"), response.project.slug);
    console.log("");
    console.log("Run `cloudify deploy` to deploy your project.");
  } catch (error) {
    spinner.fail("Failed to create project: " + (error as Error).message);
    process.exit(1);
  }
}
