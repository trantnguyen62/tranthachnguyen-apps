/**
 * Team Invitation Actions API
 * GET - Get invitation details
 * POST - Accept invitation
 * DELETE - Decline invitation
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("invitations/[token]");
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
          select: { name: true, slug: true, image: true },
        },
        inviter: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      return fail("NOT_FOUND", "Invitation not found", 404);
    }

    // Check if already processed
    if (invitation.status !== "PENDING") {
      return fail("BAD_REQUEST", "Invitation already processed", 400);
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return fail("INTERNAL_ERROR", "Invitation has expired", 410);
    }

    return ok({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        team: {
          name: invitation.team.name,
          slug: invitation.team.slug,
          image: invitation.team.image,
        },
        inviter: {
          name: invitation.inviter.name,
        },
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    log.error("Failed to fetch invitation", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch invitation", 500);
  }
}

// POST /api/invitations/[token] - Accept invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return fail("AUTH_REQUIRED", "Please log in to accept the invitation", 401);
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
      return fail("NOT_FOUND", "Invitation not found", 404);
    }

    if (invitation.status !== "PENDING") {
      return fail("BAD_REQUEST", "Invitation already processed", 400);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return fail("INTERNAL_ERROR", "Invitation has expired", 410);
    }

    // Verify the user's email matches the invitation
    // (Or allow any logged-in user - depends on requirements)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return fail("AUTH_FORBIDDEN", "This invitation was sent to a different email address", 403
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
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      return ok({
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
        data: { status: "ACCEPTED", acceptedAt: new Date() },
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
        role: "OWNER",
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

    return ok({
      success: true,
      team: {
        slug: invitation.team.slug,
        name: invitation.team.name,
      },
      role: invitation.role,
    });
  } catch (error) {
    log.error("Failed to accept invitation", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to accept invitation", 500);
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
      return fail("NOT_FOUND", "Invitation not found", 404);
    }

    if (invitation.status !== "PENDING") {
      return fail("BAD_REQUEST", "Invitation already processed", 400);
    }

    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "DECLINED" },
    });

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to decline invitation", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to decline invitation", 500);
  }
}
