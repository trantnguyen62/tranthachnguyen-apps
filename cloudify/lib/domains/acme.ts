/**
 * ACME Client for Let's Encrypt
 * Handles certificate issuance and renewal using the ACME protocol
 *
 * Supports:
 * - HTTP-01 challenge (webroot method)
 * - DNS-01 challenge (via Cloudflare)
 * - Certificate generation and renewal
 * - Staging environment for testing
 */

import crypto from "crypto";
import { execFileSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from "fs";
import os from "os";
import path from "path";
import {
  setupAcmeChallengeRecord,
  removeAcmeChallengeRecord,
  isCloudflareConfigured,
} from "@/lib/integrations/cloudflare";
import { prisma } from "@/lib/prisma";
import { isValidDomain, validateDomains } from "@/lib/domains/validate";

// ACME Directory URLs
const ACME_DIRECTORY = {
  production: "https://acme-v02.api.letsencrypt.org/directory",
  staging: "https://acme-staging-v02.api.letsencrypt.org/directory",
};

// Configuration
const ACME_EMAIL = process.env.ACME_EMAIL || "admin@tranthachnguyen.com";
const ACME_ENV = (process.env.LETSENCRYPT_ENV || "production") as "production" | "staging";
const CERTBOT_WEBROOT = process.env.CERTBOT_WEBROOT || "/var/www/certbot";

/**
 * ACME account key (cached in memory, persisted to database)
 */
let accountKey: crypto.KeyObject | null = null;
let accountUrl: string | null = null;

/**
 * Load ACME account from database
 */
async function loadAccountFromDatabase(): Promise<boolean> {
  try {
    const account = await prisma.acmeAccount.findUnique({
      where: { environment: ACME_ENV },
    });

    if (account) {
      accountKey = crypto.createPrivateKey(account.privateKey);
      accountUrl = account.accountUrl;
      console.log(`[ACME] Loaded ${ACME_ENV} account from database`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[ACME] Failed to load account from database:", error);
    return false;
  }
}

/**
 * Save ACME account to database
 */
async function saveAccountToDatabase(
  privateKey: crypto.KeyObject,
  acmeAccountUrl: string
): Promise<void> {
  try {
    const pemKey = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

    await prisma.acmeAccount.upsert({
      where: { environment: ACME_ENV },
      update: {
        accountUrl: acmeAccountUrl,
        privateKey: pemKey,
        email: ACME_EMAIL,
      },
      create: {
        environment: ACME_ENV,
        accountUrl: acmeAccountUrl,
        privateKey: pemKey,
        email: ACME_EMAIL,
      },
    });
    console.log(`[ACME] Saved ${ACME_ENV} account to database`);
  } catch (error) {
    console.error("[ACME] Failed to save account to database:", error);
    throw error;
  }
}

/**
 * Challenge types
 */
export type ChallengeType = "http-01" | "dns-01";

/**
 * Certificate request result
 */
export interface CertificateResult {
  success: boolean;
  certificate?: string;
  privateKey?: string;
  chain?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * ACME directory structure
 */
interface AcmeDirectory {
  newNonce: string;
  newAccount: string;
  newOrder: string;
  revokeCert: string;
  keyChange: string;
}

/**
 * ACME order structure
 */
interface AcmeOrder {
  status: "pending" | "ready" | "processing" | "valid" | "invalid";
  expires: string;
  identifiers: Array<{ type: string; value: string }>;
  authorizations: string[];
  finalize: string;
  certificate?: string;
}

/**
 * ACME authorization structure
 */
interface AcmeAuthorization {
  status: "pending" | "valid" | "invalid" | "deactivated" | "expired" | "revoked";
  identifier: { type: string; value: string };
  challenges: Array<{
    type: string;
    status: string;
    url: string;
    token: string;
  }>;
}

/**
 * Generate or get account key (loads from database if available)
 */
async function getAccountKey(): Promise<crypto.KeyObject> {
  if (accountKey) {
    return accountKey;
  }

  // Try to load from database first
  const loaded = await loadAccountFromDatabase();
  if (loaded && accountKey) {
    return accountKey;
  }

  // Generate new ECDSA key (will be saved when account is created)
  console.log(`[ACME] Generating new account key for ${ACME_ENV}`);
  const { privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });

  accountKey = privateKey;
  return privateKey;
}

/**
 * Get JWK thumbprint for key authorization
 */
function getJwkThumbprint(key: crypto.KeyObject): string {
  const jwk = key.export({ format: "jwk" }) as { crv: string; kty: string; x: string; y: string };

  // Create canonical JWK representation (sorted keys, no whitespace)
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  });

  // SHA-256 hash and base64url encode
  const hash = crypto.createHash("sha256").update(canonical).digest();
  return hash.toString("base64url");
}

/**
 * Base64url encode
 */
function base64url(data: Buffer | string): string {
  const buffer = typeof data === "string" ? Buffer.from(data) : data;
  return buffer.toString("base64url");
}

/**
 * Create JWS (JSON Web Signature) for ACME request
 */
function createJws(
  payload: unknown,
  url: string,
  nonce: string,
  key: crypto.KeyObject,
  keyId?: string
): string {
  const jwk = key.export({ format: "jwk" });

  const protectedHeader: Record<string, unknown> = {
    alg: "ES256",
    nonce,
    url,
  };

  if (keyId) {
    protectedHeader.kid = keyId;
  } else {
    protectedHeader.jwk = {
      crv: (jwk as { crv: string }).crv,
      kty: (jwk as { kty: string }).kty,
      x: (jwk as { x: string }).x,
      y: (jwk as { y: string }).y,
    };
  }

  const protectedB64 = base64url(JSON.stringify(protectedHeader));
  const payloadB64 = payload === "" ? "" : base64url(JSON.stringify(payload));

  const signatureInput = `${protectedB64}.${payloadB64}`;
  const signature = crypto.sign("sha256", Buffer.from(signatureInput), key);

  // Convert DER signature to raw format (required by ACME)
  const rawSignature = derToRaw(signature);

  return JSON.stringify({
    protected: protectedB64,
    payload: payloadB64,
    signature: base64url(rawSignature),
  });
}

/**
 * Convert DER encoded ECDSA signature to raw format
 */
function derToRaw(derSignature: Buffer): Buffer {
  // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  let offset = 2; // Skip 0x30 and total length

  // Read r
  if (derSignature[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const rLength = derSignature[offset];
  offset++;
  let r = derSignature.subarray(offset, offset + rLength);
  offset += rLength;

  // Read s
  if (derSignature[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const sLength = derSignature[offset];
  offset++;
  let s = derSignature.subarray(offset, offset + sLength);

  // Remove leading zeros (if present for positive number padding)
  if (r[0] === 0 && r.length > 32) r = r.subarray(1);
  if (s[0] === 0 && s.length > 32) s = s.subarray(1);

  // Pad to 32 bytes each
  const raw = Buffer.alloc(64);
  r.copy(raw, 32 - r.length);
  s.copy(raw, 64 - s.length);

  return raw;
}

/**
 * Get ACME directory
 */
async function getDirectory(): Promise<AcmeDirectory> {
  const directoryUrl = ACME_DIRECTORY[ACME_ENV];
  const response = await fetch(directoryUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ACME directory: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a fresh nonce
 */
async function getNonce(directory: AcmeDirectory): Promise<string> {
  const response = await fetch(directory.newNonce, { method: "HEAD" });
  const nonce = response.headers.get("replay-nonce");

  if (!nonce) {
    throw new Error("Failed to get nonce from ACME server");
  }

  return nonce;
}

/**
 * Make ACME request with JWS
 */
async function acmeRequest<T>(
  url: string,
  payload: unknown,
  key: crypto.KeyObject,
  nonce: string,
  keyId?: string
): Promise<{ data: T; nonce: string; location?: string }> {
  const body = createJws(payload, url, nonce, key, keyId);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/jose+json",
    },
    body,
  });

  const newNonce = response.headers.get("replay-nonce") || nonce;
  const location = response.headers.get("location") || undefined;

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ACME error: ${error.detail || JSON.stringify(error)}`);
  }

  // Some responses are empty (204)
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return { data: data as T, nonce: newNonce, location };
}

/**
 * Create or get ACME account (with database persistence)
 */
async function getOrCreateAccount(
  directory: AcmeDirectory,
  key: crypto.KeyObject,
  nonce: string
): Promise<{ accountUrl: string; nonce: string }> {
  // Return cached account URL if available
  if (accountUrl) {
    return { accountUrl, nonce };
  }

  // Try to load from database first
  const loaded = await loadAccountFromDatabase();
  if (loaded && accountUrl) {
    return { accountUrl, nonce };
  }

  // Create new ACME account
  const payload = {
    termsOfServiceAgreed: true,
    contact: [`mailto:${ACME_EMAIL}`],
  };

  const result = await acmeRequest<{ status: string }>(
    directory.newAccount,
    payload,
    key,
    nonce
  );

  if (!result.location) {
    throw new Error("Failed to get account URL");
  }

  accountUrl = result.location;

  // Persist to database
  await saveAccountToDatabase(key, result.location);

  return { accountUrl: result.location, nonce: result.nonce };
}

/**
 * Create certificate order
 */
async function createOrder(
  directory: AcmeDirectory,
  key: crypto.KeyObject,
  nonce: string,
  keyId: string,
  domains: string[]
): Promise<{ order: AcmeOrder; orderUrl: string; nonce: string }> {
  const payload = {
    identifiers: domains.map((domain) => ({ type: "dns", value: domain })),
  };

  const result = await acmeRequest<AcmeOrder>(
    directory.newOrder,
    payload,
    key,
    nonce,
    keyId
  );

  if (!result.location) {
    throw new Error("Failed to get order URL");
  }

  return { order: result.data, orderUrl: result.location, nonce: result.nonce };
}

/**
 * Get authorization details
 */
async function getAuthorization(
  url: string,
  key: crypto.KeyObject,
  nonce: string,
  keyId: string
): Promise<{ auth: AcmeAuthorization; nonce: string }> {
  const result = await acmeRequest<AcmeAuthorization>(url, "", key, nonce, keyId);
  return { auth: result.data, nonce: result.nonce };
}

/**
 * Respond to HTTP-01 challenge
 */
async function respondToHttp01Challenge(
  token: string,
  keyAuthorization: string
): Promise<void> {
  // Create webroot directory (safe - no shell involved)
  const challengeDir = path.join(CERTBOT_WEBROOT, ".well-known", "acme-challenge");
  mkdirSync(challengeDir, { recursive: true });

  // Validate token to prevent path traversal (ACME tokens are base64url)
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    throw new Error("Invalid ACME challenge token");
  }

  // Write challenge file
  const challengePath = path.join(challengeDir, token);
  writeFileSync(challengePath, keyAuthorization);

  console.log(`[ACME] HTTP-01 challenge file created at ${challengePath}`);
}

/**
 * Respond to DNS-01 challenge via Cloudflare
 */
async function respondToDns01Challenge(
  domain: string,
  keyAuthorization: string
): Promise<boolean> {
  if (!isCloudflareConfigured()) {
    throw new Error("Cloudflare not configured for DNS-01 challenge");
  }

  // DNS-01 requires SHA-256 hash of key authorization, base64url encoded
  const hash = crypto.createHash("sha256").update(keyAuthorization).digest();
  const challengeValue = hash.toString("base64url");

  const record = await setupAcmeChallengeRecord(domain, challengeValue);
  if (!record) {
    throw new Error("Failed to create ACME challenge DNS record");
  }

  console.log(`[ACME] DNS-01 challenge record created for ${domain}`);

  // Wait for DNS propagation
  await new Promise((resolve) => setTimeout(resolve, 10000));

  return true;
}

/**
 * Notify ACME server that challenge is ready
 */
async function notifyChallengeReady(
  challengeUrl: string,
  key: crypto.KeyObject,
  nonce: string,
  keyId: string
): Promise<string> {
  const result = await acmeRequest<{ status: string }>(
    challengeUrl,
    {},
    key,
    nonce,
    keyId
  );
  return result.nonce;
}

/**
 * Poll for authorization status
 */
async function pollAuthorizationStatus(
  authUrl: string,
  key: crypto.KeyObject,
  nonce: string,
  keyId: string,
  maxAttempts = 30
): Promise<{ status: string; nonce: string }> {
  let currentNonce = nonce;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await getAuthorization(authUrl, key, currentNonce, keyId);
    currentNonce = result.nonce;

    if (result.auth.status === "valid") {
      return { status: "valid", nonce: currentNonce };
    }

    if (result.auth.status === "invalid") {
      throw new Error("Authorization failed: challenge invalid");
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Authorization timed out");
}

/**
 * Generate CSR (Certificate Signing Request)
 */
function generateCsr(domains: string[]): { csr: string; privateKey: string } {
  // Validate all domains before using them in OpenSSL config (prevents injection)
  const validation = validateDomains(domains);
  if (!validation.valid) {
    throw new Error(`Invalid domain names: ${validation.invalid.join(", ")}`);
  }

  // Generate RSA key for the certificate
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const keyPath = path.join(tempDir, `cloudify-key-${timestamp}.pem`);
  const csrPath = path.join(tempDir, `cloudify-csr-${timestamp}.pem`);
  const configPath = path.join(tempDir, `cloudify-csr-${timestamp}.cnf`);

  try {
    // Write private key
    writeFileSync(keyPath, privateKey.export({ type: "pkcs8", format: "pem" }));

    // Create OpenSSL config for SAN (Subject Alternative Names)
    // Domains are pre-validated above — safe for config file
    const primaryDomain = domains[0];
    const sanList = domains.map((d, i) => `DNS.${i + 1} = ${d}`).join("\n");

    const opensslConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[req_distinguished_name]
CN = ${primaryDomain}

[req_ext]
subjectAltName = @alt_names

[alt_names]
${sanList}
`;

    writeFileSync(configPath, opensslConfig);

    // Generate CSR using execFileSync (safe — no shell interpolation)
    execFileSync("openssl", [
      "req", "-new",
      "-key", keyPath,
      "-out", csrPath,
      "-config", configPath,
    ], { stdio: "pipe" });

    const csrPem = readFileSync(csrPath, "utf-8");

    // Extract DER-encoded CSR (remove PEM headers and decode)
    const csrB64 = csrPem
      .replace("-----BEGIN CERTIFICATE REQUEST-----", "")
      .replace("-----END CERTIFICATE REQUEST-----", "")
      .replace(/\s/g, "");

    const csrDer = Buffer.from(csrB64, "base64");

    return {
      csr: csrDer.toString("base64url"),
      privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    };
  } finally {
    // Clean up temp files
    try {
      unlinkSync(keyPath);
      unlinkSync(csrPath);
      unlinkSync(configPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Finalize order and get certificate
 */
async function finalizeOrder(
  finalizeUrl: string,
  csr: string,
  key: crypto.KeyObject,
  nonce: string,
  keyId: string
): Promise<{ nonce: string }> {
  const result = await acmeRequest<AcmeOrder>(
    finalizeUrl,
    { csr },
    key,
    nonce,
    keyId
  );
  return { nonce: result.nonce };
}

/**
 * Poll for order completion and get certificate
 */
async function pollOrderStatus(
  orderUrl: string,
  key: crypto.KeyObject,
  nonce: string,
  keyId: string,
  maxAttempts = 30
): Promise<{ certificate: string; nonce: string }> {
  let currentNonce = nonce;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await acmeRequest<AcmeOrder>(orderUrl, "", key, currentNonce, keyId);
    currentNonce = result.nonce;

    if (result.data.status === "valid" && result.data.certificate) {
      // Fetch certificate
      const certResult = await acmeRequest<string>(
        result.data.certificate,
        "",
        key,
        currentNonce,
        keyId
      );

      return { certificate: certResult.data, nonce: certResult.nonce };
    }

    if (result.data.status === "invalid") {
      throw new Error("Order failed: certificate issuance invalid");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Order timed out");
}

/**
 * Request certificate using ACME protocol
 */
export async function requestCertificate(
  domains: string[],
  challengeType: ChallengeType = "http-01"
): Promise<CertificateResult> {
  try {
    // Validate all domains before processing
    const validation = validateDomains(domains);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid domain names: ${validation.invalid.join(", ")}`,
      };
    }

    console.log(`[ACME] Requesting certificate for: ${domains.join(", ")}`);
    console.log(`[ACME] Using ${ACME_ENV} environment with ${challengeType} challenge`);

    // Get account key
    const key = await getAccountKey();
    const thumbprint = getJwkThumbprint(key);

    // Get directory
    const directory = await getDirectory();

    // Get nonce
    let nonce = await getNonce(directory);

    // Create or get account
    const accountResult = await getOrCreateAccount(directory, key, nonce);
    nonce = accountResult.nonce;
    const keyId = accountResult.accountUrl;

    // Create order
    const orderResult = await createOrder(directory, key, nonce, keyId, domains);
    nonce = orderResult.nonce;

    // Process each authorization
    for (const authUrl of orderResult.order.authorizations) {
      const authResult = await getAuthorization(authUrl, key, nonce, keyId);
      nonce = authResult.nonce;

      const challenge = authResult.auth.challenges.find((c) => c.type === challengeType);
      if (!challenge) {
        throw new Error(`No ${challengeType} challenge available`);
      }

      const keyAuthorization = `${challenge.token}.${thumbprint}`;
      const domain = authResult.auth.identifier.value;

      // Respond to challenge
      if (challengeType === "http-01") {
        await respondToHttp01Challenge(challenge.token, keyAuthorization);
      } else if (challengeType === "dns-01") {
        await respondToDns01Challenge(domain, keyAuthorization);
      }

      // Notify ACME server
      nonce = await notifyChallengeReady(challenge.url, key, nonce, keyId);

      // Poll for validation
      const pollResult = await pollAuthorizationStatus(authUrl, key, nonce, keyId);
      nonce = pollResult.nonce;

      // Clean up DNS challenge if used
      if (challengeType === "dns-01") {
        await removeAcmeChallengeRecord(domain);
      }
    }

    // Generate CSR and finalize
    const { csr, privateKey } = generateCsr(domains);

    await finalizeOrder(orderResult.order.finalize, csr, key, nonce, keyId);

    // Poll for certificate
    const certResult = await pollOrderStatus(orderResult.orderUrl, key, nonce, keyId);

    // Parse expiration from certificate
    const expiresAt = parseCertificateExpiry(certResult.certificate);

    console.log(`[ACME] Certificate issued successfully, expires: ${expiresAt?.toISOString()}`);

    return {
      success: true,
      certificate: certResult.certificate,
      privateKey,
      expiresAt,
    };
  } catch (error) {
    console.error("[ACME] Certificate request failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Parse certificate expiration date
 */
function parseCertificateExpiry(certPem: string): Date | undefined {
  try {
    const tempPath = path.join(os.tmpdir(), `cert-${Date.now()}.pem`);
    writeFileSync(tempPath, certPem);

    try {
      // Use execFileSync (safe — no shell interpolation)
      const output = execFileSync("openssl", [
        "x509", "-in", tempPath, "-enddate", "-noout",
      ], { encoding: "utf-8" });

      // Parse: notAfter=Jan 15 12:00:00 2024 GMT
      const match = output.match(/notAfter=(.+)/);
      if (match) {
        return new Date(match[1].trim());
      }
    } finally {
      unlinkSync(tempPath);
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}

/**
 * Check if certificate needs renewal (30 days before expiry)
 */
export function needsRenewal(expiresAt: Date, thresholdDays = 30): boolean {
  const now = new Date();
  const threshold = new Date(expiresAt.getTime() - thresholdDays * 24 * 60 * 60 * 1000);
  return now >= threshold;
}

/**
 * Get ACME environment status
 */
export function getAcmeStatus(): {
  environment: "production" | "staging";
  email: string;
  directoryUrl: string;
} {
  return {
    environment: ACME_ENV,
    email: ACME_EMAIL,
    directoryUrl: ACME_DIRECTORY[ACME_ENV],
  };
}
