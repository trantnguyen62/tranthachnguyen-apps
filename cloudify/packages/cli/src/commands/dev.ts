/**
 * Dev Command
 * Run local development server with Cloudify environment
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import chalk from "chalk";
import { requireAuth, apiRequest, getApiUrl } from "../config.js";

interface DevOptions {
  port?: string;
  framework?: string;
  watch?: boolean;
}

interface CloudifyConfig {
  projectId: string;
  framework?: string;
}

interface EnvVariable {
  key: string;
  value: string;
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

type Framework = "nextjs" | "nuxt" | "remix" | "astro" | "vite" | "cra" | "static" | "unknown";

/**
 * Detect the framework used in the project
 */
function detectFramework(packageJson: PackageJson): Framework {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (deps["next"]) return "nextjs";
  if (deps["nuxt"]) return "nuxt";
  if (deps["@remix-run/react"] || deps["remix"]) return "remix";
  if (deps["astro"]) return "astro";
  if (deps["vite"]) return "vite";
  if (deps["react-scripts"]) return "cra";

  return "unknown";
}

/**
 * Get the dev command for a framework
 */
function getDevCommand(framework: Framework, packageJson: PackageJson): { cmd: string; args: string[] } {
  // Check for custom dev script first
  if (packageJson.scripts?.dev) {
    return { cmd: "npm", args: ["run", "dev"] };
  }

  switch (framework) {
    case "nextjs":
      return { cmd: "npx", args: ["next", "dev"] };
    case "nuxt":
      return { cmd: "npx", args: ["nuxi", "dev"] };
    case "remix":
      return { cmd: "npx", args: ["remix", "dev"] };
    case "astro":
      return { cmd: "npx", args: ["astro", "dev"] };
    case "vite":
      return { cmd: "npx", args: ["vite"] };
    case "cra":
      return { cmd: "npm", args: ["start"] };
    default:
      if (packageJson.scripts?.start) {
        return { cmd: "npm", args: ["start"] };
      }
      return { cmd: "npm", args: ["run", "dev"] };
  }
}

/**
 * Print the Cloudify dev banner
 */
function printBanner(port: string, framework: Framework, envCount: number): void {
  console.log("");
  console.log(chalk.cyan.bold("  ☁️  Cloudify Dev Server"));
  console.log(chalk.gray("  ─────────────────────────"));
  console.log("");
  console.log(`  ${chalk.gray("Framework:")}   ${chalk.white(framework)}`);
  console.log(`  ${chalk.gray("Local:")}       ${chalk.cyan(`http://localhost:${port}`)}`);
  console.log(`  ${chalk.gray("Env vars:")}    ${chalk.white(envCount)} loaded from Cloudify`);
  console.log("");
  console.log(chalk.gray("  Press Ctrl+C to stop"));
  console.log("");
}

/**
 * Create a local proxy server for Cloudify API
 */
function createApiProxy(apiUrl: string, token: string, proxyPort: number): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${proxyPort}`);

    // Forward to Cloudify API
    const targetUrl = `${apiUrl}${url.pathname}${url.search}`;

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      res.statusCode = response.status;
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }

      const body = await response.text();
      res.end(body);
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Proxy error" }));
    }
  });

  return server;
}

/**
 * Watch for .env file changes and reload environment
 */
function watchEnvFile(cwd: string, callback: () => void): fs.FSWatcher | null {
  const envFiles = [".env", ".env.local", ".env.development", ".env.development.local"];

  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);
    if (fs.existsSync(envPath)) {
      const watcher = fs.watch(envPath, () => {
        console.log(chalk.yellow(`\n  ${envFile} changed, restart to apply changes`));
        callback();
      });
      return watcher;
    }
  }

  return null;
}

export async function dev(options: DevOptions): Promise<void> {
  requireAuth();

  const cwd = process.cwd();
  const cloudifyConfigPath = path.join(cwd, "cloudify.json");
  const packageJsonPath = path.join(cwd, "package.json");

  // Check for cloudify.json
  if (!fs.existsSync(cloudifyConfigPath)) {
    console.error(chalk.red("\n  No cloudify.json found. Run `cloudify init` or `cloudify link` first.\n"));
    process.exit(1);
  }

  // Check for package.json
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("\n  No package.json found.\n"));
    process.exit(1);
  }

  const cloudifyConfig: CloudifyConfig = JSON.parse(fs.readFileSync(cloudifyConfigPath, "utf-8"));
  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const projectId = cloudifyConfig.projectId;
  const framework = (options.framework || cloudifyConfig.framework || detectFramework(packageJson)) as Framework;
  const port = options.port || "3000";

  // Fetch environment variables from Cloudify
  let envVars: EnvVariable[] = [];
  try {
    const response = await apiRequest<{ variables: EnvVariable[] }>(
      `/projects/${projectId}/env?target=development`
    );
    envVars = response.variables;
  } catch (error) {
    console.log(chalk.yellow("\n  Could not fetch environment variables from Cloudify"));
    console.log(chalk.gray(`  ${(error as Error).message}\n`));
  }

  // Build environment
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const { key, value } of envVars) {
    env[key] = value;
  }
  env.PORT = port;
  env.NODE_ENV = "development";

  // Get the dev command
  const devCommand = getDevCommand(framework, packageJson);

  // Print banner
  printBanner(port, framework, envVars.length);

  // Watch for .env changes if enabled
  let envWatcher: fs.FSWatcher | null = null;
  if (options.watch !== false) {
    envWatcher = watchEnvFile(cwd, () => {
      // Just notify, don't auto-restart
    });
  }

  // Spawn the dev process
  const child: ChildProcess = spawn(devCommand.cmd, devCommand.args, {
    cwd,
    env,
    stdio: "inherit",
    shell: true,
  });

  // Handle process exit
  child.on("close", (code) => {
    if (envWatcher) envWatcher.close();
    process.exit(code || 0);
  });

  child.on("error", (error) => {
    console.error(chalk.red(`\n  Failed to start dev server: ${error.message}\n`));
    if (envWatcher) envWatcher.close();
    process.exit(1);
  });

  // Handle signals
  const cleanup = () => {
    if (envWatcher) envWatcher.close();
    child.kill("SIGTERM");
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
