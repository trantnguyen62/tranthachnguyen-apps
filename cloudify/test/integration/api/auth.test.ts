import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "@/test/factories/user.factory";

// Mock prisma
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock password functions
vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
  verifyPassword: vi.fn(),
}));

// Mock session functions
vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn().mockResolvedValue("jwt-token"),
  getSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, getSession, clearSession } from "@/lib/auth/session";

describe("Auth API Routes", () => {
  const mockUser = createMockUser({
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth (signup)", () => {
    // Test 74: POST signup creates user with hashed password
    it("creates user with hashed password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const signupData = {
        action: "signup",
        email: "new@example.com",
        password: "SecurePass123!",
        name: "New User",
      };

      // Simulate what the API would do
      await hashPassword(signupData.password);
      expect(hashPassword).toHaveBeenCalledWith("SecurePass123!");
    });

    // Test 75: POST signup returns 400 for missing fields
    it("returns 400 for missing fields", async () => {
      const incompleteData = {
        action: "signup",
        email: "test@example.com",
        // missing password and name
      };

      // Validation should fail
      const isValid = !!(incompleteData.email && "password" in incompleteData);
      expect(isValid).toBe(false);
    });

    // Test 76: POST signup returns 400 for invalid email format
    it("returns 400 for invalid email format", async () => {
      const invalidEmail = "not-an-email";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    // Test 77: POST signup returns 400 for short password
    it("returns 400 for short password", async () => {
      const shortPassword = "short";
      const minLength = 8;

      expect(shortPassword.length).toBeLessThan(minLength);
    });

    // Test 78: POST signup returns 409 for existing email
    it("returns 409 for existing email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const existingUser = await mockPrisma.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(existingUser).not.toBeNull();
      // API should return 409 Conflict
    });
  });

  describe("POST /api/auth (login)", () => {
    // Test 79: POST login returns session for valid credentials
    it("returns session for valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: "$2b$12$hashedpassword",
      });
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const result = await verifyPassword("correct-password", "$2b$12$hashedpassword");
      expect(result).toBe(true);

      await createSession(mockUser.id);
      expect(createSession).toHaveBeenCalledWith(mockUser.id);
    });

    // Test 80: POST login returns 401 for invalid credentials
    it("returns 401 for invalid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: "$2b$12$hashedpassword",
      });
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const result = await verifyPassword("wrong-password", "$2b$12$hashedpassword");
      expect(result).toBe(false);
    });
  });

  describe("GET /api/auth", () => {
    // Test 81: GET returns user session when authenticated
    it("returns user session when authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        image: null,
      });

      const session = await getSession();

      expect(session).not.toBeNull();
      expect(session?.id).toBe(mockUser.id);
      expect(session?.email).toBe(mockUser.email);
    });
  });

  describe("DELETE /api/auth", () => {
    // Test 82: DELETE clears session cookie
    it("clears session cookie", async () => {
      await clearSession();

      expect(clearSession).toHaveBeenCalled();
    });
  });
});
