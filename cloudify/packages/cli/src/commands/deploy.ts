/**
 * Deploy Command
 *
 * Deploys the current project to Cloudify.
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import tar from "tar";
import { requireAuth, apiRequest } from "../config";

interface DeployOptions {
  prod?: boolean;
  wait?: boolean;
  yes?: boolean;
}

interface DeployResponse {
  deployment: {
    id: string;
    url: string;
    status: string;
  };
}

export async function deploy(options: DeployOptions): Promise<void> {
  requireAuth();

  const spinner = ora("Preparing deployment...").start();

  try {
    // Check for cloudify.json or package.json
    const cwd = process.cwd();
    const cloudifyJsonPath = path.join(cwd, "cloudify.json");
    const packageJsonPath = path.join(cwd, "package.json");

    let projectConfig: Record<string, unknown> = {};

    if (fs.existsSync(cloudifyJsonPath)) {
      projectConfig = JSON.parse(fs.readFileSync(cloudifyJsonPath, "utf-8"));
    } else if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      projectConfig = pkg.cloudify || {};
    }

    if (!projectConfig.projectId) {
      spinner.fail("No project linked");
      console.log(chalk.gray("Run `cloudify init` to initialize a project."));
      process.exit(1);
    }

    spinner.text = "Creating deployment bundle...";

    // Create tarball of the project
    const tarballPath = path.join(cwd, ".cloudify-deploy.tar.gz");

    // Get files to include (respect .gitignore)
    const ignorePatterns = [
      "node_modules",
      ".git",
      ".cloudify-deploy.tar.gz",
      ".env.local",
      ".env*.local",
    ];

    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd,
        filter: (filePath) => {
          return !ignorePatterns.some((pattern) => filePath.includes(pattern));
        },
      },
      ["."]
    );

    spinner.text = "Uploading to Cloudify...";

    // Upload the tarball
    const formData = new FormData();
    const tarball = fs.readFileSync(tarballPath);
    formData.append("file", new Blob([tarball]), "deploy.tar.gz");
    formData.append("projectId", projectConfig.projectId as string);
    formData.append("production", String(options.prod || false));

    const response = await apiRequest<DeployResponse>("/deploy", {
      method: "POST",
      body: formData,
      headers: {}, // Let fetch set content-type for FormData
    });

    // Clean up tarball
    fs.unlinkSync(tarballPath);

    spinner.succeed("Deployment started!");

    console.log("");
    console.log(chalk.cyan("Deployment ID:"), response.deployment.id);
    console.log(chalk.cyan("Preview URL:"), chalk.underline(response.deployment.url));

    if (options.wait !== false) {
      spinner.start("Waiting for deployment to complete...");

      // Poll for deployment status
      let status = response.deployment.status;
      while (status === "QUEUED" || status === "BUILDING" || status === "DEPLOYING") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusResponse = await apiRequest<{ deployment: { status: string; url: string } }>(
          `/deployments/${response.deployment.id}`
        );
        status = statusResponse.deployment.status;
        spinner.text = `Deployment status: ${status}`;
      }

      if (status === "READY") {
        spinner.succeed("Deployment complete!");
        console.log("");
        console.log(chalk.green("✓ Your site is live at:"));
        console.log(chalk.cyan.underline(response.deployment.url));
      } else {
        spinner.fail(`Deployment failed with status: ${status}`);
        console.log(chalk.gray("Run `cloudify logs` for more details."));
        process.exit(1);
      }
    }
  } catch (error) {
    spinner.fail("Deployment failed");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
