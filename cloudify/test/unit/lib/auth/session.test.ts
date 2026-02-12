import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "@/test/factories/user.factory";

// Use vi.hoisted to define mocks that will be hoisted with vi.mock
const { mockPrisma, mockCookies } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  mockCookies: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

// Import after mocks
import {
  createSession,
  getSession,
  clearSession,
} from "@/lib/auth/session";
import jwt from "jsonwebtoken";

// Helper to create JWT tokens for testing (mirrors the inlined signToken in session.ts)
function signToken(payload: { userId: string }, expiresIn: string = "7d"): string {
  const secret = process.env.JWT_SECRET || "development-secret-change-in-production";
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

describe("Session management functions", () => {
  const mockUser = createMockUser({ id: "user-123", email: "test@example.com" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 16: createSession() signs a JWT (no DB session)
  it("creates a JWT token", async () => {
    const jwtToken = await createSession(mockUser.id);

    expect(jwtToken).toBeDefined();
    expect(typeof jwtToken).toBe("string");
    // Verify the token is a valid JWT containing userId
    const decoded = jwt.decode(jwtToken) as { userId: string };
    expect(decoded.userId).toBe(mockUser.id);
  });

  // Test 17: createSession() sets httpOnly secure cookie
  it("sets httpOnly secure cookie", async () => {
    await createSession(mockUser.id);

    expect(mockCookies.set).toHaveBeenCalledWith(
      "cloudify_session",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  // Test 18: createSession() accepts userAgent parameter (unused but signature preserved)
  it("accepts userAgent parameter", async () => {
    const userAgent = "Mozilla/5.0 Test Browser";

    const jwtToken = await createSession(mockUser.id, userAgent);

    expect(jwtToken).toBeDefined();
    expect(typeof jwtToken).toBe("string");
  });

  // Test 19: getSession() returns user data for valid JWT
  it("returns user data for valid session", async () => {
    const jwtToken = signToken({ userId: mockUser.id });
    mockCookies.get.mockReturnValue({ value: jwtToken });

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getSession();

    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockUser.id);
    expect(result?.email).toBe(mockUser.email);
  });

  // Test 20: getSession() returns null when no cookie present
  it("returns null when no cookie present", async () => {
    mockCookies.get.mockReturnValue(undefined);

    const result = await getSession();

    expect(result).toBeNull();
  });

  // Test 21: getSession() returns null when user not found
  it("returns null when user not found", async () => {
    const jwtToken = signToken({ userId: "nonexistent-user" });
    mockCookies.get.mockReturnValue({ value: jwtToken });

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getSession();

    expect(result).toBeNull();
    // Should clear the stale cookie
    expect(mockCookies.delete).toHaveBeenCalledWith("cloudify_session");
  });

  // Test 22: clearSession() deletes cookie
  it("deletes session cookie", async () => {
    await clearSession();

    expect(mockCookies.delete).toHaveBeenCalledWith("cloudify_session");
  });

  // Test: getSession() returns null for invalid JWT
  it("returns null for invalid JWT", async () => {
    mockCookies.get.mockReturnValue({ value: "invalid-jwt-token" });

    const result = await getSession();

    expect(result).toBeNull();
  });
});
