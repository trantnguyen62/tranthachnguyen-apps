import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

// GET /api/edge-config - List edge configs or items
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const configId = searchParams.get("configId");

    // If projectId is provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    // Get items in a specific config
    if (configId) {
      const config = await prisma.edgeConfig.findFirst({
        where: { id: configId },
        include: { items: true, project: { select: { id: true, name: true, slug: true } } },
      });
      return NextResponse.json(config);
    }

    // Get user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    // Get all configs (optionally filtered by project)
    const configs = await prisma.edgeConfig.findMany({
      where: projectId
        ? { projectId }
        : { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Failed to fetch edge config:", error);
    return NextResponse.json(
      { error: "Failed to fetch edge config" },
      { status: 500 }
    );
  }
}

// POST /api/edge-config - Create config or set item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, configName, configId, key, value } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
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

    // Create a new config
    if (configName && !configId) {
      const slug = configName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const config = await prisma.edgeConfig.create({
        data: {
          projectId,
          name: configName,
          slug,
        },
      });

      await prisma.activity.create({
        data: {
          userId: session.user.id,
          projectId,
          type: "edge_config",
          action: "created",
          description: `Created edge config "${configName}"`,
        },
      });

      return NextResponse.json(config);
    }

    // Set an item in an existing config
    if (configId && key && value !== undefined) {
      const item = await prisma.edgeConfigItem.upsert({
        where: {
          configId_key: { configId, key },
        },
        update: { value },
        create: {
          configId,
          key,
          value,
        },
      });

      return NextResponse.json(item);
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create edge config:", error);
    return NextResponse.json(
      { error: "Failed to create edge config" },
      { status: 500 }
    );
  }
}

// DELETE /api/edge-config - Delete config or item
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("configId");
    const key = searchParams.get("key");

    if (configId && key) {
      await prisma.edgeConfigItem.delete({
        where: { configId_key: { configId, key } },
      });
      return NextResponse.json({ success: true });
    }

    if (configId) {
      const config = await prisma.edgeConfig.findFirst({
        where: {
          id: configId,
          project: { userId: session.user.id },
        },
      });

      if (!config) {
        return NextResponse.json({ error: "Config not found" }, { status: 404 });
      }

      await prisma.edgeConfig.delete({ where: { id: configId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID required" }, { status: 400 });
  } catch (error) {
    console.error("Failed to delete:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
