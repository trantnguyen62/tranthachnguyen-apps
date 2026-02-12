/**
 * Team Invitations API
 * POST - Send invitation to a new team member
 * GET - List pending invitations for a team
 * DELETE - Cancel/revoke an invitation
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { randomBytes } from "crypto";
import { sendRawEmail } from "@/lib/notifications/email";
import { createInvitationEmail } from "@/lib/notifications/team-emails";
import { sendTeamInviteNotification } from "@/lib/notifications";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("teams/[id]/invitations");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/[id]/invitations - Send invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: teamId } = await params;
    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { email, role = "member" } = body;

    if (!email || typeof email !== "string") {
      return fail("VALIDATION_MISSING_FIELD", "Email is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail("VALIDATION_ERROR", "Invalid email format", 400);
    }

    // Validate and normalize role to uppercase enum
    const roleUpper = (role as string).toUpperCase();
    const validRoles = ["OWNER", "ADMIN", "MEMBER", "DEVELOPER", "VIEWER"];
    if (!validRoles.includes(roleUpper)) {
      return fail("VALIDATION_ERROR", "Invalid role", 400);
    }
    const prismaRole = roleUpper as "OWNER" | "ADMIN" | "MEMBER" | "DEVELOPER" | "VIEWER";

    // Get team and verify user can invite (owner or admin)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: user.id,
            role: { in: ["OWNER", "ADMIN"] },
          },
        },
      },
    });

    if (!team) {
      return fail("NOT_FOUND", "Team not found", 404);
    }

    if (team.members.length === 0) {
      return fail("AUTH_FORBIDDEN", "Not authorized to invite members", 403);
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        return fail("BAD_REQUEST", "User is already a team member", 400);
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email: email.toLowerCase(),
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return fail("BAD_REQUEST", "Invitation already sent to this email", 400);
    }

    // Generate token and set expiration (7 days)
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get inviter info
    const inviter = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email: email.toLowerCase(),
        role: prismaRole,
        token,
        invitedBy: user.id,
        expiresAt,
      },
      include: {
        team: {
          select: { name: true },
        },
      },
    });

    // Send invitation email
    const emailPayload = createInvitationEmail({
      inviterName: inviter?.name || "A team member",
      inviterEmail: inviter?.email || "",
      teamName: team.name,
      role,
      token,
      recipientEmail: email.toLowerCase(),
    });

    const emailResult = await sendRawEmail(emailPayload);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "team",
        action: "invitation.sent",
        description: `Invited ${email} to ${team.name}`,
        metadata: {
          teamId,
          invitedEmail: email,
          role,
          emailSent: emailResult.success,
        },
      },
    });

    // Send in-app team invite notification if invited user has an account
    if (existingUser) {
      try {
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cloudify.tranthachnguyen.com";
        await sendTeamInviteNotification({
          userId: existingUser.id,
          teamName: team.name,
          inviterName: inviter?.name || "A team member",
          inviteUrl: `${APP_URL}/invitations/${token}`,
        });
      } catch (notifError) {
        log.error("Failed to send team invite notification", notifError);
      }
    }

    return ok({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
      emailSent: emailResult.success,
    });
  } catch (error) {
    log.error("Failed to send invitation", error);
    return fail("INTERNAL_ERROR", "Failed to send invitation", 500);
  }
}

// GET /api/teams/[id]/invitations - List pending invitations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: teamId } = await params;

    // Verify user is a member of the team
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    });

    if (!member) {
      return fail("AUTH_FORBIDDEN", "Not a team member", 403);
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        status: "PENDING",
      },
      include: {
        inviter: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mark expired invitations
    const now = new Date();
    const result = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      invitedBy: {
        name: inv.inviter.name,
        email: inv.inviter.email,
      },
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      isExpired: inv.expiresAt < now,
    }));

    return ok({ invitations: result });
  } catch (error) {
    log.error("Failed to fetch invitations", error);
    return fail("INTERNAL_ERROR", "Failed to fetch invitations", 500);
  }
}

// DELETE /api/teams/[id]/invitations - Cancel an invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return fail("VALIDATION_MISSING_FIELD", "Invitation ID is required", 400);
    }

    // Verify user can cancel (owner or admin)
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!member) {
      return fail("AUTH_FORBIDDEN", "Not authorized to cancel invitations", 403);
    }

    // Get and delete invitation
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        teamId,
        status: "PENDING",
      },
    });

    if (!invitation) {
      return fail("NOT_FOUND", "Invitation not found", 404);
    }

    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to cancel invitation", error);
    return fail("INTERNAL_ERROR", "Failed to cancel invitation", 500);
  }
}
