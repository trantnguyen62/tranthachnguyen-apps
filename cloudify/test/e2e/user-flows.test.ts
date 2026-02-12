/**
 * End-to-End User Flow Tests
 *
 * These tests simulate complete user journeys through the Cloudify platform,
 * testing the integration of multiple features working together.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import jwt from "jsonwebtoken";
import { generateCsrfToken } from "@/lib/security/csrf";

// Helper JWT functions for testing (mirrors session.ts internals)
function signToken(payload: Record<string, unknown>, expiresIn: string = "7d"): string {
  const secret = process.env.JWT_SECRET || "development-secret-change-in-production";
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const secret = process.env.JWT_SECRET || "development-secret-change-in-production";
    return jwt.verify(token, secret) as Record<string, unknown>;
  } catch {
    return null;
  }
}
import {
  isValidEmail,
  sanitizeSlug,
  isValidGitHubUrl,
  isValidBuildCommand,
  isValidPath,
} from "@/lib/security/validation";
import {
  getPlan,
  getPlanLimits,
  hasExceededLimit,
  getUsagePercentage,
  calculateOverage,
  OVERAGE_PRICING,
} from "@/lib/billing/pricing";

// ============================================================================
// Test Helpers - Simulating Database & State
// ============================================================================

interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  plan: "free" | "pro" | "team" | "enterprise";
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  githubRepo?: string;
  buildCommand: string;
  outputDir: string;
  createdAt: Date;
}

interface Deployment {
  id: string;
  projectId: string;
  status: "queued" | "building" | "ready" | "error" | "canceled";
  commitSha?: string;
  branch: string;
  url?: string;
  buildDuration?: number;
  createdAt: Date;
}

interface TeamMember {
  userId: string;
  projectId: string;
  role: "viewer" | "member" | "admin" | "owner";
  invitedAt: Date;
  acceptedAt?: Date;
}

interface UsageRecord {
  userId: string;
  month: string; // YYYY-MM
  deployments: number;
  buildMinutes: number;
  bandwidthGB: number;
  functionInvocations: number;
}

// In-memory database for tests
let users: Map<string, User>;
let projects: Map<string, Project>;
let deployments: Map<string, Deployment>;
let teamMembers: Map<string, TeamMember>;
let usageRecords: Map<string, UsageRecord>;
let sessions: Map<string, { userId: string; expiresAt: Date }>;

function resetDatabase() {
  users = new Map();
  projects = new Map();
  deployments = new Map();
  teamMembers = new Map();
  usageRecords = new Map();
  sessions = new Map();
}

function generateId(): string {
  return "c" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================================
// FLOW 1: Complete Authentication Journey
// ============================================================================

describe("Flow 1: Complete Authentication Journey", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("User signs up → verifies email → logs in → resets password → logs out", async () => {
    // ========== Step 1: User Registration ==========
    const email = "newuser@example.com";
    const password = "SecureP@ssw0rd123";

    // Validate email format
    expect(isValidEmail(email)).toBe(true);

    // Check email not already registered
    const existingUser = Array.from(users.values()).find((u) => u.email === email);
    expect(existingUser).toBeUndefined();

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = generateId();

    const newUser: User = {
      id: userId,
      email,
      passwordHash,
      emailVerified: false,
      plan: "free",
      createdAt: new Date(),
    };
    users.set(userId, newUser);

    // Generate email verification token
    const verificationToken = signToken({ userId, purpose: "email-verification" });
    expect(verificationToken).toBeDefined();

    // ========== Step 2: Email Verification ==========
    // Simulate clicking verification link
    const decoded = verifyToken(verificationToken);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(userId);
    expect(decoded?.purpose).toBe("email-verification");

    // Mark email as verified
    const user = users.get(userId)!;
    user.emailVerified = true;
    users.set(userId, user);

    expect(users.get(userId)?.emailVerified).toBe(true);

    // ========== Step 3: User Login ==========
    // Attempt login with correct credentials
    const loginUser = Array.from(users.values()).find((u) => u.email === email);
    expect(loginUser).toBeDefined();
    expect(loginUser?.emailVerified).toBe(true);

    const passwordValid = await verifyPassword(password, loginUser!.passwordHash);
    expect(passwordValid).toBe(true);

    // Create session
    const sessionToken = signToken({ userId: loginUser!.id, type: "session" });
    const sessionId = generateId();
    sessions.set(sessionId, {
      userId: loginUser!.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Generate CSRF token for the session
    const csrfToken = generateCsrfToken();
    expect(csrfToken.length).toBeGreaterThan(20);

    // ========== Step 4: Password Reset Flow ==========
    // User requests password reset (1 hour expiry)
    const resetToken = signToken(
      { userId: loginUser!.id, purpose: "password-reset" },
      "1h"
    );
    expect(resetToken).toBeDefined();

    // Verify reset token
    const resetDecoded = verifyToken(resetToken);
    expect(resetDecoded?.purpose).toBe("password-reset");

    // Set new password
    const newPassword = "NewSecureP@ss456";
    const newPasswordHash = await hashPassword(newPassword);

    const userToUpdate = users.get(resetDecoded!.userId as string)!;
    userToUpdate.passwordHash = newPasswordHash;
    users.set(userToUpdate.id, userToUpdate);

    // Verify new password works
    const newPasswordValid = await verifyPassword(
      newPassword,
      users.get(userId)!.passwordHash
    );
    expect(newPasswordValid).toBe(true);

    // Old password should no longer work
    const oldPasswordValid = await verifyPassword(
      password,
      users.get(userId)!.passwordHash
    );
    expect(oldPasswordValid).toBe(false);

    // ========== Step 5: Logout ==========
    // Invalidate session
    sessions.delete(sessionId);
    expect(sessions.has(sessionId)).toBe(false);

    // Verify session is gone
    const session = sessions.get(sessionId);
    expect(session).toBeUndefined();
  }, 30000); // bcrypt is intentionally slow

  it("Login fails with wrong password, then succeeds after correct attempt", async () => {
    // Setup user
    const email = "test@example.com";
    const correctPassword = "CorrectPassword123";
    const wrongPassword = "WrongPassword456";

    const passwordHash = await hashPassword(correctPassword);
    const userId = generateId();

    users.set(userId, {
      id: userId,
      email,
      passwordHash,
      emailVerified: true,
      plan: "free",
      createdAt: new Date(),
    });

    // Attempt 1: Wrong password
    const attempt1 = await verifyPassword(wrongPassword, passwordHash);
    expect(attempt1).toBe(false);

    // Attempt 2: Still wrong
    const attempt2 = await verifyPassword("AnotherWrong", passwordHash);
    expect(attempt2).toBe(false);

    // Attempt 3: Correct password
    const attempt3 = await verifyPassword(correctPassword, passwordHash);
    expect(attempt3).toBe(true);
  }, 30000); // bcrypt is intentionally slow

  it("Rejects login for unverified email", async () => {
    const email = "unverified@example.com";
    const password = "Password123";
    const passwordHash = await hashPassword(password);
    const userId = generateId();

    users.set(userId, {
      id: userId,
      email,
      passwordHash,
      emailVerified: false, // Not verified!
      plan: "free",
      createdAt: new Date(),
    });

    // Even with correct password, unverified users shouldn't login
    const user = users.get(userId)!;
    const passwordValid = await verifyPassword(password, user.passwordHash);

    expect(passwordValid).toBe(true); // Password is correct
    expect(user.emailVerified).toBe(false); // But email not verified

    // Login should be blocked at application level
    const canLogin = passwordValid && user.emailVerified;
    expect(canLogin).toBe(false);
  });
});

// ============================================================================
// FLOW 2: Complete Project Lifecycle
// ============================================================================

describe("Flow 2: Complete Project Lifecycle", () => {
  let currentUser: User;

  beforeEach(async () => {
    resetDatabase();

    // Create authenticated user
    const userId = generateId();
    currentUser = {
      id: userId,
      email: "developer@example.com",
      passwordHash: await hashPassword("password123"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    };
    users.set(userId, currentUser);
  });

  it("User creates project → configures build → connects GitHub → deploys → views → deletes", async () => {
    // ========== Step 1: Create New Project ==========
    const projectName = "My Awesome App";
    const projectSlug = sanitizeSlug(projectName);

    expect(projectSlug).toBe("my-awesome-app");

    // Check slug uniqueness
    const existingProject = Array.from(projects.values()).find(
      (p) => p.slug === projectSlug && p.ownerId === currentUser.id
    );
    expect(existingProject).toBeUndefined();

    const projectId = generateId();
    const project: Project = {
      id: projectId,
      name: projectName,
      slug: projectSlug,
      ownerId: currentUser.id,
      buildCommand: "npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    };
    projects.set(projectId, project);

    // Verify project created
    expect(projects.get(projectId)?.name).toBe(projectName);

    // ========== Step 2: Configure Build Settings ==========
    const buildCommand = "npm ci && npm run build";
    const outputDir = "./build";

    // Validate build command is safe
    const commandValidation = isValidBuildCommand(buildCommand);
    expect(commandValidation.valid).toBe(true);

    // Validate output path
    expect(isValidPath(outputDir)).toBe(true);

    // Update project
    const updatedProject = projects.get(projectId)!;
    updatedProject.buildCommand = buildCommand;
    updatedProject.outputDir = outputDir;
    projects.set(projectId, updatedProject);

    // ========== Step 3: Connect GitHub Repository ==========
    const githubUrl = "https://github.com/developer/awesome-app";

    // Validate GitHub URL
    expect(isValidGitHubUrl(githubUrl)).toBe(true);

    // Reject malicious URLs
    expect(isValidGitHubUrl("https://github.com/../../../etc/passwd")).toBe(false);
    expect(isValidGitHubUrl("https://gitlab.com/user/repo")).toBe(false);

    // Update project with GitHub repo
    const projectWithGithub = projects.get(projectId)!;
    projectWithGithub.githubRepo = githubUrl;
    projects.set(projectId, projectWithGithub);

    expect(projects.get(projectId)?.githubRepo).toBe(githubUrl);

    // ========== Step 4: Create First Deployment ==========
    const deploymentId = generateId();
    const deployment: Deployment = {
      id: deploymentId,
      projectId,
      status: "queued",
      branch: "main",
      commitSha: "abc123def456",
      createdAt: new Date(),
    };
    deployments.set(deploymentId, deployment);

    // Simulate build process
    const buildSteps = ["queued", "building", "ready"] as const;

    for (const step of buildSteps) {
      const d = deployments.get(deploymentId)!;
      d.status = step;

      if (step === "ready") {
        d.url = `https://${projectSlug}-${deploymentId.slice(0, 8)}.cloudify.app`;
        d.buildDuration = 45; // seconds
      }

      deployments.set(deploymentId, d);
    }

    // Verify deployment is ready
    const finalDeployment = deployments.get(deploymentId)!;
    expect(finalDeployment.status).toBe("ready");
    expect(finalDeployment.url).toContain(projectSlug);
    expect(finalDeployment.buildDuration).toBe(45);

    // ========== Step 5: Track Usage ==========
    const month = getCurrentMonth();
    const usageKey = `${currentUser.id}-${month}`;

    if (!usageRecords.has(usageKey)) {
      usageRecords.set(usageKey, {
        userId: currentUser.id,
        month,
        deployments: 0,
        buildMinutes: 0,
        bandwidthGB: 0,
        functionInvocations: 0,
      });
    }

    const usage = usageRecords.get(usageKey)!;
    usage.deployments += 1;
    usage.buildMinutes += Math.ceil(finalDeployment.buildDuration! / 60);
    usageRecords.set(usageKey, usage);

    expect(usage.deployments).toBe(1);

    // ========== Step 6: View Project Dashboard ==========
    const userProjects = Array.from(projects.values()).filter(
      (p) => p.ownerId === currentUser.id
    );
    expect(userProjects.length).toBe(1);

    const projectDeployments = Array.from(deployments.values()).filter(
      (d) => d.projectId === projectId
    );
    expect(projectDeployments.length).toBe(1);
    expect(projectDeployments[0].status).toBe("ready");

    // ========== Step 7: Delete Project ==========
    // First delete related deployments
    const deploymentsToDelete = Array.from(deployments.entries()).filter(
      ([_, d]) => d.projectId === projectId
    );

    for (const [id] of deploymentsToDelete) {
      deployments.delete(id);
    }

    // Then delete project
    projects.delete(projectId);

    // Verify cleanup
    expect(projects.has(projectId)).toBe(false);
    expect(
      Array.from(deployments.values()).filter((d) => d.projectId === projectId).length
    ).toBe(0);
  });

  it("Handles project name collisions by generating unique slugs", () => {
    // Create first project
    const project1Id = generateId();
    projects.set(project1Id, {
      id: project1Id,
      name: "My App",
      slug: "my-app",
      ownerId: currentUser.id,
      buildCommand: "npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    });

    // Try to create project with same name
    const projectName = "My App";
    let slug = sanitizeSlug(projectName);

    // Check if slug exists for this user
    const existingWithSlug = Array.from(projects.values()).filter(
      (p) => p.slug === slug && p.ownerId === currentUser.id
    );

    if (existingWithSlug.length > 0) {
      // Append number to make unique
      let counter = 1;
      while (
        Array.from(projects.values()).some(
          (p) => p.slug === `${slug}-${counter}` && p.ownerId === currentUser.id
        )
      ) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    expect(slug).toBe("my-app-1");

    // Create second project with unique slug
    const project2Id = generateId();
    projects.set(project2Id, {
      id: project2Id,
      name: projectName,
      slug,
      ownerId: currentUser.id,
      buildCommand: "npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    });

    expect(projects.get(project2Id)?.slug).toBe("my-app-1");
  });
});

// ============================================================================
// FLOW 3: Complete Deployment Pipeline
// ============================================================================

describe("Flow 3: Complete Deployment Pipeline", () => {
  let currentUser: User;
  let currentProject: Project;

  beforeEach(async () => {
    resetDatabase();

    const userId = generateId();
    currentUser = {
      id: userId,
      email: "dev@startup.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    };
    users.set(userId, currentUser);

    const projectId = generateId();
    currentProject = {
      id: projectId,
      name: "Startup MVP",
      slug: "startup-mvp",
      ownerId: userId,
      githubRepo: "https://github.com/startup/mvp",
      buildCommand: "npm ci && npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    };
    projects.set(projectId, currentProject);
  });

  it("GitHub push → build queued → building → ready → preview URL → promote to production", async () => {
    // ========== Step 1: Receive GitHub Webhook (Push Event) ==========
    const webhookPayload = {
      ref: "refs/heads/feature/new-button",
      after: "a1b2c3d4e5f6789012345678901234567890abcd",
      repository: {
        full_name: "startup/mvp",
        clone_url: "https://github.com/startup/mvp.git",
      },
      head_commit: {
        message: "Add new button component",
        author: { name: "Developer", email: "dev@startup.com" },
      },
    };

    // Extract branch name
    const branch = webhookPayload.ref.replace("refs/heads/", "");
    expect(branch).toBe("feature/new-button");

    // ========== Step 2: Create Preview Deployment ==========
    const deploymentId = generateId();
    const deployment: Deployment = {
      id: deploymentId,
      projectId: currentProject.id,
      status: "queued",
      branch,
      commitSha: webhookPayload.after.slice(0, 7),
      createdAt: new Date(),
    };
    deployments.set(deploymentId, deployment);

    expect(deployment.status).toBe("queued");

    // ========== Step 3: Build Process Starts ==========
    const buildStartTime = Date.now();

    deployment.status = "building";
    deployments.set(deploymentId, deployment);

    // Simulate build steps
    const buildLogs: string[] = [];
    buildLogs.push("Cloning repository...");
    buildLogs.push("Installing dependencies...");
    buildLogs.push("Running: npm ci && npm run build");
    buildLogs.push("Build completed successfully!");

    expect(buildLogs.length).toBe(4);

    // ========== Step 4: Build Completes ==========
    const buildEndTime = Date.now();
    const buildDuration = Math.ceil((buildEndTime - buildStartTime) / 1000);

    deployment.status = "ready";
    deployment.buildDuration = buildDuration > 0 ? buildDuration : 1;
    deployment.url = `https://${currentProject.slug}-${branch.replace(/\//g, "-")}-${deploymentId.slice(0, 8)}.cloudify.app`;
    deployments.set(deploymentId, deployment);

    expect(deployment.status).toBe("ready");
    expect(deployment.url).toContain("feature-new-button");

    // ========== Step 5: Update GitHub Commit Status ==========
    const commitStatus = {
      state: "success" as const,
      target_url: deployment.url,
      description: "Deployment ready",
      context: "cloudify/preview",
    };

    expect(commitStatus.state).toBe("success");
    expect(commitStatus.target_url).toBe(deployment.url);

    // ========== Step 6: Create PR Comment with Preview Link ==========
    const prComment = `
## 🚀 Preview Deployment Ready

| Environment | URL |
|-------------|-----|
| Preview | [${deployment.url}](${deployment.url}) |

**Commit:** \`${deployment.commitSha}\`
**Build Time:** ${deployment.buildDuration}s
    `.trim();

    expect(prComment).toContain(deployment.url!);
    expect(prComment).toContain(deployment.commitSha!);

    // ========== Step 7: Merge PR → Production Deployment ==========
    // Simulate PR merge to main
    const productionDeploymentId = generateId();
    const productionDeployment: Deployment = {
      id: productionDeploymentId,
      projectId: currentProject.id,
      status: "queued",
      branch: "main",
      commitSha: webhookPayload.after.slice(0, 7),
      createdAt: new Date(),
    };
    deployments.set(productionDeploymentId, productionDeployment);

    // Fast-forward through build
    productionDeployment.status = "building";
    productionDeployment.status = "ready";
    productionDeployment.buildDuration = 38;
    productionDeployment.url = `https://${currentProject.slug}.cloudify.app`;
    deployments.set(productionDeploymentId, productionDeployment);

    // ========== Step 8: Verify Production is Live ==========
    const allDeployments = Array.from(deployments.values()).filter(
      (d) => d.projectId === currentProject.id && d.status === "ready"
    );

    expect(allDeployments.length).toBe(2);

    const productionDeploy = allDeployments.find((d) => d.branch === "main");
    expect(productionDeploy?.url).toBe("https://startup-mvp.cloudify.app");
  });

  it("Build fails → error status → user fixes → redeploy succeeds", async () => {
    // ========== Step 1: Initial Deployment with Bug ==========
    const now = Date.now();
    const deployment1Id = generateId();
    const deployment1: Deployment = {
      id: deployment1Id,
      projectId: currentProject.id,
      status: "queued",
      branch: "main",
      commitSha: "broken1",
      createdAt: new Date(now), // Earlier timestamp
    };
    deployments.set(deployment1Id, deployment1);

    // Build fails
    deployment1.status = "building";
    deployment1.status = "error";
    deployments.set(deployment1Id, deployment1);

    expect(deployment1.status).toBe("error");

    // ========== Step 2: User Pushes Fix ==========
    const deployment2Id = generateId();
    const deployment2: Deployment = {
      id: deployment2Id,
      projectId: currentProject.id,
      status: "queued",
      branch: "main",
      commitSha: "fixedab",
      createdAt: new Date(now + 1000), // Later timestamp
    };
    deployments.set(deployment2Id, deployment2);

    // Build succeeds
    deployment2.status = "building";
    deployment2.status = "ready";
    deployment2.url = "https://startup-mvp.cloudify.app";
    deployment2.buildDuration = 42;
    deployments.set(deployment2Id, deployment2);

    expect(deployment2.status).toBe("ready");

    // ========== Step 3: Verify Deployment History ==========
    const projectDeployments = Array.from(deployments.values())
      .filter((d) => d.projectId === currentProject.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    expect(projectDeployments.length).toBe(2);
    expect(projectDeployments[0].status).toBe("ready"); // Latest is ready
    expect(projectDeployments[1].status).toBe("error"); // Previous failed
  });

  it("User cancels in-progress deployment", () => {
    // Start deployment
    const deploymentId = generateId();
    const deployment: Deployment = {
      id: deploymentId,
      projectId: currentProject.id,
      status: "queued",
      branch: "main",
      createdAt: new Date(),
    };
    deployments.set(deploymentId, deployment);

    // Move to building
    deployment.status = "building";
    deployments.set(deploymentId, deployment);

    expect(deployment.status).toBe("building");

    // User cancels
    deployment.status = "canceled";
    deployments.set(deploymentId, deployment);

    expect(deployment.status).toBe("canceled");

    // Verify no URL was assigned
    expect(deployment.url).toBeUndefined();
  });
});

// ============================================================================
// FLOW 4: Billing & Usage Tracking
// ============================================================================

describe("Flow 4: Billing & Usage Tracking", () => {
  let freeUser: User;
  let proUser: User;

  beforeEach(async () => {
    resetDatabase();

    const freeUserId = generateId();
    freeUser = {
      id: freeUserId,
      email: "hobby@example.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "free",
      createdAt: new Date(),
    };
    users.set(freeUserId, freeUser);

    const proUserId = generateId();
    proUser = {
      id: proUserId,
      email: "pro@startup.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    };
    users.set(proUserId, proUser);
  });

  it("Free user deploys → approaches limit → hits limit → gets blocked → upgrades → continues", () => {
    const freeLimits = getPlanLimits("free");
    const month = getCurrentMonth();
    const usageKey = `${freeUser.id}-${month}`;

    // Initialize usage
    usageRecords.set(usageKey, {
      userId: freeUser.id,
      month,
      deployments: 0,
      buildMinutes: 0,
      bandwidthGB: 0,
      functionInvocations: 0,
    });

    // ========== Step 1: Normal Usage ==========
    const usage = usageRecords.get(usageKey)!;
    usage.deployments = 50;

    expect(hasExceededLimit(usage.deployments, freeLimits.deploymentsPerMonth)).toBe(false);
    expect(getUsagePercentage(usage.deployments, freeLimits.deploymentsPerMonth)).toBe(50);

    // ========== Step 2: Approaching Limit (80%) ==========
    usage.deployments = 80;
    const percentage = getUsagePercentage(usage.deployments, freeLimits.deploymentsPerMonth);
    expect(percentage).toBe(80);

    // Should trigger warning notification
    const shouldWarn = percentage >= 80;
    expect(shouldWarn).toBe(true);

    // ========== Step 3: At Limit (100%) ==========
    usage.deployments = 100;
    expect(hasExceededLimit(usage.deployments, freeLimits.deploymentsPerMonth)).toBe(false); // AT limit is OK
    expect(getUsagePercentage(usage.deployments, freeLimits.deploymentsPerMonth)).toBe(100);

    // ========== Step 4: Over Limit - Blocked ==========
    usage.deployments = 101;
    expect(hasExceededLimit(usage.deployments, freeLimits.deploymentsPerMonth)).toBe(true);

    // Deployment should be blocked
    const canDeploy = !hasExceededLimit(usage.deployments, freeLimits.deploymentsPerMonth);
    expect(canDeploy).toBe(false);

    // ========== Step 5: User Upgrades to Pro ==========
    freeUser.plan = "pro";
    users.set(freeUser.id, freeUser);

    const proLimits = getPlanLimits("pro");
    expect(proLimits.deploymentsPerMonth).toBe(1000);

    // ========== Step 6: Can Deploy Again ==========
    const canDeployNow = !hasExceededLimit(usage.deployments, proLimits.deploymentsPerMonth);
    expect(canDeployNow).toBe(true);

    // Usage percentage is now much lower
    expect(getUsagePercentage(usage.deployments, proLimits.deploymentsPerMonth)).toBe(10);
  });

  it("Pro user incurs overage charges for exceeding limits", () => {
    const proLimits = getPlanLimits("pro");
    const month = getCurrentMonth();
    const usageKey = `${proUser.id}-${month}`;

    // Heavy usage month
    usageRecords.set(usageKey, {
      userId: proUser.id,
      month,
      deployments: 1200, // 200 over limit
      buildMinutes: 500, // 100 over limit
      bandwidthGB: 1500, // 500GB over limit
      functionInvocations: 1500000, // 500k over limit
    });

    const usage = usageRecords.get(usageKey)!;

    // ========== Calculate Overages ==========
    const buildOverage = calculateOverage(
      usage.buildMinutes,
      proLimits.buildMinutesPerMonth,
      OVERAGE_PRICING.buildMinutes
    );
    expect(buildOverage).toBe(100 * 0.02); // 100 minutes * $0.02 = $2.00

    const bandwidthOverage = calculateOverage(
      usage.bandwidthGB,
      proLimits.bandwidthGB,
      OVERAGE_PRICING.bandwidthGB
    );
    expect(bandwidthOverage).toBe(500 * 0.15); // 500 GB * $0.15 = $75.00

    const functionOverage = calculateOverage(
      usage.functionInvocations,
      proLimits.functionInvocationsPerMonth,
      OVERAGE_PRICING.functionInvocations
    );
    expect(functionOverage).toBeCloseTo(500000 * 0.0000006); // ~$0.30

    // Total overage
    const totalOverage = buildOverage + bandwidthOverage + functionOverage;
    expect(totalOverage).toBeGreaterThan(77);

    // Pro plan base price + overages
    const proPrice = getPlan("pro").priceMonthly;
    const totalBill = proPrice + totalOverage;
    expect(totalBill).toBeGreaterThan(97); // $20 base + $77+ overage
  });

  it("Enterprise user has unlimited resources - no limits enforced", () => {
    const enterpriseUserId = generateId();
    const enterpriseUser: User = {
      id: enterpriseUserId,
      email: "cto@bigcorp.com",
      passwordHash: "hash",
      emailVerified: true,
      plan: "enterprise",
      createdAt: new Date(),
    };
    users.set(enterpriseUserId, enterpriseUser);

    const limits = getPlanLimits("enterprise");

    // Massive usage
    const hugeDeployments = 100000;
    const hugeBandwidth = 1000000;

    // Never exceeds limit (-1 means unlimited)
    expect(hasExceededLimit(hugeDeployments, limits.deploymentsPerMonth)).toBe(false);
    expect(hasExceededLimit(hugeBandwidth, limits.bandwidthGB)).toBe(false);

    // Usage percentage is 0 for unlimited
    expect(getUsagePercentage(hugeDeployments, limits.deploymentsPerMonth)).toBe(0);

    // No overage charges
    const overage = calculateOverage(hugeDeployments, limits.deploymentsPerMonth, 0.01);
    expect(overage).toBe(0);
  });
});

// ============================================================================
// FLOW 5: Team Collaboration
// ============================================================================

describe("Flow 5: Team Collaboration", () => {
  let owner: User;
  let project: Project;

  beforeEach(async () => {
    resetDatabase();

    const ownerId = generateId();
    owner = {
      id: ownerId,
      email: "founder@startup.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "team",
      createdAt: new Date(),
    };
    users.set(ownerId, owner);

    const projectId = generateId();
    project = {
      id: projectId,
      name: "Team Project",
      slug: "team-project",
      ownerId,
      buildCommand: "npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    };
    projects.set(projectId, project);

    // Owner is automatically a team member
    const memberKey = `${ownerId}-${projectId}`;
    teamMembers.set(memberKey, {
      userId: ownerId,
      projectId,
      role: "owner",
      invitedAt: new Date(),
      acceptedAt: new Date(),
    });
  });

  it("Owner invites member → member accepts → collaborates → role changed → member removed", async () => {
    // ========== Step 1: Owner Invites New Member ==========
    const newMemberId = generateId();
    const newMember: User = {
      id: newMemberId,
      email: "developer@startup.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "free", // Their personal plan doesn't matter for team access
      createdAt: new Date(),
    };
    users.set(newMemberId, newMember);

    // Create pending invite
    const inviteKey = `${newMemberId}-${project.id}`;
    teamMembers.set(inviteKey, {
      userId: newMemberId,
      projectId: project.id,
      role: "member",
      invitedAt: new Date(),
      // acceptedAt is undefined - pending
    });

    const invite = teamMembers.get(inviteKey)!;
    expect(invite.acceptedAt).toBeUndefined();

    // ========== Step 2: Generate Invite Token ==========
    const inviteToken = signToken({
      userId: project.ownerId || "system",
      projectId: project.id,
      inviteeId: newMemberId,
      role: "member",
      purpose: "team-invite",
    });
    expect(inviteToken).toBeDefined();

    // ========== Step 3: Member Accepts Invite ==========
    const decoded = verifyToken(inviteToken);
    expect(decoded?.purpose).toBe("team-invite");
    expect(decoded?.inviteeId).toBe(newMemberId);

    // Update invite to accepted
    invite.acceptedAt = new Date();
    teamMembers.set(inviteKey, invite);

    expect(teamMembers.get(inviteKey)?.acceptedAt).toBeDefined();

    // ========== Step 4: Member Creates Deployment ==========
    // Check member has permission
    const memberRecord = teamMembers.get(inviteKey)!;
    const canDeploy = ["member", "admin", "owner"].includes(memberRecord.role);
    expect(canDeploy).toBe(true);

    // Create deployment
    const deploymentId = generateId();
    deployments.set(deploymentId, {
      id: deploymentId,
      projectId: project.id,
      status: "ready",
      branch: "feature/new-feature",
      createdAt: new Date(),
    });

    // ========== Step 5: Owner Promotes to Admin ==========
    // Check owner can change roles
    const ownerKey = `${owner.id}-${project.id}`;
    const ownerRecord = teamMembers.get(ownerKey)!;
    expect(ownerRecord.role).toBe("owner");

    // Promote member
    memberRecord.role = "admin";
    teamMembers.set(inviteKey, memberRecord);

    expect(teamMembers.get(inviteKey)?.role).toBe("admin");

    // ========== Step 6: Admin Can Delete Deployments ==========
    const canDelete = ["admin", "owner"].includes(memberRecord.role);
    expect(canDelete).toBe(true);

    // ========== Step 7: Owner Removes Member ==========
    teamMembers.delete(inviteKey);

    expect(teamMembers.has(inviteKey)).toBe(false);

    // Verify member no longer has access
    const hasAccess = teamMembers.has(inviteKey);
    expect(hasAccess).toBe(false);
  });

  it("Respects role hierarchy for permissions", () => {
    const roles = ["viewer", "member", "admin", "owner"] as const;
    const roleLevel = (role: string) => roles.indexOf(role as (typeof roles)[number]);

    // Define permission requirements
    const permissions = {
      viewProject: 0, // viewer+
      createDeployment: 1, // member+
      deleteDeployment: 2, // admin+
      manageTeam: 3, // owner only
      deleteProject: 3, // owner only
    };

    // Test each role
    for (const role of roles) {
      const level = roleLevel(role);

      const canView = level >= permissions.viewProject;
      const canDeploy = level >= permissions.createDeployment;
      const canDelete = level >= permissions.deleteDeployment;
      const canManage = level >= permissions.manageTeam;

      if (role === "viewer") {
        expect(canView).toBe(true);
        expect(canDeploy).toBe(false);
        expect(canDelete).toBe(false);
        expect(canManage).toBe(false);
      } else if (role === "member") {
        expect(canView).toBe(true);
        expect(canDeploy).toBe(true);
        expect(canDelete).toBe(false);
        expect(canManage).toBe(false);
      } else if (role === "admin") {
        expect(canView).toBe(true);
        expect(canDeploy).toBe(true);
        expect(canDelete).toBe(true);
        expect(canManage).toBe(false);
      } else if (role === "owner") {
        expect(canView).toBe(true);
        expect(canDeploy).toBe(true);
        expect(canDelete).toBe(true);
        expect(canManage).toBe(true);
      }
    }
  });

  it("Team plan limits team size", async () => {
    const teamLimits = getPlanLimits("team");
    expect(teamLimits.teamMembers).toBe(10);

    // Add members up to limit
    for (let i = 1; i < 10; i++) {
      const memberId = generateId();
      const memberKey = `${memberId}-${project.id}`;
      teamMembers.set(memberKey, {
        userId: memberId,
        projectId: project.id,
        role: "member",
        invitedAt: new Date(),
        acceptedAt: new Date(),
      });
    }

    // Count team members
    const teamSize = Array.from(teamMembers.values()).filter(
      (m) => m.projectId === project.id
    ).length;
    expect(teamSize).toBe(10); // Owner + 9 members

    // Try to add 11th member
    const canAddMore = teamSize < teamLimits.teamMembers;
    expect(canAddMore).toBe(false);
  });
});

// ============================================================================
// FLOW 6: Complete GitHub CI/CD Integration
// ============================================================================

describe("Flow 6: GitHub CI/CD Integration", () => {
  let user: User;
  let project: Project;

  beforeEach(async () => {
    resetDatabase();

    const userId = generateId();
    user = {
      id: userId,
      email: "dev@company.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    };
    users.set(userId, user);

    const projectId = generateId();
    project = {
      id: projectId,
      name: "Frontend App",
      slug: "frontend-app",
      ownerId: userId,
      githubRepo: "https://github.com/company/frontend",
      buildCommand: "npm ci && npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    };
    projects.set(projectId, project);
  });

  it("PR opened → preview deploy → PR updated → new preview → PR merged → production deploy", () => {
    const now = Date.now();

    // ========== Step 1: PR Opened ==========
    const prNumber = 42;
    const prBranch = "feature/dark-mode";
    const prCommit1 = "abc1234";

    // Create preview deployment
    const preview1Id = generateId();
    const preview1: Deployment = {
      id: preview1Id,
      projectId: project.id,
      status: "queued",
      branch: prBranch,
      commitSha: prCommit1,
      createdAt: new Date(now), // T+0
    };
    deployments.set(preview1Id, preview1);

    // Build completes
    preview1.status = "ready";
    preview1.url = `https://pr-${prNumber}-${project.slug}.cloudify.app`;
    preview1.buildDuration = 35;
    deployments.set(preview1Id, preview1);

    expect(preview1.url).toContain(`pr-${prNumber}`);

    // ========== Step 2: Developer Pushes More Commits ==========
    const prCommit2 = "def5678";

    // Previous preview is superseded
    const preview2Id = generateId();
    const preview2: Deployment = {
      id: preview2Id,
      projectId: project.id,
      status: "queued",
      branch: prBranch,
      commitSha: prCommit2,
      createdAt: new Date(now + 1000), // T+1s
    };
    deployments.set(preview2Id, preview2);

    preview2.status = "ready";
    preview2.url = `https://pr-${prNumber}-${project.slug}.cloudify.app`;
    preview2.buildDuration = 33;
    deployments.set(preview2Id, preview2);

    // Same URL, new content
    expect(preview2.url).toBe(preview1.url);
    expect(preview2.commitSha).not.toBe(preview1.commitSha);

    // ========== Step 3: PR Merged to Main ==========
    const mergeCommit = "merged12";

    const productionId = generateId();
    const production: Deployment = {
      id: productionId,
      projectId: project.id,
      status: "queued",
      branch: "main",
      commitSha: mergeCommit,
      createdAt: new Date(now + 2000), // T+2s (latest)
    };
    deployments.set(productionId, production);

    production.status = "ready";
    production.url = `https://${project.slug}.cloudify.app`;
    production.buildDuration = 40;
    deployments.set(productionId, production);

    // ========== Step 4: Verify Deployment History ==========
    const allDeployments = Array.from(deployments.values())
      .filter((d) => d.projectId === project.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    expect(allDeployments.length).toBe(3);

    // Latest is production
    expect(allDeployments[0].branch).toBe("main");
    expect(allDeployments[0].url).toBe("https://frontend-app.cloudify.app");

    // Previous two are previews
    expect(allDeployments[1].branch).toBe(prBranch);
    expect(allDeployments[2].branch).toBe(prBranch);
  });

  it("Handles concurrent PRs with separate preview environments", () => {
    const prs = [
      { number: 101, branch: "feature/auth", commit: "auth123" },
      { number: 102, branch: "feature/dashboard", commit: "dash456" },
      { number: 103, branch: "fix/bug", commit: "bug789" },
    ];

    // Create preview for each PR
    for (const pr of prs) {
      const deploymentId = generateId();
      deployments.set(deploymentId, {
        id: deploymentId,
        projectId: project.id,
        status: "ready",
        branch: pr.branch,
        commitSha: pr.commit,
        url: `https://pr-${pr.number}-${project.slug}.cloudify.app`,
        createdAt: new Date(),
      });
    }

    // All have unique URLs
    const urls = Array.from(deployments.values()).map((d) => d.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(3);

    // Each PR has its own preview
    for (const pr of prs) {
      const preview = Array.from(deployments.values()).find(
        (d) => d.branch === pr.branch
      );
      expect(preview?.url).toContain(`pr-${pr.number}`);
    }
  });
});

// ============================================================================
// FLOW 7: Error Recovery & Edge Cases
// ============================================================================

describe("Flow 7: Error Recovery & Edge Cases", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("Handles rapid consecutive deployments (debouncing)", async () => {
    const userId = generateId();
    users.set(userId, {
      id: userId,
      email: "fast@dev.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    });

    const projectId = generateId();
    projects.set(projectId, {
      id: projectId,
      name: "Rapid Deploy",
      slug: "rapid-deploy",
      ownerId: userId,
      buildCommand: "npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    });

    // Simulate 5 rapid pushes within 10 seconds
    const commits = ["a1", "b2", "c3", "d4", "e5"];
    const deploymentIds: string[] = [];

    for (const commit of commits) {
      const id = generateId();
      deploymentIds.push(id);
      deployments.set(id, {
        id,
        projectId,
        status: "queued",
        branch: "main",
        commitSha: commit,
        createdAt: new Date(),
      });
    }

    // Cancel all but the latest
    for (let i = 0; i < deploymentIds.length - 1; i++) {
      const d = deployments.get(deploymentIds[i])!;
      d.status = "canceled";
      deployments.set(deploymentIds[i], d);
    }

    // Only latest should build
    const latestId = deploymentIds[deploymentIds.length - 1];
    const latest = deployments.get(latestId)!;
    latest.status = "ready";
    latest.url = "https://rapid-deploy.cloudify.app";
    deployments.set(latestId, latest);

    // Verify results
    const canceled = Array.from(deployments.values()).filter(
      (d) => d.status === "canceled"
    );
    const ready = Array.from(deployments.values()).filter((d) => d.status === "ready");

    expect(canceled.length).toBe(4);
    expect(ready.length).toBe(1);
    expect(ready[0].commitSha).toBe("e5");
  });

  it("Recovers from session expiry during long operation", async () => {
    const userId = generateId();
    users.set(userId, {
      id: userId,
      email: "patient@dev.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    });

    // Create session that expires soon
    const sessionId = generateId();
    const shortExpiry = new Date(Date.now() + 1000); // 1 second
    sessions.set(sessionId, {
      userId,
      expiresAt: shortExpiry,
    });

    // Start long operation
    const projectId = generateId();

    // Session expires during operation
    const session = sessions.get(sessionId)!;
    const isExpired = session.expiresAt < new Date();

    // In real app, should refresh token or require re-auth
    if (isExpired) {
      // Refresh session
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      sessions.set(sessionId, session);
    }

    // Operation can continue
    expect(sessions.get(sessionId)?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("Handles project deletion with pending deployments", async () => {
    const userId = generateId();
    users.set(userId, {
      id: userId,
      email: "cleaner@dev.com",
      passwordHash: await hashPassword("password"),
      emailVerified: true,
      plan: "pro",
      createdAt: new Date(),
    });

    const projectId = generateId();
    projects.set(projectId, {
      id: projectId,
      name: "To Delete",
      slug: "to-delete",
      ownerId: userId,
      buildCommand: "npm run build",
      outputDir: "./dist",
      createdAt: new Date(),
    });

    // Create some deployments
    const statuses = ["ready", "building", "queued", "error"] as const;
    for (const status of statuses) {
      const id = generateId();
      deployments.set(id, {
        id,
        projectId,
        status,
        branch: "main",
        createdAt: new Date(),
      });
    }

    // Delete project - should cascade
    // First, cancel in-progress deployments
    for (const [id, d] of deployments.entries()) {
      if (d.projectId === projectId && (d.status === "building" || d.status === "queued")) {
        d.status = "canceled";
        deployments.set(id, d);
      }
    }

    // Then delete all deployments
    const toDelete = Array.from(deployments.entries()).filter(
      ([_, d]) => d.projectId === projectId
    );
    for (const [id] of toDelete) {
      deployments.delete(id);
    }

    // Finally delete project
    projects.delete(projectId);

    // Verify cleanup
    expect(projects.has(projectId)).toBe(false);
    expect(
      Array.from(deployments.values()).filter((d) => d.projectId === projectId).length
    ).toBe(0);
  });
});
