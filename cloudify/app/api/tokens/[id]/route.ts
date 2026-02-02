import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tokens/[id] - Get token details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const token = await prisma.apiToken.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error("Failed to fetch token:", error);
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 500 }
    );
  }
}

// DELETE /api/tokens/[id] - Revoke a token
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const token = await prisma.apiToken.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Delete token
    await prisma.apiToken.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "api_token",
        action: "deleted",
        description: `Revoked API token "${token.name}"`,
        metadata: { tokenId: id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete token:", error);
    return NextResponse.json(
      { error: "Failed to delete token" },
      { status: 500 }
    );
  }
}
