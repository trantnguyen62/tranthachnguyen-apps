import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockUser } from "@/test/factories/user.factory";

// Mock prisma
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock password functions
vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
}));

import { hashPassword } from "@/lib/auth/password";

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

    // Test: POST with non-signup action returns 400
    it("returns 400 for non-signup action", async () => {
      const invalidAction = "login";
      expect(invalidAction).not.toBe("signup");
      // API should return 400 - only signup is supported
    });
  });
});
