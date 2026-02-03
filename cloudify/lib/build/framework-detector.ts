/**
 * Framework Auto-Detection
 *
 * Automatically detects the framework used in a repository and
 * configures build settings accordingly.
 *
 * Supported frameworks:
 * - Next.js
 * - Vite (React, Vue, Svelte)
 * - Remix
 * - Astro
 * - Nuxt
 * - SvelteKit
 * - Gatsby
 * - Create React App
 * - Vue CLI
 * - Angular
 * - Static HTML
 */

import { createLogger } from "@/lib/logging";

const logger = createLogger("framework-detector");

export interface FrameworkConfig {
  name: string;
  slug: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  devCommand: string;
  nodeVersion: string;
  serverless: boolean; // Supports serverless functions
  edgeFunctions: boolean; // Supports edge functions
  icon: string;
}

// Framework configurations
export const FRAMEWORKS: Record<string, FrameworkConfig> = {
  nextjs: {
    name: "Next.js",
    slug: "nextjs",
    buildCommand: "npm run build",
    outputDirectory: ".next",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: true,
    edgeFunctions: true,
    icon: "⚛️",
  },
  vite: {
    name: "Vite",
    slug: "vite",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: false,
    edgeFunctions: false,
    icon: "⚡",
  },
  remix: {
    name: "Remix",
    slug: "remix",
    buildCommand: "npm run build",
    outputDirectory: "build",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: true,
    edgeFunctions: true,
    icon: "💿",
  },
  astro: {
    name: "Astro",
    slug: "astro",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: true,
    edgeFunctions: true,
    icon: "🚀",
  },
  nuxt: {
    name: "Nuxt",
    slug: "nuxt",
    buildCommand: "npm run build",
    outputDirectory: ".output",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: true,
    edgeFunctions: true,
    icon: "💚",
  },
  sveltekit: {
    name: "SvelteKit",
    slug: "sveltekit",
    buildCommand: "npm run build",
    outputDirectory: "build",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: true,
    edgeFunctions: true,
    icon: "🔥",
  },
  gatsby: {
    name: "Gatsby",
    slug: "gatsby",
    buildCommand: "npm run build",
    outputDirectory: "public",
    installCommand: "npm install",
    devCommand: "npm run develop",
    nodeVersion: "20",
    serverless: true,
    edgeFunctions: false,
    icon: "💜",
  },
  cra: {
    name: "Create React App",
    slug: "cra",
    buildCommand: "npm run build",
    outputDirectory: "build",
    installCommand: "npm install",
    devCommand: "npm start",
    nodeVersion: "20",
    serverless: false,
    edgeFunctions: false,
    icon: "⚛️",
  },
  vue: {
    name: "Vue CLI",
    slug: "vue",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
    devCommand: "npm run serve",
    nodeVersion: "20",
    serverless: false,
    edgeFunctions: false,
    icon: "💚",
  },
  angular: {
    name: "Angular",
    slug: "angular",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
    devCommand: "npm start",
    nodeVersion: "20",
    serverless: false,
    edgeFunctions: false,
    icon: "🅰️",
  },
  static: {
    name: "Static HTML",
    slug: "static",
    buildCommand: "",
    outputDirectory: ".",
    installCommand: "",
    devCommand: "npx serve .",
    nodeVersion: "20",
    serverless: false,
    edgeFunctions: false,
    icon: "📄",
  },
  other: {
    name: "Other",
    slug: "other",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
    devCommand: "npm run dev",
    nodeVersion: "20",
    serverless: false,
    edgeFunctions: false,
    icon: "📦",
  },
};

export interface DetectionResult {
  framework: FrameworkConfig;
  confidence: number; // 0-100
  detectedBy: string[];
  suggestions: string[];
}

export interface FileInfo {
  name: string;
  content?: string;
}

/**
 * Detect framework from package.json
 */
