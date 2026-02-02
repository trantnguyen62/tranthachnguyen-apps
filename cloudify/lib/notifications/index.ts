/**
 * Notification System
 *
 * A comprehensive notification system supporting multiple channels:
 * - Email (via Resend or SendGrid)
 * - Slack (via webhooks or API)
 * - Discord (via webhooks)
 * - Custom webhooks with HMAC signing
 *
 * @example
 * ```typescript
 * import {
 *   sendNotification,
 *   sendDeploymentNotification,
 *   sendDomainNotification,
 * } from "@/lib/notifications";
 *
 * // Send deployment notification
 * await sendDeploymentNotification("success", {
 *   userId: "user123",
 *   projectId: "project456",
 *   projectName: "My App",
 *   deploymentId: "deploy789",
 *   url: "https://my-app.projects.tranthachnguyen.com",
 * });
 *
 * // Send custom notification
 * await sendNotification({
 *   userId: "user123",
 *   type: "security_alert",
 *   title: "New login detected",
 *   message: "A new login was detected from Chrome on macOS.",
 * });
 * ```
 */

// Types
export type {
  NotificationType,
  NotificationChannel,
  DeliveryStatus,
  NotificationPayload,
  NotificationResult,
  NotificationSendResult,
  EmailPayload,
  SlackMessage,
  SlackBlock,
  SlackAttachment,
  DiscordEmbed,
  DiscordWebhookPayload,
  CustomWebhookPayload,
  WebhookDeliveryOptions,
  NotificationTemplate,
  EmailProviderConfig,
  SlackProviderConfig,
  DiscordProviderConfig,
} from "./types";

export { NOTIFICATION_COLORS, getNotificationColor } from "./types";

// Service (main entry point)
export {
  sendNotification,
  sendDirectNotification,
  sendDeploymentNotification,
  sendDomainNotification,
  sendUsageWarningNotification,
  sendTeamInviteNotification,
  sendSecurityAlertNotification,
  createInAppNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  getNotificationStatus,
} from "./service";

// Email provider
export {
  sendEmailNotification,
  sendRawEmail,
  formatNotificationEmail,
  isEmailConfigured,
} from "./email";

// Discord provider
export {
  sendDiscordNotification,
  sendRawDiscordMessage,
  formatDiscordEmbed,
  createDeploymentEmbed,
  isValidDiscordWebhook,
} from "./discord";

// Slack provider
export {
  sendSlackNotification,
  sendRawSlackMessage,
  formatSlackMessage,
  createDeploymentMessage,
  isValidSlackWebhook,
  isSlackApiConfigured,
} from "./slack";

// Custom webhook provider
export {
  sendWebhookNotification,
  sendRawWebhook,
  formatWebhookPayload,
  verifyWebhookSignature,
  testWebhook,
  isValidWebhookUrl,
} from "./webhook";
