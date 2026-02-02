/**
 * Notification Service
 * Core orchestration for sending notifications across all channels
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  NotificationPayload,
  NotificationResult,
  NotificationSendResult,
  NotificationChannel,
  NotificationType,
} from "./types";
import { sendEmailNotification, isEmailConfigured } from "./email";
import { sendDiscordNotification, isValidDiscordWebhook } from "./discord";
import { sendSlackNotification, isValidSlackWebhook, isSlackApiConfigured } from "./slack";
import { sendWebhookNotification, isValidWebhookUrl } from "./webhook";

/**
 * Create an in-app notification record
 */
export async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Prisma.InputJsonValue
): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata,
    },
  });

  return notification.id;
}

/**
 * Get user's notification preferences for a specific type
 */
async function getUserPreferences(userId: string, type: NotificationType) {
  return prisma.notificationPreference.findMany({
    where: {
      userId,
      type,
      enabled: true,
    },
  });
}

/**
 * Get project integrations for notifications
 */
async function getProjectIntegrations(projectId: string, types: string[]) {
  return prisma.integration.findMany({
    where: {
      projectId,
      type: { in: types },
      enabled: true,
    },
  });
}

/**
 * Send notification via a specific channel
 */
async function sendViaChannel(
  channel: NotificationChannel,
  destination: string,
  notification: NotificationPayload
): Promise<NotificationResult> {
  switch (channel) {
    case "email":
      return sendEmailNotification(destination, notification);

    case "discord":
      if (!isValidDiscordWebhook(destination)) {
        return {
          success: false,
          channel: "discord",
          destination,
          error: "Invalid Discord webhook URL",
        };
      }
      return sendDiscordNotification(destination, notification);

    case "slack":
      if (!isValidSlackWebhook(destination) && !isSlackApiConfigured()) {
        return {
          success: false,
          channel: "slack",
          destination,
          error: "Invalid Slack webhook URL or API not configured",
        };
      }
      return sendSlackNotification(destination, notification);

    case "webhook":
      if (!isValidWebhookUrl(destination)) {
        return {
          success: false,
          channel: "webhook",
          destination,
          error: "Invalid webhook URL",
        };
      }
      return sendWebhookNotification(destination, notification);

    default:
      return {
        success: false,
        channel,
        destination,
        error: `Unknown channel: ${channel}`,
      };
  }
}

/**
 * Send a notification to a user
 *
 * This is the main entry point for sending notifications.
 * It handles:
 * 1. Creating an in-app notification
 * 2. Looking up user preferences
 * 3. Sending via each enabled channel
 * 4. Optionally sending to project integrations
 */
