import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

// Available integration types
const INTEGRATION_TYPES = {
  github: {
    name: "GitHub",
    description: "Connect your GitHub repositories for automatic deployments",
    icon: "github",
  },
  slack: {
    name: "Slack",
    description: "Get deployment notifications in Slack channels",
    icon: "slack",
  },
  discord: {
    name: "Discord",
    description: "Get deployment notifications in Discord channels",
    icon: "discord",
  },
  webhook: {
    name: "Custom Webhook",
    description: "Send deployment events to a custom webhook URL",
    icon: "webhook",
  },
  datadog: {
    name: "Datadog",
    description: "Monitor your deployments with Datadog",
    icon: "datadog",
  },
  sentry: {
    name: "Sentry",
    description: "Track errors and performance with Sentry",
    icon: "sentry",
  },
};

// GET /api/integrations - List integrations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const listAvailable = searchParams.get("available") === "true";

    // List available integration types
    if (listAvailable) {
      return NextResponse.json(INTEGRATION_TYPES);
    }

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    // Get user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    const integrations = await prisma.integration.findMany({
      where: projectId
        ? { projectId }
        : { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Don't return credentials in the response
    const safeIntegrations = integrations.map(({ ...int }) => ({
      id: int.id,
      projectId: int.projectId,
      project: int.project,
      type: int.type,
      name: int.name,
      config: int.config,
      enabled: int.enabled,
      lastSyncAt: int.lastSyncAt,
      createdAt: int.createdAt,
      updatedAt: int.updatedAt,
    }));

    return NextResponse.json(safeIntegrations);
  } catch (error) {
    console.error("Failed to fetch integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create an integration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, type, name, config, credentials, webhookUrl } = body;

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "Project ID and type are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: { projectId, type },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Integration already exists for this project" },
        { status: 400 }
      );
    }

    const integrationName = name || INTEGRATION_TYPES[type as keyof typeof INTEGRATION_TYPES]?.name || type;

    const integration = await prisma.integration.create({
      data: {
        projectId,
        type,
        name: integrationName,
        config,
        credentials,
        webhookUrl,
        enabled: true,
      },
      select: {
        id: true,
        type: true,
        name: true,
        config: true,
        enabled: true,
        createdAt: true,
      },
    });

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId,
        type: "integration",
        action: "created",
        description: `Connected ${integrationName} integration`,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Failed to create integration:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations - Update an integration
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, config, credentials, enabled, webhookUrl } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (config !== undefined) updateData.config = config;
    if (credentials !== undefined) updateData.credentials = credentials;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;

    const updated = await prisma.integration.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        type: true,
        name: true,
        config: true,
        enabled: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations - Delete an integration
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    await prisma.integration.delete({ where: { id } });

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId: integration.projectId,
        type: "integration",
        action: "deleted",
        description: `Disconnected ${integration.name} integration`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
