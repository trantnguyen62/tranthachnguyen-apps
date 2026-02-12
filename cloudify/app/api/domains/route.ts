import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import crypto from "crypto";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("domains");

// GET /api/domains - List all domains for the user's projects
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const domains = await prisma.domain.findMany({
      where: {
        project: {
          userId: user.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(domains);
  } catch (error) {
    log.error("Failed to fetch domains", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}

// POST /api/domains - Add a new custom domain
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { domain, projectId } = body;

    if (!domain || !projectId) {
      return NextResponse.json(
        { error: "Domain and projectId are required" },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Check if project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if domain already exists
    const existingDomain = await prisma.domain.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: "This domain is already registered" },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(16).toString("hex");

    const newDomain = await prisma.domain.create({
      data: {
        domain,
        projectId,
        verificationToken,
        verified: false,
        sslStatus: "pending",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(newDomain, { status: 201 });
  } catch (error) {
    log.error("Failed to add domain", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }
}
