/**
 * Audit Log Retention Policy Management
 *
 * Manages retention policies for audit logs including:
 * - Configurable retention periods
 * - Automatic cleanup of old logs
 * - Team-level retention settings
 */

import { prisma } from "@/lib/prisma";

export interface RetentionPolicy {
  enabled: boolean;
  retentionDays: number;
  autoDelete: boolean;
  lastCleanup?: Date;
}

// Default retention policy
const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  enabled: false,
  retentionDays: 90, // 90 days default
  autoDelete: false,
};

// Minimum and maximum retention days
const MIN_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 365 * 7; // 7 years for compliance

/**
 * Get retention policy for a team
 * Returns default policy if none is configured
 */
export async function getRetentionPolicy(
  teamId: string
): Promise<RetentionPolicy> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  // Check for stored policy in team settings
  // Using a JSON field approach - this could be stored in a separate settings table
  const settings = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM "TeamSetting"
    WHERE "teamId" = ${teamId} AND key = 'audit_retention_policy'
    LIMIT 1
  `.catch(() => null);

  if (settings && settings.length > 0) {
    try {
      const policy = JSON.parse(settings[0].value);
      return {
        ...DEFAULT_RETENTION_POLICY,
        ...policy,
      };
    } catch {
      return DEFAULT_RETENTION_POLICY;
    }
  }

  return DEFAULT_RETENTION_POLICY;
}

/**
 * Set retention policy for a team
 */
export async function setRetentionPolicy(
  teamId: string,
  policy: Partial<RetentionPolicy>
): Promise<RetentionPolicy> {
  // Validate retention days
  if (policy.retentionDays !== undefined) {
    if (policy.retentionDays < MIN_RETENTION_DAYS) {
      throw new Error(
        `Retention period must be at least ${MIN_RETENTION_DAYS} days`
      );
    }
    if (policy.retentionDays > MAX_RETENTION_DAYS) {
      throw new Error(
        `Retention period cannot exceed ${MAX_RETENTION_DAYS} days`
      );
    }
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  const currentPolicy = await getRetentionPolicy(teamId);
  const newPolicy: RetentionPolicy = {
    ...currentPolicy,
    ...policy,
  };

  // Store the policy using raw SQL since TeamSetting might not exist
  // This will upsert the setting
  await prisma.$executeRaw`
    INSERT INTO "TeamSetting" ("id", "teamId", "key", "value", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      ${teamId},
      'audit_retention_policy',
      ${JSON.stringify(newPolicy)},
      NOW(),
      NOW()
    )
    ON CONFLICT ("teamId", "key")
    DO UPDATE SET
      "value" = ${JSON.stringify(newPolicy)},
      "updatedAt" = NOW()
  `.catch(async () => {
    // If TeamSetting table doesn't exist, try creating it
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TeamSetting" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "teamId" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        UNIQUE("teamId", "key"),
        FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE
      )
    `;
    // Retry insert
    await prisma.$executeRaw`
      INSERT INTO "TeamSetting" ("id", "teamId", "key", "value", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${teamId},
        'audit_retention_policy',
        ${JSON.stringify(newPolicy)},
        NOW(),
        NOW()
      )
      ON CONFLICT ("teamId", "key")
      DO UPDATE SET
        "value" = ${JSON.stringify(newPolicy)},
        "updatedAt" = NOW()
    `;
  });

  return newPolicy;
}

/**
 * Apply retention policy to delete old audit logs
 * Returns the number of deleted records
 */
export async function applyRetentionPolicy(teamId: string): Promise<number> {
  const policy = await getRetentionPolicy(teamId);

  if (!policy.enabled || !policy.autoDelete) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

  const result = await prisma.activity.deleteMany({
    where: {
      teamId,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  // Update last cleanup timestamp
  await setRetentionPolicy(teamId, {
    lastCleanup: new Date(),
  });

  return result.count;
}

/**
 * Get count of logs that would be affected by current retention policy
 */
export async function getRetentionPreview(
  teamId: string
): Promise<{ totalLogs: number; logsToDelete: number; oldestLog: Date | null }> {
  const policy = await getRetentionPolicy(teamId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

  const [totalLogs, logsToDelete, oldestLog] = await Promise.all([
    prisma.activity.count({
      where: { teamId },
    }),
    prisma.activity.count({
      where: {
        teamId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    }),
    prisma.activity.findFirst({
      where: { teamId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    totalLogs,
    logsToDelete,
    oldestLog: oldestLog?.createdAt || null,
  };
}

/**
 * Cleanup old audit logs for all teams with retention enabled
 * This should be called by a cron job
 */
export async function runRetentionCleanup(): Promise<{
  teamsProcessed: number;
  totalDeleted: number;
}> {
  // Get all teams with retention enabled
  const teamsWithRetention = await prisma.$queryRaw<Array<{ teamId: string }>>`
    SELECT "teamId" FROM "TeamSetting"
    WHERE key = 'audit_retention_policy'
    AND value::jsonb->>'enabled' = 'true'
    AND value::jsonb->>'autoDelete' = 'true'
  `.catch(() => []);

  let totalDeleted = 0;

  for (const { teamId } of teamsWithRetention) {
    const deleted = await applyRetentionPolicy(teamId);
    totalDeleted += deleted;
  }

  return {
    teamsProcessed: teamsWithRetention.length,
    totalDeleted,
  };
}

/**
 * Get retention policy statistics
 */
export async function getRetentionStats(teamId: string): Promise<{
  policy: RetentionPolicy;
  preview: {
    totalLogs: number;
    logsToDelete: number;
    oldestLog: Date | null;
  };
  storageEstimate: {
    currentSizeKB: number;
    afterCleanupSizeKB: number;
  };
}> {
  const [policy, preview] = await Promise.all([
    getRetentionPolicy(teamId),
    getRetentionPreview(teamId),
  ]);

  // Estimate storage (rough estimate: ~1KB per log entry)
  const avgLogSizeKB = 1;
  const currentSizeKB = preview.totalLogs * avgLogSizeKB;
  const afterCleanupSizeKB =
    (preview.totalLogs - preview.logsToDelete) * avgLogSizeKB;

  return {
    policy,
    preview,
    storageEstimate: {
      currentSizeKB,
      afterCleanupSizeKB,
    },
  };
}
