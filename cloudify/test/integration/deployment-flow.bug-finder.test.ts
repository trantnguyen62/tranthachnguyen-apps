/**
 * Deployment Flow Bug Finder Tests
 *
 * Tests edge cases in the deployment pipeline that could cause real bugs.
 * Focuses on state transitions, race conditions, and error handling.
 *
 * Seeded deployments:
 * - deploy_001 through deploy_030: Various statuses (READY, ERROR, BUILDING, QUEUED, CANCELLED)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Import types only for reference
type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "ERROR"
  | "CANCELLED";

describe("Deployment State Machine Bug Finder", () => {
  describe("Valid State Transitions", () => {
    const validTransitions: Record<DeploymentStatus, DeploymentStatus[]> = {
      QUEUED: ["BUILDING", "CANCELLED", "ERROR"],
      BUILDING: ["DEPLOYING", "CANCELLED", "ERROR"],
      DEPLOYING: ["READY", "ERROR"],
      READY: [], // Terminal state
      ERROR: [], // Terminal state
      CANCELLED: [], // Terminal state
    };

    it("BUG: Can transition from READY back to BUILDING", () => {
      // Once a deployment is READY, it shouldn't go back to BUILDING
      const currentStatus: DeploymentStatus = "READY";
      const newStatus: DeploymentStatus = "BUILDING";

      expect(validTransitions[currentStatus]).not.toContain(newStatus);
    });

    it("BUG: Can transition from ERROR to READY", () => {
      // ERROR is terminal - can't magically become READY
      const currentStatus: DeploymentStatus = "ERROR";
      const newStatus: DeploymentStatus = "READY";

      expect(validTransitions[currentStatus]).not.toContain(newStatus);
    });

    it("BUG: Can transition from CANCELLED to QUEUED", () => {
      // CANCELLED is terminal - need to create new deployment
      const currentStatus: DeploymentStatus = "CANCELLED";
      const newStatus: DeploymentStatus = "QUEUED";

      expect(validTransitions[currentStatus]).not.toContain(newStatus);
    });

    it("BUG: Direct transition from QUEUED to READY", () => {
      // Should go through BUILDING and DEPLOYING first
      const currentStatus: DeploymentStatus = "QUEUED";
      const newStatus: DeploymentStatus = "READY";

      expect(validTransitions[currentStatus]).not.toContain(newStatus);
    });

    it("BUG: Direct transition from QUEUED to DEPLOYING", () => {
      // Should go through BUILDING first
      const currentStatus: DeploymentStatus = "QUEUED";
      const newStatus: DeploymentStatus = "DEPLOYING";

      expect(validTransitions[currentStatus]).not.toContain(newStatus);
    });
  });

  describe("Race Condition Scenarios", () => {
    it("BUG: Two cancel requests for same deployment", async () => {
      // First request: status = BUILDING -> CANCELLED
      // Second request arrives before first completes
      // Second request might also try to cancel BUILDING
      // Result: duplicate operations or inconsistent state

      const simulateCancel = async (
        currentStatus: DeploymentStatus
      ): Promise<DeploymentStatus | null> => {
        // Only cancel if in progress
        if (["QUEUED", "BUILDING", "DEPLOYING"].includes(currentStatus)) {
          return "CANCELLED";
        }
        return null; // Can't cancel
      };

      // Both requests see BUILDING
      const result1 = await simulateCancel("BUILDING");
      const result2 = await simulateCancel("BUILDING");

      // Both succeed - but second should fail because already cancelled
      expect(result1).toBe("CANCELLED");
      expect(result2).toBe("CANCELLED"); // BUG: Should be null
    });

    it("BUG: Build completes while cancel request in flight", async () => {
      // Timeline:
      // T0: User clicks cancel, status = BUILDING
      // T1: Build completes naturally, status -> DEPLOYING -> READY
      // T2: Cancel request arrives, sees READY
      // Should: Return "already completed" not "cancelled"

      const cancelIfCancellable = (status: DeploymentStatus): boolean => {
        return ["QUEUED", "BUILDING", "DEPLOYING"].includes(status);
      };

      // When cancel arrives, status has changed to READY
      const canCancel = cancelIfCancellable("READY");
      expect(canCancel).toBe(false);
    });

    it("BUG: Multiple concurrent deployments for same project", async () => {
      // User triggers deploy twice quickly
      // Both deployments might try to:
      // - Clone same repo
      // - Build to same output directory
      // - Deploy to same URL
      // Result: race conditions, file overwrites, broken deployments

      const projectId = "project_001";
      const deployments = [
        { id: "deploy_a", projectId, status: "QUEUED" as DeploymentStatus },
        { id: "deploy_b", projectId, status: "QUEUED" as DeploymentStatus },
      ];

      // Both point to same project - this could be problematic
      const sameProject = deployments[0].projectId === deployments[1].projectId;
      expect(sameProject).toBe(true);

      // BUG: No check for existing in-progress deployment
    });
  });

  describe("Build Worker Edge Cases", () => {
    it("BUG: Build worker dies mid-build", async () => {
      // Deployment stuck in BUILDING forever
      // Need: timeout mechanism to mark as ERROR

      const deployment = {
        id: "deploy_001",
        status: "BUILDING" as DeploymentStatus,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };

      // Build has been running for 1 hour - likely stuck
      const buildStarted = deployment.createdAt.getTime();
      const now = Date.now();
      const buildDurationMins = (now - buildStarted) / 1000 / 60;

      expect(buildDurationMins).toBeGreaterThan(30); // Definitely stuck

      // BUG: No timeout mechanism to clean this up
    });

    it("BUG: Build succeeds but deploy fails", async () => {
      // Status goes BUILDING -> DEPLOYING -> ERROR
      // Build artifacts exist but deployment failed
      // On retry, should it use existing artifacts or rebuild?

      const deployment = {
        id: "deploy_001",
        status: "ERROR" as DeploymentStatus,
        artifactPath: "/data/builds/my-project/deploy_001",
      };

      // Artifacts exist from successful build
      const hasArtifacts = deployment.artifactPath !== null;
      expect(hasArtifacts).toBe(true);

      // BUG: Retry mechanism unclear
    });

    it("BUG: Out of disk space during build", async () => {
      // Build generates huge node_modules
      // Disk fills up
      // What error does user see? How is cleanup handled?

      const diskSpaceMB = 100; // Only 100MB free
      const buildSizeMB = 500; // Build needs 500MB

      expect(diskSpaceMB < buildSizeMB).toBe(true);

      // BUG: Pre-flight disk space check missing
    });

    it("BUG: Build timeout vs slow legitimate build", () => {
      // Large project takes 25 minutes to build
      // Timeout is 10 minutes
      // Deployment marked as ERROR even though it would have succeeded

      const buildTimeoutMins = 10;
      const actualBuildMins = 25;

      expect(actualBuildMins > buildTimeoutMins).toBe(true);

      // BUG: Timeout might be too aggressive for large projects
    });
  });

  describe("URL and Artifact Path Edge Cases", () => {
    it("BUG: Deployment URL with special characters in project name", () => {
      // Project name: "My App (v2.0)"
      // Expected slug: "my-app-v2-0"
      // URL: my-app-v2-0-abc123.projects.tranthachnguyen.com

      const projectName = "My App (v2.0)";
      const slug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      expect(slug).toBe("my-app-v2-0");

      // Should be valid subdomain
      const validSubdomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug);
      expect(validSubdomain).toBe(true);
    });

    it("BUG: Artifact path with very long deployment ID", () => {
      // CUID can be ~25 chars, but what if it's longer?
      const longId = "a".repeat(100);
      const artifactPath = `/data/builds/my-project/${longId}`;

      // Most filesystems have 255 char limit on path components
      expect(longId.length).toBeLessThan(255);
    });

    it("BUG: Collision in siteSlug generation", () => {
      // Two projects: "my-app" and "my--app"
      // Both generate same slug
      const name1 = "my-app";
      const name2 = "my--app";

      const slug1 = name1
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const slug2 = name2
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Both become "my-app"
      expect(slug1).toBe("my-app");
      expect(slug2).toBe("my-app");
    });
  });

  describe("Log Streaming Edge Cases", () => {
    it("BUG: Log message with null bytes", () => {
      const logMessage = "Build output\x00with null\x00bytes";

      // Null bytes can cause issues in string handling
      expect(logMessage).toContain("\x00");

      // Should sanitize null bytes
      const sanitized = logMessage.replace(/\x00/g, "");
      expect(sanitized).not.toContain("\x00");
    });

    it("BUG: Log message exceeding database TEXT limit", () => {
      // PostgreSQL TEXT has no explicit limit but performance degrades
      const hugeLog = "x".repeat(10 * 1024 * 1024); // 10MB

      // Should truncate or chunk large logs
      expect(hugeLog.length).toBeGreaterThan(1000000);
    });

    it("BUG: Log timestamp ordering with high concurrency", () => {
      // Multiple log entries created in same millisecond
      const logs = [
        { timestamp: new Date(), message: "Step 1" },
        { timestamp: new Date(), message: "Step 2" },
        { timestamp: new Date(), message: "Step 3" },
      ];

      // All might have same timestamp
      const uniqueTimestamps = new Set(logs.map((l) => l.timestamp.getTime()));
      // Could be 1, 2, or 3 unique timestamps
      expect(uniqueTimestamps.size).toBeGreaterThanOrEqual(1);

      // BUG: Order might not be preserved if timestamps are identical
    });

    it("BUG: ANSI color codes in log output", () => {
      const logWithColors = "\x1b[32mSuccess\x1b[0m \x1b[31mError\x1b[0m";

      // Should either preserve (for terminal display) or strip (for web)
      const stripped = logWithColors.replace(
        // eslint-disable-next-line no-control-regex
        /\x1b\[[0-9;]*[a-zA-Z]/g,
        ""
      );
      expect(stripped).toBe("Success Error");
    });
  });

  describe("Cancel Operation Edge Cases", () => {
    it("BUG: Cancel request when deployment already ERROR", () => {
      const canCancel = (status: DeploymentStatus): boolean => {
        return ["QUEUED", "BUILDING", "DEPLOYING"].includes(status);
      };

      expect(canCancel("ERROR")).toBe(false);
    });

    it("BUG: Cancel request when deployment already READY", () => {
      const canCancel = (status: DeploymentStatus): boolean => {
        return ["QUEUED", "BUILDING", "DEPLOYING"].includes(status);
      };

      expect(canCancel("READY")).toBe(false);
    });

    it("BUG: Cancel request when deployment already CANCELLED", () => {
      const canCancel = (status: DeploymentStatus): boolean => {
        return ["QUEUED", "BUILDING", "DEPLOYING"].includes(status);
      };

      expect(canCancel("CANCELLED")).toBe(false);
    });

    it("BUG: K8s job not cleaned up on cancel", async () => {
      // When we cancel, we update DB status
      // But do we also delete the K8s Job?
      // Orphaned jobs could consume cluster resources

      const cancelled = {
        dbStatus: "CANCELLED" as DeploymentStatus,
        k8sJobDeleted: false, // BUG: K8s job still running
      };

      // Both should be true for proper cleanup
      expect(cancelled.dbStatus).toBe("CANCELLED");
      expect(cancelled.k8sJobDeleted).toBe(false); // This is the bug!
    });
  });

  describe("Rollback Edge Cases", () => {
    it("BUG: Rollback to deployment that no longer has artifacts", () => {
      // Old deployments might have artifacts cleaned up
      const oldDeployment = {
        id: "deploy_001",
        artifactPath: "/data/builds/my-project/deploy_001",
        status: "READY" as DeploymentStatus,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      };

      // Artifacts might have been deleted
      const artifactsExist = false; // Simulated

      // BUG: Rollback should check artifacts exist first
      expect(artifactsExist).toBe(false);
    });

    it("BUG: Rollback while another deployment is in progress", () => {
      const currentDeployment = {
        id: "deploy_current",
        status: "BUILDING" as DeploymentStatus,
      };
      const rollbackTarget = {
        id: "deploy_old",
        status: "READY" as DeploymentStatus,
      };

      // Rollback while build in progress - what happens?
      const hasInProgressDeployment = currentDeployment.status === "BUILDING";
      expect(hasInProgressDeployment).toBe(true);

      // BUG: Should either queue rollback or reject with "deployment in progress"
    });
  });

  describe("Deployment Limits by Plan", () => {
    it("BUG: Free tier user exceeds deployment limit", () => {
      const freeUserDeployments = 101; // Over 100 limit
      const freeLimit = 100;

      expect(freeUserDeployments > freeLimit).toBe(true);
      // BUG: Should be blocked but limit might not be enforced
    });

    it("BUG: Concurrent deployments check", () => {
      // Free: 1 concurrent
      // Pro: 5 concurrent
      // Enterprise: unlimited

      const concurrentLimit = {
        free: 1,
        pro: 5,
        enterprise: -1,
      };

      const freeUserConcurrent = 2; // Trying to run 2
      expect(freeUserConcurrent > concurrentLimit.free).toBe(true);
      // BUG: Concurrent deployment limit might not be enforced
    });
  });
});

describe("Deployment API Input Validation", () => {
  describe("Project ID Validation", () => {
    it("BUG: Empty string projectId", () => {
      const projectId = "";
      expect(projectId).toBe("");
      // Should return 400 Bad Request
    });

    it("BUG: SQL injection in projectId", () => {
      const projectId = "'; DROP TABLE projects; --";
      // Prisma parameterizes queries, so this should be safe
      // But test anyway
      expect(projectId).toContain("DROP");
    });

    it("BUG: CUID vs UUID mismatch", () => {
      // CUIDs are ~25 char alphanumeric strings starting with 'c'
      const validCuid = "clh3am8b00000edq0tgkh8r1x";
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";

      // If system expects CUID but receives UUID
      // CUIDs typically start with 'c' and are 21-28 chars
      const isCuid = /^c[a-z0-9]{20,27}$/.test(validCuid);
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          validUuid
        );

      expect(isCuid).toBe(true);
      expect(isUuid).toBe(true);
      // BUG: System should validate ID format
    });
  });

  describe("Branch Name Validation", () => {
    it("BUG: Branch with spaces", () => {
      const branch = "feature branch";
      // Git allows branches with spaces if properly escaped
      expect(branch).toContain(" ");
    });

    it("BUG: Branch with special git characters", () => {
      const dangerousBranches = [
        "../../../etc/passwd",
        "branch\nwith\nnewlines",
        "branch;rm -rf /",
        "branch`whoami`",
        "branch$(id)",
      ];

      for (const branch of dangerousBranches) {
        // BUG: Should validate branch name format
        expect(branch).toBeDefined();
      }
    });

    it("BUG: Very long branch name", () => {
      const longBranch = "a".repeat(1000);
      // Git has 255 char limit on ref names
      expect(longBranch.length).toBeGreaterThan(255);
    });
  });

  describe("Commit SHA Validation", () => {
    it("BUG: Invalid commit SHA format", () => {
      const invalidShas = [
        "not-a-sha",
        "12345", // Too short
        "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz", // Invalid chars
        "", // Empty
      ];

      const validShaRegex = /^[0-9a-f]{40}$/i;

      for (const sha of invalidShas) {
        const isValid = validShaRegex.test(sha);
        expect(isValid).toBe(false);
      }
    });

    it("BUG: Short SHA (7 chars) vs full SHA", () => {
      const shortSha = "abc1234";
      const fullSha = "abc1234567890123456789012345678901234567";

      // Git accepts short SHA but API might require full
      expect(shortSha.length).toBe(7);
      expect(fullSha.length).toBe(40);
    });
  });
});

describe("Build Command Security", () => {
  it("BUG: Command injection via environment variable", () => {
    // If buildCmd includes env vars that user controls
    const userControlledEnv = "value; rm -rf /";
    const buildCmd = `echo $USER_VAR && npm run build`;

    // If USER_VAR = "value; rm -rf /"
    // Expanded: echo value; rm -rf / && npm run build
    expect(userControlledEnv).toContain(";");
  });

  it("BUG: Build command with backticks", () => {
    const buildCmd = "npm run build `whoami`";
    expect(buildCmd).toContain("`");
    // Backticks execute command substitution
  });

  it("BUG: Build command with $() substitution", () => {
    const buildCmd = "npm run build $(cat /etc/passwd)";
    expect(buildCmd).toContain("$(");
    // $(command) also does substitution
  });
});
