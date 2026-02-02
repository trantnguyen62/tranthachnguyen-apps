/**
 * Email Notification Provider
 * Supports Resend and SendGrid for email delivery
 */

import {
  EmailPayload,
  NotificationPayload,
  NotificationResult,
  getNotificationColor,
} from "./types";

// Environment configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Cloudify <notifications@tranthachnguyen.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";

/**
 * Send email using Resend API
 */
async function sendWithResend(payload: EmailPayload): Promise<{ id: string }> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from || EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Send email using SendGrid API
 */
async function sendWithSendGrid(payload: EmailPayload): Promise<{ id: string }> {
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: payload.from || EMAIL_FROM },
      subject: payload.subject,
      content: [
        { type: "text/plain", value: payload.text },
        ...(payload.html ? [{ type: "text/html", value: payload.html }] : []),
      ],
      reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error || response.statusText}`);
  }

  // SendGrid returns 202 with no body on success
  const messageId = response.headers.get("x-message-id") || `sg-${Date.now()}`;
  return { id: messageId };
}

/**
 * Format notification as an email
 */
export function formatNotificationEmail(notification: NotificationPayload): EmailPayload {
  const color = getNotificationColor(notification.type);
  const projectLink = notification.projectId
    ? `${APP_URL}/projects/${notification.projectId}`
    : null;

  const subject = `[Cloudify] ${notification.title}`;

  const text = `
${notification.title}

${notification.message}

${notification.projectName ? `Project: ${notification.projectName}` : ""}
${notification.deploymentId ? `Deployment: ${notification.deploymentId}` : ""}

---
View in Cloudify: ${projectLink || APP_URL}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">☁️ Cloudify</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="border-left: 4px solid ${color.hex}; padding-left: 16px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #1f2937;">${notification.title}</h2>
      <p style="margin: 0; color: #6b7280;">${notification.message}</p>
    </div>

    ${notification.projectName || notification.deploymentId ? `
    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      ${notification.projectName ? `<p style="margin: 0 0 5px 0;"><strong>Project:</strong> ${notification.projectName}</p>` : ""}
      ${notification.deploymentId ? `<p style="margin: 0;"><strong>Deployment:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${notification.deploymentId}</code></p>` : ""}
    </div>
    ` : ""}

    ${projectLink ? `
    <a href="${projectLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
      View in Dashboard →
    </a>
    ` : ""}
  </div>

  <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; color: #9ca3af; font-size: 14px;">
      You're receiving this because you have notifications enabled for this event.
      <br>
      <a href="${APP_URL}/settings/notifications" style="color: #667eea;">Manage preferences</a>
    </p>
  </div>
</body>
</html>
`.trim();

  return {
    to: "", // Will be set by the caller
    subject,
    text,
    html,
  };
}

/**
 * Send an email notification
 */
export async function sendEmailNotification(
  email: string,
  notification: NotificationPayload
): Promise<NotificationResult> {
  try {
    const payload = formatNotificationEmail(notification);
    payload.to = email;

    let result: { id: string };

    // Prefer Resend, fall back to SendGrid
    if (RESEND_API_KEY) {
      result = await sendWithResend(payload);
    } else if (SENDGRID_API_KEY) {
      result = await sendWithSendGrid(payload);
    } else {
      return {
        success: false,
        channel: "email",
        destination: email,
        error: "No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY required)",
      };
    }

    console.log(`Email notification sent to ${email}:`, result.id);

    return {
      success: true,
      channel: "email",
      destination: email,
      messageId: result.id,
    };
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return {
      success: false,
      channel: "email",
      destination: email,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a raw email (for custom use cases)
 */
export async function sendRawEmail(payload: EmailPayload): Promise<NotificationResult> {
  try {
    let result: { id: string };

    if (RESEND_API_KEY) {
      result = await sendWithResend(payload);
    } else if (SENDGRID_API_KEY) {
      result = await sendWithSendGrid(payload);
    } else {
      return {
        success: false,
        channel: "email",
        destination: payload.to,
        error: "No email provider configured",
      };
    }

    return {
      success: true,
      channel: "email",
      destination: payload.to,
      messageId: result.id,
    };
  } catch (error) {
    console.error("Failed to send raw email:", error);
    return {
      success: false,
      channel: "email",
      destination: payload.to,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if email notifications are available
 */
export function isEmailConfigured(): boolean {
  return !!(RESEND_API_KEY || SENDGRID_API_KEY);
}
