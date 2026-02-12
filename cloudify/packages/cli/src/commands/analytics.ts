/**
 * Analytics Command
 * View project analytics and real-time stats
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest, getCurrentProject } from "../config.js";

interface AnalyticsOverview {
  totalVisitors: number;
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ source: string; visitors: number }>;
  period: string;
}

interface RealtimeStats {
  activeVisitors: number;
  activePages: Array<{ path: string; visitors: number }>;
  timestamp: string;
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export async function analyticsOverview(options: { period?: string }): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const period = options.period || "7d";
  const spinner = ora("Fetching analytics...").start();

  try {
    const response = await apiRequest<AnalyticsOverview>(
      `/projects/${projectId}/analytics?period=${period}`
    );

    spinner.stop();

    console.log("");
    console.log(chalk.cyan.bold(`Analytics Overview (${response.period})`));
    console.log("");

    // Summary stats in a grid
    console.log(`  ${chalk.gray("Total Visitors:")}     ${chalk.white.bold(formatNumber(response.totalVisitors))}`);
    console.log(`  ${chalk.gray("Page Views:")}         ${chalk.white.bold(formatNumber(response.totalPageViews))}`);
    console.log(`  ${chalk.gray("Unique Visitors:")}    ${chalk.white.bold(formatNumber(response.uniqueVisitors))}`);
    console.log(`  ${chalk.gray("Avg Session:")}        ${chalk.white.bold(formatDuration(response.avgSessionDuration))}`);
    console.log(`  ${chalk.gray("Bounce Rate:")}        ${chalk.white.bold(`${response.bounceRate.toFixed(1)}%`)}`);

    // Top pages
    if (response.topPages.length > 0) {
      console.log("");
      console.log(chalk.cyan("  Top Pages:"));
      console.log("");

      const maxPathLength = Math.max(...response.topPages.map((p) => p.path.length), 10);

      for (const page of response.topPages.slice(0, 10)) {
        const bar = chalk.cyan("\u2588".repeat(Math.max(1, Math.round((page.views / response.topPages[0].views) * 20))));
        console.log(`    ${chalk.white(page.path.padEnd(maxPathLength))}  ${bar} ${chalk.gray(formatNumber(page.views))}`);
      }
    }

    // Top referrers
    if (response.topReferrers.length > 0) {
      console.log("");
      console.log(chalk.cyan("  Top Referrers:"));
      console.log("");

      const maxSourceLength = Math.max(...response.topReferrers.map((r) => r.source.length), 10);

      for (const referrer of response.topReferrers.slice(0, 10)) {
        const bar = chalk.yellow("\u2588".repeat(Math.max(1, Math.round((referrer.visitors / response.topReferrers[0].visitors) * 20))));
        console.log(`    ${chalk.white(referrer.source.padEnd(maxSourceLength))}  ${bar} ${chalk.gray(formatNumber(referrer.visitors))}`);
      }
    }

    console.log("");
  } catch (error) {
    spinner.fail("Failed to fetch analytics");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function analyticsRealtime(): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora("Fetching real-time analytics...").start();

  try {
    const response = await apiRequest<RealtimeStats>(
      `/projects/${projectId}/analytics?realtime=true`
    );

    spinner.stop();

    console.log("");
    console.log(chalk.cyan.bold("Real-time Analytics"));
    console.log("");

    const visitorColor = response.activeVisitors > 0 ? chalk.green.bold : chalk.yellow;
    console.log(`  ${chalk.gray("Active Visitors:")} ${visitorColor(response.activeVisitors.toString())}`);
    console.log(`  ${chalk.gray("Updated:")}         ${new Date(response.timestamp).toLocaleTimeString()}`);

    if (response.activePages.length > 0) {
      console.log("");
      console.log(chalk.cyan("  Active Pages:"));
      console.log("");

      const maxPathLength = Math.max(...response.activePages.map((p) => p.path.length), 10);

      for (const page of response.activePages) {
        console.log(
          `    ${chalk.white(page.path.padEnd(maxPathLength))}  ${chalk.green(page.visitors.toString())} ${chalk.gray(page.visitors === 1 ? "visitor" : "visitors")}`
        );
      }
    }

    console.log("");
  } catch (error) {
    spinner.fail("Failed to fetch real-time analytics");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
