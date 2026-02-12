/**
 * Audit Logs Export API
 *
 * POST /api/audit-logs/export - Export audit logs in JSON or CSV format
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { exportAuditLogs, AuditLogFilters, ExportFormat } from "@/lib/audit";
import { createAuditContext, audit } from "@/lib/audit";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("audit-logs/export");

/**
 * POST /api/audit-logs/export
 *
 * Body:
 * {
 *   format: "json" | "csv"
 *   filters: {
 *     type?: string
 *     action?: string
 *     userId?: string
 *     projectId?: string
 *     teamId?: string
 *     startDate?: string (ISO date)
 *     endDate?: string (ISO date)
 *     search?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const format: ExportFormat = body.format || "json";

    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        { error: "Invalid format. Must be 'json' or 'csv'" },
        { status: 400 }
      );
    }

    // Build filters from request body
    const filters: AuditLogFilters = {};

    if (body.filters) {
      if (body.filters.type) filters.type = body.filters.type;
      if (body.filters.action) filters.action = body.filters.action;
      if (body.filters.userId) filters.userId = body.filters.userId;
      if (body.filters.projectId) filters.projectId = body.filters.projectId;
      if (body.filters.teamId) filters.teamId = body.filters.teamId;
      if (body.filters.startDate)
        filters.startDate = new Date(body.filters.startDate);
      if (body.filters.endDate)
        filters.endDate = new Date(body.filters.endDate);
      if (body.filters.search) filters.search = body.filters.search;
    }

    // Export logs
    const { data, mimeType, filename } = await exportAuditLogs(filters, format);

    // Log this export action
    const auditContext = createAuditContext(request, user.id, {
      teamId: filters.teamId,
    });
    await audit.settings(auditContext, "exported", "Exported audit logs", {
      format,
      filters,
      recordCount: data.split("\n").length,
    });

    // Return file download
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    log.error("Failed to export audit logs", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
