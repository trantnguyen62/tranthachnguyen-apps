/**
 * Audit Log Export Functionality
 *
 * Provides export capabilities for audit logs in JSON and CSV formats.
 */

import { prisma } from "@/lib/prisma";
import { Activity, User, Project, Team } from "@prisma/client";

export interface AuditLogFilters {
  userId?: string;
  projectId?: string;
  teamId?: string;
  type?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export type ExportFormat = "json" | "csv";

export interface ActivityWithRelations extends Activity {
  user: Pick<User, "id" | "name" | "email">;
  project: Pick<Project, "id" | "name" | "slug"> | null;
  team: Pick<Team, "id" | "name" | "slug"> | null;
}

/**
 * Fetch audit logs with filters
 */
/**
 * Build Prisma where clause from audit log filters
 */
function buildAuditWhere(filters: AuditLogFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.teamId) {
    where.teamId = filters.teamId;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      (where.createdAt as Record<string, Date>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, Date>).lte = filters.endDate;
    }
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { user: { name: { contains: filters.search, mode: "insensitive" } } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function fetchAuditLogs(
  filters: AuditLogFilters,
  options?: {
    limit?: number;
    offset?: number;
    cursorWhere?: Record<string, unknown>;
  }
): Promise<{ logs: ActivityWithRelations[]; total: number }> {
  const baseWhere = buildAuditWhere(filters);
  const where = options?.cursorWhere
    ? { ...baseWhere, ...options.cursorWhere }
    : baseWhere;

  const [logs, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, slug: true },
        },
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: options?.limit,
      skip: options?.cursorWhere ? undefined : options?.offset,
    }),
    prisma.activity.count({ where: baseWhere }),
  ]);

  return { logs: logs as ActivityWithRelations[], total };
}

/**
 * Export audit logs to JSON format
 */
export function formatAsJSON(logs: ActivityWithRelations[]): string {
  const exportData = logs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    type: log.type,
    action: log.action,
    description: log.description,
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
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains comma, newline, or double quote, wrap in quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Export audit logs to CSV format
 */
export function formatAsCSV(logs: ActivityWithRelations[]): string {
  const headers = [
    "ID",
    "Timestamp",
    "Type",
    "Action",
    "Description",
    "User ID",
    "User Name",
    "User Email",
    "Project ID",
    "Project Name",
    "Team ID",
    "Team Name",
    "IP Address",
    "User Agent",
    "Metadata",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.type,
    log.action,
    log.description,
    log.user.id,
    log.user.name,
    log.user.email,
    log.project?.id || "",
    log.project?.name || "",
    log.team?.id || "",
    log.team?.name || "",
    log.ipAddress || "",
    log.userAgent || "",
    log.metadata ? JSON.stringify(log.metadata) : "",
  ]);

  const csvContent = [
    headers.map(escapeCSVField).join(","),
    ...rows.map((row) => row.map(escapeCSVField).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Export audit logs with filters in specified format
 */
export async function exportAuditLogs(
  filters: AuditLogFilters,
  format: ExportFormat
): Promise<{ data: string; mimeType: string; filename: string }> {
  // Fetch all matching logs (no pagination for export)
  const { logs } = await fetchAuditLogs(filters, { limit: 10000 });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (format === "csv") {
    return {
      data: formatAsCSV(logs),
      mimeType: "text/csv",
      filename: `audit-logs-${timestamp}.csv`,
    };
  }

  return {
    data: formatAsJSON(logs),
    mimeType: "application/json",
    filename: `audit-logs-${timestamp}.json`,
  };
}

/**
 * Get available filter options (types and actions)
 */
export async function getFilterOptions(
  teamId?: string
): Promise<{ types: string[]; actions: string[] }> {
  const where = teamId ? { teamId } : {};

  const [types, actions] = await Promise.all([
    prisma.activity.findMany({
      where,
      select: { type: true },
      distinct: ["type"],
    }),
    prisma.activity.findMany({
      where,
      select: { action: true },
      distinct: ["action"],
    }),
  ]);

  return {
    types: types.map((t) => t.type).sort(),
    actions: actions.map((a) => a.action).sort(),
  };
}
