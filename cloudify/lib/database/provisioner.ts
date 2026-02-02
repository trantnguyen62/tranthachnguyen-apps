/**
 * Database Provisioner
 * Manages provisioning of managed databases for projects
 */

import { prisma } from "@/lib/prisma";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// Encryption for database credentials
const ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY || randomBytes(32).toString("hex");
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

export interface DatabaseProvisionRequest {
  projectId: string;
  name: string;
  type: "postgresql" | "mysql" | "redis";
  provider: "cloudify" | "neon" | "planetscale" | "upstash";
  plan: "hobby" | "pro" | "enterprise";
  region?: string;
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  version?: string;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), "utf-8");
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), "utf-8");

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a secure password
 */
function generatePassword(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Provision a new managed database
 */
export async function provisionDatabase(
  request: DatabaseProvisionRequest
): Promise<{ databaseId: string }> {
  // Create database record
  const db = await prisma.managedDatabase.create({
    data: {
      projectId: request.projectId,
      name: request.name,
      type: request.type,
      provider: request.provider,
      status: "provisioning",
      plan: request.plan,
      region: request.region || "us-east-1",
      // Placeholder credentials
      host: "",
      port: 0,
      database: "",
      username: "",
      password: "",
    },
  });

  // Provision asynchronously
  provisionAsync(db.id, request).catch((error) => {
    console.error(`Failed to provision database ${db.id}:`, error);
  });

  return { databaseId: db.id };
}

/**
 * Async provisioning logic
 */
async function provisionAsync(
  databaseId: string,
  request: DatabaseProvisionRequest
) {
  try {
    let credentials: DatabaseCredentials;

    switch (request.provider) {
      case "cloudify":
        credentials = await provisionCloudifyDatabase(request);
        break;
      case "neon":
        credentials = await provisionNeonDatabase(request);
        break;
      case "planetscale":
        credentials = await provisionPlanetScaleDatabase(request);
        break;
      case "upstash":
        credentials = await provisionUpstashDatabase(request);
        break;
      default:
        throw new Error(`Unknown provider: ${request.provider}`);
    }

    // Encrypt and store credentials
    const encryptedPassword = encrypt(credentials.password);

    await prisma.managedDatabase.update({
      where: { id: databaseId },
      data: {
        host: credentials.host,
        port: credentials.port,
        database: credentials.database,
        username: credentials.username,
        password: encryptedPassword,
        status: "active",
        version: credentials.version,
      },
    });

    // Inject connection string as env variable
    await injectEnvVariable(request.projectId, databaseId);
  } catch (error) {
    await prisma.managedDatabase.update({
      where: { id: databaseId },
      data: {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Provisioning failed",
      },
    });
    throw error;
  }
}

/**
 * Provision a Cloudify-managed database (Docker-based for development)
 */
async function provisionCloudifyDatabase(
  request: DatabaseProvisionRequest
): Promise<DatabaseCredentials> {
  const password = generatePassword();
  const dbName = `cloudify_${request.projectId.slice(0, 8)}_${request.name}`.replace(
    /[^a-zA-Z0-9_]/g,
    "_"
  );

  // In production, this would create a K8s StatefulSet
  // For now, return development credentials
  switch (request.type) {
    case "postgresql":
      return {
        host: process.env.CLOUDIFY_PG_HOST || "localhost",
        port: parseInt(process.env.CLOUDIFY_PG_PORT || "5432"),
        database: dbName,
        username: `user_${request.projectId.slice(0, 8)}`,
        password,
        version: "16",
      };
    case "mysql":
      return {
        host: process.env.CLOUDIFY_MYSQL_HOST || "localhost",
        port: parseInt(process.env.CLOUDIFY_MYSQL_PORT || "3306"),
        database: dbName,
        username: `user_${request.projectId.slice(0, 8)}`,
        password,
        version: "8.0",
      };
    case "redis":
      return {
        host: process.env.CLOUDIFY_REDIS_HOST || "localhost",
        port: parseInt(process.env.CLOUDIFY_REDIS_PORT || "6379"),
        database: "0",
        username: "",
        password,
        version: "7",
      };
    default:
      throw new Error(`Unsupported database type: ${request.type}`);
  }
}

/**
 * Provision a Neon database (PostgreSQL)
 */
async function provisionNeonDatabase(
  request: DatabaseProvisionRequest
): Promise<DatabaseCredentials> {
  const NEON_API_KEY = process.env.NEON_API_KEY;
  if (!NEON_API_KEY) {
    throw new Error("Neon API key not configured");
  }

  // Create project in Neon
  const response = await fetch("https://console.neon.tech/api/v2/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NEON_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: {
        name: `cloudify-${request.projectId.slice(0, 8)}-${request.name}`,
        region_id: request.region || "aws-us-east-2",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Neon API error: ${response.statusText}`);
  }

  const data = await response.json();
  const connection = data.connection_uris?.[0];

  if (!connection) {
    throw new Error("No connection URI returned from Neon");
  }

  const url = new URL(connection.connection_uri);

  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
    version: "16",
  };
}

/**
 * Provision a PlanetScale database (MySQL)
 */
async function provisionPlanetScaleDatabase(
  request: DatabaseProvisionRequest
): Promise<DatabaseCredentials> {
  const PLANETSCALE_TOKEN = process.env.PLANETSCALE_TOKEN;
  const PLANETSCALE_ORG = process.env.PLANETSCALE_ORG;

  if (!PLANETSCALE_TOKEN || !PLANETSCALE_ORG) {
    throw new Error("PlanetScale credentials not configured");
  }

  // Create database
  const dbName = `cloudify-${request.projectId.slice(0, 8)}-${request.name}`;

  const createResponse = await fetch(
    `https://api.planetscale.com/v1/organizations/${PLANETSCALE_ORG}/databases`,
    {
      method: "POST",
      headers: {
        Authorization: PLANETSCALE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: dbName }),
    }
  );

  if (!createResponse.ok) {
    throw new Error(`PlanetScale API error: ${createResponse.statusText}`);
  }

  // Get connection credentials
  const passwordResponse = await fetch(
    `https://api.planetscale.com/v1/organizations/${PLANETSCALE_ORG}/databases/${dbName}/passwords`,
    {
      method: "POST",
      headers: {
        Authorization: PLANETSCALE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "cloudify",
        role: "admin",
        branch: "main",
      }),
    }
  );

  if (!passwordResponse.ok) {
    throw new Error("Failed to create PlanetScale password");
  }

  const password = await passwordResponse.json();

  return {
    host: password.access_host_url,
    port: 3306,
    database: dbName,
    username: password.username,
    password: password.plain_text,
    version: "8.0",
  };
}

