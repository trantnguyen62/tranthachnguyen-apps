/**
 * Monorepo Detection and Configuration
 *
 * Detects and handles monorepo structures:
 * - Turborepo
 * - Nx
 * - Lerna
 * - pnpm workspaces
 * - npm/yarn workspaces
 *
 * Provides build configuration for each package in the monorepo.
 */

import { loggers } from "@/lib/logging";

const logger = loggers.build.child("monorepo");

export type MonorepoTool = "turborepo" | "nx" | "lerna" | "pnpm" | "yarn" | "npm" | "none";

export interface WorkspacePackage {
  name: string;
  path: string;
  relativePath: string;
  packageJson?: {
    name: string;
    version?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  framework?: string;
  isDeployable: boolean;
}

export interface MonorepoConfig {
  isMonorepo: boolean;
  tool: MonorepoTool;
  rootPath: string;
  workspacePatterns: string[];
  packages: WorkspacePackage[];
  turboConfig?: TurboConfig;
  nxConfig?: NxConfig;
}

export interface TurboConfig {
  pipeline?: Record<
    string,
    {
      dependsOn?: string[];
      outputs?: string[];
      cache?: boolean;
    }
  >;
  globalDependencies?: string[];
  globalEnv?: string[];
}

export interface NxConfig {
  targetDefaults?: Record<string, unknown>;
  namedInputs?: Record<string, unknown>;
  tasksRunnerOptions?: Record<string, unknown>;
}

export interface DetectionResult {
  config: MonorepoConfig;
  detectedBy: string[];
  suggestions: string[];
}

/**
 * Detect monorepo configuration from file list and contents
 */
export async function detectMonorepo(
  files: string[],
  fileContents?: Record<string, string>
): Promise<DetectionResult> {
  const detectedBy: string[] = [];
  const suggestions: string[] = [];

  // Initialize config
  const config: MonorepoConfig = {
    isMonorepo: false,
    tool: "none",
    rootPath: "/",
    workspacePatterns: [],
    packages: [],
  };

  // Check for monorepo indicators
  const hasTurboJson = files.includes("turbo.json");
  const hasNxJson = files.includes("nx.json");
  const hasLernaJson = files.includes("lerna.json");
  const hasPnpmWorkspace = files.includes("pnpm-workspace.yaml");
  const hasPackageJson = files.includes("package.json");

  // Parse root package.json
  let rootPackageJson: Record<string, unknown> | null = null;
  if (hasPackageJson && fileContents?.["package.json"]) {
    try {
      rootPackageJson = JSON.parse(fileContents["package.json"]);
    } catch {
      logger.warn("Failed to parse root package.json");
    }
  }

  // Detect workspaces from package.json
  const workspaces = extractWorkspaces(rootPackageJson);

  // Determine monorepo tool
  if (hasTurboJson) {
    config.isMonorepo = true;
    config.tool = "turborepo";
    detectedBy.push("turbo.json found");

    // Parse turbo.json
    if (fileContents?.["turbo.json"]) {
      try {
        config.turboConfig = JSON.parse(fileContents["turbo.json"]);
      } catch {
        logger.warn("Failed to parse turbo.json");
      }
    }
  } else if (hasNxJson) {
    config.isMonorepo = true;
    config.tool = "nx";
    detectedBy.push("nx.json found");

    // Parse nx.json
    if (fileContents?.["nx.json"]) {
      try {
        config.nxConfig = JSON.parse(fileContents["nx.json"]);
      } catch {
        logger.warn("Failed to parse nx.json");
      }
    }
  } else if (hasLernaJson) {
    config.isMonorepo = true;
    config.tool = "lerna";
    detectedBy.push("lerna.json found");
  } else if (hasPnpmWorkspace) {
    config.isMonorepo = true;
    config.tool = "pnpm";
    detectedBy.push("pnpm-workspace.yaml found");
  } else if (workspaces.length > 0) {
    config.isMonorepo = true;
    config.tool = hasYarnLock(files) ? "yarn" : "npm";
    detectedBy.push("workspaces field in package.json");
  }

  // Set workspace patterns
  if (workspaces.length > 0) {
    config.workspacePatterns = workspaces;
  } else if (hasPnpmWorkspace && fileContents?.["pnpm-workspace.yaml"]) {
    config.workspacePatterns = parsePnpmWorkspaces(fileContents["pnpm-workspace.yaml"]);
  } else if (config.isMonorepo) {
    // Default patterns
    config.workspacePatterns = ["packages/*", "apps/*"];
    suggestions.push("Consider adding explicit workspace patterns");
  }

  // Detect packages from directory structure
  config.packages = detectPackages(files, config.workspacePatterns, fileContents);

  // Add suggestions based on detection
  if (config.isMonorepo && config.packages.length === 0) {
    suggestions.push("No deployable packages found in workspace patterns");
  }

  if (config.tool === "turborepo" && !config.turboConfig?.pipeline?.build) {
    suggestions.push("Consider adding a 'build' task to turbo.json pipeline");
  }

  logger.info("Monorepo detection complete", {
    isMonorepo: config.isMonorepo,
    tool: config.tool,
    packageCount: config.packages.length,
  });

  return { config, detectedBy, suggestions };
}

/**
 * Extract workspaces from package.json
 */
function extractWorkspaces(packageJson: Record<string, unknown> | null): string[] {
  if (!packageJson) return [];

  const workspaces = packageJson.workspaces;

  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  if (typeof workspaces === "object" && workspaces !== null) {
    const ws = workspaces as { packages?: string[] };
    if (Array.isArray(ws.packages)) {
      return ws.packages;
    }
  }

  return [];
}

/**
 * Check if yarn.lock exists
 */
function hasYarnLock(files: string[]): boolean {
  return files.includes("yarn.lock");
}

/**
 * Parse pnpm-workspace.yaml
 */
function parsePnpmWorkspaces(content: string): string[] {
  const patterns: string[] = [];
  const lines = content.split("\n");
  let inPackages = false;

  for (const line of lines) {
    if (line.trim() === "packages:") {
      inPackages = true;
      continue;
    }

    if (inPackages && line.trim().startsWith("-")) {
      const pattern = line.trim().replace(/^-\s*['"]?/, "").replace(/['"]?\s*$/, "");
      if (pattern) {
        patterns.push(pattern);
      }
    } else if (inPackages && !line.startsWith(" ") && !line.startsWith("\t")) {
      inPackages = false;
    }
  }

  return patterns;
}

/**
 * Detect packages based on workspace patterns and file structure
 */
function detectPackages(
  files: string[],
  patterns: string[],
  fileContents?: Record<string, string>
): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];
  const packageJsonFiles = files.filter((f) => f.endsWith("package.json") && f !== "package.json");

  for (const pkgPath of packageJsonFiles) {
    const relativePath = pkgPath.replace("/package.json", "");
    const parts = relativePath.split("/").filter(Boolean);

    // Check if path matches any workspace pattern
    if (!matchesPattern(relativePath, patterns)) {
      continue;
    }

    // Parse package.json
    let packageJson: WorkspacePackage["packageJson"];
    const content = fileContents?.[pkgPath];
    if (content) {
      try {
        packageJson = JSON.parse(content);
      } catch {
        continue;
      }
    }

    // Determine if deployable (has build script or is a known framework)
    const isDeployable = isPackageDeployable(packageJson, files, relativePath);

    // Detect framework
    const framework = detectPackageFramework(packageJson);

    packages.push({
      name: packageJson?.name || parts[parts.length - 1],
      path: `/${relativePath}`,
      relativePath,
      packageJson,
      framework,
      isDeployable,
    });
  }

  return packages;
}

/**
 * Check if a path matches workspace patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple glob matching
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/\*\*/g, "___DOUBLE___")
          .replace(/\*/g, "[^/]+")
          .replace(/___DOUBLE___/g, ".*") +
        "$"
    );

    if (regex.test(path)) {
      return true;
    }
  }
  return false;
}

