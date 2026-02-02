import { describe, it, expect, vi, beforeEach } from "vitest";
import { signToken, verifyToken, JWTPayload } from "@/lib/auth/jwt";
import jwt from "jsonwebtoken";

describe("JWT authentication functions", () => {
  const testPayload: JWTPayload = {
    userId: "user-123",
    sessionId: "session-456",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 5: signToken() creates valid JWT with userId and sessionId
  it("creates valid JWT with userId and sessionId", () => {
    const token = signToken(testPayload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts

    // Verify the payload is embedded
    const decoded = jwt.decode(token) as JWTPayload & { exp: number };
    expect(decoded.userId).toBe(testPayload.userId);
    expect(decoded.sessionId).toBe(testPayload.sessionId);
  });

  // Test 6: signToken() respects custom expiration time
  it("respects custom expiration time", () => {
    const token = signToken(testPayload, "1h");
    const decoded = jwt.decode(token) as { exp: number; iat: number };

    // 1 hour = 3600 seconds
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(3600);
  });

  // Test 7: signToken() uses default 7 day expiration when not specified
  it("uses default 7 day expiration when not specified", () => {
    const token = signToken(testPayload);
    const decoded = jwt.decode(token) as { exp: number; iat: number };

    // 7 days = 7 * 24 * 60 * 60 = 604800 seconds
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(604800);
  });

  // Test 8: verifyToken() successfully decodes valid JWT
  it("successfully decodes valid JWT", () => {
    const token = signToken(testPayload);
    const result = verifyToken(token);

    expect(result).not.toBeNull();
    expect(result?.userId).toBe(testPayload.userId);
    expect(result?.sessionId).toBe(testPayload.sessionId);
  });

  // Test 9: verifyToken() returns null for invalid JWT
  it("returns null for invalid JWT", () => {
    const invalidToken = "invalid.token.here";
    const result = verifyToken(invalidToken);

    expect(result).toBeNull();
  });

  // Test 10: verifyToken() returns null for expired JWT
  it("returns null for expired JWT", () => {
    // Create a token that expires immediately
    const token = signToken(testPayload, "-1s");
    const result = verifyToken(token);

    expect(result).toBeNull();
  });
});
