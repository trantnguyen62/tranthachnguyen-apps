import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("teams/[id]/members");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/[id]/members - Invite member to team
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user: authUser } = authResult;

    const { id } = await params;

    // Check if user is owner or admin
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: authUser.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!currentMember) {
      return fail("AUTH_FORBIDDEN", "Not authorized", 403);
    }

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { email, role = "member" } = body;

    if (!email) {
      return fail("VALIDATION_MISSING_FIELD", "Email is required", 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return fail("NOT_FOUND", "User not found. They need to sign up first.", 404);
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: user.id },
    });

    if (existingMember) {
      return fail("BAD_REQUEST", "User is already a team member", 400);
    }

    // Validate and normalize role to uppercase enum
    const roleUpper = (role as string).toUpperCase();
    const validRoles: Array<"ADMIN" | "MEMBER" | "VIEWER"> = ["ADMIN", "MEMBER", "VIEWER"];
    const memberRole = (validRoles.includes(roleUpper as typeof validRoles[number]) ? roleUpper : "MEMBER") as "ADMIN" | "MEMBER" | "VIEWER";

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
            image: true,
          },
        },
      },
    });

    // Get team for activity log
    const team = await prisma.team.findUnique({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: authUser.id,
        type: "team",
        action: "member_added",
        description: `Added ${user.name} to team "${team?.name}"`,
        metadata: { teamId: id, memberId: user.id, role: memberRole },
      },
    });

    return ok(member);
  } catch (error) {
    log.error("Failed to add team member", error);
    return fail("INTERNAL_ERROR", "Failed to add team member", 500);
  }
}

// DELETE /api/teams/[id]/members - Remove member from team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user: authUser } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return fail("VALIDATION_MISSING_FIELD", "User ID is required", 400);
    }

    // Check if current user is owner or admin (or removing themselves)
    const currentMember = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: authUser.id },
    });

    if (!currentMember) {
      return fail("AUTH_FORBIDDEN", "Not a team member", 403);
    }

    const isSelf = userId === authUser.id;
    const canRemoveOthers = ["OWNER", "ADMIN"].includes(currentMember.role);

    if (!isSelf && !canRemoveOthers) {
      return fail("AUTH_FORBIDDEN", "Not authorized", 403);
    }

    // Cannot remove the last owner
    if (!isSelf) {
      const targetMember = await prisma.teamMember.findFirst({
        where: { teamId: id, userId },
      });

      if (targetMember?.role === "OWNER") {
        const ownerCount = await prisma.teamMember.count({
          where: { teamId: id, role: "OWNER" },
        });

        if (ownerCount <= 1) {
          return fail("BAD_REQUEST", "Cannot remove the last owner", 400);
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
          userId: authUser.id,
          type: "team",
          action: "member_removed",
          description: `Removed ${memberInfo.user.name || memberInfo.user.email} from team`,
          metadata: { teamId: id, removedUserId: userId },
        },
      }).catch(() => {});
    }

    return ok({ success: true });
  } catch (error) {
    log.error("Failed to remove team member", error);
    return fail("INTERNAL_ERROR", "Failed to remove team member", 500);
  }
}