/**
 * Provision an Upstash database (Redis)
 */
async function provisionUpstashDatabase(
  request: DatabaseProvisionRequest
): Promise<DatabaseCredentials> {
  const UPSTASH_EMAIL = process.env.UPSTASH_EMAIL;
  const UPSTASH_API_KEY = process.env.UPSTASH_API_KEY;

  if (!UPSTASH_EMAIL || !UPSTASH_API_KEY) {
    throw new Error("Upstash credentials not configured");
  }

  const response = await fetch("https://api.upstash.com/v2/redis/database", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${UPSTASH_EMAIL}:${UPSTASH_API_KEY}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `cloudify-${request.projectId.slice(0, 8)}-${request.name}`,
      region: request.region || "us-east-1",
      tls: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upstash API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    host: data.endpoint,
    port: data.port,
    database: "0",
    username: "",
    password: data.password,
    version: "7",
  };
}

/**
 * Generate connection string
 */
export function generateConnectionString(
  type: string,
  credentials: DatabaseCredentials,
  sslMode: string = "require"
): string {
  const { host, port, database, username, password } = credentials;

  switch (type) {
    case "postgresql":
      return `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=${sslMode}`;
    case "mysql":
      return `mysql://${username}:${password}@${host}:${port}/${database}`;
    case "redis":
      return password
        ? `redis://:${password}@${host}:${port}`
        : `redis://${host}:${port}`;
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}

/**
 * Inject connection string as environment variable
 */
async function injectEnvVariable(projectId: string, databaseId: string) {
  const db = await prisma.managedDatabase.findUnique({
    where: { id: databaseId },
  });

  if (!db) return;

  const decryptedPassword = decrypt(db.password);
  const connectionString = generateConnectionString(
    db.type,
    {
      host: db.host,
      port: db.port,
      database: db.database,
      username: db.username,
      password: decryptedPassword,
    },
    db.sslMode
  );

  const envVarName = `${db.type.toUpperCase()}_URL`;

  await prisma.envVariable.upsert({
    where: {
      projectId_key_target: {
        projectId,
        key: envVarName,
        target: "production",
      },
    },
    create: {
      projectId,
      key: envVarName,
      value: connectionString,
      isSecret: true,
      target: "production",
    },
    update: {
      value: connectionString,
    },
  });
}

/**
 * Get database with decrypted credentials
 */
export async function getDatabaseWithCredentials(databaseId: string) {
  const db = await prisma.managedDatabase.findUnique({
    where: { id: databaseId },
  });

  if (!db) return null;

  return {
    ...db,
    decryptedPassword: decrypt(db.password),
  };
}

/**
 * Delete a managed database
 */
export async function deleteDatabase(databaseId: string) {
  const db = await prisma.managedDatabase.findUnique({
    where: { id: databaseId },
  });

  if (!db) return;

  // In production, deprovision from provider
  // For now, just delete the record
  await prisma.managedDatabase.delete({
    where: { id: databaseId },
  });
}

/**
 * Deprovision a database (async deletion with cleanup)
 */
export async function deprovisionDatabase(databaseId: string): Promise<void> {
  const db = await prisma.managedDatabase.findUnique({
    where: { id: databaseId },
    include: { project: true },
  });

  if (!db) return;

  // Mark as deleting
  await prisma.managedDatabase.update({
    where: { id: databaseId },
    data: { status: "deleting" },
  });

  // Deprovision asynchronously
  deprovisionAsync(databaseId, db).catch((error) => {
    console.error(`Failed to deprovision database ${databaseId}:`, error);
  });
}

/**
 * Async deprovisioning logic
 */
async function deprovisionAsync(
  databaseId: string,
  db: { type: string; provider: string; name: string; projectId: string }
) {
  try {
    // Provider-specific cleanup would go here
    // For now, just clean up the record and related env vars

    // Remove associated env variable
    const envVarName = `${db.type.toUpperCase()}_URL`;
    await prisma.envVariable.deleteMany({
      where: {
        projectId: db.projectId,
        key: envVarName,
      },
    });

    // Delete related records
    await prisma.databaseMetric.deleteMany({
      where: { databaseId },
    });

    await prisma.databaseBackup.deleteMany({
      where: { databaseId },
    });

    await prisma.databaseMigration.deleteMany({
      where: { databaseId },
    });

    // Finally delete the database record
    await prisma.managedDatabase.delete({
      where: { id: databaseId },
    });
  } catch (error) {
    await prisma.managedDatabase.update({
      where: { id: databaseId },
      data: {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Deprovisioning failed",
      },
    });
    throw error;
  }
}

/**
 * Decrypt connection string (alias for decrypt)
 */
export function decryptConnectionString(encrypted: string): string {
  return decrypt(encrypted);
}

/**
 * Rotate database credentials
 */
export async function rotateCredentials(databaseId: string): Promise<{
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionString: string;
}> {
  const db = await prisma.managedDatabase.findUnique({
    where: { id: databaseId },
  });

  if (!db) {
    throw new Error("Database not found");
  }

  if (db.status !== "ready" && db.status !== "active") {
    throw new Error("Database is not ready for credential rotation");
  }

  // Generate new password
  const newPassword = randomBytes(24).toString("base64url");

  // In production, this would call the provider API to rotate credentials
  // For cloudify-hosted databases, this would update the database user password

  // Encrypt and store new password
  const encryptedPassword = encrypt(newPassword);

  await prisma.managedDatabase.update({
    where: { id: databaseId },
    data: { password: encryptedPassword },
  });

  // Update the env variable
  const connectionString = generateConnectionString(db.type, {
    host: db.host,
    port: db.port,
    database: db.database,
    username: db.username,
    password: newPassword,
  });

  const envVarName = `${db.type.toUpperCase()}_URL`;
  await prisma.envVariable.updateMany({
    where: {
      projectId: db.projectId,
      key: envVarName,
    },
    data: {
      value: connectionString,
    },
  });

  return {
    host: db.host,
    port: db.port,
    database: db.database,
    username: db.username,
    password: newPassword,
    connectionString,
  };
}
