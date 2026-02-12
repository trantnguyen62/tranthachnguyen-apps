import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth/api-auth";
import { ok, fail } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (isAuthError(result)) return result;
    const { user: authUser } = result;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        plan: true,
        createdAt: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        accounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            projects: true,
            teamMembers: true,
          },
        },
      },
    });

    if (!user) {
      return fail("NOT_FOUND", "User not found", 404);
    }

    return ok({ user });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to fetch profile", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (isAuthError(result)) return result;
    const { user: authUser } = result;

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const allowedFields = ["name", "image"];
    const protectedFields = Object.keys(body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (protectedFields.length > 0) {
      return fail("BAD_REQUEST", `Cannot update protected fields: ${protectedFields.join(", ")}`, 400);
    }

    const { name, image } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 1) {
        return fail("VALIDATION_ERROR", "Name must be at least 1 character", 400);
      }
      if (name.trim().length > 100) {
        return fail("VALIDATION_ERROR", "Name must be 100 characters or less", 400);
      }
      // Sanitize: strip HTML tags to prevent XSS
      updateData.name = name.trim().replace(/<[^>]*>/g, "");
    }
    if (image !== undefined) {
      if (image !== null && typeof image !== "string") {
        return fail("VALIDATION_ERROR", "Image must be a string URL or null", 400);
      }
      if (image && image.length > 2048) {
        return fail("VALIDATION_ERROR", "Image URL must be 2048 characters or less", 400);
      }
      updateData.image = image;
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        plan: true,
      },
    });

    return ok({ user });
  } catch {
    return fail("INTERNAL_ERROR", "Failed to update profile", 500);
  }
}
