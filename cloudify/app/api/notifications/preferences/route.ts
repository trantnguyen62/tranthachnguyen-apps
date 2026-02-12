import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("notifications/preferences");

// Available notification types
const NOTIFICATION_TYPES = [
  "deployment_started",
  "deployment_success",
  "deployment_failure",
  "domain_verified",
  "domain_error",
  "usage_warning",
  "team_invite",
  "security_alert",
];

// Available channels
const NOTIFICATION_CHANNELS = ["email", "slack", "webhook"];

// GET /api/notifications/preferences - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: user.id },
    });

    // Return preferences with available types and channels
    return ok({
      preferences,
      availableTypes: NOTIFICATION_TYPES,
      availableChannels: NOTIFICATION_CHANNELS,
    });
  } catch (error) {
    log.error("Failed to fetch preferences", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch preferences", 500);
  }
}

// POST /api/notifications/preferences - Create/update preference
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { channel, type, enabled, destination } = body;

    if (!channel || !type) {
      return fail("VALIDATION_MISSING_FIELD", "Channel and type are required", 400);
    }

    if (!NOTIFICATION_CHANNELS.includes(channel)) {
      return fail("VALIDATION_ERROR", "Invalid channel", 400);
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
      return fail("VALIDATION_ERROR", "Invalid notification type", 400);
    }

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_channel_type: {
          userId: user.id,
          channel,
          type,
        },
      },
      update: {
        enabled: enabled ?? true,
        destination,
      },
      create: {
        userId: user.id,
        channel,
        type,
        enabled: enabled ?? true,
        destination,
      },
    });

    return ok(preference);
  } catch (error) {
    log.error("Failed to update preference", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to update preference", 500);
  }
}

// DELETE /api/notifications/preferences - Delete preference
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return fail("VALIDATION_MISSING_FIELD", "Preference ID is required", 400);
    }

    await prisma.notificationPreference.delete({
      where: { id, userId: user.id },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete preference", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to delete preference", 500);
  }
}
