/**
 * Logout Command
 *
 * Logs out the current user by clearing stored credentials.
 */

import chalk from "chalk";
import { isLoggedIn, getUser, clearAuth } from "../config.js";

export async function logout(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.yellow("Not currently logged in."));
    return;
  }

  const user = getUser();
  clearAuth();

  console.log(chalk.green(`Successfully logged out${user?.email ? ` from ${user.email}` : ""}.`));
}
