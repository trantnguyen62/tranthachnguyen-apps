/**
 * Team Invitation Email Templates
 */

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";

/**
 * Create invitation email for new team members
 */
export function createInvitationEmail(params: {
  inviterName: string;
  inviterEmail: string;
  teamName: string;
  role: string;
  token: string;
  recipientEmail: string;
}): EmailPayload {
  const acceptUrl = `${APP_URL}/invitations/${params.token}`;
  const declineUrl = `${APP_URL}/invitations/${params.token}/decline`;

  const roleDisplayName = getRoleDisplayName(params.role);

  return {
    to: params.recipientEmail,
    subject: `You've been invited to join ${params.teamName} on Cloudify`,
    text: `
${params.inviterName} (${params.inviterEmail}) has invited you to join the team "${params.teamName}" as a ${roleDisplayName}.

Accept invitation: ${acceptUrl}
Decline invitation: ${declineUrl}

This invitation expires in 7 days.

If you don't have a Cloudify account, you'll be able to create one when you accept the invitation.

---
Cloudify - Deploy with confidence
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">You're Invited!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                <strong>${escapeHtml(params.inviterName)}</strong> has invited you to join
                <strong>${escapeHtml(params.teamName)}</strong> as a <strong>${roleDisplayName}</strong>.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 0 0 32px;">
                As a ${roleDisplayName}, you'll have access to ${getRoleDescription(params.role)}.
              </p>

              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${declineUrl}" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                      Decline
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 13px; margin: 32px 0 0; text-align: center;">
                This invitation expires in 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0;">
                If you don't have a Cloudify account, you can create one when you accept.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
                <a href="${APP_URL}" style="color: #6366f1; text-decoration: none;">Cloudify</a> - Deploy with confidence
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Create welcome email when user joins a team
 */
export function createWelcomeToTeamEmail(params: {
  memberName: string;
  teamName: string;
  teamSlug: string;
  role: string;
  recipientEmail: string;
}): EmailPayload {
  const teamUrl = `${APP_URL}/teams/${params.teamSlug}`;
  const roleDisplayName = getRoleDisplayName(params.role);

  return {
    to: params.recipientEmail,
    subject: `Welcome to ${params.teamName} on Cloudify!`,
    text: `
Welcome ${params.memberName}!

You're now a ${roleDisplayName} of ${params.teamName} on Cloudify.

Visit your team: ${teamUrl}

---
Cloudify - Deploy with confidence
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${escapeHtml(params.teamName)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Welcome to ${escapeHtml(params.teamName)}!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                Hi ${escapeHtml(params.memberName)}, you're now a <strong>${roleDisplayName}</strong> of the team.
              </p>

              <a href="${teamUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Go to Team Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${APP_URL}" style="color: #6366f1; text-decoration: none;">Cloudify</a> - Deploy with confidence
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Notify team owner when someone joins
 */
export function createMemberJoinedEmail(params: {
  ownerName: string;
  memberName: string;
  memberEmail: string;
  teamName: string;
  teamSlug: string;
  role: string;
  recipientEmail: string;
}): EmailPayload {
  const teamUrl = `${APP_URL}/teams/${params.teamSlug}`;
  const roleDisplayName = getRoleDisplayName(params.role);

  return {
    to: params.recipientEmail,
    subject: `${params.memberName} joined ${params.teamName}`,
    text: `
Hi ${params.ownerName},

${params.memberName} (${params.memberEmail}) has joined ${params.teamName} as a ${roleDisplayName}.

View team: ${teamUrl}

---
Cloudify - Deploy with confidence
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Team Member</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
                Hi ${escapeHtml(params.ownerName)},
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
                <strong>${escapeHtml(params.memberName)}</strong> (${escapeHtml(params.memberEmail)}) has joined
                <strong>${escapeHtml(params.teamName)}</strong> as a ${roleDisplayName}.
              </p>
              <a href="${teamUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                View Team
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

// Helper functions

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function getRoleDisplayName(role: string): string {
  const roles: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    developer: "Developer",
    viewer: "Viewer",
  };
  return roles[role] || "Member";
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    owner: "full access including billing and team settings",
    admin: "manage team members and all projects",
    member: "view and deploy projects",
    developer: "deploy and manage environment variables",
    viewer: "view projects and deployments",
  };
  return descriptions[role] || "view and collaborate on projects";
}
