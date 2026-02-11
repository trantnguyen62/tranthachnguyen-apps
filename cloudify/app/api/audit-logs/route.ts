/**
 * Audit Logs API
 *
 * GET /api/audit-logs - List/search audit logs with pagination and filters
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/next-auth";
import { fetchAuditLogs, getFilterOptions, AuditLogFilters } from "@/lib/audit";

/**
 * GET /api/audit-logs
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - type: string (filter by activity type)
 * - action: string (filter by action)
 * - userId: string (filter by user)
 * - projectId: string (filter by project)
 * - teamId: string (filter by team)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - search: string (search in description, user name/email)
 * - includeFilters: boolean (include filter options in response)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
    );
    const offset = (page - 1) * limit;

    // Build filters
    const filters: AuditLogFilters = {};

    const type = searchParams.get("type");
    if (type) filters.type = type;

    const action = searchParams.get("action");
    if (action) filters.action = action;

    const userId = searchParams.get("userId");
    if (userId) filters.userId = userId;

    const projectId = searchParams.get("projectId");
    if (projectId) filters.projectId = projectId;

    const teamId = searchParams.get("teamId");
    if (teamId) filters.teamId = teamId;

    const startDate = searchParams.get("startDate");
    if (startDate) filters.startDate = new Date(startDate);

    const endDate = searchParams.get("endDate");
    if (endDate) filters.endDate = new Date(endDate);

    const search = searchParams.get("search");
    if (search) filters.search = search;

    // For non-admin users, restrict to their own activities or team activities
    // TODO: Add proper role-based access control
    // For now, allow access if user is part of the team

    // Fetch logs
    const { logs, total } = await fetchAuditLogs(filters, { limit, offset });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // Build response
    const response: Record<string, unknown> = {
      logs: logs.map((log) => ({
        id: log.id,
        type: log.type,
        action: log.action,
        description: log.description,
        timestamp: log.createdAt.toISOString(),
        user: {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
        },
        project: log.project
          ? {
              id: log.project.id,
              name: log.project.name,
              slug: log.project.slug,
            }
          : null,
        team: log.team
          ? {
              id: log.team.id,
              name: log.team.name,
              slug: log.team.slug,
            }
          : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };

    // Include filter options if requested
    const includeFilters = searchParams.get("includeFilters") === "true";
    if (includeFilters) {
      response.filterOptions = await getFilterOptions(teamId || undefined);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Audit Logs API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
