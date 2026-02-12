/**
 * Teams Command
 * Manage teams and team members
 */

import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest } from "../config.js";

interface Team {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export async function teamsList(): Promise<void> {
  requireAuth();

  const spinner = ora("Fetching teams...").start();

  try {
    const response = await apiRequest<{ teams: Team[] }>("/teams");

    spinner.stop();

    if (response.teams.length === 0) {
      console.log(chalk.yellow("No teams found."));
      console.log(chalk.gray("Run `cloudify teams create <name>` to create one."));
      return;
    }

    console.log(chalk.cyan.bold("Your Teams"));
    console.log("");

    const maxNameLength = Math.max(...response.teams.map((t) => t.name.length), 10);
    const maxSlugLength = Math.max(...response.teams.map((t) => t.slug.length), 10);

    // Header
    console.log(
      chalk.gray(
        `${"NAME".padEnd(maxNameLength)}  ${"SLUG".padEnd(maxSlugLength)}  ${"ROLE".padEnd(10)}  MEMBERS`
      )
    );
    console.log(chalk.gray("-".repeat(maxNameLength + maxSlugLength + 30)));

    for (const team of response.teams) {
      const roleColor = team.role === "owner" ? chalk.cyan : team.role === "admin" ? chalk.yellow : chalk.white;

      console.log(
        `${chalk.white(team.name.padEnd(maxNameLength))}  ${chalk.gray(team.slug.padEnd(maxSlugLength))}  ${roleColor(team.role.padEnd(10))}  ${team.memberCount}`
      );
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.teams.length} team(s)`));
  } catch (error) {
    spinner.fail("Failed to fetch teams");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function teamsCreate(name: string): Promise<void> {
  requireAuth();

  const spinner = ora(`Creating team "${name}"...`).start();

  try {
    const response = await apiRequest<{ team: Team }>("/teams", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    spinner.succeed(`Created team ${chalk.cyan(response.team.name)}`);
    console.log("");
    console.log(`  ${chalk.gray("ID:")}   ${response.team.id}`);
    console.log(`  ${chalk.gray("Slug:")} ${response.team.slug}`);
    console.log(`  ${chalk.gray("Role:")} ${chalk.cyan(response.team.role)}`);
    console.log("");
    console.log(chalk.gray("Invite members with `cloudify teams invite <email> --role <role>`"));
  } catch (error) {
    spinner.fail(`Failed to create team "${name}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function teamsInvite(
  email: string,
  options: { role?: string; team?: string }
): Promise<void> {
  requireAuth();

  const role = options.role || "member";
  const validRoles = ["owner", "admin", "member", "viewer"];

  if (!validRoles.includes(role)) {
    console.error(chalk.red(`Invalid role: ${role}`));
    console.log(chalk.gray(`Valid roles: ${validRoles.join(", ")}`));
    process.exit(1);
  }

  const spinner = ora(`Inviting ${email}...`).start();

  try {
    // If --team specified, use that, otherwise get the user's first team
    let teamId = options.team;

    if (!teamId) {
      const teamsResponse = await apiRequest<{ teams: Team[] }>("/teams");
      if (teamsResponse.teams.length === 0) {
        spinner.fail("No teams found. Create one first with `cloudify teams create <name>`.");
        process.exit(1);
      }
      teamId = teamsResponse.teams[0].id;
    }

    const response = await apiRequest<{ invitation: Invitation }>(
      `/teams/${teamId}/invitations`,
      {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }
    );

    spinner.succeed(`Invited ${chalk.cyan(email)} as ${chalk.yellow(role)}`);
    console.log("");
    console.log(`  ${chalk.gray("Invitation ID:")} ${response.invitation.id}`);
    console.log(`  ${chalk.gray("Status:")}        ${response.invitation.status}`);
    console.log(`  ${chalk.gray("Expires:")}       ${new Date(response.invitation.expiresAt).toLocaleString()}`);
    console.log("");
  } catch (error) {
    spinner.fail(`Failed to invite ${email}`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function teamsMembers(options: { team?: string }): Promise<void> {
  requireAuth();

  const spinner = ora("Fetching team members...").start();

  try {
    // If --team specified, use that, otherwise get the user's first team
    let teamId = options.team;

    if (!teamId) {
      const teamsResponse = await apiRequest<{ teams: Team[] }>("/teams");
      if (teamsResponse.teams.length === 0) {
        spinner.fail("No teams found. Create one first with `cloudify teams create <name>`.");
        process.exit(1);
      }
      teamId = teamsResponse.teams[0].id;
    }

    const response = await apiRequest<{ members: TeamMember[] }>(
      `/teams/${teamId}/members`
    );

    spinner.stop();

    if (response.members.length === 0) {
      console.log(chalk.yellow("No members found."));
      return;
    }

    console.log(chalk.cyan.bold("Team Members"));
    console.log("");

    const maxNameLength = Math.max(...response.members.map((m) => m.name.length), 10);
    const maxEmailLength = Math.max(...response.members.map((m) => m.email.length), 15);

    // Header
    console.log(
      chalk.gray(
        `${"NAME".padEnd(maxNameLength)}  ${"EMAIL".padEnd(maxEmailLength)}  ${"ROLE".padEnd(10)}  JOINED`
      )
    );
    console.log(chalk.gray("-".repeat(maxNameLength + maxEmailLength + 30)));

    for (const member of response.members) {
      const roleColor = member.role === "owner" ? chalk.cyan : member.role === "admin" ? chalk.yellow : chalk.white;
      const joined = new Date(member.joinedAt).toLocaleDateString();

      console.log(
        `${chalk.white(member.name.padEnd(maxNameLength))}  ${chalk.gray(member.email.padEnd(maxEmailLength))}  ${roleColor(member.role.padEnd(10))}  ${chalk.gray(joined)}`
      );
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.members.length} member(s)`));
  } catch (error) {
    spinner.fail("Failed to fetch team members");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
