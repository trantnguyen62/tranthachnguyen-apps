/**
 * Auth Commands
 *
 * Handle login, logout, and user info.
 */

import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { setToken, clearToken, setUser, getUser, apiRequest, isLoggedIn } from "../config.js";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export async function login(): Promise<void> {
  if (isLoggedIn()) {
    const user = getUser();
    console.log(chalk.yellow(`Already logged in as ${user?.email}`));

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Do you want to log in with a different account?",
        default: false,
      },
    ]);

    if (!confirm) return;
  }

  console.log(chalk.cyan("Log in to Cloudify"));
  console.log("");

  const { method } = await inquirer.prompt([
    {
      type: "list",
      name: "method",
      message: "How would you like to log in?",
      choices: [
        { name: "Email & Password", value: "email" },
        { name: "GitHub", value: "github" },
        { name: "API Token", value: "token" },
      ],
    },
  ]);

  if (method === "token") {
    const { token } = await inquirer.prompt([
      {
        type: "password",
        name: "token",
        message: "Enter your API token:",
        mask: "*",
      },
    ]);

    const spinner = ora("Verifying token...").start();

    try {
      setToken(token);
      const response = await apiRequest<{ user: LoginResponse["user"] }>("/auth/me");
      setUser(response.user);
      spinner.succeed(`Logged in as ${response.user.email}`);
    } catch (error) {
      clearToken();
      spinner.fail("Invalid token");
      process.exit(1);
    }
    return;
  }

  if (method === "email") {
    const { email, password } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Email:",
      },
      {
        type: "password",
        name: "password",
        message: "Password:",
        mask: "*",
      },
    ]);

    const spinner = ora("Logging in...").start();

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(response.token);
      setUser(response.user);
      spinner.succeed(`Logged in as ${response.user.email}`);
    } catch (error) {
      spinner.fail("Login failed: " + (error as Error).message);
      process.exit(1);
    }
    return;
  }

  if (method === "github") {
    console.log("");
    console.log(chalk.cyan("Visit the following URL to authenticate:"));
    console.log(chalk.underline("https://cloudify.tranthachnguyen.com/login?cli=true"));
    console.log("");
    console.log("After authenticating, copy your API token and run:");
    console.log(chalk.gray("  cloudify login"));
    console.log("Then select 'API Token' option.");
  }
}

export async function logout(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.yellow("Not currently logged in."));
    return;
  }

  clearToken();
  console.log(chalk.green("Successfully logged out."));
}

export async function whoami(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.yellow("Not logged in."));
    console.log(chalk.gray("Run `cloudify login` to authenticate."));
    return;
  }

  const spinner = ora("Fetching user info...").start();

  try {
    const response = await apiRequest<{ user: LoginResponse["user"] }>("/auth/me");
    setUser(response.user);
    spinner.stop();

    console.log("");
    console.log(chalk.cyan("Logged in as:"));
    console.log(`  Name:  ${response.user.name}`);
    console.log(`  Email: ${response.user.email}`);
    console.log(`  ID:    ${response.user.id}`);
  } catch (error) {
    spinner.fail("Failed to fetch user info");
    clearToken();
    process.exit(1);
  }
}