function detectFromPackageJson(packageJson: Record<string, unknown>): DetectionResult | null {
  const dependencies = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const detectedBy: string[] = [];
  let framework: FrameworkConfig | null = null;
  let confidence = 0;

  // Next.js
  if (dependencies.next) {
    framework = FRAMEWORKS.nextjs;
    confidence = 95;
    detectedBy.push("next in dependencies");
  }
  // Remix
  else if (dependencies["@remix-run/react"] || dependencies["@remix-run/node"]) {
    framework = FRAMEWORKS.remix;
    confidence = 95;
    detectedBy.push("@remix-run packages in dependencies");
  }
  // Astro
  else if (dependencies.astro) {
    framework = FRAMEWORKS.astro;
    confidence = 95;
    detectedBy.push("astro in dependencies");
  }
  // Nuxt
  else if (dependencies.nuxt) {
    framework = FRAMEWORKS.nuxt;
    confidence = 95;
    detectedBy.push("nuxt in dependencies");
  }
  // SvelteKit
  else if (dependencies["@sveltejs/kit"]) {
    framework = FRAMEWORKS.sveltekit;
    confidence = 95;
    detectedBy.push("@sveltejs/kit in dependencies");
  }
  // Gatsby
  else if (dependencies.gatsby) {
    framework = FRAMEWORKS.gatsby;
    confidence = 95;
    detectedBy.push("gatsby in dependencies");
  }
  // Vite
  else if (dependencies.vite) {
    framework = FRAMEWORKS.vite;
    confidence = 90;
    detectedBy.push("vite in dependencies");
  }
  // Vue CLI
  else if (dependencies["@vue/cli-service"]) {
    framework = FRAMEWORKS.vue;
    confidence = 90;
    detectedBy.push("@vue/cli-service in dependencies");
  }
  // Angular
  else if (dependencies["@angular/core"]) {
    framework = FRAMEWORKS.angular;
    confidence = 90;
    detectedBy.push("@angular/core in dependencies");
  }
  // Create React App
  else if (dependencies["react-scripts"]) {
    framework = FRAMEWORKS.cra;
    confidence = 90;
    detectedBy.push("react-scripts in dependencies");
  }
  // Generic React (could be CRA or Vite)
  else if (dependencies.react && !dependencies.next) {
    framework = FRAMEWORKS.vite;
    confidence = 60;
    detectedBy.push("react without specific framework");
  }

  if (!framework) return null;

  return {
    framework,
    confidence,
    detectedBy,
    suggestions: [],
  };
}

/**
 * Detect framework from config files
 */
function detectFromConfigFiles(files: string[]): DetectionResult | null {
  const detectedBy: string[] = [];
  let framework: FrameworkConfig | null = null;
  let confidence = 0;

  const fileSet = new Set(files.map((f) => f.toLowerCase()));

  // Next.js
  if (fileSet.has("next.config.js") || fileSet.has("next.config.mjs") || fileSet.has("next.config.ts")) {
    framework = FRAMEWORKS.nextjs;
    confidence = 100;
    detectedBy.push("next.config.* file found");
  }
  // Remix
  else if (fileSet.has("remix.config.js")) {
    framework = FRAMEWORKS.remix;
    confidence = 100;
    detectedBy.push("remix.config.js found");
  }
  // Astro
  else if (fileSet.has("astro.config.mjs") || fileSet.has("astro.config.ts")) {
    framework = FRAMEWORKS.astro;
    confidence = 100;
    detectedBy.push("astro.config.* found");
  }
  // Nuxt
  else if (fileSet.has("nuxt.config.js") || fileSet.has("nuxt.config.ts")) {
    framework = FRAMEWORKS.nuxt;
    confidence = 100;
    detectedBy.push("nuxt.config.* found");
  }
  // SvelteKit
  else if (fileSet.has("svelte.config.js")) {
    framework = FRAMEWORKS.sveltekit;
    confidence = 100;
    detectedBy.push("svelte.config.js found");
  }
  // Gatsby
  else if (fileSet.has("gatsby-config.js") || fileSet.has("gatsby-config.ts")) {
    framework = FRAMEWORKS.gatsby;
    confidence = 100;
    detectedBy.push("gatsby-config.* found");
  }
  // Vite
  else if (fileSet.has("vite.config.js") || fileSet.has("vite.config.ts")) {
    framework = FRAMEWORKS.vite;
    confidence = 100;
    detectedBy.push("vite.config.* found");
  }
  // Angular
  else if (fileSet.has("angular.json")) {
    framework = FRAMEWORKS.angular;
    confidence = 100;
    detectedBy.push("angular.json found");
  }
  // Vue CLI
  else if (fileSet.has("vue.config.js")) {
    framework = FRAMEWORKS.vue;
    confidence = 100;
    detectedBy.push("vue.config.js found");
  }
  // Static HTML
  else if (fileSet.has("index.html") && !fileSet.has("package.json")) {
    framework = FRAMEWORKS.static;
    confidence = 80;
    detectedBy.push("index.html without package.json");
  }

  if (!framework) return null;

  return {
    framework,
    confidence,
    detectedBy,
    suggestions: [],
  };
}

