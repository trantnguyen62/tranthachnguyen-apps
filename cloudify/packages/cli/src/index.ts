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
import { functionsList, functionsDeploy, functionsLogs, functionsInvoke } from "./commands/functions.js";
import { kvList, kvGet, kvSet, kvDelete, blobList, blobUpload, blobDownload, blobDelete } from "./commands/storage.js";
import { teamsList, teamsCreate, teamsInvite, teamsMembers } from "./commands/teams.js";
import { analyticsOverview, analyticsRealtime } from "./commands/analytics.js";

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

// Functions
const functionsCommand = program
  .command("functions")
  .description("Manage edge functions");

functionsCommand
  .command("list")
  .description("List all edge functions")
  .action(functionsList);

functionsCommand
  .command("deploy <name>")
  .description("Deploy an edge function")
  .requiredOption("--file <path>", "Path to the function source file")
  .action(functionsDeploy);

functionsCommand
  .command("logs <name>")
  .description("Show recent execution logs for a function")
  .option("-n, --lines <number>", "Number of log entries to show", "50")
  .action(functionsLogs);

functionsCommand
  .command("invoke <name>")
  .description("Invoke an edge function")
  .option("-d, --data <json>", "JSON payload to send")
  .action(functionsInvoke);

// Storage
const storageCommand = program
  .command("storage")
  .description("Manage KV store and blob storage");

// Storage - KV subcommands
const kvCommand = storageCommand
  .command("kv")
  .description("Manage key-value store");

kvCommand
  .command("list")
  .description("List all KV entries")
  .action(kvList);

kvCommand
  .command("get <key>")
  .description("Get a value by key")
  .action(kvGet);

kvCommand
  .command("set <key> <value>")
  .description("Set a key-value pair")
  .action(kvSet);

kvCommand
  .command("delete <key>")
  .description("Delete a key")
  .action(kvDelete);

// Storage - Blob subcommands
const blobCommand = storageCommand
  .command("blob")
  .description("Manage blob storage");

blobCommand
  .command("list")
  .description("List all blobs")
  .action(blobList);

blobCommand
  .command("upload <file>")
  .description("Upload a file to blob storage")
  .action(blobUpload);

blobCommand
  .command("download <path>")
  .description("Download a blob to local file")
  .option("-o, --output <file>", "Output file path")
  .action(blobDownload);

blobCommand
  .command("delete <path>")
  .description("Delete a blob")
  .action(blobDelete);

// Teams
const teamsCommand = program
  .command("teams")
  .description("Manage teams and members");

teamsCommand
  .command("list")
  .description("List your teams")
  .action(teamsList);

teamsCommand
  .command("create <name>")
  .description("Create a new team")
  .action(teamsCreate);

teamsCommand
  .command("invite <email>")
  .description("Invite a member to your team")
  .option("-r, --role <role>", "Role (owner, admin, member, viewer)", "member")
  .option("-t, --team <teamId>", "Team ID (defaults to first team)")
  .action(teamsInvite);

teamsCommand
  .command("members")
  .description("List team members")
  .option("-t, --team <teamId>", "Team ID (defaults to first team)")
  .action(teamsMembers);

// Analytics
const analyticsCommand = program
  .command("analytics")
  .description("View project analytics");

analyticsCommand
  .command("overview")
  .description("Show analytics summary")
  .option("-p, --period <period>", "Time period (24h, 7d, 30d, 90d)", "7d")
  .action(analyticsOverview);

analyticsCommand
  .command("realtime")
  .description("Show real-time visitor stats")
  .action(analyticsRealtime);

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
