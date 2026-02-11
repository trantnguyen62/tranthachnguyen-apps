/**
 * Whoami Command
 *
 * Shows the currently logged in user.
 */

import chalk from "chalk";
import ora from "ora";
import { isLoggedIn, getUser, setUser, clearAuth, apiRequest } from "../config.js";

interface UserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt?: string;
  };
}

export async function whoami(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.yellow("Not logged in."));
    console.log(chalk.gray("Run `cloudify login` to authenticate."));
    return;
  }

  const spinner = ora("Fetching user info...").start();

  try {
    const response = await apiRequest<UserResponse>("/auth/me");
    setUser(response.user);
    spinner.stop();

    console.log("");
    console.log(chalk.cyan.bold("Logged in as:"));
    console.log("");
    console.log(`  ${chalk.gray("Name:")}   ${response.user.name}`);
    console.log(`  ${chalk.gray("Email:")}  ${response.user.email}`);
    console.log(`  ${chalk.gray("ID:")}     ${response.user.id}`);

    if (response.user.createdAt) {
      const createdDate = new Date(response.user.createdAt).toLocaleDateString();
      console.log(`  ${chalk.gray("Member since:")} ${createdDate}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail("Failed to fetch user info");

    // Token might be invalid, clear it
    clearAuth();
    console.log(chalk.gray("Session expired. Please run `cloudify login` again."));
    process.exit(1);
  }
}