/**
 * Determine if a package is deployable
 */
function isPackageDeployable(
  packageJson: WorkspacePackage["packageJson"],
  files: string[],
  relativePath: string
): boolean {
  if (!packageJson) return false;

  // Has build script
  if (packageJson.scripts?.build) return true;

  // Has common framework files
  const frameworkFiles = [
    `${relativePath}/next.config.js`,
    `${relativePath}/next.config.mjs`,
    `${relativePath}/vite.config.ts`,
    `${relativePath}/vite.config.js`,
    `${relativePath}/astro.config.mjs`,
    `${relativePath}/nuxt.config.ts`,
    `${relativePath}/remix.config.js`,
  ];

  return frameworkFiles.some((f) => files.includes(f));
}

/**
 * Detect framework for a package
 */
function detectPackageFramework(packageJson: WorkspacePackage["packageJson"]): string | undefined {
  if (!packageJson) return undefined;

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (deps.next) return "nextjs";
  if (deps.vite) return "vite";
  if (deps.astro) return "astro";
  if (deps.nuxt) return "nuxt";
  if (deps["@remix-run/react"]) return "remix";
  if (deps.svelte || deps["@sveltejs/kit"]) return "svelte";
  if (deps.gatsby) return "gatsby";

  return undefined;
}

/**
 * Get build command for a monorepo package
 */
