import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth/api-auth";

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
        avatar: true,
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const allowedFields = ["name", "avatar"];
    const protectedFields = Object.keys(body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (protectedFields.length > 0) {
      return NextResponse.json(
        { error: `Cannot update protected fields: ${protectedFields.join(", ")}` },
        { status: 400 }
      );
    }

    const { name, avatar } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 1) {
        return NextResponse.json(
          { error: "Name must be at least 1 character" },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: "Name must be 100 characters or less" },
          { status: 400 }
        );
      }
      // Sanitize: strip HTML tags to prevent XSS
      updateData.name = name.trim().replace(/<[^>]*>/g, "");
    }
    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== "string") {
        return NextResponse.json(
          { error: "Avatar must be a string URL or null" },
          { status: 400 }
        );
      }
      if (avatar && avatar.length > 2048) {
        return NextResponse.json(
          { error: "Avatar URL must be 2048 characters or less" },
          { status: 400 }
        );
      }
      updateData.avatar = avatar;
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        image: true,
        plan: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
