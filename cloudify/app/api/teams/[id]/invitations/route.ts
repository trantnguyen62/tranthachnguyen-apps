/**
 * Team Invitations API
 * POST - Send invitation to a new team member
 * GET - List pending invitations for a team
 * DELETE - Cancel/revoke an invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { randomBytes } from "crypto";
import { sendRawEmail } from "@/lib/notifications/email";
import { createInvitationEmail } from "@/lib/notifications/team-emails";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";

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
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["owner", "admin", "member", "developer", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Get team and verify user can invite (owner or admin)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: user.id,
            role: { in: ["owner", "admin"] },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    if (team.members.length === 0) {
      return NextResponse.json(
        { error: "Not authorized to invite members" },
        { status: 403 }
      );
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
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email: email.toLowerCase(),
        status: "pending",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
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
        role,
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

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Not a team member" },
        { status: 403 }
      );
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        status: "pending",
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

    return NextResponse.json({ invitations: result });
  } catch (error) {
    log.error("Failed to fetch invitations", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    // Verify user can cancel (owner or admin)
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Not authorized to cancel invitations" },
        { status: 403 }
      );
    }

    // Get and delete invitation
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        teamId,
        status: "pending",
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Failed to cancel invitation", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
