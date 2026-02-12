/**
 * Audit Logs API
 *
 * GET /api/audit-logs - List/search audit logs with pagination and filters
 */

import { NextRequest } from "next/server";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { fetchAuditLogs, getFilterOptions, AuditLogFilters } from "@/lib/audit";
import { getRouteLogger } from "@/lib/api/logger";
import {
  ok,
  fail,
  encodeCursor,
  buildCursorWhere,
  parsePaginationParams,
} from "@/lib/api/response";

const log = getRouteLogger("audit-logs");

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
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = request.nextUrl;

    // Pagination
    const { cursor, limit } = parsePaginationParams(searchParams);
    const cursorWhere = buildCursorWhere(cursor);

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

    // Fetch logs with cursor pagination
    const { logs, total } = await fetchAuditLogs(filters, {
      limit: limit + 1,
      cursorWhere: Object.keys(cursorWhere).length > 0 ? cursorWhere : undefined,
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : undefined;

    // Build response
    const response: Record<string, unknown> = {
      logs: items.map((log) => ({
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
    };

    // Include filter options if requested
    const includeFilters = searchParams.get("includeFilters") === "true";
    if (includeFilters) {
      response.filterOptions = await getFilterOptions(teamId || undefined);
    }

    return ok(response, {
      pagination: {
        cursor: nextCursor,
        hasMore,
        total,
      },
    });
  } catch (error) {
    log.error("Failed to fetch audit logs", { error: error instanceof Error ? error.message : String(error) });
    return fail("INTERNAL_ERROR", "Failed to fetch audit logs", 500);
  }
}
