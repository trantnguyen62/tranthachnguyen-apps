/**
 * AI Conversation Detail API
 *
 * GET /api/ai/conversations/[id] - Get conversation with messages
 * DELETE /api/ai/conversations/[id] - Delete conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("ai/conversations/detail");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai/conversations/[id]
 *
 * Get conversation with all messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
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

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      context: conversation.context,
      projectId: conversation.projectId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    log.error("AI conversation error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to get conversation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/conversations/[id]
 *
 * Delete a conversation and all its messages
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    // Verify ownership
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete conversation (cascades to messages)
    await prisma.aIConversation.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    log.error("AI conversation error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/conversations/[id]
 *
 * Update conversation title
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    // Verify ownership
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Update title
    const updated = await prisma.aIConversation.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    log.error("AI conversation error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}
