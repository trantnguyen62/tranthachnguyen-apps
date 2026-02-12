import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("teams/[id]");

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
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const member = await checkTeamAccess(id, user.id);
    if (!member) {
      return fail("NOT_FOUND", "Team not found", 404);
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
                image: true,
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

    return ok({ ...team, myRole: member.role });
  } catch (error) {
    log.error("Failed to fetch team", error);
    return fail("INTERNAL_ERROR", "Failed to fetch team", 500);
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const member = await checkTeamAccess(id, user.id, ["owner", "admin"]);
    if (!member) {
      return fail("AUTH_FORBIDDEN", "Not authorized", 403);
    }

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { name, image } = body;

    const updateData: { name?: string; image?: string } = {};
    if (name) updateData.name = name.trim();
    if (image !== undefined) updateData.image = image;

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
    });

    return ok(team);
  } catch (error) {
    log.error("Failed to update team", error);
    return fail("INTERNAL_ERROR", "Failed to update team", 500);
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const member = await checkTeamAccess(id, user.id, ["owner"]);
    if (!member) {
      return fail("AUTH_FORBIDDEN", "Only team owner can delete", 403);
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
        userId: user.id,
        type: "team",
        action: "deleted",
        description: `Deleted team "${team?.name}"`,
      },
    }).catch(() => {});

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to delete team", error);
    return fail("INTERNAL_ERROR", "Failed to delete team", 500);
  }
}
