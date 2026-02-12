/**
 * AI Conversation Messages API
 *
 * POST /api/ai/conversations/[id]/messages - Send message and get AI response
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import {
  generateCompletion,
  generateStreamingCompletion,
  AIMessage as AIClientMessage,
} from "@/lib/ai/client";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ai/conversations/messages");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Build context-aware system prompt
 */
async function buildSystemPrompt(
  conversationId: string,
  projectId: string | null
): Promise<string> {
  let contextInfo = "";

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            status: true,
            branch: true,
            commitMessage: true,
            createdAt: true,
          },
        },
        envVariables: {
          where: { isSecret: false },
          select: { key: true },
        },
      },
    });

    if (project) {
      contextInfo = `
## Current Project Context
- **Project**: ${project.name} (${project.framework || "Unknown framework"})
- **Repository**: ${project.repoUrl}
- **Branch**: ${project.repoBranch}
- **Build Command**: ${project.buildCmd || "Default"}
- **Output Directory**: ${project.outputDir || "Default"}

## Environment Variables
${project.envVariables.map((v) => `- ${v.key}`).join("\n")}

## Recent Deployments
${project.deployments
  .map(
    (d) =>
      `- ${d.status} on ${d.branch}: "${d.commitMessage}" (${d.createdAt.toISOString().split("T")[0]})`
  )
  .join("\n")}
`;
    }
  }

  return `${CHAT_SYSTEM_PROMPT}

${contextInfo}`;
}

/**
 * POST /api/ai/conversations/[id]/messages
 *
 * Send a message and receive AI response
 * Supports both streaming and non-streaming responses
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, stream = false } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify conversation ownership and get messages
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Save the user message
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "user",
        content,
      },
    });

    // Build message history for AI
    const messageHistory: AIClientMessage[] = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Add the new user message
    messageHistory.push({
      role: "user",
      content,
    });

    // Build context-aware system prompt
    const systemPrompt = await buildSystemPrompt(
      conversationId,
      conversation.projectId
    );

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          let fullResponse = "";

          try {
            const streamGenerator = generateStreamingCompletion({
              systemPrompt,
              messages: messageHistory,
              temperature: 0.7,
            });

            for await (const chunk of streamGenerator) {
              if (chunk.type === "text" && chunk.content) {
                fullResponse += chunk.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk.content })}\n\n`)
                );
              } else if (chunk.type === "done") {
                // Save the complete assistant message
                const assistantMessage = await prisma.aIMessage.create({
                  data: {
                    conversationId,
                    role: "assistant",
                    content: fullResponse,
                  },
                });

                // Update conversation timestamp
                await prisma.aIConversation.update({
                  where: { id: conversationId },
                  data: { updatedAt: new Date() },
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      messageId: assistantMessage.id,
                    })}\n\n`
                  )
                );
                controller.close();
              } else if (chunk.type === "error") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ error: chunk.error })}\n\n`
                  )
                );
                controller.close();
              }
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "AI generation failed";
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const aiResponse = await generateCompletion({
      systemPrompt,
      messages: messageHistory,
      temperature: 0.7,
    });

    // Save the assistant message
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: aiResponse.content,
      },
    });

    // Update conversation timestamp
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      userMessage: {
        id: userMessage.id,
        role: "user",
        content: userMessage.content,
        createdAt: userMessage.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: "assistant",
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
      usage: {
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
      },
    });
  } catch (error) {
    log.error("Failed to process message", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
