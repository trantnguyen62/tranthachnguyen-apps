import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "@/test/factories/user.factory";

// Use vi.hoisted to define mocks that will be hoisted with vi.mock
const { mockPrisma, mockCookies } = vi.hoisted(() => ({
  mockPrisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
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
  getSessionFromRequest,
} from "@/lib/auth/session";
import { signToken } from "@/lib/auth/jwt";

describe("Session management functions", () => {
  const mockUser = createMockUser({ id: "user-123", email: "test@example.com" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 16: createSession() creates database session with correct expiry
  it("creates database session with correct expiry", async () => {
    const sessionData = {
      id: "session-123",
      userId: mockUser.id,
      token: "random-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    mockPrisma.session.create.mockResolvedValue(sessionData);

    const jwt = await createSession(mockUser.id);

    expect(mockPrisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: mockUser.id,
        expiresAt: expect.any(Date),
      }),
    });
    expect(jwt).toBeDefined();
    expect(typeof jwt).toBe("string");
  });

  // Test 17: createSession() sets httpOnly secure cookie
  it("sets httpOnly secure cookie", async () => {
    const sessionData = {
      id: "session-123",
      userId: mockUser.id,
      token: "random-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    mockPrisma.session.create.mockResolvedValue(sessionData);

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

  // Test 18: createSession() stores user agent when provided
  it("stores user agent when provided", async () => {
    const userAgent = "Mozilla/5.0 Test Browser";
    const sessionData = {
      id: "session-123",
      userId: mockUser.id,
      token: "random-token",
      expiresAt: new Date(),
      userAgent,
    };

    mockPrisma.session.create.mockResolvedValue(sessionData);

    await createSession(mockUser.id, userAgent);

    expect(mockPrisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userAgent,
      }),
    });
  });

  // Test 19: getSession() returns user data for valid session
  it("returns user data for valid session", async () => {
    const jwt = signToken({ userId: mockUser.id, sessionId: "session-123" });
    mockCookies.get.mockReturnValue({ value: jwt });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: "session-123",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: mockUser,
    });

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

  // Test 21: getSession() returns null for expired session
  it("returns null for expired session", async () => {
    const jwt = signToken({ userId: mockUser.id, sessionId: "session-123" });
    mockCookies.get.mockReturnValue({ value: jwt });
    mockPrisma.session.delete.mockResolvedValue({});

    mockPrisma.session.findUnique.mockResolvedValue({
      id: "session-123",
      expiresAt: new Date(Date.now() - 1000),
      user: mockUser,
    });

    const result = await getSession();

    expect(result).toBeNull();
  });

  // Test 22: clearSession() deletes database session and cookie
  it("deletes database session and cookie", async () => {
    const jwt = signToken({ userId: mockUser.id, sessionId: "session-123" });
    mockCookies.get.mockReturnValue({ value: jwt });
    mockPrisma.session.delete.mockResolvedValue({});

    await clearSession();

    expect(mockPrisma.session.delete).toHaveBeenCalledWith({
      where: { id: "session-123" },
    });
    expect(mockCookies.delete).toHaveBeenCalledWith("cloudify_session");
  });

  // Test 23: getSessionFromRequest() extracts session from request headers
  it("extracts session from request headers", async () => {
    const jwt = signToken({ userId: mockUser.id, sessionId: "session-123" });
    const request = new Request("http://localhost", {
      headers: { cookie: `cloudify_session=${jwt}` },
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: "session-123",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: mockUser,
    });

    const result = await getSessionFromRequest(request);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockUser.id);
  });
});
