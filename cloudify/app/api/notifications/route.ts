import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("notifications");

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: { userId: string; read?: boolean } = {
      userId: user.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    log.error("Failed to fetch notifications", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "No notifications specified" },
      { status: 400 }
    );
  } catch (error) {
    log.error("Failed to update notifications", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// Helper function to create a notification
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Prisma.InputJsonValue
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata,
    },
  });
}
