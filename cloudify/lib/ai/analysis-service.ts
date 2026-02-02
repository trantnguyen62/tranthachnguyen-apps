/**
 * AI Analysis Service
 * Provides AI-powered analysis for deployments, errors, and performance
 */

import { prisma } from "@/lib/prisma";
import { generateCompletion, parseAIJson, isAIAvailable } from "./client";
import {
  DEPLOYMENT_ANALYSIS_PROMPT,
  ERROR_PATTERN_PROMPT,
  BUILD_FAILURE_PROMPT,
} from "./prompts";

export interface DeploymentAnalysis {
  summary: string;
  status: "success" | "warning" | "error";
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    line?: number;
  }>;
  rootCause: string | null;
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    impact: string;
  }>;
  optimizations: Array<{
    area: string;
    suggestion: string;
    estimatedImprovement: string;
  }>;
}

/**
 * Analyze a deployment
 */
export async function analyzeDeployment(
  deploymentId: string
): Promise<DeploymentAnalysis | null> {
  if (!isAIAvailable()) {
    console.warn("AI analysis unavailable: ANTHROPIC_API_KEY not set");
    return null;
  }

  // Get deployment with logs
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      project: {
        select: { name: true, framework: true, buildCmd: true },
      },
      logs: {
        orderBy: { timestamp: "asc" },
        take: 200,
      },
    },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  // Create analysis record
  const analysis = await prisma.aIAnalysis.create({
    data: {
      projectId: deployment.projectId,
      deploymentId,
      type: "deployment_analysis",
      status: "processing",
      input: {
        status: deployment.status,
        branch: deployment.branch,
        framework: deployment.project.framework,
        buildCmd: deployment.project.buildCmd,
        logsCount: deployment.logs.length,
      },
    },
  });

  try {
    // Format logs for analysis
    const logsText = deployment.logs
      .map((log) => `[${log.level.toUpperCase()}] ${log.message}`)
      .join("\n");

    const context = `
Project: ${deployment.project.name}
Framework: ${deployment.project.framework}
Build Command: ${deployment.project.buildCmd}
Branch: ${deployment.branch}
Status: ${deployment.status}
Build Time: ${deployment.buildTime || "N/A"}ms

Build Logs:
${logsText}
    `.trim();

    const startTime = Date.now();
    const response = await generateCompletion({
      systemPrompt: DEPLOYMENT_ANALYSIS_PROMPT,
      messages: [{ role: "user", content: context }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const result = parseAIJson<DeploymentAnalysis>(response.content);

    if (!result) {
      throw new Error("Failed to parse AI response");
    }

    // Update analysis record
    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: "completed",
        output: result as any,
        model: response.model,
        tokens: response.inputTokens + response.outputTokens,
        latency: Date.now() - startTime,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    // Update analysis record with error
    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: "failed",
        output: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Analyze a build failure
 */
export async function analyzeBuildFailure(
  deploymentId: string
): Promise<{
  rootCause: string;
  solution: string;
  steps: string[];
  relatedDocs: string[];
} | null> {
  if (!isAIAvailable()) return null;

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      project: true,
      logs: {
        where: { level: "error" },
        orderBy: { timestamp: "desc" },
        take: 50,
      },
    },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  const errorLogs = deployment.logs.map((log) => log.message).join("\n");

  const context = `
Framework: ${deployment.project.framework}
Node Version: ${deployment.project.nodeVersion}
Build Command: ${deployment.project.buildCmd}
Install Command: ${deployment.project.installCmd}

Error Logs:
${errorLogs}
  `.trim();

  const response = await generateCompletion({
    systemPrompt: BUILD_FAILURE_PROMPT,
    messages: [{ role: "user", content: context }],
    maxTokens: 2048,
    temperature: 0.3,
  });

  return parseAIJson(response.content);
}

/**
 * Detect and categorize error patterns
 */
export async function detectErrorPatterns(
  projectId: string,
  timeRange: { start: Date; end: Date }
): Promise<
  Array<{
    pattern: string;
    category: string;
    frequency: number;
    solution: string;
  }>
> {
  if (!isAIAvailable()) return [];

  // Get error logs from deployments
  const deployments = await prisma.deployment.findMany({
    where: {
      projectId,
      status: "ERROR",
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    },
    include: {
      logs: {
        where: { level: "error" },
      },
    },
  });

  const allErrors = deployments.flatMap((d) =>
    d.logs.map((log) => log.message)
  );

  if (allErrors.length === 0) {
    return [];
  }

  const context = `
Total Errors: ${allErrors.length}
Time Period: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}

Error Messages:
${allErrors.slice(0, 100).join("\n---\n")}
  `.trim();

  const response = await generateCompletion({
    systemPrompt: ERROR_PATTERN_PROMPT,
    messages: [{ role: "user", content: context }],
    maxTokens: 2048,
    temperature: 0.3,
  });

  const patterns = parseAIJson<
    Array<{
      pattern: string;
      category: string;
      frequency: number;
      solution: string;
    }>
  >(response.content);

  if (!patterns) return [];

  // Store patterns in database
  for (const pattern of patterns) {
    const existing = await prisma.errorPattern.findFirst({
      where: {
        projectId,
        pattern: pattern.pattern,
      },
    });

    if (existing) {
      await prisma.errorPattern.update({
        where: { id: existing.id },
        data: {
          frequency: existing.frequency + pattern.frequency,
          lastOccurrence: new Date(),
          aiSolution: pattern.solution,
        },
      });
    } else {
      await prisma.errorPattern.create({
        data: {
          projectId,
          pattern: pattern.pattern,
          category: pattern.category,
          frequency: pattern.frequency,
          aiSolution: pattern.solution,
          firstOccurrence: timeRange.start,
          lastOccurrence: new Date(),
        },
      });
    }
  }

  return patterns;
}

/**
 * Get AI analysis for a deployment
 */
export async function getDeploymentAnalysis(
  deploymentId: string
): Promise<DeploymentAnalysis | null> {
  const analysis = await prisma.aIAnalysis.findFirst({
    where: {
      deploymentId,
      type: "deployment_analysis",
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!analysis || !analysis.output) {
    return null;
  }

  return analysis.output as unknown as DeploymentAnalysis;
}

/**
 * Get error patterns for a project
 */
export async function getErrorPatterns(projectId: string) {
  return prisma.errorPattern.findMany({
    where: {
      projectId,
      resolved: false,
    },
    orderBy: [{ frequency: "desc" }, { lastOccurrence: "desc" }],
    take: 20,
  });
}
