/**
 * ISR Revalidation Service
 *
 * Provides on-demand revalidation for Incremental Static Regeneration (ISR)
 * Compatible with Next.js and other frameworks supporting ISR.
 */

import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logging";
import { purgeCache, purgeCacheByPrefix } from "@/lib/integrations/cloudflare";

const logger = createLogger("isr");

export interface RevalidationResult {
  success: boolean;
  revalidated: string[];
  failed: string[];
  duration: number;
  cachesPurged: boolean;
}

export interface RevalidationOptions {
  purgeCloudflare?: boolean;
  secret?: string;
}

/**
 * Revalidate a single path
 */
export async function revalidatePath(
  projectId: string,
  path: string,
  options: RevalidationOptions = {}
): Promise<RevalidationResult> {
  const startTime = Date.now();
  const result: RevalidationResult = {
    success: false,
    revalidated: [],
    failed: [],
    duration: 0,
    cachesPurged: false,
  };

  try {
    // Get the project's active deployment
    const deployment = await prisma.deployment.findFirst({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        project: true,
      },
    });

    if (!deployment || !deployment.url) {
      throw new Error("No active deployment found");
    }

    // Build the revalidation URL
    const deploymentUrl = deployment.url.startsWith("http")
      ? deployment.url
      : `https://${deployment.url}`;

    const revalidateUrl = new URL("/api/revalidate", deploymentUrl);
    revalidateUrl.searchParams.set("path", path);
    if (options.secret) {
      revalidateUrl.searchParams.set("secret", options.secret);
    }

    logger.info("Triggering ISR revalidation", {
      projectId,
      path,
      url: revalidateUrl.toString(),
    });

    // Call the deployment's revalidation endpoint
    const response = await fetch(revalidateUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cloudify-Revalidate": "true",
      },
      body: JSON.stringify({ path }),
    });

    if (response.ok) {
      result.revalidated.push(path);
      result.success = true;

      // Purge Cloudflare cache if requested
      if (options.purgeCloudflare !== false) {
        const fullUrl = `${deploymentUrl}${path}`;
        const purgeResult = await purgeCache([fullUrl]);
        result.cachesPurged = purgeResult.success;
      }

      logger.info("ISR revalidation successful", { projectId, path });
    } else {
      const errorText = await response.text();
      result.failed.push(path);
      logger.error("ISR revalidation failed", new Error(errorText), { projectId, path });
    }
  } catch (error) {
    result.failed.push(path);
    logger.error("ISR revalidation error", error as Error, { projectId, path });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Revalidate multiple paths
 */
export async function revalidatePaths(
  projectId: string,
  paths: string[],
  options: RevalidationOptions = {}
): Promise<RevalidationResult> {
  const startTime = Date.now();
  const result: RevalidationResult = {
    success: false,
    revalidated: [],
    failed: [],
    duration: 0,
    cachesPurged: false,
  };

  // Revalidate paths in parallel (with concurrency limit)
  const concurrency = 5;
  const chunks: string[][] = [];
  for (let i = 0; i < paths.length; i += concurrency) {
    chunks.push(paths.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map((path) => revalidatePath(projectId, path, { ...options, purgeCloudflare: false }))
    );

    for (const r of results) {
      result.revalidated.push(...r.revalidated);
      result.failed.push(...r.failed);
    }
  }

  // Purge all URLs from Cloudflare at once
  if (options.purgeCloudflare !== false && result.revalidated.length > 0) {
    const deployment = await prisma.deployment.findFirst({
      where: { projectId, isActive: true },
    });

    if (deployment?.url) {
      const baseUrl = deployment.url.startsWith("http")
        ? deployment.url
        : `https://${deployment.url}`;
      const urls = result.revalidated.map((path) => `${baseUrl}${path}`);
      const purgeResult = await purgeCache(urls);
      result.cachesPurged = purgeResult.success;
    }
  }

  result.success = result.failed.length === 0;
  result.duration = Date.now() - startTime;

  return result;
}

/**
 * Revalidate by tag (cache tag)
 * This triggers revalidation for all paths associated with a tag
 */
export async function revalidateTag(
  projectId: string,
  tag: string,
  options: RevalidationOptions = {}
): Promise<RevalidationResult> {
  const startTime = Date.now();
  const result: RevalidationResult = {
    success: false,
    revalidated: [],
    failed: [],
    duration: 0,
    cachesPurged: false,
  };

  try {
    // Get the project's active deployment
    const deployment = await prisma.deployment.findFirst({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        project: true,
      },
    });

    if (!deployment || !deployment.url) {
      throw new Error("No active deployment found");
    }

    // Build the revalidation URL
    const deploymentUrl = deployment.url.startsWith("http")
      ? deployment.url
      : `https://${deployment.url}`;

    const revalidateUrl = new URL("/api/revalidate/tag", deploymentUrl);
    revalidateUrl.searchParams.set("tag", tag);
    if (options.secret) {
      revalidateUrl.searchParams.set("secret", options.secret);
    }

    logger.info("Triggering tag-based ISR revalidation", {
      projectId,
      tag,
      url: revalidateUrl.toString(),
    });

    // Call the deployment's tag revalidation endpoint
    const response = await fetch(revalidateUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cloudify-Revalidate": "true",
      },
      body: JSON.stringify({ tag }),
    });

    if (response.ok) {
      const data = await response.json();
      result.revalidated = data.revalidated || [tag];
      result.success = true;

      // Purge Cloudflare cache by prefix
      if (options.purgeCloudflare !== false) {
        const purgeResult = await purgeCacheByPrefix([deploymentUrl]);
        result.cachesPurged = purgeResult.success;
      }

      logger.info("Tag-based ISR revalidation successful", { projectId, tag });
    } else {
      const errorText = await response.text();
      result.failed.push(tag);
      logger.error("Tag-based ISR revalidation failed", new Error(errorText), { projectId, tag });
    }
  } catch (error) {
    result.failed.push(tag);
    logger.error("Tag-based ISR revalidation error", error as Error, { projectId, tag });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Revalidate all pages for a project
 * Used after a new deployment
 */
export async function revalidateAll(
  projectId: string,
  options: RevalidationOptions = {}
): Promise<RevalidationResult> {
  const startTime = Date.now();
  const result: RevalidationResult = {
    success: false,
    revalidated: [],
    failed: [],
    duration: 0,
    cachesPurged: false,
  };

  try {
    // Get the project's active deployment
    const deployment = await prisma.deployment.findFirst({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        project: true,
      },
    });

    if (!deployment || !deployment.url) {
      throw new Error("No active deployment found");
    }

    // Build the revalidation URL
    const deploymentUrl = deployment.url.startsWith("http")
      ? deployment.url
      : `https://${deployment.url}`;

    const revalidateUrl = new URL("/api/revalidate/all", deploymentUrl);
    if (options.secret) {
      revalidateUrl.searchParams.set("secret", options.secret);
    }

    logger.info("Triggering full ISR revalidation", { projectId });

    // Call the deployment's full revalidation endpoint
    const response = await fetch(revalidateUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cloudify-Revalidate": "true",
      },
    });

    if (response.ok) {
      const data = await response.json();
      result.revalidated = data.revalidated || ["all"];
      result.success = true;

      // Purge all Cloudflare cache for the deployment
      if (options.purgeCloudflare !== false) {
        const purgeResult = await purgeCacheByPrefix([deploymentUrl]);
        result.cachesPurged = purgeResult.success;
      }

      logger.info("Full ISR revalidation successful", { projectId });
    } else {
      const errorText = await response.text();
      result.failed.push("all");
      logger.error("Full ISR revalidation failed", new Error(errorText), { projectId });
    }
  } catch (error) {
    result.failed.push("all");
    logger.error("Full ISR revalidation error", error as Error, { projectId });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Create a webhook handler for ISR revalidation
 * Can be used by CMS or other services to trigger revalidation
 */
export function createRevalidationWebhookHandler(projectId: string, secret: string) {
  return async (request: Request): Promise<Response> => {
    try {
      // Verify secret
      const url = new URL(request.url);
      const providedSecret = url.searchParams.get("secret") || request.headers.get("x-webhook-secret");

      if (providedSecret !== secret) {
        return new Response(JSON.stringify({ error: "Invalid secret" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await request.json();
      const { path, paths, tag } = body;

      let result: RevalidationResult;

      if (tag) {
        result = await revalidateTag(projectId, tag);
      } else if (paths && Array.isArray(paths)) {
        result = await revalidatePaths(projectId, paths);
      } else if (path) {
        result = await revalidatePath(projectId, path);
      } else {
        return new Response(JSON.stringify({ error: "Missing path, paths, or tag" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
