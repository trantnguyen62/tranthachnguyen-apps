import { PrismaClient, DeploymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // ============ CLEANUP EXISTING DATA ============
  console.log("🧹 Cleaning up existing test data...");

  // Delete in reverse order of dependencies
  await prisma.webVital.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.edgeConfigItem.deleteMany({});
  await prisma.edgeConfig.deleteMany({});
  await prisma.kVEntry.deleteMany({});
  await prisma.kVStore.deleteMany({});
  await prisma.blob.deleteMany({});
  await prisma.blobStore.deleteMany({});
  await prisma.functionInvocation.deleteMany({});
  await prisma.serverlessFunction.deleteMany({});
  await prisma.analyticsEvent.deleteMany({});
  await prisma.featureFlag.deleteMany({});
  await prisma.usageRecord.deleteMany({});
  await prisma.teamProject.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.envVariable.deleteMany({});
  await prisma.deploymentLog.deleteMany({});
  await prisma.deployment.deleteMany({});
  await prisma.integration.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // ============ CREATE USERS ============
  console.log("👤 Creating test users...");

  const users = await Promise.all([
    // Admin/Pro user
    prisma.user.create({
      data: {
        email: "demo@cloudify.app",
        name: "Demo User",
        passwordHash: await hashPassword("demo123"),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
        plan: "PRO",
      },
    }),
    // Free tier user
    prisma.user.create({
      data: {
        email: "free@cloudify.app",
        name: "Free User",
        passwordHash: await hashPassword("free123"),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=free",
        plan: "FREE",
      },
    }),
    // Team admin
    prisma.user.create({
      data: {
        email: "team@cloudify.app",
        name: "Team Admin",
        passwordHash: await hashPassword("team123"),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=team",
        plan: "TEAM",
      },
    }),
    // Enterprise user
    prisma.user.create({
      data: {
        email: "enterprise@cloudify.app",
        name: "Enterprise User",
        passwordHash: await hashPassword("enterprise123"),
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=enterprise",
        plan: "ENTERPRISE",
      },
    }),
  ]);

  const [demoUser, freeUser, teamUser, enterpriseUser] = users;
  console.log(`   ✓ Created ${users.length} users`);

  // ============ CREATE PROJECTS ============
  console.log("📁 Creating test projects...");

  const projects = await Promise.all([
    // Demo user's projects
    prisma.project.create({
      data: {
        name: "Next.js Blog",
        slug: "nextjs-blog",
        userId: demoUser.id,
        repositoryUrl: "https://github.com/vercel/next.js",
        repositoryBranch: "main",
        framework: "nextjs",
        buildCommand: "npm run build",
        outputDirectory: ".next",
        nodeVersion: "20",
      },
    }),
    prisma.project.create({
      data: {
        name: "React Dashboard",
        slug: "react-dashboard",
        userId: demoUser.id,
        repositoryUrl: "https://github.com/facebook/react",
        repositoryBranch: "main",
        framework: "vite",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        nodeVersion: "20",
      },
    }),
    prisma.project.create({
      data: {
        name: "API Service",
        slug: "api-service",
        userId: demoUser.id,
        repositoryUrl: "https://github.com/expressjs/express",
        repositoryBranch: "master",
        framework: "other",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        nodeVersion: "18",
      },
    }),
    // Free user's project
    prisma.project.create({
      data: {
        name: "Personal Portfolio",
        slug: "personal-portfolio",
        userId: freeUser.id,
        repositoryUrl: "https://github.com/vercel/next.js",
        repositoryBranch: "main",
        framework: "nextjs",
        buildCommand: "npm run build",
        outputDirectory: ".next",
        nodeVersion: "20",
      },
    }),
    // Team user's projects
    prisma.project.create({
      data: {
        name: "E-commerce Store",
        slug: "ecommerce-store",
        userId: teamUser.id,
        repositoryUrl: "https://github.com/vercel/commerce",
        repositoryBranch: "main",
        framework: "nextjs",
        buildCommand: "pnpm build",
        outputDirectory: ".next",
        nodeVersion: "20",
      },
    }),
    prisma.project.create({
      data: {
        name: "Documentation Site",
        slug: "docs-site",
        userId: teamUser.id,
        repositoryUrl: "https://github.com/facebook/docusaurus",
        repositoryBranch: "main",
        framework: "other",
        buildCommand: "npm run build",
        outputDirectory: "build",
        nodeVersion: "18",
      },
    }),
  ]);

  console.log(`   ✓ Created ${projects.length} projects`);

  // ============ CREATE DEPLOYMENTS ============
  console.log("🚀 Creating test deployments...");

  const deploymentData = [];
  const statuses: DeploymentStatus[] = ["READY", "BUILDING", "QUEUED", "ERROR"];

  for (const project of projects) {
    // Create 5 deployments per project
    for (let i = 0; i < 5; i++) {
      const status = i === 0 ? "READY" : statuses[i % statuses.length];
      const createdAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000); // Each deployment 1 day apart

      deploymentData.push({
        projectId: project.id,
        status,
        commitSha: `abc${Math.random().toString(36).substring(7)}`,
        commitMessage: `Deployment ${i + 1}: ${["Fix bug", "Add feature", "Update deps", "Refactor code", "Initial commit"][i % 5]}`,
        branch: "main",
        url: status === "READY" ? `https://${project.slug}-${Math.random().toString(36).substring(7)}.cloudify.app` : null,
        buildTime: status === "READY" ? Math.floor(Math.random() * 120 + 30) : null,
        siteSlug: status === "READY" ? `${project.slug}-${Math.random().toString(36).substring(2, 8)}` : null,
        createdAt,
        finishedAt: status === "READY" || status === "ERROR" ? new Date(createdAt.getTime() + 60000) : null,
      });
    }
  }

  const deployments = await prisma.deployment.createMany({ data: deploymentData });
  console.log(`   ✓ Created ${deployments.count} deployments`);

  // ============ CREATE DEPLOYMENT LOGS ============
  console.log("📝 Creating deployment logs...");

  const allDeployments = await prisma.deployment.findMany({ take: 10 });
  const logMessages = [
    { level: "info", message: "Cloning repository..." },
    { level: "info", message: "Installing dependencies..." },
    { level: "info", message: "Running build command: npm run build" },
    { level: "info", message: "Build completed successfully" },
    { level: "info", message: "Deploying to production..." },
    { level: "success", message: "Deployment complete!" },
  ];

  for (const deployment of allDeployments) {
    for (const log of logMessages) {
      await prisma.deploymentLog.create({
        data: {
          deploymentId: deployment.id,
          level: log.level,
          message: log.message,
        },
      });
    }
  }
  console.log(`   ✓ Created deployment logs`);

  // ============ CREATE ENVIRONMENT VARIABLES ============
  console.log("🔐 Creating environment variables...");

  const envVarData = [];
  for (const project of projects) {
    envVarData.push(
      { projectId: project.id, key: "NODE_ENV", value: "production", target: "production" },
      { projectId: project.id, key: "DATABASE_URL", value: "postgresql://localhost:5432/app", isSecret: true, target: "production" },
      { projectId: project.id, key: "API_KEY", value: "sk_test_" + Math.random().toString(36).substring(7), isSecret: true, target: "production" },
      { projectId: project.id, key: "NEXT_PUBLIC_APP_URL", value: `https://${project.slug}.cloudify.app`, target: "production" },
    );
  }

  const envVars = await prisma.envVariable.createMany({ data: envVarData });
  console.log(`   ✓ Created ${envVars.count} environment variables`);

  // ============ CREATE DOMAINS ============
  console.log("🌐 Creating custom domains...");

  const domainsData: Array<{ domain: string; projectId: string; verified: boolean; sslStatus: "PENDING" | "PROVISIONING" | "ACTIVE" | "ERROR"; verificationToken: string }> = [
    { domain: "blog.example.com", projectId: projects[0].id, verified: true, sslStatus: "ACTIVE", verificationToken: "verify_" + Math.random().toString(36).substring(7) },
    { domain: "dashboard.example.com", projectId: projects[1].id, verified: true, sslStatus: "ACTIVE", verificationToken: "verify_" + Math.random().toString(36).substring(7) },
    { domain: "api.example.com", projectId: projects[2].id, verified: false, sslStatus: "PENDING", verificationToken: "verify_" + Math.random().toString(36).substring(7) },
    { domain: "shop.example.com", projectId: projects[4].id, verified: true, sslStatus: "ACTIVE", verificationToken: "verify_" + Math.random().toString(36).substring(7) },
  ];

  const domains = await prisma.domain.createMany({ data: domainsData });
  console.log(`   ✓ Created ${domains.count} custom domains`);

  // ============ CREATE TEAMS ============
  console.log("👥 Creating teams...");

  const team = await prisma.team.create({
    data: {
      name: "Acme Corp",
      slug: "acme-corp",
      plan: "TEAM",
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: team.id, userId: teamUser.id, role: "OWNER" },
      { teamId: team.id, userId: demoUser.id, role: "ADMIN" },
      { teamId: team.id, userId: freeUser.id, role: "MEMBER" },
    ],
  });

  await prisma.teamProject.createMany({
    data: [
      { teamId: team.id, projectId: projects[4].id },
      { teamId: team.id, projectId: projects[5].id },
    ],
  });
  console.log(`   ✓ Created team with 3 members and 2 projects`);

  // ============ CREATE USAGE RECORDS ============
  console.log("📊 Creating usage records...");

  const usageData = [];
  const usageTypes: Array<"BUILD_MINUTES" | "BANDWIDTH" | "REQUESTS" | "FUNCTION_INVOCATIONS" | "DEPLOYMENTS"> = ["BUILD_MINUTES", "BANDWIDTH", "REQUESTS", "FUNCTION_INVOCATIONS", "DEPLOYMENTS"];

  for (const user of users) {
    for (let day = 0; day < 30; day++) {
      for (const type of usageTypes) {
        usageData.push({
          userId: user.id,
          projectId: projects[0].id,
          type,
          value: Math.random() * (type === "REQUESTS" ? 10000 : type === "BANDWIDTH" ? 100 : 10),
          recordedAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  const usageRecords = await prisma.usageRecord.createMany({ data: usageData });
  console.log(`   ✓ Created ${usageRecords.count} usage records`);

  // ============ CREATE ANALYTICS EVENTS ============
  console.log("📈 Creating analytics events...");

  const analyticsData = [];
  const pages = ["/", "/about", "/blog", "/contact", "/pricing", "/docs"];
  const devices = ["desktop", "mobile", "tablet"];
  const browsers = ["Chrome", "Firefox", "Safari", "Edge"];
  const countries = ["US", "UK", "DE", "FR", "JP", "AU"];

  for (const project of projects.slice(0, 3)) {
    for (let i = 0; i < 100; i++) {
      analyticsData.push({
        projectId: project.id,
        type: "pageview",
        path: pages[Math.floor(Math.random() * pages.length)],
        referrer: Math.random() > 0.5 ? "https://google.com" : null,
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        sessionId: `session_${Math.random().toString(36).substring(7)}`,
        visitorId: `visitor_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  const analytics = await prisma.analyticsEvent.createMany({ data: analyticsData });
  console.log(`   ✓ Created ${analytics.count} analytics events`);

  // ============ CREATE SERVERLESS FUNCTIONS ============
  console.log("⚡ Creating serverless functions...");

  const functions = await prisma.serverlessFunction.createMany({
    data: [
      {
        projectId: projects[0].id,
        name: "api-handler",
        runtime: "nodejs20",
        entrypoint: "api/index.ts",
        memory: 256,
        timeout: 30,
        regions: ["iad1", "sfo1"],
      },
      {
        projectId: projects[0].id,
        name: "image-optimizer",
        runtime: "nodejs20",
        entrypoint: "api/optimize.ts",
        memory: 512,
        timeout: 60,
        regions: ["iad1"],
      },
      {
        projectId: projects[2].id,
        name: "webhook-handler",
        runtime: "nodejs18",
        entrypoint: "api/webhook.ts",
        memory: 128,
        timeout: 10,
        regions: ["iad1", "cdg1"],
      },
    ],
  });
  console.log(`   ✓ Created ${functions.count} serverless functions`);

  // ============ CREATE BLOB STORES ============
  console.log("📦 Creating blob stores...");

  const blobStore = await prisma.blobStore.create({
    data: {
      projectId: projects[0].id,
      name: "uploads",
      isPublic: true,
    },
  });

  await prisma.blob.createMany({
    data: [
      { storeId: blobStore.id, pathname: "images/logo.png", contentType: "image/png", size: 24567, url: "https://storage.cloudify.app/uploads/images/logo.png" },
      { storeId: blobStore.id, pathname: "images/hero.jpg", contentType: "image/jpeg", size: 156789, url: "https://storage.cloudify.app/uploads/images/hero.jpg" },
      { storeId: blobStore.id, pathname: "documents/readme.pdf", contentType: "application/pdf", size: 89012, url: "https://storage.cloudify.app/uploads/documents/readme.pdf" },
    ],
  });
  console.log(`   ✓ Created blob store with 3 files`);

  // ============ CREATE KV STORES ============
  console.log("🗄️ Creating KV stores...");

  const kvStore = await prisma.kVStore.create({
    data: {
      projectId: projects[0].id,
      name: "cache",
    },
  });

  await prisma.kVEntry.createMany({
    data: [
      { storeId: kvStore.id, key: "user:123:preferences", value: JSON.stringify({ theme: "dark", language: "en" }) },
      { storeId: kvStore.id, key: "rate:limit:192.168.1.1", value: "45", expiresAt: new Date(Date.now() + 60000) },
      { storeId: kvStore.id, key: "cache:homepage", value: JSON.stringify({ html: "<html>...</html>", ttl: 300 }) },
    ],
  });
  console.log(`   ✓ Created KV store with 3 entries`);

  // ============ CREATE FEATURE FLAGS ============
  console.log("🚩 Creating feature flags...");

  await prisma.featureFlag.createMany({
    data: [
      { projectId: projects[0].id, key: "new_dashboard", name: "New Dashboard", enabled: true, percentage: 50 },
      { projectId: projects[0].id, key: "dark_mode", name: "Dark Mode", enabled: true, percentage: 100 },
      { projectId: projects[0].id, key: "beta_features", name: "Beta Features", enabled: false, percentage: 0 },
    ],
  });
  console.log(`   ✓ Created 3 feature flags`);

  // ============ CREATE ACTIVITIES ============
  console.log("📋 Creating activity logs...");

  const activityData = [
    { userId: demoUser.id, projectId: projects[0].id, type: "deployment", action: "created", description: "Deployed to production" },
    { userId: demoUser.id, projectId: projects[0].id, type: "domain", action: "verified", description: "Verified domain blog.example.com" },
    { userId: demoUser.id, projectId: projects[1].id, type: "env_var", action: "created", description: "Added environment variable API_KEY" },
    { userId: teamUser.id, projectId: projects[4].id, type: "deployment", action: "created", description: "Deployed to production" },
    { userId: freeUser.id, projectId: projects[3].id, type: "project", action: "created", description: "Created new project Personal Portfolio" },
  ];

  const activities = await prisma.activity.createMany({ data: activityData });
  console.log(`   ✓ Created ${activities.count} activity logs`);

  // ============ CREATE NOTIFICATIONS ============
  console.log("🔔 Creating notifications...");

  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, type: "deployment_success", title: "Deployment Successful", message: "Your project Next.js Blog has been deployed successfully.", read: false },
      { userId: demoUser.id, type: "usage_warning", title: "Usage Warning", message: "You've used 80% of your build minutes this month.", read: true },
      { userId: teamUser.id, type: "team_invite", title: "New Team Member", message: "Demo User has joined your team Acme Corp.", read: false },
    ],
  });
  console.log(`   ✓ Created 3 notifications`);

  // ============ CREATE WEB VITALS ============
  console.log("📉 Creating web vitals...");

  const vitalsData = [];
  const metrics = ["LCP", "FID", "CLS", "TTFB", "FCP", "INP"];
  const ratings = ["good", "needs-improvement", "poor"];

  for (const project of projects.slice(0, 2)) {
    for (let i = 0; i < 50; i++) {
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      vitalsData.push({
        projectId: project.id,
        url: pages[Math.floor(Math.random() * pages.length)],
        metric,
        value: metric === "CLS" ? Math.random() * 0.5 : Math.random() * 3000,
        rating: ratings[Math.floor(Math.random() * ratings.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  const vitals = await prisma.webVital.createMany({ data: vitalsData });
  console.log(`   ✓ Created ${vitals.count} web vitals`);

  // ============ SUMMARY ============
  console.log("\n✅ Database seeding completed!\n");
  console.log("📋 Test Credentials:");
  console.log("   ┌─────────────────────────────────────────────────────┐");
  console.log("   │  Email                      │  Password  │  Plan    │");
  console.log("   ├─────────────────────────────────────────────────────┤");
  console.log("   │  demo@cloudify.app          │  demo123   │  Pro     │");
  console.log("   │  free@cloudify.app          │  free123   │  Free    │");
  console.log("   │  team@cloudify.app          │  team123   │  Team    │");
  console.log("   │  enterprise@cloudify.app    │  enterprise123 │ Enterprise │");
  console.log("   └─────────────────────────────────────────────────────┘");
  console.log("\n🎯 Quick Start: Login with demo@cloudify.app / demo123\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
