/**
 * AI Conversations API
 *
 * GET /api/ai/conversations - List user's conversations
 * POST /api/ai/conversations - Create a new conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ai/conversations");

/**
 * GET /api/ai/conversations
 *
 * List all AI conversations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.aIConversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        context: c.context,
        projectId: c.projectId,
        messageCount: c._count.messages,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    log.error("AI conversations error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/conversations
 *
 * Create a new AI conversation
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { projectId, title, context, initialMessage } = body;

    // Verify project access if projectId provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Create conversation
    const conversation = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        projectId: projectId || null,
        title: title || "New Conversation",
        context: context || "general",
      },
    });

    // If initial message provided, create it
    if (initialMessage) {
      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: initialMessage,
        },
      });
    }

    return NextResponse.json(
      {
        id: conversation.id,
        title: conversation.title,
        context: conversation.context,
        projectId: conversation.projectId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    log.error("AI conversations error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
