import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to check team membership and role
async function checkTeamAccess(
  teamId: string,
  userId: string,
  requiredRoles?: string[]
) {
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (!member) return null;
  if (requiredRoles && !requiredRoles.includes(member.role)) return null;

  return member;
}

// GET /api/teams/[id] - Get team details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const member = await checkTeamAccess(id, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
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
        },
        teamProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
                framework: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ ...team, myRole: member.role });
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const member = await checkTeamAccess(id, session.user.id, ["owner", "admin"]);
    if (!member) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, avatar } = body;

    const updateData: { name?: string; avatar?: string } = {};
    if (name) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const member = await checkTeamAccess(id, session.user.id, ["owner"]);
    if (!member) {
      return NextResponse.json({ error: "Only team owner can delete" }, { status: 403 });
    }

    const team = await prisma.team.findUnique({ where: { id } });

    // Explicitly delete dependent records that may not have cascade,
    // then delete the team in a transaction
    await prisma.$transaction([
      prisma.teamInvitation.deleteMany({ where: { teamId: id } }),
      prisma.teamProject.deleteMany({ where: { teamId: id } }),
      prisma.teamMember.deleteMany({ where: { teamId: id } }),
      // Set null on activities referencing this team
      prisma.activity.updateMany({
        where: { teamId: id },
        data: { teamId: null },
      }),
      prisma.team.delete({ where: { id } }),
    ]);

    // Log activity (non-blocking)
    prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "team",
        action: "deleted",
        description: `Deleted team "${team?.name}"`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