/**
 * Main detection function
 */
export async function detectFramework(
  files: string[],
  packageJsonContent?: string
): Promise<DetectionResult> {
  logger.info("Detecting framework", { fileCount: files.length });

  const results: DetectionResult[] = [];

  // Try detection from config files first (highest confidence)
  const configResult = detectFromConfigFiles(files);
  if (configResult) {
    results.push(configResult);
  }

  // Try detection from package.json
  if (packageJsonContent) {
    try {
      const packageJson = JSON.parse(packageJsonContent);
      const pkgResult = detectFromPackageJson(packageJson);
      if (pkgResult) {
        results.push(pkgResult);
      }
    } catch (error) {
      logger.warn("Failed to parse package.json", { error });
    }
  }

  // Sort by confidence and take the best match
  results.sort((a, b) => b.confidence - a.confidence);

  if (results.length > 0) {
    const best = results[0];
    logger.info("Framework detected", {
      framework: best.framework.name,
      confidence: best.confidence,
      detectedBy: best.detectedBy,
    });
    return best;
  }

  // Default to "other" if nothing detected
  logger.info("No framework detected, defaulting to 'other'");
  return {
    framework: FRAMEWORKS.other,
    confidence: 0,
    detectedBy: ["default"],
    suggestions: ["Add a package.json or framework config file"],
  };
}

/**
 * Get build settings override from vercel.json or cloudify.json
 */
export function parseBuildConfig(configContent: string): Partial<FrameworkConfig> | null {
  try {
    const config = JSON.parse(configContent);
    const buildConfig: Partial<FrameworkConfig> = {};

    if (config.buildCommand) buildConfig.buildCommand = config.buildCommand;
    if (config.outputDirectory) buildConfig.outputDirectory = config.outputDirectory;
    if (config.installCommand) buildConfig.installCommand = config.installCommand;
    if (config.devCommand) buildConfig.devCommand = config.devCommand;
    if (config.framework) {
      const fw = FRAMEWORKS[config.framework];
      if (fw) return { ...fw, ...buildConfig };
    }

    return Object.keys(buildConfig).length > 0 ? buildConfig : null;
  } catch {
    return null;
  }
}

/**
 * Get all supported frameworks
 */
export function getSupportedFrameworks(): FrameworkConfig[] {
  return Object.values(FRAMEWORKS);
}

/**
 * Get framework by slug
 */
export function getFrameworkBySlug(slug: string): FrameworkConfig | null {
  return FRAMEWORKS[slug] || null;
}

// Re-export monorepo detection utilities
export {
  detectMonorepo,
  getBuildCommand,
  getInstallCommand,
  getOutputDirectory,
  getSupportedMonorepoTools,
  type MonorepoConfig,
  type MonorepoTool,
  type WorkspacePackage,
} from "./monorepo-detector";
