/**
 * Slack Notification Provider
 * Sends notifications via Slack webhooks and API with Block Kit formatting
 */

import {
  SlackBlock,
  SlackMessage,
  SlackAttachment,
  NotificationPayload,
  NotificationResult,
  getNotificationColor,
} from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

/**
 * Get emoji for notification type
 */
function getNotificationEmoji(type: string): string {
  switch (type) {
    case "deployment_success":
      return ":white_check_mark:";
    case "deployment_failure":
    case "build_failed":
      return ":x:";
    case "deployment_started":
      return ":rocket:";
    case "domain_verified":
      return ":globe_with_meridians:";
    case "domain_error":
      return ":warning:";
    case "usage_warning":
      return ":chart_with_upwards_trend:";
    case "team_invite":
      return ":busts_in_silhouette:";
    case "security_alert":
      return ":lock:";
    case "ssl_expiring":
      return ":key:";
    case "function_error":
      return ":zap:";
    default:
      return ":information_source:";
  }
}

/**
 * Format notification as Slack Block Kit message
 */
export function formatSlackMessage(notification: NotificationPayload): SlackMessage {
  const color = getNotificationColor(notification.type);
  const emoji = getNotificationEmoji(notification.type);
  const projectUrl = notification.projectId
    ? `${APP_URL}/projects/${notification.projectId}`
    : APP_URL;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${notification.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: notification.message,
      },
    },
  ];

  // Add context fields
  const contextFields: string[] = [];

  if (notification.projectName) {
    contextFields.push(`*Project:* ${notification.projectName}`);
  }

  if (notification.deploymentId) {
    contextFields.push(`*Deployment:* \`${notification.deploymentId.slice(0, 8)}\``);
  }

  // Add metadata fields
  if (notification.metadata) {
    const { branch, commitSha, duration, url } = notification.metadata as Record<string, unknown>;

    if (branch) {
      contextFields.push(`*Branch:* ${branch}`);
    }

    if (commitSha) {
      contextFields.push(`*Commit:* \`${String(commitSha).slice(0, 7)}\``);
    }

    if (duration) {
      contextFields.push(`*Duration:* ${duration}s`);
    }

    if (url) {
      contextFields.push(`*URL:* <${url}|Visit>`);
    }
  }

  if (contextFields.length > 0) {
    blocks.push({
      type: "section",
      fields: contextFields.map((text) => ({
        type: "mrkdwn" as const,
        text,
      })),
    });
  }

  // Add action button
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: " ",
    },
    accessory: {
      type: "button",
      text: {
        type: "plain_text",
        text: "View in Dashboard",
      },
      url: projectUrl,
      action_id: "view_dashboard",
    },
  });

  // Add divider
  blocks.push({ type: "divider" });

  // Add context footer
  blocks.push({
    type: "context",
    text: {
      type: "mrkdwn",
      text: `Cloudify Deployment Platform • <${APP_URL}/settings/notifications|Manage notifications>`,
    },
  } as SlackBlock);

  return {
    text: `${emoji} ${notification.title}: ${notification.message}`,
    blocks,
    attachments: [
      {
        color: color.hex,
        fallback: `${notification.title}: ${notification.message}`,
      },
    ],
  };
}

/**
 * Send a Slack webhook message
 */
