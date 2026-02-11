#!/usr/bin/env node
/**
 * Cloudify CLI
 * Deploy and manage your projects from the command line
 */

import { Command } from "commander";
import chalk from "chalk";
import { login } from "./commands/login.js";
import { deploy } from "./commands/deploy.js";
import { init } from "./commands/init.js";
import { envPull, envPush, envList } from "./commands/env.js";
import { logs } from "./commands/logs.js";
import { list } from "./commands/list.js";
import { link, unlink } from "./commands/link.js";
import { whoami } from "./commands/whoami.js";
import { logout } from "./commands/logout.js";
import { dev } from "./commands/dev.js";
import { rollback } from "./commands/rollback.js";
import { addDomain, removeDomain, listDomains, domainsVerify } from "./commands/domains.js";

const program = new Command();

program
  .name("cloudify")
  .description("Cloudify CLI - Deploy and manage your projects")
  .version("1.0.0");

// Authentication commands
program
  .command("login")
  .description("Log in to Cloudify")
  .option("--token <token>", "Use API token instead of browser login")
  .action(login);

program
  .command("logout")
  .description("Log out of Cloudify")
  .action(logout);

program
  .command("whoami")
  .description("Show currently logged in user")
  .action(whoami);

// Project initialization
program
  .command("init")
  .description("Initialize a new Cloudify project")
  .option("-n, --name <name>", "Project name")
  .option("-f, --framework <framework>", "Framework (nextjs, react, static)")
  .action(init);

// Project linking
program
  .command("link")
  .description("Link current directory to a Cloudify project")
  .option("--project <project>", "Project slug to link to")
  .action(link);

program
  .command("unlink")
  .description("Unlink current directory from Cloudify project")
  .action(unlink);

// Deployment
program
  .command("deploy")
  .description("Deploy the current project")
  .option("-p, --prod", "Deploy to production")
  .option("--preview", "Create a preview deployment")
  .option("-m, --message <message>", "Deployment message")
  .action(deploy);

// Environment variables
const envCommand = program
  .command("env")
  .description("Manage environment variables");

envCommand
  .command("pull")
  .description("Pull environment variables to local .env file")
  .option("-e, --environment <env>", "Environment (production, preview, development)", "production")
  .action(envPull);

envCommand
  .command("push")
  .description("Push local .env variables to Cloudify")
  .option("-e, --environment <env>", "Environment (production, preview, development)", "production")
  .action(envPush);

envCommand
  .command("list")
  .description("List environment variables")
  .option("-e, --environment <env>", "Environment (production, preview, development)", "production")
  .action(envList);

// Logs
program
  .command("logs")
  .description("Stream deployment logs")
  .option("-f, --follow", "Follow log output")
  .option("-n, --lines <number>", "Number of lines to show", "100")
  .action(logs);

// List projects
program
  .command("list")
  .alias("ls")
  .description("List all projects")
  .action(list);

// Development server
program
  .command("dev")
  .description("Start local development server with Cloudify environment")
  .option("-p, --port <port>", "Port to run on", "3000")
  .option("-f, --framework <framework>", "Override framework detection")
  .option("--no-watch", "Disable .env file watching")
  .action(dev);

// Rollback
program
  .command("rollback")
  .description("Rollback to a previous deployment")
  .option("-d, --deployment <id>", "Specific deployment ID to rollback to")
  .action(rollback);

// Domains
const domainsCommand = program
  .command("domains")
  .description("Manage custom domains");

domainsCommand
  .command("list")
  .description("List domains for current project")
  .action(listDomains);

domainsCommand
  .command("add <domain>")
  .description("Add a custom domain")
  .action(addDomain);

domainsCommand
  .command("remove <domain>")
  .description("Remove a custom domain")
  .action(removeDomain);

domainsCommand
  .command("verify <domain>")
  .description("Verify DNS configuration for a domain")
  .action(domainsVerify);

// Parse arguments
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan(`
   ______ __                  __ _  ____
  / ____// /____   __  __ ___/ /(_)/ __/__  __
 / /    / // __ \\ / / / // _  // // /_ / / / /
/ /___ / // /_/ // /_/ // /_/ // // __// /_/ /
\\____//_/ \\____/ \\__,_/ \\__,_//_//_/   \\__, /
                                      /____/
  `));
  program.help();
}
