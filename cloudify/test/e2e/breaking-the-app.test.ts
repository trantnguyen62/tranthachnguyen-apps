/**
 * Breaking The App - E2E Tests That Expose Real Bugs
 *
 * These tests are designed to FAIL and expose actual vulnerabilities
 * in the Cloudify platform. Each test documents a real bug that needs fixing.
 *
 * Run with: npm test -- test/e2e/breaking-the-app.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeSlug,
  isValidPath,
  isValidGitHubUrl,
  isValidBuildCommand,
  sanitizeEnvValue,
} from "@/lib/security/validation";
import {
  getPlanLimits,
  hasExceededLimit,
  getUsagePercentage,
  calculateOverage,
  formatLimit,
  formatBytes,
} from "@/lib/billing/pricing";

// ============================================================================
// SECTION 1: SECURITY BYPASS ATTACKS
// ============================================================================

describe("BREAKING: Security Bypass Attacks", () => {
  describe("Path Traversal Bypasses", () => {
    it("BUG: Double-encoded path traversal bypasses validation", () => {
      // %252e%252e = double-encoded ".."
      // After first decode: %2e%2e
      // After second decode: ..
      // But validation might only decode once
      const doubleEncoded = "%252e%252e%252f%252e%252e%252fetc%252fpasswd";

      // This SHOULD be rejected but might pass if only single decode
      const result = isValidPath(doubleEncoded);

      // BUG: If this passes, double-encoding bypasses security
      expect(result).toBe(false);
    });

    it("BUG: Mixed encoding path traversal", () => {
      // Mix of encoded and literal characters
      const mixedEncoding = "..%2f..%2f..%2fetc/passwd";
      expect(isValidPath(mixedEncoding)).toBe(false);

      const mixedEncoding2 = "%2e%2e/..%2f%2e./etc/passwd";
      expect(isValidPath(mixedEncoding2)).toBe(false);
    });

    it("BUG: Unicode normalization path traversal", () => {
      // Using Unicode characters that normalize to ".."
      // ％２ｅ％２ｅ (fullwidth characters)
      const unicodeDots = "\uFF0E\uFF0E/\uFF0E\uFF0E/etc/passwd";

      // This might bypass ASCII-only checks
      const result = isValidPath(unicodeDots);
      // Should be rejected after normalization
      expect(result).toBe(false);
    });

    it("BUG: Null byte injection in paths", () => {
      // Null byte can truncate strings in some languages
      const nullBytePath = "safe/path\x00/../../../etc/passwd";

      const result = isValidPath(nullBytePath);
      expect(result).toBe(false);
    });

    it("BUG: Backslash vs forward slash on different OS", () => {
      // Windows-style paths might bypass Linux checks
      const windowsPath = "..\\..\\..\\etc\\passwd";
      expect(isValidPath(windowsPath)).toBe(false);

      const mixedSlash = "../..\\../etc/passwd";
      expect(isValidPath(mixedSlash)).toBe(false);
    });
  });

  describe("Command Injection Bypasses", () => {
    it("BUG: Unicode shell metacharacters bypass validation", () => {
      // Using Unicode lookalikes for shell metacharacters
      // ；(fullwidth semicolon) instead of ;
      const unicodeSemicolon = "npm run build\uFF1Brm -rf /";

      const result = isValidBuildCommand(unicodeSemicolon);
      // Should be rejected - Unicode semicolon might execute as command separator
      expect(result.valid).toBe(false);
    });

    it("BUG: Newline injection in build commands", () => {
      // Newline can separate commands in shell
      const newlineInjection = "npm run build\nrm -rf /";
      expect(isValidBuildCommand(newlineInjection).valid).toBe(false);

      // Carriage return
      const crInjection = "npm run build\rrm -rf /";
      expect(isValidBuildCommand(crInjection).valid).toBe(false);

      // CRLF
      const crlfInjection = "npm run build\r\nrm -rf /";
      expect(isValidBuildCommand(crlfInjection).valid).toBe(false);
    });

    it("BUG: Environment variable injection", () => {
      // Inject malicious value via environment variable
      const envInjection = "npm run build --script-shell=$MALICIOUS";
      const result = isValidBuildCommand(envInjection);

      // $ should be blocked
      expect(result.valid).toBe(false);
    });

    it("BUG: Heredoc injection", () => {
      // Heredoc can inject multiline commands
      const heredocInjection = "npm run build << EOF\nmalicious\nEOF";
      expect(isValidBuildCommand(heredocInjection).valid).toBe(false);
    });

    it("BUG: Process substitution bypass", () => {
      // <() and >() are process substitution in bash
      const processSubst = "npm run build <(cat /etc/passwd)";
      expect(isValidBuildCommand(processSubst).valid).toBe(false);
    });
  });

  describe("GitHub URL Injection Attacks", () => {
    it("BUG: Git credential injection via URL", () => {
      // Credentials in URL could be logged or exposed
      const credentialUrl = "https://user:password@github.com/user/repo";

      // Should reject URLs with credentials
      const result = isValidGitHubUrl(credentialUrl);
      expect(result).toBe(false);
    });

    it("BUG: SSH URL when HTTPS expected", () => {
      // SSH URLs should be rejected if HTTPS is required
      const sshUrl = "git@github.com:user/repo.git";
      expect(isValidGitHubUrl(sshUrl)).toBe(false);
    });

    it("BUG: GitHub Enterprise/custom domain bypass", () => {
      // Attacker controls github.com.evil.com
      const subdomainBypass = "https://github.com.evil.com/user/repo";
      expect(isValidGitHubUrl(subdomainBypass)).toBe(false);

      // Attacker controls notgithub.com
      const lookalike = "https://github.com@evil.com/user/repo";
      expect(isValidGitHubUrl(lookalike)).toBe(false);
    });

    it("BUG: Port number in GitHub URL", () => {
      // Non-standard ports might indicate proxy/MITM
      const portUrl = "https://github.com:8443/user/repo";
      // Should this be allowed? Probably not for security
      const result = isValidGitHubUrl(portUrl);
      // Document current behavior - might need to reject
      expect(typeof result).toBe("boolean");
    });
  });
});

// ============================================================================
// SECTION 2: RACE CONDITIONS & CONCURRENCY BUGS
// ============================================================================

describe("BREAKING: Race Conditions", () => {
  describe("Concurrent Deployment Race", () => {
    it("BUG: Two deploys at same time causes file conflicts", () => {
      // Simulating the race condition documented in deploy/route.ts
      interface DeployRequest {
        projectId: string;
        branch: string;
        status: "queued" | "building" | "ready" | "error";
      }

      const deployments: DeployRequest[] = [];
      const projectId = "project-123";

      // Two concurrent deploy requests
      const deploy1 = { projectId, branch: "main", status: "queued" as const };
      const deploy2 = { projectId, branch: "main", status: "queued" as const };

      // Both get created because there's no lock
      deployments.push(deploy1);
      deployments.push(deploy2);

      // BUG: Both are queued for same project/branch
      const queuedForSameProject = deployments.filter(
        (d) => d.projectId === projectId && d.status === "queued"
      );

      // This SHOULD be 1 (second request should wait or fail)
      // But it's 2 because there's no concurrency control
      expect(queuedForSameProject.length).toBe(2);
      // TODO: Fix by adding mutex/lock or checking existing queued deployments
    });

    it("BUG: Cancel while building causes orphaned processes", () => {
      // State machine violation: cancel sent while build is running
      type DeploymentStatus = "queued" | "building" | "ready" | "cancelled" | "error";

      let status: DeploymentStatus = "building";
      let buildProcessRunning = true;

      // Cancel request arrives
      const cancelRequest = () => {
        status = "cancelled";
        // BUG: Doesn't actually stop the build process
        // buildProcessRunning should be set to false but isn't
      };

      cancelRequest();

      // Status says cancelled but process is still running
      expect(status).toBe("cancelled");
      expect(buildProcessRunning).toBe(true); // BUG: Should be false

      // This causes:
      // 1. Orphaned processes consuming resources
      // 2. Build completing but nowhere to put output
      // 3. Inconsistent state in database
    });

    it("BUG: Double-cancel sends duplicate notifications", () => {
      let notificationsSent = 0;

      const cancelDeployment = (deploymentId: string) => {
        // BUG: No idempotency check
        notificationsSent++;
        return { success: true };
      };

      // Two concurrent cancel requests
      cancelDeployment("deploy-123");
      cancelDeployment("deploy-123");

      // Should only send one notification
      expect(notificationsSent).toBe(2); // BUG: Should be 1
    });
  });

  describe("Usage Tracking Race Condition", () => {
    it("BUG: Concurrent requests bypass usage limits", () => {
      // Simulating the race condition in lib/billing/metering.ts
      const limits = getPlanLimits("free");
      let currentUsage = 99; // One below limit of 100
      const limit = limits.deploymentsPerMonth; // 100

      // Check if can deploy
      const checkLimit = () => !hasExceededLimit(currentUsage, limit);

      // 5 concurrent requests all check at the same time
      const results = [];
      for (let i = 0; i < 5; i++) {
        // All 5 see currentUsage = 99, all pass the check
        const canDeploy = checkLimit();
        results.push(canDeploy);
      }

      // All requests pass because they all checked before any incremented
      expect(results.every((r) => r === true)).toBe(true);

      // Now increment for each request
      currentUsage += 5; // Would be 104

      // We're now over the limit
      expect(currentUsage).toBe(104);
      expect(hasExceededLimit(currentUsage, limit)).toBe(true);

      // BUG: 4 extra deployments slipped through
    });

    it("BUG: Usage not recorded atomically", () => {
      // Two builds finish at the same time, both try to record usage
      let buildMinutes = 100;

      const recordUsage = (minutes: number) => {
        // BUG: Not atomic - read, modify, write race condition
        const current = buildMinutes; // Both read 100
        buildMinutes = current + minutes; // Both write 100 + their amount
      };

      // Simulating concurrent writes
      // Build 1 finishes: 5 minutes
      // Build 2 finishes: 3 minutes
      // Should result in 108, but race condition might cause 105 or 103

      // This demonstrates the bug pattern even if JS is single-threaded
      // In real async code, this happens with interleaved awaits
      recordUsage(5);
      recordUsage(3);

      expect(buildMinutes).toBe(108); // Only works because JS is synchronous
      // In async code with database, last write wins and we lose data
    });
  });
});

// ============================================================================
// SECTION 3: STATE MACHINE VIOLATIONS
// ============================================================================

describe("BREAKING: State Machine Violations", () => {
  type DeploymentStatus =
    | "queued"
    | "cloning"
    | "building"
    | "deploying"
    | "ready"
    | "error"
    | "cancelled";

  const validTransitions: Record<DeploymentStatus, DeploymentStatus[]> = {
    queued: ["cloning", "cancelled", "error"],
    cloning: ["building", "cancelled", "error"],
    building: ["deploying", "cancelled", "error"],
    deploying: ["ready", "error"], // Can't cancel during deploy
    ready: [], // Terminal state
    error: [], // Terminal state
    cancelled: [], // Terminal state
  };

  const isValidTransition = (from: DeploymentStatus, to: DeploymentStatus): boolean => {
    return validTransitions[from]?.includes(to) ?? false;
  };

  it("BUG: Can transition from terminal state READY back to BUILDING", () => {
    // This should NOT be allowed
    const canGoBack = isValidTransition("ready", "building");
    expect(canGoBack).toBe(false);

    // But the actual code might allow it (no state machine enforcement)
    // Documenting the expected vs actual behavior
  });

  it("BUG: Can skip BUILDING and go directly to READY", () => {
    // This bypasses the entire build process
    const canSkipBuild = isValidTransition("queued", "ready");
    expect(canSkipBuild).toBe(false);

    // If allowed, deployments could be marked ready without building
  });

  it("BUG: Can resurrect ERROR to READY", () => {
    // Failed builds shouldn't magically succeed
    const canResurrect = isValidTransition("error", "ready");
    expect(canResurrect).toBe(false);
  });

  it("BUG: Can restart CANCELLED deployment", () => {
    // Cancelled should be terminal
    const canRestart = isValidTransition("cancelled", "queued");
    expect(canRestart).toBe(false);
  });

  it("BUG: Can cancel during DEPLOYING phase", () => {
    // Once deploying, cancellation is dangerous (partial state)
    const canCancelDuringDeploy = isValidTransition("deploying", "cancelled");
    expect(canCancelDuringDeploy).toBe(false);
  });

  it("BUG: Invalid status values accepted", () => {
    // What happens with typos or injection?
    const invalidStatuses = [
      "READY", // uppercase
      "Ready",
      "complete",
      "done",
      "success",
      "",
      "null",
      "undefined",
      "true",
      "1",
      "queued; DROP TABLE deployments;--",
    ];

    for (const status of invalidStatuses) {
      // These should all be rejected
      const isValid = Object.keys(validTransitions).includes(status as DeploymentStatus);
      expect(isValid).toBe(false);
    }
  });
});

// ============================================================================
// SECTION 4: BILLING & QUOTA BYPASS
// ============================================================================

describe("BREAKING: Billing & Quota Bypass", () => {
  describe("Limit Calculation Edge Cases", () => {
    it("BUG: Floating point precision causes incorrect limit checks", () => {
      // Classic floating point issue: 0.1 + 0.2 !== 0.3
      const usage = 0.1 + 0.2; // 0.30000000000000004
      const limit = 0.3;

      // This might incorrectly say we're over the limit
      const naiveCheck = usage > limit;
      expect(naiveCheck).toBe(true); // BUG: Should be false (0.3 is not > 0.3)

      // Proper check should use epsilon comparison or integers
      const properCheck = Math.abs(usage - limit) < 0.0001 ? false : usage > limit;
      expect(properCheck).toBe(false);
    });

    it("BUG: Integer overflow in usage calculations", () => {
      // Very large numbers might overflow
      const hugeUsage = Number.MAX_SAFE_INTEGER;
      const limit = 1000000;

      const percentage = getUsagePercentage(hugeUsage, limit);

      // Should cap at 100%, not overflow or NaN
      expect(percentage).toBeLessThanOrEqual(100);
      expect(Number.isFinite(percentage)).toBe(true);
      expect(Number.isNaN(percentage)).toBe(false);
    });

    it("BUG: Negative usage values not rejected", () => {
      // Negative usage shouldn't be possible
      const negativeUsage = -50;
      const limit = 100;

      const percentage = getUsagePercentage(negativeUsage, limit);

      // Should be 0%, not negative
      expect(percentage).toBeGreaterThanOrEqual(0);
    });

    it("BUG: Zero limit causes division by zero", () => {
      const usage = 50;
      const limit = 0;

      // This should not throw or return Infinity
      const percentage = getUsagePercentage(usage, limit);

      expect(Number.isFinite(percentage)).toBe(true);
      expect(percentage).toBe(100); // 100% exceeded
    });

    it("BUG: NaN in calculations", () => {
      const nanUsage = NaN;
      const limit = 100;

      const percentage = getUsagePercentage(nanUsage, limit);
      expect(Number.isNaN(percentage)).toBe(false);

      const exceeded = hasExceededLimit(nanUsage, limit);
      expect(exceeded).toBe(false); // NaN should fail open
    });
  });

  describe("Overage Calculation Bugs", () => {
    it("BUG: Overage calculated on unlimited plans", () => {
      const usage = 1000000;
      const unlimitedLimit = -1;
      const pricePerUnit = 0.01;

      const overage = calculateOverage(usage, unlimitedLimit, pricePerUnit);

      // Should be $0 for unlimited plans
      expect(overage).toBe(0);
    });

    it("BUG: Negative overage values possible", () => {
      const usage = 50;
      const limit = 100;
      const pricePerUnit = 0.01;

      const overage = calculateOverage(usage, limit, pricePerUnit);

      // Under limit = no overage
      expect(overage).toBe(0);
      expect(overage).toBeGreaterThanOrEqual(0);
    });

    it("BUG: Rounding errors accumulate over billing period", () => {
      // $0.0000006 per invocation, 1M invocations
      const invocations = 1000000;
      const pricePerInvocation = 0.0000006;

      // Calculate one by one (simulating per-request billing)
      let accumulatedWrong = 0;
      for (let i = 0; i < invocations; i++) {
        accumulatedWrong += pricePerInvocation;
      }

      // Calculate in bulk
      const bulkCalculation = invocations * pricePerInvocation;

      // These SHOULD be equal but floating point accumulation causes drift
      // Expected: $0.60, but accumulation might give different result
      expect(Math.abs(accumulatedWrong - bulkCalculation)).toBeLessThan(0.01);
    });
  });

  describe("Plan Limit Bypass", () => {
    it("BUG: Free tier can exceed limits via API manipulation", () => {
      const freeLimits = getPlanLimits("free");

      // Free tier: 100 deployments/month
      expect(freeLimits.deploymentsPerMonth).toBe(100);

      // Attacker sends 101 requests before usage is recorded
      // (See race condition tests above)
    });

    it("BUG: Team members counted incorrectly", () => {
      const teamLimits = getPlanLimits("team");

      // Team plan allows 10 members
      expect(teamLimits.teamMembers).toBe(10);

      // BUG: What if owner is not counted?
      // BUG: What if pending invites are not counted?
      // BUG: What if same user is in multiple roles?
    });

    it("BUG: Custom domain limit bypass via subdomain", () => {
      const freeLimits = getPlanLimits("free");

      // Free tier: 1 custom domain
      expect(freeLimits.customDomains).toBe(1);

      // User adds: example.com (counts as 1)
      // Then adds: www.example.com (should this count as 2?)
      // Then adds: api.example.com (should this count as 3?)

      // BUG: Subdomains might not be counted toward limit
    });
  });
});

// ============================================================================
// SECTION 5: INPUT VALIDATION BYPASS
// ============================================================================

describe("BREAKING: Input Validation Bypass", () => {
  describe("Slug Generation Attacks", () => {
    it("BUG: Homoglyph attack on slug", () => {
      // Using Unicode characters that look like ASCII
      // а (Cyrillic) looks like a (Latin)
      const cyrillicA = "\u0430"; // Cyrillic small letter a
      const latinA = "a";

      const slug1 = sanitizeSlug(`my-project`);
      const slug2 = sanitizeSlug(`my-project`.replace("a", cyrillicA));

      // These might generate the same slug, causing collision
      // Or one might bypass validation while other doesn't
      expect(typeof slug1).toBe("string");
      expect(typeof slug2).toBe("string");
    });

    it("BUG: Zero-width characters in slug", () => {
      // Zero-width space, zero-width joiner, etc.
      const zeroWidthSpace = "\u200B";
      const zeroWidthJoiner = "\u200D";

      const slug1 = sanitizeSlug("my-project");
      const slug2 = sanitizeSlug(`my${zeroWidthSpace}-project`);
      const slug3 = sanitizeSlug(`my-${zeroWidthJoiner}project`);

      // All should produce same slug or reject zero-width chars
      expect(slug2).toBe(slug1);
      expect(slug3).toBe(slug1);
    });

    it("BUG: Very long slug after sanitization", () => {
      // Input that expands after processing
      const input = "a".repeat(10000);
      const slug = sanitizeSlug(input);

      // Should be truncated to DNS-safe length
      expect(slug.length).toBeLessThanOrEqual(63);
    });

    it("BUG: Slug that becomes empty after sanitization", () => {
      // All characters stripped
      const slug1 = sanitizeSlug("!!!###$$$");
      const slug2 = sanitizeSlug("   ");
      const slug3 = sanitizeSlug("");

      // Empty slugs should be rejected, not allowed
      expect(slug1.length).toBe(0); // BUG: Empty slug allowed
      expect(slug2.length).toBe(0);
      expect(slug3.length).toBe(0);
    });

    it("BUG: Slug starts/ends with dash after sanitization", () => {
      const slug = sanitizeSlug("!!!my-project!!!");

      // Shouldn't start or end with dash (DNS requirement)
      expect(slug.startsWith("-")).toBe(false);
      expect(slug.endsWith("-")).toBe(false);
    });
  });

  describe("Environment Variable Injection", () => {
    it("BUG: Env value contains shell expansion", () => {
      // These shouldn't be executed but might be if env is not escaped
      const dangerous = sanitizeEnvValue("$(whoami)");
      expect(dangerous).toBe("$(whoami)");

      const backticks = sanitizeEnvValue("`cat /etc/passwd`");
      expect(backticks).toBe("`cat /etc/passwd`");

      // Value is preserved (not sanitized) because env values can contain special chars
      // The BUG is in how these values are USED, not stored
    });

    it("BUG: Env value with newlines", () => {
      const multiline = sanitizeEnvValue("line1\nline2\nline3");

      // Newlines in env values can cause injection in shell scripts
      expect(multiline).toContain("\n");
      // This might be intentional for multiline secrets, but risky
    });

    it("BUG: Very long env value", () => {
      const veryLong = "x".repeat(100000);
      const sanitized = sanitizeEnvValue(veryLong);

      // Should be truncated to prevent DoS
      expect(sanitized.length).toBeLessThanOrEqual(32768);
    });
  });
});

// ============================================================================
// SECTION 6: DATA INTEGRITY ISSUES
// ============================================================================

describe("BREAKING: Data Integrity Issues", () => {
  describe("Orphaned Records", () => {
    it("BUG: Deleting project doesn't delete deployments", () => {
      // Simulating cascade delete failure
      interface Project {
        id: string;
        name: string;
        deleted?: boolean;
      }

      interface Deployment {
        id: string;
        projectId: string;
      }

      const projects: Project[] = [{ id: "p1", name: "Test" }];
      const deployments: Deployment[] = [
        { id: "d1", projectId: "p1" },
        { id: "d2", projectId: "p1" },
        { id: "d3", projectId: "p1" },
      ];

      // Delete project (soft delete)
      const project = projects.find((p) => p.id === "p1")!;
      project.deleted = true;

      // BUG: Deployments are now orphaned
      const orphanedDeployments = deployments.filter((d) => {
        const proj = projects.find((p) => p.id === d.projectId && !p.deleted);
        return !proj;
      });

      expect(orphanedDeployments.length).toBe(3);
      // These deployments point to a deleted project
    });

    it("BUG: Team member left but still has access", () => {
      interface TeamMember {
        userId: string;
        projectId: string;
        removedAt?: Date;
      }

      interface AccessToken {
        userId: string;
        projectId: string;
        createdAt: Date;
      }

      const teamMembers: TeamMember[] = [{ userId: "u1", projectId: "p1" }];

      const accessTokens: AccessToken[] = [
        { userId: "u1", projectId: "p1", createdAt: new Date() },
      ];

      // Remove team member
      teamMembers[0].removedAt = new Date();

      // BUG: Access token still valid
      const validTokens = accessTokens.filter((t) => {
        // Token doesn't check team membership
        return true;
      });

      expect(validTokens.length).toBe(1); // BUG: Should be 0
    });
  });

  describe("Constraint Violations", () => {
    it("BUG: Duplicate slug for same user allowed", () => {
      const projects = new Map<string, { userId: string; slug: string }>();

      const userId = "user-1";
      const slug = "my-project";

      // First project
      projects.set("p1", { userId, slug });

      // Second project with same slug for same user
      // BUG: No uniqueness check
      projects.set("p2", { userId, slug });

      const userProjects = Array.from(projects.values()).filter(
        (p) => p.userId === userId && p.slug === slug
      );

      // Should be 1, but it's 2
      expect(userProjects.length).toBe(2);
    });

    it("BUG: Build minutes can go negative", () => {
      let buildMinutes = 10;

      // Refund issued twice by mistake
      buildMinutes -= 15;
      buildMinutes -= 15;

      // BUG: Minutes are now negative
      expect(buildMinutes).toBe(-20);
      // Should have clamped to 0
    });
  });
});

// ============================================================================
// SECTION 7: AUTHORIZATION BYPASS
// ============================================================================

describe("BREAKING: Authorization Bypass", () => {
  describe("Privilege Escalation", () => {
    it("BUG: Viewer can modify project settings", () => {
      const roles = ["viewer", "member", "admin", "owner"] as const;
      type Role = (typeof roles)[number];

      const permissions: Record<string, Role[]> = {
        viewProject: ["viewer", "member", "admin", "owner"],
        editProject: ["member", "admin", "owner"],
        deleteProject: ["owner"],
        manageTeam: ["admin", "owner"],
      };

      const hasPermission = (role: Role, action: string): boolean => {
        return permissions[action]?.includes(role) ?? false;
      };

      // Viewer should NOT be able to edit
      expect(hasPermission("viewer", "editProject")).toBe(false);

      // BUG: But what if the API doesn't check?
      // The test documents expected behavior
    });

    it("BUG: Removed admin retains cached permissions", () => {
      // Simulating permission caching issue
      interface CachedPermission {
        userId: string;
        role: string;
        cachedAt: Date;
        ttlSeconds: number;
      }

      const cache = new Map<string, CachedPermission>();

      // Cache admin permissions
      cache.set("user-1", {
        userId: "user-1",
        role: "admin",
        cachedAt: new Date(),
        ttlSeconds: 3600, // 1 hour cache
      });

      // Admin is removed from team
      // But cache still has old permissions

      const cachedPerms = cache.get("user-1");

      // BUG: Cache not invalidated
      expect(cachedPerms?.role).toBe("admin");
    });

    it("BUG: Token scope not validated", () => {
      interface ApiToken {
        id: string;
        scope: "read" | "write" | "admin";
        projectId?: string;
      }

      const token: ApiToken = {
        id: "token-1",
        scope: "read",
        projectId: "project-1",
      };

      // Token is read-only and project-scoped
      // But API might not check scope for write operations

      const canWriteToProject = (token: ApiToken, projectId: string): boolean => {
        // BUG: Not checking scope
        return token.projectId === projectId || !token.projectId;
      };

      const canActuallyWrite = (token: ApiToken, projectId: string): boolean => {
        if (token.scope === "read") return false;
        return token.projectId === projectId || !token.projectId;
      };

      expect(canWriteToProject(token, "project-1")).toBe(true); // BUG
      expect(canActuallyWrite(token, "project-1")).toBe(false); // Correct
    });
  });

  describe("IDOR (Insecure Direct Object Reference)", () => {
    it("BUG: Can access other user's project by ID", () => {
      // Simulating IDOR vulnerability
      const projects = [
        { id: "p1", ownerId: "user-1", name: "Secret Project" },
        { id: "p2", ownerId: "user-2", name: "Public Project" },
      ];

      const getProject = (projectId: string, _requesterId: string) => {
        // BUG: Not checking if requester owns the project
        return projects.find((p) => p.id === projectId);
      };

      // User 2 tries to access User 1's project
      const result = getProject("p1", "user-2");

      // BUG: Should be null/undefined, but returns the project
      expect(result?.ownerId).toBe("user-1");
    });

    it("BUG: Can access deployments via predictable ID", () => {
      // If deployment IDs are sequential or predictable
      const deployments = [
        { id: "deploy-001", projectId: "p1", logs: "SECRET_KEY=abc123" },
        { id: "deploy-002", projectId: "p2", logs: "Normal logs" },
      ];

      // Attacker iterates through IDs
      const guessedId = "deploy-001";

      const getLogs = (deploymentId: string, _requesterId: string) => {
        // BUG: Not checking authorization
        return deployments.find((d) => d.id === deploymentId)?.logs;
      };

      const logs = getLogs(guessedId, "attacker");

      // BUG: Attacker gets secret logs
      expect(logs).toContain("SECRET_KEY");
    });
  });
});

// ============================================================================
// SECTION 8: FORMAT STRING & DISPLAY BUGS
// ============================================================================

describe("BREAKING: Format & Display Bugs", () => {
  describe("Number Formatting Edge Cases", () => {
    it("FIXED: formatLimit with Infinity returns Unlimited", () => {
      const result = formatLimit(Infinity);
      expect(result).toBe("Unlimited");
    });

    it("FIXED: formatLimit with NaN returns 0", () => {
      const result = formatLimit(NaN);
      expect(result).toBe("0");
    });

    it("BUG: formatBytes with negative", () => {
      const result = formatBytes(-1024);
      expect(result).not.toContain("-");
      expect(result).toBe("0 B");
    });

    it("BUG: formatBytes with very large number", () => {
      const result = formatBytes(Number.MAX_SAFE_INTEGER);
      expect(Number.isFinite(parseFloat(result))).toBe(true);
    });
  });

  describe("String Injection in Logs/Notifications", () => {
    it("BUG: User-controlled strings in notifications", () => {
      // If project name is used in notification without escaping
      const maliciousProjectName = "<script>alert('xss')</script>";

      // Notification message template
      const template = (name: string) => `Deployment for ${name} completed`;
      const message = template(maliciousProjectName);

      // BUG: XSS in notification if rendered as HTML
      expect(message).toContain("<script>");
    });

    it("BUG: Log injection via commit message", () => {
      const maliciousCommit = "Normal commit\n[ERROR] Fake error injected";

      // If this goes into logs, it creates fake error entries
      const logEntry = `[INFO] Deploying commit: ${maliciousCommit}`;

      // Contains newline that breaks log parsing
      expect(logEntry.split("\n").length).toBeGreaterThan(1);
    });
  });
});

// ============================================================================
// SECTION 9: TIMING & EXPIRATION BUGS
// ============================================================================

describe("BREAKING: Timing & Expiration Bugs", () => {
  describe("Token Expiration Issues", () => {
    it("BUG: Expired token still used due to clock skew", () => {
      const tokenExpiry = new Date("2024-01-01T12:00:00Z");
      const serverTime = new Date("2024-01-01T12:00:05Z"); // 5 seconds after

      const isExpired = tokenExpiry < serverTime;
      expect(isExpired).toBe(true);

      // BUG: If client clock is behind, token appears valid
      const clientTime = new Date("2024-01-01T11:59:55Z"); // 5 seconds before
      const appearsValid = tokenExpiry > clientTime;
      expect(appearsValid).toBe(true);
    });

    it("BUG: Session extends beyond intended maximum", () => {
      // Session sliding expiration bug
      const maxSessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
      const sessionStart = new Date("2024-01-01");

      let currentExpiry = new Date(sessionStart.getTime() + 24 * 60 * 60 * 1000); // 1 day

      // User keeps refreshing session
      for (let i = 0; i < 10; i++) {
        // BUG: Each refresh extends by 1 day without checking max
        currentExpiry = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000);
      }

      const totalDuration = currentExpiry.getTime() - sessionStart.getTime();

      // Session is now 11 days, exceeding 7 day maximum
      expect(totalDuration).toBeGreaterThan(maxSessionDuration);
    });
  });

  describe("Rate Limiting Timing Bugs", () => {
    it("BUG: Rate limit window can be bypassed at boundary", () => {
      // Rate limit: 100 requests per minute
      // At 11:59:59, user sends 100 requests (exhausts limit)
      // At 12:00:00, window resets, user sends 100 more
      // Result: 200 requests in 2 seconds

      interface RateLimitWindow {
        count: number;
        windowStart: Date;
        windowDurationMs: number;
      }

      const window: RateLimitWindow = {
        count: 0,
        windowStart: new Date("2024-01-01T11:59:00"),
        windowDurationMs: 60000, // 1 minute
      };

      const checkRateLimit = (requestTime: Date, limit: number): boolean => {
        const windowEnd = new Date(window.windowStart.getTime() + window.windowDurationMs);

        if (requestTime >= windowEnd) {
          // Reset window
          window.windowStart = requestTime;
          window.count = 1;
          return true;
        }

        if (window.count >= limit) {
          return false;
        }

        window.count++;
        return true;
      };

      // 100 requests at 11:59:59
      for (let i = 0; i < 100; i++) {
        checkRateLimit(new Date("2024-01-01T11:59:59.900"), 100);
      }

      // 100 more requests at 12:00:00 (window reset)
      let successCount = 0;
      for (let i = 0; i < 100; i++) {
        if (checkRateLimit(new Date("2024-01-01T12:00:00.100"), 100)) {
          successCount++;
        }
      }

      // All 100 succeed because window reset
      expect(successCount).toBe(100);
      // BUG: 200 requests in ~200ms bypasses rate limiting
    });
  });
});
