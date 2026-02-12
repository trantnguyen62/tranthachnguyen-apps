/**
 * Storage Command
 * Manage KV store and blob storage
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { requireAuth, apiRequest, getCurrentProject } from "../config.js";

// KV interfaces
interface KvEntry {
  key: string;
  value: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Blob interfaces
interface BlobEntry {
  path: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ─── KV Commands ──────────────────────────────────────────────

export async function kvList(): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora("Fetching KV entries...").start();

  try {
    const response = await apiRequest<{ entries: KvEntry[] }>(
      `/projects/${projectId}/storage/kv`
    );

    spinner.stop();

    if (response.entries.length === 0) {
      console.log(chalk.yellow("No KV entries found."));
      console.log(chalk.gray("Run `cloudify storage kv set <key> <value>` to add one."));
      return;
    }

    console.log(chalk.cyan.bold("KV Store"));
    console.log("");

    const maxKeyLength = Math.max(...response.entries.map((e) => e.key.length), 5);

    // Header
    console.log(
      chalk.gray(
        `${"KEY".padEnd(maxKeyLength)}  ${"VALUE".padEnd(30)}  UPDATED`
      )
    );
    console.log(chalk.gray("-".repeat(maxKeyLength + 50)));

    for (const entry of response.entries) {
      const truncatedValue =
        entry.value.length > 28 ? entry.value.substring(0, 25) + "..." : entry.value;
      const updated = new Date(entry.updatedAt).toLocaleString();

      console.log(
        `${chalk.white(entry.key.padEnd(maxKeyLength))}  ${chalk.gray(truncatedValue.padEnd(30))}  ${chalk.gray(updated)}`
      );
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.entries.length} entries`));
  } catch (error) {
    spinner.fail("Failed to fetch KV entries");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function kvGet(key: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Fetching key "${key}"...`).start();

  try {
    const response = await apiRequest<{ entry: KvEntry }>(
      `/projects/${projectId}/storage/kv?key=${encodeURIComponent(key)}`
    );

    spinner.stop();

    console.log("");
    console.log(`  ${chalk.gray("Key:")}     ${chalk.cyan(response.entry.key)}`);
    console.log(`  ${chalk.gray("Value:")}   ${response.entry.value}`);
    console.log(`  ${chalk.gray("Updated:")} ${new Date(response.entry.updatedAt).toLocaleString()}`);

    if (response.entry.expiresAt) {
      console.log(`  ${chalk.gray("Expires:")} ${new Date(response.entry.expiresAt).toLocaleString()}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail(`Failed to get key "${key}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function kvSet(key: string, value: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Setting key "${key}"...`).start();

  try {
    await apiRequest(`/projects/${projectId}/storage/kv`, {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });

    spinner.succeed(`Set ${chalk.cyan(key)} = ${chalk.gray(value.length > 30 ? value.substring(0, 27) + "..." : value)}`);
  } catch (error) {
    spinner.fail(`Failed to set key "${key}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function kvDelete(key: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Deleting key "${key}"...`).start();

  try {
    await apiRequest(
      `/projects/${projectId}/storage/kv?key=${encodeURIComponent(key)}`,
      { method: "DELETE" }
    );

    spinner.succeed(`Deleted key ${chalk.cyan(key)}`);
  } catch (error) {
    spinner.fail(`Failed to delete key "${key}"`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

// ─── Blob Commands ────────────────────────────────────────────

export async function blobList(): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora("Fetching blobs...").start();

  try {
    const response = await apiRequest<{ blobs: BlobEntry[] }>(
      `/projects/${projectId}/storage/blobs`
    );

    spinner.stop();

    if (response.blobs.length === 0) {
      console.log(chalk.yellow("No blobs found."));
      console.log(chalk.gray("Run `cloudify storage blob upload <file>` to upload one."));
      return;
    }

    console.log(chalk.cyan.bold("Blob Storage"));
    console.log("");

    const maxPathLength = Math.max(...response.blobs.map((b) => b.path.length), 10);

    // Header
    console.log(
      chalk.gray(
        `${"PATH".padEnd(maxPathLength)}  ${"SIZE".padEnd(10)}  ${"TYPE".padEnd(20)}  CREATED`
      )
    );
    console.log(chalk.gray("-".repeat(maxPathLength + 50)));

    for (const blob of response.blobs) {
      const created = new Date(blob.createdAt).toLocaleString();

      console.log(
        `${chalk.white(blob.path.padEnd(maxPathLength))}  ${chalk.gray(formatBytes(blob.size).padEnd(10))}  ${chalk.gray(blob.contentType.padEnd(20))}  ${chalk.gray(created)}`
      );
    }

    console.log("");
    console.log(chalk.gray(`Total: ${response.blobs.length} blob(s)`));
  } catch (error) {
    spinner.fail("Failed to fetch blobs");
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function blobUpload(filePath: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`File not found: ${resolvedPath}`));
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const spinner = ora(`Uploading ${fileName} (${formatBytes(stat.size)})...`).start();

  try {
    const fileContent = fs.readFileSync(resolvedPath);
    const formData = new FormData();
    formData.append("file", new Blob([fileContent]), fileName);

    const response = await apiRequest<{ blob: BlobEntry }>(
      `/projects/${projectId}/storage/blobs`,
      {
        method: "POST",
        body: formData,
        headers: {}, // Let fetch set content-type for FormData
      }
    );

    spinner.succeed(`Uploaded ${chalk.cyan(fileName)}`);
    console.log("");
    console.log(`  ${chalk.gray("Path:")} ${response.blob.path}`);
    console.log(`  ${chalk.gray("Size:")} ${formatBytes(response.blob.size)}`);
    console.log(`  ${chalk.gray("Type:")} ${response.blob.contentType}`);

    if (response.blob.url) {
      console.log(`  ${chalk.gray("URL:")}  ${chalk.cyan.underline(response.blob.url)}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail(`Failed to upload ${fileName}`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function blobDownload(
  blobPath: string,
  options: { output?: string }
): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const outputPath = options.output || path.basename(blobPath);
  const resolvedOutput = path.resolve(outputPath);
  const spinner = ora(`Downloading ${blobPath}...`).start();

  try {
    const response = await apiRequest<{ blob: { data: string; contentType: string } }>(
      `/projects/${projectId}/storage/blobs/${encodeURIComponent(blobPath)}`
    );

    // Write the data as a buffer (base64 encoded from API)
    const buffer = Buffer.from(response.blob.data, "base64");
    fs.writeFileSync(resolvedOutput, buffer);

    spinner.succeed(`Downloaded to ${chalk.cyan(resolvedOutput)}`);
    console.log(`  ${chalk.gray("Size:")} ${formatBytes(buffer.length)}`);
  } catch (error) {
    spinner.fail(`Failed to download ${blobPath}`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

export async function blobDelete(blobPath: string): Promise<void> {
  requireAuth();

  const projectId = getProjectId();
  const spinner = ora(`Deleting ${blobPath}...`).start();

  try {
    await apiRequest(
      `/projects/${projectId}/storage/blobs?path=${encodeURIComponent(blobPath)}`,
      { method: "DELETE" }
    );

    spinner.succeed(`Deleted blob ${chalk.cyan(blobPath)}`);
  } catch (error) {
    spinner.fail(`Failed to delete ${blobPath}`);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
