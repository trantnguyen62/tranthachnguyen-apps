#!/usr/bin/env node
/**
 * Cloudify CLI
 *
 * Deploy your projects from the command line.
 *
 * Usage:
 *   cloudify                 Deploy current directory
 *   cloudify init            Initialize a new project
 *   cloudify dev             Start local development server
 *   cloudify env             Manage environment variables
 *   cloudify domains         Manage custom domains
 *   cloudify logs            View deployment logs
 *   cloudify rollback        Rollback to previous deployment
 *   cloudify login           Authenticate with Cloudify
 *   cloudify logout          Log out of Cloudify
 */

import { Command } from "commander";
import chalk from "chalk";
import { version } from "../package.json";
import { deploy } from "./commands/deploy";
import { init } from "./commands/init";
import { dev } from "./commands/dev";
import { envList, envAdd, envRemove, envPull } from "./commands/env";
import { domainsList, domainsAdd, domainsRemove, domainsVerify } from "./commands/domains";
import { logs, buildLogs } from "./commands/logs";
import { rollback, listDeployments } from "./commands/rollback";
import { login, logout, whoami } from "./commands/auth";

const program = new Command();

// ASCII art logo
const logo = `
   _____ _                 _ _  __
  / ____| |               | (_)/ _|
 | |    | | ___  _   _  __| |_| |_ _   _
 | |    | |/ _ \\| | | |/ _\` | |  _| | | |
 | |____| | (_) | |_| | (_| | | | | |_| |
  \\_____|_|\\___/ \\__,_|\\__,_|_|_|  \\__, |
                                    __/ |
                                   |___/
`;

program
  .name("cloudify")
  .description(chalk.cyan(logo) + "\nDeploy your projects to the cloud")
  .version(version);

// Deploy command (default)
program
  .command("deploy", { isDefault: true })
  .description("Deploy the current project")
  .option("-p, --prod", "Deploy to production")
  .option("--no-wait", "Don't wait for deployment to complete")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(deploy);

// Init command
program
  .command("init")
  .description("Initialize a new Cloudify project")
  .option("-y, --yes", "Use default settings")
  .action(init);

// Dev command
program
  .command("dev")
  .description("Start local development server")
  .option("-p, --port <port>", "Port to run on", "3000")
  .action(dev);

// Environment variables
const envCmd = program
  .command("env")
  .description("Manage environment variables");

envCmd
  .command("ls")
  .description("List all environment variables")
  .option("-e, --environment <env>", "Filter by environment")
  .action(envList);

envCmd
  .command("add [key] [value]")
  .description("Add an environment variable")
  .option("-e, --environment <env>", "Target environment(s), comma-separated")
  .action(envAdd);

envCmd
  .command("rm <key>")
  .description("Remove an environment variable")
  .option("-e, --environment <env>", "Target environment")
  .action(envRemove);

envCmd
  .command("pull [filename]")
  .description("Pull environment variables to .env.local")
  .action(envPull);

// Domains
const domainsCmd = program
  .command("domains")
  .description("Manage custom domains");

domainsCmd
  .command("ls")
  .description("List all domains")
  .action(domainsList);

domainsCmd
  .command("add <domain>")
  .description("Add a custom domain")
  .action(domainsAdd);

domainsCmd
  .command("rm <domain>")
  .description("Remove a custom domain")
  .action(domainsRemove);

domainsCmd
  .command("verify <domain>")
  .description("Verify domain ownership")
  .action(domainsVerify);

// Logs
program
  .command("logs")
  .description("View deployment logs")
  .option("-f, --follow", "Follow log output in real-time")
  .option("-n, --lines <n>", "Number of lines to show", "100")
  .option("-d, --deployment <id>", "Filter by deployment ID")
  .option("--filter <text>", "Filter logs containing text")
  .action(logs);

program
  .command("build-logs <deployment-id>")
  .description("View build logs for a deployment")
  .action(buildLogs);

// Deployments
program
  .command("list")
  .alias("ls")
  .description("List recent deployments")
  .action(listDeployments);

// Rollback
program
  .command("rollback [deployment-id]")
  .description("Rollback to a previous deployment")
  .option("-y, --yes", "Skip confirmation")
  .action(rollback);

// Auth commands
program
  .command("login")
  .description("Log in to Cloudify")
  .action(login);

program
  .command("logout")
  .description("Log out of Cloudify")
  .action(logout);

program
  .command("whoami")
  .description("Show current logged in user")
  .action(whoami);

// Parse and execute
program.parse();
