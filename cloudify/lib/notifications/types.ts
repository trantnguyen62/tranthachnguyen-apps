/**
 * Notification Types
 * Core type definitions for the notification system
 */

// Notification event types that can trigger notifications
export type NotificationType =
  | "deployment_started"
  | "deployment_success"
  | "deployment_failure"
  | "domain_verified"
  | "domain_error"
  | "usage_warning"
  | "team_invite"
  | "security_alert"
  | "build_failed"
  | "ssl_expiring"
  | "function_error";

// Channels through which notifications can be sent
export type NotificationChannel = "email" | "slack" | "discord" | "webhook";

// Delivery status for tracking notification attempts
export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

// Base notification payload
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  deploymentId?: string;
  metadata?: Record<string, unknown>;
}

// Result from sending a notification via a channel
export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  destination?: string;
  error?: string;
  messageId?: string;
}

// Aggregated result from all notification attempts
export interface NotificationSendResult {
  success: boolean;
  results: NotificationResult[];
  inAppNotificationId?: string;
}

// Email-specific payload
export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

// Slack message formatting
export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: "section" | "divider" | "header" | "context" | "actions";
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: "plain_text" | "mrkdwn";
    text: string;
  }>;
  accessory?: {
    type: "button";
    text: { type: "plain_text"; text: string };
    url?: string;
    action_id?: string;
  };
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

// Discord embed formatting
export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: { url: string };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

// Custom webhook payload
export interface CustomWebhookPayload {
  event: NotificationType;
  timestamp: string;
  data: {
    userId: string;
    projectId?: string;
    projectName?: string;
    deploymentId?: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  };
}

// Webhook delivery options
export interface WebhookDeliveryOptions {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// Notification template for formatting messages
export interface NotificationTemplate {
  type: NotificationType;
  email?: {
    subject: string;
    text: string;
    html?: string;
  };
  slack?: SlackMessage;
  discord?: DiscordEmbed;
}

// Provider configuration
export interface EmailProviderConfig {
  provider: "resend" | "sendgrid";
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface SlackProviderConfig {
  webhookUrl?: string;
  botToken?: string;
  defaultChannel?: string;
}

export interface DiscordProviderConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

// Color constants for different notification types
export const NOTIFICATION_COLORS = {
  success: {
    hex: "#22c55e",
    discord: 0x22c55e,
    slack: "good",
  },
  error: {
    hex: "#ef4444",
    discord: 0xef4444,
    slack: "danger",
  },
  warning: {
    hex: "#f59e0b",
    discord: 0xf59e0b,
    slack: "warning",
  },
  info: {
    hex: "#3b82f6",
    discord: 0x3b82f6,
    slack: "#3b82f6",
  },
} as const;

// Color type for notifications
export type NotificationColor = (typeof NOTIFICATION_COLORS)[keyof typeof NOTIFICATION_COLORS];

// Map notification types to their color categories
export function getNotificationColor(type: NotificationType): NotificationColor {
  switch (type) {
    case "deployment_success":
    case "domain_verified":
      return NOTIFICATION_COLORS.success;
    case "deployment_failure":
    case "domain_error":
    case "build_failed":
    case "function_error":
    case "security_alert":
      return NOTIFICATION_COLORS.error;
    case "usage_warning":
    case "ssl_expiring":
      return NOTIFICATION_COLORS.warning;
    default:
      return NOTIFICATION_COLORS.info;
  }
}
