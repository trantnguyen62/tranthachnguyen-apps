import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/[id]/members - Invite member to team
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner or admin
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!currentMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. They need to sign up first." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: user.id },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "member", "viewer"];
    const memberRole = validRoles.includes(role) ? role : "member";

    // Add member
    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: user.id,
        role: memberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Get team for activity log
    const team = await prisma.team.findUnique({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "team",
        action: "member_added",
        description: `Added ${user.name} to team "${team?.name}"`,
        metadata: { teamId: id, memberId: user.id, role: memberRole },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Failed to add team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/members - Remove member from team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if current user is owner or admin (or removing themselves)
    const currentMember = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: session.user.id },
    });

    if (!currentMember) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    const isSelf = userId === session.user.id;
    const canRemoveOthers = ["owner", "admin"].includes(currentMember.role);

    if (!isSelf && !canRemoveOthers) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Cannot remove the last owner
    if (!isSelf) {
      const targetMember = await prisma.teamMember.findFirst({
        where: { teamId: id, userId },
      });

      if (targetMember?.role === "owner") {
        const ownerCount = await prisma.teamMember.count({
          where: { teamId: id, role: "owner" },
        });

        if (ownerCount <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last owner" },
            { status: 400 }
          );
        }
      }
    }

    // Get member info for audit log before deletion
    const memberInfo = await prisma.teamMember.findFirst({
      where: { teamId: id, userId },
      include: { user: { select: { name: true, email: true } } },
    });

    // Remove member
    await prisma.teamMember.deleteMany({
      where: { teamId: id, userId },
    });

    // Log activity
    if (memberInfo) {
      prisma.activity.create({
        data: {
          userId: session.user.id,
          type: "team",
          action: "member_removed",
          description: `Removed ${memberInfo.user.name || memberInfo.user.email} from team`,
          metadata: { teamId: id, removedUserId: userId },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
