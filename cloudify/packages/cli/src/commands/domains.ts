/**
 * Domains Command
 * Manage custom domains for a project
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest, getCurrentProject } from "../config";

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  primary: boolean;
  sslStatus: string;
  createdAt: string;
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

export async function domainsList(): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora("Fetching domains...").start();

  try {
    const response = await apiRequest<{ domains: Domain[] }>(
      `/projects/${projectId}/domains`
    );

    spinner.stop();

    if (response.domains.length === 0) {
      console.log(chalk.yellow("No custom domains configured."));
      console.log(chalk.gray("Run `cloudify domains add <domain>` to add one."));
      return;
    }

    console.log(chalk.cyan("Custom Domains:"));
    console.log("");

    for (const domain of response.domains) {
      const status = domain.verified
        ? chalk.green("✓ Verified")
        : chalk.yellow("⏳ Pending verification");
      const ssl = domain.sslStatus === "active"
        ? chalk.green("🔒")
        : chalk.gray("🔓");
      const primary = domain.primary ? chalk.cyan(" (primary)") : "";

      console.log(`  ${ssl} ${chalk.white(domain.domain)}${primary}`);
      console.log(`     ${status}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail("Failed to fetch domains");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function domainsAdd(domain: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Adding domain ${domain}...`).start();

  try {
    const response = await apiRequest<{
      domain: Domain;
      dnsRecords: Array<{ type: string; name: string; value: string }>;
    }>(`/projects/${projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ domain }),
    });

    spinner.succeed(`Added ${chalk.cyan(domain)}`);
    console.log("");

    // Show DNS configuration instructions
    console.log(chalk.yellow("Configure your DNS with these records:"));
    console.log("");

    for (const record of response.dnsRecords) {
      console.log(`  ${chalk.white(record.type.padEnd(6))} ${chalk.gray(record.name)}`);
      console.log(`  ${chalk.gray("→")} ${record.value}`);
      console.log("");
    }

    console.log(chalk.gray("After configuring DNS, run `cloudify domains verify " + domain + "`"));
  } catch (error) {
    spinner.fail("Failed to add domain");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function domainsRemove(domain: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Removing domain ${domain}...`).start();

  try {
    await apiRequest(`/projects/${projectId}/domains/${encodeURIComponent(domain)}`, {
      method: "DELETE",
    });

    spinner.succeed(`Removed ${chalk.cyan(domain)}`);
  } catch (error) {
    spinner.fail("Failed to remove domain");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function domainsVerify(domain: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Verifying domain ${domain}...`).start();

  try {
    const response = await apiRequest<{ verified: boolean; message: string }>(
      `/projects/${projectId}/domains/${encodeURIComponent(domain)}/verify`,
      { method: "POST" }
    );

    if (response.verified) {
      spinner.succeed(`${chalk.cyan(domain)} is now verified!`);
      console.log(chalk.green("SSL certificate will be provisioned automatically."));
    } else {
      spinner.warn(`${chalk.yellow(domain)} verification pending`);
      console.log(chalk.gray(response.message));
    }
  } catch (error) {
    spinner.fail("Verification failed");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
