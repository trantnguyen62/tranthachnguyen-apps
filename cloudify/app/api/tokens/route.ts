import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/next-auth";
import { randomBytes, createHash } from "crypto";

// Generate a secure API token
function generateToken(): { token: string; hash: string; prefix: string } {
  const token = `cl_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(token).digest("hex");
  const prefix = token.substring(0, 11); // "cl_" + first 8 chars
  return { token, hash, prefix };
}

// GET /api/tokens - List user's API tokens
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Failed to fetch tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Create a new API token
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes = ["read"], expiresIn } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Token name is required" },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes = ["read", "write", "deploy", "admin"];
    const tokenScopes = scopes.filter((s: string) => validScopes.includes(s));
    if (tokenScopes.length === 0) {
      tokenScopes.push("read");
    }

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expiresIn) {
      const days = parseInt(expiresIn, 10);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    }

    // Generate token
    const { token, hash, prefix } = generateToken();

    // Create token in database (store hash, not raw token)
    const apiToken = await prisma.apiToken.create({
      data: {
        name: name.trim(),
        token: hash,
        tokenPrefix: prefix,
        userId: session.user.id,
        scopes: tokenScopes,
        expiresAt,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "api_token",
        action: "created",
        description: `Created API token "${name}"`,
        metadata: { tokenId: apiToken.id, scopes: tokenScopes },
      },
    });

    // Return the raw token ONLY on creation (never shown again)
    return NextResponse.json({
      id: apiToken.id,
      name: apiToken.name,
      token, // Raw token - only shown once!
      tokenPrefix: apiToken.tokenPrefix,
      scopes: apiToken.scopes,
      expiresAt: apiToken.expiresAt,
      createdAt: apiToken.createdAt,
    });
  } catch (error) {
    console.error("Failed to create token:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
