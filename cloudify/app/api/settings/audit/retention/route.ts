/**
 * Audit Retention Policy API
 *
 * GET /api/settings/audit/retention - Get retention policy for a team
 * PUT /api/settings/audit/retention - Update retention policy
 * POST /api/settings/audit/retention/apply - Apply retention policy (delete old logs)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import {
  getRetentionPolicy,
  setRetentionPolicy,
  applyRetentionPolicy,
  getRetentionStats,
} from "@/lib/audit";
import { createAuditContext, audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * Verify user has admin access to the team
 */
async function verifyTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prisma.teamMember.findFirst({
    where: {
      userId,
      teamId,
      role: { in: ["owner", "admin"] },
    },
  });
  return !!membership;
}

/**
 * GET /api/settings/audit/retention?teamId=xxx
 *
 * Get retention policy and stats for a team
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the team
    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, teamId },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Get retention stats (includes policy)
    const stats = await getRetentionStats(teamId);

    return NextResponse.json({
      policy: stats.policy,
      preview: stats.preview,
      storageEstimate: stats.storageEstimate,
    });
  } catch (error) {
    console.error("[Retention Policy GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get retention policy" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/audit/retention
 *
 * Update retention policy for a team
 *
 * Body:
 * {
 *   teamId: string
 *   policy: {
 *     enabled?: boolean
 *     retentionDays?: number
 *     autoDelete?: boolean
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, policy } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Verify user is admin of the team
    const isAdmin = await verifyTeamAdmin(session.user.id, teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can modify retention policy" },
        { status: 403 }
      );
    }

    // Update policy
    const updatedPolicy = await setRetentionPolicy(teamId, policy);

    // Log the change
    const auditContext = createAuditContext(request, session.user.id, {
      teamId,
    });
    await audit.settings(
      auditContext,
      "configured",
      "Updated audit log retention policy",
      {
        newPolicy: updatedPolicy,
      }
    );

    return NextResponse.json({
      message: "Retention policy updated",
      policy: updatedPolicy,
    });
  } catch (error) {
    console.error("[Retention Policy PUT] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update retention policy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/settings/audit/retention
 *
 * Apply retention policy and delete old logs
 *
 * Body:
 * {
 *   teamId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Verify user is admin of the team
    const isAdmin = await verifyTeamAdmin(session.user.id, teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team admins can apply retention policy" },
        { status: 403 }
      );
    }

    // Get current policy
    const policy = await getRetentionPolicy(teamId);

    if (!policy.enabled) {
      return NextResponse.json(
        { error: "Retention policy is not enabled" },
        { status: 400 }
      );
    }

    // Apply the policy
    const deletedCount = await applyRetentionPolicy(teamId);

    // Log the cleanup
    const auditContext = createAuditContext(request, session.user.id, {
      teamId,
    });
    await audit.settings(
      auditContext,
      "deleted",
      `Applied retention policy, deleted ${deletedCount} old audit logs`,
      {
        deletedCount,
        retentionDays: policy.retentionDays,
      }
    );

    return NextResponse.json({
      message: "Retention policy applied",
      deletedCount,
    });
  } catch (error) {
    console.error("[Retention Policy POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to apply retention policy" },
      { status: 500 }
    );
  }
}
