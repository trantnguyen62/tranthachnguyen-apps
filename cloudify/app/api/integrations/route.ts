import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { parseJsonBody, isParseError } from "@/lib/api/parse-body";
import {
  badRequest,
  notFound,
  conflict,
  validationError,
  serverError,
  handlePrismaError,
} from "@/lib/api/error-response";

const log = getRouteLogger("integrations");

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
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const listAvailable = searchParams.get("available") === "true";

    // List available integration types
    if (listAvailable) {
      return ok(INTEGRATION_TYPES);
    }

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (!project) {
        return notFound("Project not found");
      }
    }

    // Get user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id },
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

    return ok(safeIntegrations);
  } catch (error) {
    return serverError("Failed to fetch integrations", error);
  }
}

// POST /api/integrations - Create an integration
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { projectId, type, name, config, credentials, webhookUrl } = body;

    if (!projectId || !type) {
      const fields = [];
      if (!projectId) fields.push({ field: "projectId", message: "Project ID is required" });
      if (!type) fields.push({ field: "type", message: "Integration type is required" });
      return validationError(fields);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return notFound("Project not found");
    }

    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: { projectId, type },
    });

    if (existing) {
      return conflict("Integration already exists for this project");
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
        userId: user.id,
        projectId,
        type: "integration",
        action: "created",
        description: `Connected ${integrationName} integration`,
      },
    });

    return ok(integration);
  } catch (error) {
    const prismaResp = handlePrismaError(error, "integration");
    if (prismaResp) return prismaResp;

    return serverError("Failed to create integration", error);
  }
}

// PATCH /api/integrations - Update an integration
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const parseResult = await parseJsonBody(request);
    if (isParseError(parseResult)) return parseResult;
    const body = parseResult.data;
    const { id, config, credentials, enabled, webhookUrl } = body;

    if (!id) {
      return badRequest("Integration ID is required");
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!integration) {
      return notFound("Integration not found");
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

    return ok(updated);
  } catch (error) {
    return serverError("Failed to update integration", error);
  }
}

// DELETE /api/integrations - Delete an integration
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequest("Integration ID is required");
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        project: { userId: user.id },
      },
    });

    if (!integration) {
      return notFound("Integration not found");
    }

    await prisma.integration.delete({ where: { id } });

    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: integration.projectId,
        type: "integration",
        action: "deleted",
        description: `Disconnected ${integration.name} integration`,
      },
    });

    return ok({ success: true });
  } catch (error) {
    return serverError("Failed to delete integration", error);
  }
}
