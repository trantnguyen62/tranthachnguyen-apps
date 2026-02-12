/**
 * Analytics Script Injection
 *
 * Injects the Cloudify analytics tracking script into deployed site HTML files.
 * Supports both local filesystem (Docker builds) and MinIO (K8s builds).
 */

import { promises as fs } from "fs";
import path from "path";
import { createLogger } from "@/lib/logging";

const logger = createLogger("analytics-inject");

/**
 * The analytics script tag template.
 * Uses `defer` to avoid blocking page rendering.
 */
function getAnalyticsScriptTag(projectId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";
  return `<script defer src="${baseUrl}/api/analytics/script/${projectId}"></script>`;
}

/**
 * Inject analytics script into an HTML string.
 * Inserts the script tag just before </head> if present.
 * Returns the modified HTML or null if injection was not possible.
 */
export function injectAnalyticsIntoHtml(
  html: string,
  projectId: string
): string | null {
  const scriptTag = getAnalyticsScriptTag(projectId);

  // Check if the script is already injected (idempotency)
  if (html.includes("/api/analytics/script/")) {
    return null;
  }

  // Prefer injecting before </head>
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptTag}\n</head>`);
  }

  // Fallback: inject before </body>
  if (html.includes("</body>")) {
    return html.replace("</body>", `${scriptTag}\n</body>`);
  }

  // Cannot inject -- not a standard HTML file
  return null;
}

/**
 * Inject analytics script into a local build directory.
 * Used by the Docker build pipeline (worker.ts).
 *
 * Scans for index.html in the build output directory and injects
 * the analytics tracking script.
 */
export async function injectAnalyticsIntoLocalBuild(
  buildDir: string,
  projectId: string
): Promise<boolean> {
  const indexPath = path.join(buildDir, "index.html");

  try {
    // Check if index.html exists
    const stat = await fs.stat(indexPath);
    if (!stat.isFile()) {
      logger.info("index.html is not a regular file, skipping analytics injection", { buildDir });
      return false;
    }

    // Read the file
    const html = await fs.readFile(indexPath, "utf-8");

    // Inject the script
    const modifiedHtml = injectAnalyticsIntoHtml(html, projectId);

    if (modifiedHtml === null) {
      logger.info("Analytics script already injected or HTML structure not suitable", { buildDir });
      return false;
    }

    // Write the modified file
    await fs.writeFile(indexPath, modifiedHtml, "utf-8");
    logger.info("Analytics script injected into local build", { buildDir, projectId });
    return true;
  } catch (error) {
    // File doesn't exist or other error -- skip silently
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logger.info("No index.html found, skipping analytics injection", { buildDir });
    } else {
      logger.warn("Failed to inject analytics script into local build", {
        error: error instanceof Error ? error.message : String(error),
        buildDir,
      });
    }
    return false;
  }
}

/**
 * Inject analytics script into a MinIO-stored build.
 * Used by the K8s build pipeline (k8s-worker.ts).
 *
 * Downloads index.html from MinIO, injects the analytics script,
 * and re-uploads the modified file.
 */
export async function injectAnalyticsIntoMinioBuild(
  siteSlug: string,
  projectId: string
): Promise<boolean> {
  try {
    const { getArtifact, uploadArtifact } = await import("@/lib/build/artifact-manager");

    // Download index.html from MinIO
    const htmlBuffer = await getArtifact(siteSlug, "index.html");

    if (!htmlBuffer) {
      logger.info("No index.html found in MinIO artifacts, skipping analytics injection", { siteSlug });
      return false;
    }

    const html = htmlBuffer.toString("utf-8");

    // Inject the script
    const modifiedHtml = injectAnalyticsIntoHtml(html, projectId);

    if (modifiedHtml === null) {
      logger.info("Analytics script already injected or HTML structure not suitable", { siteSlug });
      return false;
    }

    // Upload the modified file back to MinIO
    await uploadArtifact(siteSlug, "index.html", modifiedHtml, "text/html");
    logger.info("Analytics script injected into MinIO build", { siteSlug, projectId });
    return true;
  } catch (error) {
    logger.warn("Failed to inject analytics script into MinIO build", {
      error: error instanceof Error ? error.message : String(error),
      siteSlug,
    });
    return false;
  }
}