export function getBuildCommand(
  config: MonorepoConfig,
  packageName: string
): { command: string; cwd: string } {
  const pkg = config.packages.find((p) => p.name === packageName);

  if (!pkg) {
    throw new Error(`Package ${packageName} not found in monorepo`);
  }

  switch (config.tool) {
    case "turborepo":
      return {
        command: `turbo run build --filter=${packageName}`,
        cwd: config.rootPath,
      };

    case "nx":
      return {
        command: `nx build ${packageName}`,
        cwd: config.rootPath,
      };

    case "lerna":
      return {
        command: `lerna run build --scope=${packageName}`,
        cwd: config.rootPath,
      };

    case "pnpm":
      return {
        command: `pnpm --filter ${packageName} run build`,
        cwd: config.rootPath,
      };

    case "yarn":
      return {
        command: `yarn workspace ${packageName} build`,
        cwd: config.rootPath,
      };

    case "npm":
      return {
        command: `npm run build --workspace=${packageName}`,
        cwd: config.rootPath,
      };

    default:
      return {
        command: "npm run build",
        cwd: pkg.path,
      };
  }
}

/**
 * Get install command for monorepo
 */
export function getInstallCommand(config: MonorepoConfig): string {
  switch (config.tool) {
    case "pnpm":
      return "pnpm install --frozen-lockfile";

    case "yarn":
      return "yarn install --frozen-lockfile";

    case "npm":
    default:
      return "npm ci";
  }
}

/**
 * Get output directory for a package
 */
export function getOutputDirectory(
  config: MonorepoConfig,
  packageName: string
): string {
  const pkg = config.packages.find((p) => p.name === packageName);

  if (!pkg) {
    throw new Error(`Package ${packageName} not found in monorepo`);
  }

  // Framework-specific output directories
  switch (pkg.framework) {
    case "nextjs":
      return `${pkg.path}/.next`;
    case "vite":
      return `${pkg.path}/dist`;
    case "astro":
      return `${pkg.path}/dist`;
    case "nuxt":
      return `${pkg.path}/.output`;
    case "remix":
      return `${pkg.path}/build`;
    case "svelte":
      return `${pkg.path}/build`;
    case "gatsby":
      return `${pkg.path}/public`;
    default:
      return `${pkg.path}/dist`;
  }
}

/**
 * List supported monorepo tools
 */
export function getSupportedMonorepoTools(): Array<{
  name: string;
  value: MonorepoTool;
  description: string;
}> {
  return [
    {
      name: "Turborepo",
      value: "turborepo",
      description: "High-performance build system for JavaScript/TypeScript monorepos",
    },
    {
      name: "Nx",
      value: "nx",
      description: "Smart, fast and extensible build system",
    },
    {
      name: "Lerna",
      value: "lerna",
      description: "Tool for managing JavaScript projects with multiple packages",
    },
    {
      name: "pnpm Workspaces",
      value: "pnpm",
      description: "Fast, disk space efficient package manager workspaces",
    },
    {
      name: "Yarn Workspaces",
      value: "yarn",
      description: "Yarn native monorepo support",
    },
    {
      name: "npm Workspaces",
      value: "npm",
      description: "npm native monorepo support",
    },
  ];
}
