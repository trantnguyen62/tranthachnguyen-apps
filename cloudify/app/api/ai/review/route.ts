/**
 * AI Code Review API
 *
 * POST /api/ai/review - Perform AI-powered code review on deployment changes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { analyzeWithPrompt, parseAIJson, isAIAvailable } from "@/lib/ai/client";
import { CODE_REVIEW_PROMPT } from "@/lib/ai/prompts";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ai/review");

interface CodeReviewIssue {
  severity: "critical" | "warning" | "suggestion";
  category: "performance" | "security" | "best-practice" | "bug";
  line?: number;
  file?: string;
  message: string;
  suggestion: string;
}

interface CodeReviewResult {
  summary: string;
  score: number;
  issues: CodeReviewIssue[];
  highlights: string[];
}

/**
 * Build scope-specific review prompt
 */
function buildReviewPrompt(scope: "full" | "security" | "performance"): string {
  let scopeInstructions = "";

  switch (scope) {
    case "security":
      scopeInstructions = `
Focus primarily on SECURITY issues:
- XSS (Cross-Site Scripting) vulnerabilities
- SQL/NoSQL injection risks
- Exposed secrets or credentials
- Insecure data handling
- Authentication/authorization flaws
- CSRF vulnerabilities
- Unsafe dependencies
`;
      break;
    case "performance":
      scopeInstructions = `
Focus primarily on PERFORMANCE issues:
- Render-blocking resources
- Large bundle sizes
- Unoptimized images
- Missing caching headers
- Inefficient data fetching
- Memory leaks
- Unnecessary re-renders (React)
- Missing lazy loading
`;
      break;
    default:
      scopeInstructions = `
Review ALL aspects of code quality:
- Security vulnerabilities
- Performance issues
- Best practice violations
- Potential bugs
- Code maintainability
`;
  }

  return `${CODE_REVIEW_PROMPT}

${scopeInstructions}

Provide your analysis in the JSON format specified above.`;
}

/**
 * POST /api/ai/review
 *
 * Perform AI code review on deployment
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAIAvailable()) {
      return NextResponse.json(
        { error: "AI features not configured" },
        { status: 503 }
      );
    }

    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { deploymentId, scope = "full", code } = body;

    if (!deploymentId && !code) {
      return NextResponse.json(
        { error: "Either deploymentId or code is required" },
        { status: 400 }
      );
    }

    let codeToReview = code || "";
    let projectInfo = "";
    let capturedProjectId: string | null = null;

    // If deploymentId provided, fetch deployment info
    if (deploymentId) {
      const deployment = await prisma.deployment.findFirst({
        where: {
          id: deploymentId,
          project: {
            userId: user.id,
          },
        },
        include: {
          project: {
            select: {
              name: true,
              framework: true,
              repoUrl: true,
            },
          },
          logs: {
            select: {
              message: true,
              level: true,
            },
          },
        },
      });

      if (!deployment) {
        return NextResponse.json(
          { error: "Deployment not found" },
          { status: 404 }
        );
      }

      capturedProjectId = deployment.projectId;

      projectInfo = `
## Project Information
- Name: ${deployment.project.name}
- Framework: ${deployment.project.framework || "Unknown"}
- Repository: ${deployment.project.repoUrl}
- Branch: ${deployment.branch}
- Commit: ${deployment.commitSha}

## Build Logs
${deployment.logs?.map(l => `[${l.level}] ${l.message}`).join("\n") || "No build logs available"}
`;
    }

    // Build the review prompt
    const reviewPrompt = buildReviewPrompt(scope as "full" | "security" | "performance");

    // Perform the review
    const reviewContent = codeToReview || projectInfo;
    const aiResponse = await analyzeWithPrompt({
      prompt: reviewPrompt,
      content: reviewContent,
    });

    // Parse the AI response
    const review = parseAIJson<CodeReviewResult>(aiResponse);

    if (!review) {
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          rawResponse: aiResponse,
        },
        { status: 500 }
      );
    }

    // Store the review result
    const analysis = await prisma.aIAnalysis.create({
      data: {
        projectId: capturedProjectId || "",
        deploymentId: deploymentId || null,
        type: `code_review_${scope}`,
        status: "completed",
        input: { scope, codeToReview: !!codeToReview },
        output: JSON.parse(JSON.stringify({
          summary: review.summary,
          score: review.score,
          issues: review.issues,
          highlights: review.highlights,
        })),
      },
    });

    return NextResponse.json({
      id: analysis.id,
      deploymentId,
      scope,
      summary: review.summary,
      score: review.score,
      issues: review.issues,
      highlights: review.highlights,
      createdAt: analysis.createdAt.toISOString(),
    });
  } catch (error) {
    log.error("Code review failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Code review failed" },
      { status: 500 }
    );
  }
}
