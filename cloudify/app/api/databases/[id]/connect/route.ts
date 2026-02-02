/**
 * Database Connection API
 * GET - Get connection string for a database
 * POST - Rotate database credentials
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { decryptConnectionString, rotateCredentials } from "@/lib/database/provisioner";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/databases/[id]/connect - Get connection details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const database = await prisma.managedDatabase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    });

    if (!database) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (database.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    if (database.status !== "ready") {
      return NextResponse.json(
        { error: "Database is not ready", status: database.status },
        { status: 400 }
      );
    }

    // Decrypt and return connection details
    const decryptedPassword = database.password
      ? decryptConnectionString(database.password)
      : null;

    // Build connection string based on type
    let connectionString = "";
    const { host, port, database: dbName, username } = database;

    switch (database.type) {
      case "postgresql":
        connectionString = `postgresql://${username}:${decryptedPassword}@${host}:${port}/${dbName}?sslmode=require`;
        break;
      case "mysql":
        connectionString = `mysql://${username}:${decryptedPassword}@${host}:${port}/${dbName}`;
        break;
      case "redis":
        connectionString = decryptedPassword
          ? `redis://:${decryptedPassword}@${host}:${port}`
          : `redis://${host}:${port}`;
        break;
    }

    // Log access for audit
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: database.projectId,
        type: "database",
        action: "database.connection_viewed",
        description: `Viewed connection details for "${database.name}"`,
        metadata: {
          databaseId: id,
          type: database.type,
        },
      },
    });

    return NextResponse.json({
      connection: {
        host: database.host,
        port: database.port,
        database: database.database,
        username: database.username,
        password: decryptedPassword,
        connectionString,
        sslRequired: database.type !== "redis",
      },
      provider: database.provider,
      region: database.region,
    });
  } catch (error) {
    console.error("Failed to get connection details:", error);
    return NextResponse.json(
      { error: "Failed to get connection details" },
      { status: 500 }
    );
  }
}

// POST /api/databases/[id]/connect - Rotate credentials
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await params;

    const database = await prisma.managedDatabase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!database) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (database.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    if (database.status !== "ready") {
      return NextResponse.json(
        { error: "Database is not ready for credential rotation" },
        { status: 400 }
      );
    }

    // Rotate credentials
    const newCredentials = await rotateCredentials(id);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: database.projectId,
        type: "database",
        action: "database.credentials_rotated",
        description: `Rotated credentials for "${database.name}"`,
        metadata: {
          databaseId: id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Credentials rotated successfully",
      connection: newCredentials,
    });
  } catch (error) {
    console.error("Failed to rotate credentials:", error);
    return NextResponse.json(
      { error: "Failed to rotate credentials" },
      { status: 500 }
    );
  }
}
