import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import { getRouteLogger } from "@/lib/api/logger";
import { handlePrismaError } from "@/lib/api/error-response";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("teams");

// GET /api/teams - List user's teams
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const teamMembers = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
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
            _count: {
              select: {
                teamProjects: true,
              },
            },
          },
        },
      },
    });

    const teams = teamMembers.map((tm) => ({
      ...tm.team,
      myRole: tm.role,
      projectCount: tm.team._count.teamProjects,
    }));

    return ok(teams);
  } catch (error) {
    return fail("INTERNAL_ERROR", "Failed to fetch teams", 500);
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return fail("VALIDATION_MISSING_FIELD", "Team name is required", 422, {
        fields: [{ field: "name", message: "Team name is required" }],
      });
    }

    if (name.trim().length > 100) {
      return fail("VALIDATION_ERROR", "Team name must be 100 characters or less", 422, {
        fields: [{ field: "name", message: "Team name must be 100 characters or less" }],
      });
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check for existing slug and make unique
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.team.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create team with creator as owner
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
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
      },
    });

    // Log activity (non-blocking - don't fail team creation if logging fails)
    prisma.activity.create({
      data: {
        userId: user.id,
        type: "team",
        action: "created",
        description: `Created team "${name}"`,
        metadata: { teamId: team.id },
      },
    }).catch((err: unknown) => log.error("Failed to log activity", err));

    return ok(team, { status: 201 });
  } catch (error) {
    const prismaResp = handlePrismaError(error, "team");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to create team", 500);
  }
}
