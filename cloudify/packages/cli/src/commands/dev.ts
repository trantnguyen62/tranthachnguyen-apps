/**
 * Dev Command
 * Run local development server with Cloudify environment
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { requireAuth, apiRequest } from "../config";

interface DevOptions {
  port?: string;
}

export async function dev(options: DevOptions): Promise<void> {
  requireAuth();

  const cwd = process.cwd();
  const cloudifyConfigPath = path.join(cwd, "cloudify.json");
  const packageJsonPath = path.join(cwd, "package.json");

  // Check for cloudify.json
  if (!fs.existsSync(cloudifyConfigPath)) {
    console.error(chalk.red("No cloudify.json found. Run `cloudify init` first."));
    process.exit(1);
  }

  const cloudifyConfig = JSON.parse(fs.readFileSync(cloudifyConfigPath, "utf-8"));
  const projectId = cloudifyConfig.projectId;

  console.log(chalk.cyan("Starting development server..."));
  console.log("");

  // Fetch environment variables from Cloudify
  try {
    const envVars = await apiRequest<{ variables: Array<{ key: string; value: string }> }>(
      `/projects/${projectId}/env?target=development`
    );

    // Merge with process.env
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const { key, value } of envVars.variables) {
      env[key] = value;
    }

    console.log(chalk.gray(`Loaded ${envVars.variables.length} environment variables`));

    // Detect the dev command from package.json
    if (!fs.existsSync(packageJsonPath)) {
      console.error(chalk.red("No package.json found."));
      process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const devScript = pkg.scripts?.dev;

    if (!devScript) {
      console.error(chalk.red("No 'dev' script found in package.json"));
      process.exit(1);
    }

    // Parse port option
    const port = options.port || "3000";
    env.PORT = port;

    console.log(chalk.cyan(`Running: npm run dev`));
    console.log(chalk.gray(`Port: ${port}`));
    console.log("");

    // Spawn the dev process
    const child: ChildProcess = spawn("npm", ["run", "dev"], {
      cwd,
      env,
      stdio: "inherit",
      shell: true,
    });

    // Handle process exit
    child.on("close", (code) => {
      process.exit(code || 0);
    });

    // Handle signals
    process.on("SIGINT", () => {
      child.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
      child.kill("SIGTERM");
    });
  } catch (error) {
    console.error(chalk.red("Failed to start dev server: " + (error as Error).message));
    process.exit(1);
  }
}
