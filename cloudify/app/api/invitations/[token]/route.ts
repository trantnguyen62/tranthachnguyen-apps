/**
 * Team Invitation Actions API
 * GET - Get invitation details
 * POST - Accept invitation
 * DELETE - Decline invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/api-auth";
import { sendRawEmail } from "@/lib/notifications/email";
import {
  createWelcomeToTeamEmail,
  createMemberJoinedEmail,
} from "@/lib/notifications/team-emails";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/invitations/[token] - Get invitation details (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: { name: true, slug: true, avatar: true },
        },
        inviter: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          error: "Invitation already processed",
          status: invitation.status,
        },
        { status: 400 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });

      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        team: {
          name: invitation.team.name,
          slug: invitation.team.slug,
          avatar: invitation.team.avatar,
        },
        inviter: {
          name: invitation.inviter.name,
        },
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

// POST /api/invitations/[token] - Accept invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to accept the invitation" },
        { status: 401 }
      );
    }

    const { token } = await params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation already processed" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });

      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      );
    }

    // Verify the user's email matches the invitation
    // (Or allow any logged-in user - depends on requirements)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: "This invitation was sent to a different email address",
          invitedEmail: invitation.email,
        },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId: user.id,
      },
    });

    if (existingMember) {
      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: "You are already a member of this team",
        team: {
          slug: invitation.team.slug,
        },
      });
    }

    // Create team membership and update invitation
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: user.id,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted", acceptedAt: new Date() },
      }),
    ]);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "team",
        action: "invitation.accepted",
        description: `Joined ${invitation.team.name}`,
        metadata: {
          teamId: invitation.teamId,
          role: invitation.role,
        },
      },
    });

    // Send welcome email to new member
    await sendRawEmail(
      createWelcomeToTeamEmail({
        memberName: user.name,
        teamName: invitation.team.name,
        teamSlug: invitation.team.slug,
        role: invitation.role,
        recipientEmail: user.email,
      })
    );

    // Notify team owners
    const owners = await prisma.teamMember.findMany({
      where: {
        teamId: invitation.teamId,
        role: "owner",
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    for (const owner of owners) {
      if (owner.userId !== user.id) {
        await sendRawEmail(
          createMemberJoinedEmail({
            ownerName: owner.user.name,
            memberName: user.name,
            memberEmail: user.email,
            teamName: invitation.team.name,
            teamSlug: invitation.team.slug,
            role: invitation.role,
            recipientEmail: owner.user.email,
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      team: {
        slug: invitation.team.slug,
        name: invitation.team.name,
      },
      role: invitation.role,
    });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

// DELETE /api/invitations/[token] - Decline invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation already processed" },
        { status: 400 }
      );
    }

    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "declined" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to decline invitation:", error);
    return NextResponse.json(
      { error: "Failed to decline invitation" },
      { status: 500 }
    );
  }
}
