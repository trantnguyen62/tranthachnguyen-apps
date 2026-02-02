import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password hashing functions", () => {
  const testPassword = "SecurePassword123!";

  // Test 11: hashPassword() creates bcrypt hash with 12 salt rounds
  it("creates bcrypt hash with proper format", async () => {
    const hash = await hashPassword(testPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    // bcrypt hashes start with $2a$ or $2b$ followed by cost factor
    expect(hash).toMatch(/^\$2[ab]\$12\$/);
    // bcrypt hashes are 60 characters long
    expect(hash.length).toBe(60);
  });

  // Test 12: hashPassword() generates different hashes for same password
  it("generates different hashes for same password (salt uniqueness)", async () => {
    const hash1 = await hashPassword(testPassword);
    const hash2 = await hashPassword(testPassword);

    // Each hash should be different due to unique salts
    expect(hash1).not.toBe(hash2);

    // But both should still verify correctly
    expect(await verifyPassword(testPassword, hash1)).toBe(true);
    expect(await verifyPassword(testPassword, hash2)).toBe(true);
  }, 30000); // bcrypt is intentionally slow

  // Test 13: verifyPassword() returns true for correct password
  it("returns true for correct password", async () => {
    const hash = await hashPassword(testPassword);
    const result = await verifyPassword(testPassword, hash);

    expect(result).toBe(true);
  });

  // Test 14: verifyPassword() returns false for incorrect password
  it("returns false for incorrect password", async () => {
    const hash = await hashPassword(testPassword);
    const result = await verifyPassword("WrongPassword123!", hash);

    expect(result).toBe(false);
  });

  // Test 15: verifyPassword() handles special characters in password
  it("handles special characters in password", async () => {
    const specialPassword = "P@$$w0rd!#$%^&*()_+-=[]{}|;':\",./<>?";
    const hash = await hashPassword(specialPassword);

    expect(await verifyPassword(specialPassword, hash)).toBe(true);
    expect(await verifyPassword("different", hash)).toBe(false);
  });
});
