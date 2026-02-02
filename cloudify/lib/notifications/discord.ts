/**
 * Discord Notification Provider
 * Sends notifications via Discord webhooks with rich embeds
 */

import {
  DiscordEmbed,
  DiscordWebhookPayload,
  NotificationPayload,
  NotificationResult,
  getNotificationColor,
} from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";
const DEFAULT_USERNAME = "Cloudify";
const DEFAULT_AVATAR = "https://cloudify.tranthachnguyen.com/cloudify-logo.png";

/**
 * Get emoji for notification type
 */
function getNotificationEmoji(type: string): string {
  switch (type) {
    case "deployment_success":
      return "✅";
    case "deployment_failure":
    case "build_failed":
      return "❌";
    case "deployment_started":
      return "🚀";
    case "domain_verified":
      return "🌐";
    case "domain_error":
      return "⚠️";
    case "usage_warning":
      return "📊";
    case "team_invite":
      return "👥";
    case "security_alert":
      return "🔒";
    case "ssl_expiring":
      return "🔐";
    case "function_error":
      return "⚡";
    default:
      return "ℹ️";
  }
}

/**
 * Format notification as Discord embed
 */
export function formatDiscordEmbed(notification: NotificationPayload): DiscordEmbed {
  const color = getNotificationColor(notification.type);
  const emoji = getNotificationEmoji(notification.type);
  const projectUrl = notification.projectId
    ? `${APP_URL}/projects/${notification.projectId}`
    : undefined;

  const fields: DiscordEmbed["fields"] = [];

  if (notification.projectName) {
    fields.push({
      name: "Project",
      value: notification.projectName,
      inline: true,
    });
  }

  if (notification.deploymentId) {
    fields.push({
      name: "Deployment",
      value: `\`${notification.deploymentId.slice(0, 8)}\``,
      inline: true,
    });
  }

  // Add metadata fields
  if (notification.metadata) {
    const { branch, commitSha, duration, url } = notification.metadata as Record<string, unknown>;

    if (branch) {
      fields.push({
        name: "Branch",
        value: String(branch),
        inline: true,
      });
    }

    if (commitSha) {
      fields.push({
        name: "Commit",
        value: `\`${String(commitSha).slice(0, 7)}\``,
        inline: true,
      });
    }

    if (duration) {
      fields.push({
        name: "Duration",
        value: `${duration}s`,
        inline: true,
      });
    }

    if (url) {
      fields.push({
        name: "URL",
        value: `[Visit](${url})`,
        inline: true,
      });
    }
  }

  return {
    title: `${emoji} ${notification.title}`,
    description: notification.message,
    url: projectUrl,
    color: color.discord,
    fields: fields.length > 0 ? fields : undefined,
    footer: {
      text: "Cloudify Deployment Platform",
      icon_url: DEFAULT_AVATAR,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send a Discord webhook message
 */
async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username || DEFAULT_USERNAME,
      avatar_url: payload.avatar_url || DEFAULT_AVATAR,
      content: payload.content,
      embeds: payload.embeds,
    }),
  });

  if (!response.ok) {
    // Discord returns 204 No Content on success
    if (response.status !== 204) {
      const error = await response.text();
      throw new Error(`Discord webhook error: ${error || response.statusText}`);
    }
  }
}

/**
 * Send a notification to Discord
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  notification: NotificationPayload,
  options?: {
    username?: string;
    avatarUrl?: string;
    content?: string;
  }
): Promise<NotificationResult> {
  try {
    // Validate webhook URL
    if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      return {
        success: false,
        channel: "discord",
        destination: webhookUrl,
        error: "Invalid Discord webhook URL",
      };
    }

    const embed = formatDiscordEmbed(notification);

    await sendDiscordWebhook(webhookUrl, {
      username: options?.username,
      avatar_url: options?.avatarUrl,
      content: options?.content,
      embeds: [embed],
    });

    console.log(`Discord notification sent to webhook`);

    return {
      success: true,
      channel: "discord",
      destination: "Discord webhook",
    };
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
    return {
      success: false,
      channel: "discord",
      destination: webhookUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a raw Discord webhook message
 */
export async function sendRawDiscordMessage(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<NotificationResult> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      return {
        success: false,
        channel: "discord",
        destination: webhookUrl,
        error: "Invalid Discord webhook URL",
      };
    }

    await sendDiscordWebhook(webhookUrl, payload);

    return {
      success: true,
      channel: "discord",
      destination: "Discord webhook",
    };
  } catch (error) {
    console.error("Failed to send Discord message:", error);
    return {
      success: false,
      channel: "discord",
      destination: webhookUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a deployment status embed for Discord
 */
export function createDeploymentEmbed(
  status: "started" | "success" | "failure",
  data: {
    projectName: string;
    projectId: string;
    deploymentId: string;
    branch?: string;
    commitSha?: string;
    url?: string;
    duration?: number;
    error?: string;
  }
): DiscordEmbed {
  const statusConfig = {
    started: {
      emoji: "🚀",
      title: "Deployment Started",
      color: 0x3b82f6, // blue
    },
    success: {
      emoji: "✅",
      title: "Deployment Successful",
      color: 0x22c55e, // green
    },
    failure: {
      emoji: "❌",
      title: "Deployment Failed",
      color: 0xef4444, // red
    },
  };

  const config = statusConfig[status];
  const fields: DiscordEmbed["fields"] = [
    { name: "Project", value: data.projectName, inline: true },
    { name: "Deployment", value: `\`${data.deploymentId.slice(0, 8)}\``, inline: true },
  ];

  if (data.branch) {
    fields.push({ name: "Branch", value: data.branch, inline: true });
  }

  if (data.commitSha) {
    fields.push({ name: "Commit", value: `\`${data.commitSha.slice(0, 7)}\``, inline: true });
  }

  if (status === "success" && data.url) {
    fields.push({ name: "URL", value: `[Visit](${data.url})`, inline: true });
  }

  if (status === "success" && data.duration) {
    fields.push({ name: "Duration", value: `${data.duration}s`, inline: true });
  }

  if (status === "failure" && data.error) {
    fields.push({ name: "Error", value: data.error.slice(0, 200), inline: false });
  }

  return {
    title: `${config.emoji} ${config.title}`,
    description: status === "started"
      ? "Your deployment has begun processing."
      : status === "success"
      ? "Your changes are now live!"
      : "The deployment encountered an error.",
    url: `${APP_URL}/projects/${data.projectId}`,
    color: config.color,
    fields,
    footer: {
      text: "Cloudify",
      icon_url: DEFAULT_AVATAR,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate a Discord webhook URL
 */
export function isValidDiscordWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "discord.com" &&
      parsed.pathname.startsWith("/api/webhooks/")
    );
  } catch {
    return false;
  }
}
