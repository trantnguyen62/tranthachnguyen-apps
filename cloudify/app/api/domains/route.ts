import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireReadAccess, requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import crypto from "crypto";
import { getRouteLogger } from "@/lib/api/logger";
import { handlePrismaError } from "@/lib/api/error-response";
import { ok, fail } from "@/lib/api/response";

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

    return ok(domains);
  } catch (error) {
    return fail("INTERNAL_ERROR", "Failed to fetch domains", 500);
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
      return fail("BAD_REQUEST", "Invalid request body", 400);
    }
    const { domain, projectId } = body;

    if (!domain || !projectId) {
      const fields = [];
      if (!domain) fields.push({ field: "domain", message: "Domain is required" });
      if (!projectId) fields.push({ field: "projectId", message: "Project ID is required" });
      return fail("VALIDATION_MISSING_FIELD", "Validation failed", 422, { fields });
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return fail("VALIDATION_ERROR", "Invalid domain format", 422, {
        fields: [{ field: "domain", message: "Invalid domain format" }],
      });
    }

    // Check if project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return fail("NOT_FOUND", "Project not found", 404);
    }

    // Check if domain already exists
    const existingDomain = await prisma.domain.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return fail("CONFLICT", "This domain is already registered", 409);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(16).toString("hex");

    const newDomain = await prisma.domain.create({
      data: {
        domain,
        projectId,
        verificationToken,
        verified: false,
        sslStatus: "PENDING",
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

    return ok(newDomain, { status: 201 });
  } catch (error) {
    const prismaResp = handlePrismaError(error, "domain");
    if (prismaResp) return prismaResp;

    return fail("INTERNAL_ERROR", "Failed to add domain", 500);
  }
}
