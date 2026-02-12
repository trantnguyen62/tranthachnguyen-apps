/**
 * Database Provisioner
 * Manages provisioning of managed databases for projects
 */

import { prisma } from "@/lib/prisma";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import {
  createDatabaseContainer,
  removeDatabaseContainer,
  generateDatabaseCredentials,
  waitForDatabaseReady,
  getContainerName,
} from "@/lib/database/docker-provisioner";
import {
  createK8sDatabase,
  removeK8sDatabase,
  generateK8sCredentials,
  getK8sResourceName,
} from "@/lib/database/k8s-provisioner";
import { createLogger } from "@/lib/logging/logger";

const log = createLogger("database:provisioner");

/**
 * Whether to use K8s (StatefulSets) instead of Docker containers
 * for Cloudify-hosted databases.
 */
const useK8sMode =
  process.env.USE_K3S_BUILDS === "true" ||
  process.env.K3S_ENABLED === "true";

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
  const dbType = request.type.toUpperCase() as "POSTGRESQL" | "MYSQL" | "REDIS" | "MONGODB";
  const db = await prisma.managedDatabase.create({
    data: {
      projectId: request.projectId,
      name: request.name,
      type: dbType,
      provider: request.provider,
      status: "PROVISIONING",
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
        credentials = await provisionCloudifyDatabase({
          ...request,
          databaseId,
        });
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
        status: "ACTIVE",
        version: credentials.version,
      },
    });

    // Inject connection string as env variable
    await injectEnvVariable(request.projectId, databaseId);
  } catch (error) {
    await prisma.managedDatabase.update({
      where: { id: databaseId },
      data: {
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Provisioning failed",
      },
    });
    throw error;
  }
}

/**
 * Provision a Cloudify-managed database.
 * Uses K8s StatefulSets when K3S_ENABLED is set, otherwise Docker containers.
 */
async function provisionCloudifyDatabase(
  request: DatabaseProvisionRequest & { databaseId: string }
): Promise<DatabaseCredentials> {
  if (useK8sMode) {
    return provisionCloudifyDatabaseK8s(request);
  }
  return provisionCloudifyDatabaseDocker(request);
}

/**
 * Provision via Docker containers.
 */
async function provisionCloudifyDatabaseDocker(
  request: DatabaseProvisionRequest & { databaseId: string }
): Promise<DatabaseCredentials> {
  const { username, password } = generateDatabaseCredentials();
  const dbName = `cloudify_${request.projectId.slice(0, 8)}_${request.name}`.replace(
    /[^a-zA-Z0-9_]/g,
    "_"
  );

  log.info("Provisioning Cloudify database via Docker", {
    type: request.type,
    databaseId: request.databaseId,
    dbName,
  });

  // Create the Docker container
  const containerResult = await createDatabaseContainer(request.type, {
    databaseId: request.databaseId,
    type: request.type,
    name: dbName,
    username,
    password,
  });

  // Store the container ID in the database record
  await prisma.managedDatabase.update({
    where: { id: request.databaseId },
    data: { containerId: containerResult.containerId },
  });

  // Wait for the database to be ready
  const containerName = getContainerName(request.databaseId);
  await waitForDatabaseReady(request.type, containerName, {
    username,
    password,
    database: dbName,
  });

  log.info("Cloudify database provisioned successfully", {
    type: request.type,
    databaseId: request.databaseId,
    containerName,
  });

  // Build credentials based on type
  switch (request.type) {
    case "postgresql":
      return {
        host: containerName,
        port: 5432,
        database: dbName,
        username,
        password,
        version: "16",
      };
    case "mysql":
      return {
        host: containerName,
        port: 3306,
        database: dbName,
        username,
        password,
        version: "8.0",
      };
    case "redis":
      return {
        host: containerName,
        port: 6379,
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
 * Provision via K8s StatefulSets.
 */
async function provisionCloudifyDatabaseK8s(
  request: DatabaseProvisionRequest & { databaseId: string }
): Promise<DatabaseCredentials> {
  const { username, password } = generateK8sCredentials();
  const dbName = `cloudify_${request.projectId.slice(0, 8)}_${request.name}`.replace(
    /[^a-zA-Z0-9_]/g,
    "_"
  );

  log.info("Provisioning Cloudify database via K8s", {
    type: request.type,
    databaseId: request.databaseId,
    dbName,
  });

  const result = await createK8sDatabase({
    databaseId: request.databaseId,
    type: request.type,
    name: dbName,
    username,
    password,
    plan: request.plan,
  });

  // Store the K8s resource name as containerId for tracking
  await prisma.managedDatabase.update({
    where: { id: request.databaseId },
    data: { containerId: result.serviceName },
  });

  log.info("Cloudify database provisioned via K8s", {
    type: request.type,
    databaseId: request.databaseId,
    host: result.host,
  });

  switch (request.type) {
    case "postgresql":
      return {
        host: result.host,
        port: result.port,
        database: dbName,
        username,
        password,
        version: "16",
      };
    case "mysql":
      return {
        host: result.host,
        port: result.port,
        database: dbName,
        username,
        password,
        version: "8.0",
      };
    case "redis":
      return {
        host: result.host,
        port: result.port,
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

  // Remove infrastructure for Cloudify-hosted databases
  if (db.provider === "cloudify") {
    if (useK8sMode) {
      try {
        await removeK8sDatabase(
          databaseId,
          db.type as "postgresql" | "mysql" | "redis"
        );
      } catch (error) {
        log.warn("Failed to remove K8s resources during delete", {
          databaseId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      const containerName = getContainerName(databaseId);
      try {
        await removeDatabaseContainer(containerName);
      } catch (error) {
        log.warn("Failed to remove container during delete", {
          containerName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

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
    data: { status: "DELETING" },
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
  db: {
    type: string;
    provider: string;
    name: string;
    projectId: string;
    containerId?: string | null;
  }
) {
  try {
    log.info("Starting deprovisioning", {
      databaseId,
      provider: db.provider,
      type: db.type,
    });

    // Provider-specific cleanup
    if (db.provider === "cloudify") {
      if (useK8sMode) {
        // Remove K8s StatefulSet, Service, Secret, PVC
        try {
          await removeK8sDatabase(
            databaseId,
            db.type.toLowerCase() as "postgresql" | "mysql" | "redis"
          );
          log.info("K8s database resources removed", { databaseId });
        } catch (error) {
          log.warn("Failed to remove K8s resources (may already be removed)", {
            databaseId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        // Remove the Docker container
        const containerName = getContainerName(databaseId);
        try {
          await removeDatabaseContainer(containerName);
          log.info("Docker container removed", { containerName, databaseId });
        } catch (error) {
          log.warn("Failed to remove Docker container (may already be removed)", {
            containerName,
            databaseId,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // Also try removing by container ID if available
        if (db.containerId) {
          try {
            await removeDatabaseContainer(db.containerId);
          } catch {
            // Already removed by name, this is expected
          }
        }
      }
    }

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

    // Update status to DELETED instead of hard-deleting
    await prisma.managedDatabase.update({
      where: { id: databaseId },
      data: { status: "DELETED" },
    });

    log.info("Database deprovisioned successfully", { databaseId });
  } catch (error) {
    log.error("Deprovisioning failed", error instanceof Error ? error : undefined, {
      databaseId,
    });
    await prisma.managedDatabase.update({
      where: { id: databaseId },
      data: {
        status: "ERROR",
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

  if (db.status !== "ACTIVE") {
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