export async function sendNotification(
  notification: NotificationPayload
): Promise<NotificationSendResult> {
  const results: NotificationResult[] = [];
  let inAppNotificationId: string | undefined;

  try {
    // 1. Create in-app notification
    inAppNotificationId = await createInAppNotification(
      notification.userId,
      notification.type,
      notification.title,
      notification.message,
      notification.metadata as Prisma.InputJsonValue
    );

    // 2. Get user's notification preferences
    const preferences = await getUserPreferences(notification.userId, notification.type);

    // 3. Send via each enabled channel
    for (const pref of preferences) {
      if (!pref.destination) {
        results.push({
          success: false,
          channel: pref.channel as NotificationChannel,
          error: "No destination configured",
        });
        continue;
      }

      const result = await sendViaChannel(
        pref.channel as NotificationChannel,
        pref.destination,
        notification
      );

      results.push(result);
    }

    // 4. If project ID is provided, also send to project integrations
    if (notification.projectId) {
      const integrations = await getProjectIntegrations(notification.projectId, [
        "slack",
        "discord",
      ]);

      for (const integration of integrations) {
        const webhookUrl = integration.webhookUrl;
        if (!webhookUrl) continue;

        const channel = integration.type as NotificationChannel;
        const result = await sendViaChannel(channel, webhookUrl, notification);
        results.push(result);
      }
    }

    const success = results.length === 0 || results.some((r) => r.success);

    return {
      success,
      results,
      inAppNotificationId,
    };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return {
      success: false,
      results: [
        {
          success: false,
          channel: "email",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
      inAppNotificationId,
    };
  }
}

/**
 * Send a notification without checking preferences (direct send)
 */
export async function sendDirectNotification(
  channel: NotificationChannel,
  destination: string,
  notification: NotificationPayload
): Promise<NotificationResult> {
  return sendViaChannel(channel, destination, notification);
}

/**
 * Send deployment notification helper
 */
export async function sendDeploymentNotification(
  status: "started" | "success" | "failure",
  data: {
    userId: string;
    projectId: string;
    projectName: string;
    deploymentId: string;
    branch?: string;
    commitSha?: string;
    url?: string;
    duration?: number;
    error?: string;
  }
): Promise<NotificationSendResult> {
  const typeMap = {
    started: "deployment_started" as NotificationType,
    success: "deployment_success" as NotificationType,
    failure: "deployment_failure" as NotificationType,
  };

  const titleMap = {
    started: `Deployment started for ${data.projectName}`,
    success: `Deployment successful for ${data.projectName}`,
    failure: `Deployment failed for ${data.projectName}`,
  };

  const messageMap = {
    started: `Your deployment is now building on branch ${data.branch || "main"}.`,
    success: data.url
      ? `Your changes are live at ${data.url}`
      : "Your changes are now live!",
    failure: data.error
      ? `Deployment failed: ${data.error.slice(0, 100)}`
      : "The deployment encountered an error.",
  };

  return sendNotification({
    userId: data.userId,
    type: typeMap[status],
    title: titleMap[status],
    message: messageMap[status],
    projectId: data.projectId,
    projectName: data.projectName,
    deploymentId: data.deploymentId,
    metadata: {
      status,
      branch: data.branch,
      commitSha: data.commitSha,
      url: data.url,
      duration: data.duration,
      error: data.error,
    },
  });
}

/**
 * Send domain verification notification
 */
export async function sendDomainNotification(
  status: "verified" | "error",
  data: {
    userId: string;
    projectId: string;
    projectName: string;
    domain: string;
    error?: string;
  }
): Promise<NotificationSendResult> {
  const isSuccess = status === "verified";

  return sendNotification({
    userId: data.userId,
    type: isSuccess ? "domain_verified" : "domain_error",
    title: isSuccess
      ? `Domain ${data.domain} verified`
      : `Domain verification failed for ${data.domain}`,
    message: isSuccess
      ? `Your domain ${data.domain} has been verified and is now active.`
      : `Failed to verify ${data.domain}: ${data.error || "Unknown error"}`,
    projectId: data.projectId,
    projectName: data.projectName,
    metadata: {
      domain: data.domain,
      status,
      error: data.error,
    },
  });
}

/**
 * Send usage warning notification
 */
export async function sendUsageWarningNotification(
  data: {
    userId: string;
    metric: string;
    current: number;
    limit: number;
    percentage: number;
  }
): Promise<NotificationSendResult> {
  return sendNotification({
    userId: data.userId,
    type: "usage_warning",
    title: `Usage warning: ${data.metric}`,
    message: `You've used ${data.percentage}% of your ${data.metric} quota (${data.current}/${data.limit}).`,
    metadata: {
      metric: data.metric,
      current: data.current,
      limit: data.limit,
      percentage: data.percentage,
    },
  });
}

/**
 * Send team invite notification
 */
export async function sendTeamInviteNotification(
  data: {
    userId: string;
    teamName: string;
    inviterName: string;
    inviteUrl: string;
  }
): Promise<NotificationSendResult> {
  return sendNotification({
    userId: data.userId,
    type: "team_invite",
    title: `You've been invited to join ${data.teamName}`,
    message: `${data.inviterName} has invited you to join the ${data.teamName} team.`,
    metadata: {
      teamName: data.teamName,
      inviterName: data.inviterName,
      inviteUrl: data.inviteUrl,
    },
  });
}

/**
 * Send security alert notification
 */
export async function sendSecurityAlertNotification(
  data: {
    userId: string;
    alertType: string;
    description: string;
    projectId?: string;
    projectName?: string;
  }
): Promise<NotificationSendResult> {
  return sendNotification({
    userId: data.userId,
    type: "security_alert",
    title: `Security alert: ${data.alertType}`,
    message: data.description,
    projectId: data.projectId,
    projectName: data.projectName,
    metadata: {
      alertType: data.alertType,
    },
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return result.count;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/**
 * Get notification settings summary
 */
export async function getNotificationStatus(): Promise<{
  email: boolean;
  slack: boolean;
  discord: boolean;
  webhook: boolean;
}> {
  return {
    email: isEmailConfigured(),
    slack: isSlackApiConfigured(),
    discord: true, // Discord webhooks don't need configuration
    webhook: true, // Custom webhooks don't need configuration
  };
}
