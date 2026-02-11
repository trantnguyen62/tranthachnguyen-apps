/**
 * Login command - authenticate with Cloudify
 */

import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { setToken, setUser, getApiUrl } from "../config.js";
import { api } from "../api.js";

interface LoginOptions {
  token?: string;
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export async function login(options: LoginOptions): Promise<void> {
  const spinner = ora();

  try {
    let token = options.token;

    if (!token) {
      const apiUrl = getApiUrl();
      console.log(
        chalk.cyan(
          "\nGet your API token from: " +
            chalk.bold(`${apiUrl}/settings/tokens`)
        )
      );
      console.log();

      const answers = await inquirer.prompt([
        {
          type: "password",
          name: "token",
          message: "Enter your API token:",
          mask: "*",
        },
      ]);
      token = answers.token;
    }

    if (!token) {
      console.log(chalk.red("No token provided"));
      process.exit(1);
    }

    spinner.start("Verifying credentials...");

    setToken(token);

    try {
      const response = await api<MeResponse>("/auth/me");
      setUser(response.user);
      spinner.succeed(
        chalk.green(`Logged in as ${chalk.bold(response.user.email)}`)
      );
    } catch (error) {
      setToken("");
      throw error;
    }
  } catch (error) {
    spinner.fail(chalk.red("Login failed"));
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
    process.exit(1);
  }
}