async function sendSlackWebhook(webhookUrl: string, message: SlackMessage): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Slack webhook error: ${error || response.statusText}`);
  }
}

/**
 * Send a message via Slack API (requires bot token)
 */
async function sendSlackApi(channel: string, message: SlackMessage): Promise<{ ts: string }> {
  if (!SLACK_BOT_TOKEN) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      text: message.text,
      blocks: message.blocks,
      attachments: message.attachments,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return { ts: data.ts };
}

/**
 * Send a notification to Slack
 */
export async function sendSlackNotification(
  destination: string,
  notification: NotificationPayload
): Promise<NotificationResult> {
  try {
    const message = formatSlackMessage(notification);

    // Determine if destination is a webhook URL or channel ID
    if (destination.startsWith("https://hooks.slack.com/")) {
      await sendSlackWebhook(destination, message);

      console.log(`Slack notification sent via webhook`);

      return {
        success: true,
        channel: "slack",
        destination: "Slack webhook",
      };
    } else {
      // Assume it's a channel ID/name
      const result = await sendSlackApi(destination, message);

      console.log(`Slack notification sent to channel ${destination}:`, result.ts);

      return {
        success: true,
        channel: "slack",
        destination,
        messageId: result.ts,
      };
    }
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    return {
      success: false,
      channel: "slack",
      destination,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a raw Slack message
 */
export async function sendRawSlackMessage(
  destination: string,
  message: SlackMessage
): Promise<NotificationResult> {
  try {
    if (destination.startsWith("https://hooks.slack.com/")) {
      await sendSlackWebhook(destination, message);
      return {
        success: true,
        channel: "slack",
        destination: "Slack webhook",
      };
    } else {
      const result = await sendSlackApi(destination, message);
      return {
        success: true,
        channel: "slack",
        destination,
        messageId: result.ts,
      };
    }
  } catch (error) {
    console.error("Failed to send Slack message:", error);
    return {
      success: false,
      channel: "slack",
      destination,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a deployment status message for Slack
 */
export function createDeploymentMessage(
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
): SlackMessage {
  const statusConfig = {
    started: {
      emoji: ":rocket:",
      title: "Deployment Started",
      color: "#0070f3",
      text: "Your deployment has begun processing.",
    },
    success: {
      emoji: ":white_check_mark:",
      title: "Deployment Successful",
      color: "#22c55e",
      text: "Your changes are now live!",
    },
    failure: {
      emoji: ":x:",
      title: "Deployment Failed",
      color: "#ef4444",
      text: "The deployment encountered an error.",
    },
  };

  const config = statusConfig[status];

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${config.emoji} ${config.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: config.text,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Project:*\n${data.projectName}` },
        { type: "mrkdwn", text: `*Deployment:*\n\`${data.deploymentId.slice(0, 8)}\`` },
        ...(data.branch ? [{ type: "mrkdwn" as const, text: `*Branch:*\n${data.branch}` }] : []),
        ...(data.commitSha
          ? [{ type: "mrkdwn" as const, text: `*Commit:*\n\`${data.commitSha.slice(0, 7)}\`` }]
          : []),
      ],
    },
  ];

  if (status === "success" && (data.url || data.duration)) {
    const fields: Array<{ type: "mrkdwn"; text: string }> = [];
    if (data.url) {
      fields.push({ type: "mrkdwn", text: `*URL:*\n<${data.url}|Visit site>` });
    }
    if (data.duration) {
      fields.push({ type: "mrkdwn", text: `*Duration:*\n${data.duration}s` });
    }
    blocks.push({
      type: "section",
      fields,
    });
  }

  if (status === "failure" && data.error) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Error:*\n\`\`\`${data.error.slice(0, 500)}\`\`\``,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: " ",
    },
    accessory: {
      type: "button",
      text: {
        type: "plain_text",
        text: "View Details",
      },
      url: `${APP_URL}/projects/${data.projectId}`,
      action_id: "view_deployment",
    },
  });

  blocks.push({ type: "divider" });

  const attachments: SlackAttachment[] = [
    {
      color: config.color,
      fallback: `${config.title}: ${data.projectName}`,
    },
  ];

  return {
    text: `${config.emoji} ${config.title}: ${data.projectName}`,
    blocks,
    attachments,
  };
}

/**
 * Validate a Slack webhook URL
 */
export function isValidSlackWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "hooks.slack.com" &&
      parsed.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
}

/**
 * Check if Slack API is configured
 */
export function isSlackApiConfigured(): boolean {
  return !!SLACK_BOT_TOKEN;
}
