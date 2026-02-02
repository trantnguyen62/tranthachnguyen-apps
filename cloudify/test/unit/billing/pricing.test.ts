/**
 * Bug-Finding Tests for Pricing Module
 * Tests edge cases and invariants that should always hold
 */

import { describe, it, expect } from "vitest";
import {
  isUnlimited,
  hasExceededLimit,
  getUsagePercentage,
  formatLimit,
  formatBytes,
  calculateOverage,
  getPlan,
  getPlanLimits,
  PLANS,
  OVERAGE_PRICING,
} from "@/lib/billing/pricing";

describe("Pricing Module - Bug Finding Tests", () => {
  describe("isUnlimited()", () => {
    it("should return true only for -1", () => {
      expect(isUnlimited(-1)).toBe(true);
      expect(isUnlimited(0)).toBe(false);
      expect(isUnlimited(1)).toBe(false);
      expect(isUnlimited(-2)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
    });

    // Edge case: What about other negative numbers?
    it("should handle various negative numbers", () => {
      expect(isUnlimited(-0.5)).toBe(false);
      expect(isUnlimited(-100)).toBe(false);
      expect(isUnlimited(-Infinity)).toBe(false);
    });

    // Edge case: NaN and special values
    it("should handle NaN and special values", () => {
      expect(isUnlimited(NaN)).toBe(false);
      expect(isUnlimited(Infinity)).toBe(false);
      expect(isUnlimited(-Infinity)).toBe(false);
    });
  });

  describe("hasExceededLimit()", () => {
    // Property: If limit is unlimited, never exceeded
    it("should never exceed unlimited limit", () => {
      expect(hasExceededLimit(0, -1)).toBe(false);
      expect(hasExceededLimit(1000000, -1)).toBe(false);
      expect(hasExceededLimit(Number.MAX_SAFE_INTEGER, -1)).toBe(false);
    });

    // Property: current > limit means exceeded (AT limit is OK)
    it("should detect when limit is reached", () => {
      expect(hasExceededLimit(100, 100)).toBe(false); // AT limit is OK
      expect(hasExceededLimit(101, 100)).toBe(true);  // OVER limit is exceeded
      expect(hasExceededLimit(99, 100)).toBe(false);
    });

    // Edge case: Zero limit - 0 is not > 0, so not exceeded
    it("should handle zero limit", () => {
      expect(hasExceededLimit(0, 0)).toBe(false); // 0 > 0 is false
      expect(hasExceededLimit(1, 0)).toBe(true);  // 1 > 0 is true
    });

    // Edge case: Negative current value (should not happen, but what if?)
    it("should handle negative current values", () => {
      expect(hasExceededLimit(-1, 100)).toBe(false);
      expect(hasExceededLimit(-100, 0)).toBe(false);
    });

    // Edge case: Very large numbers
    it("should handle very large numbers", () => {
      expect(hasExceededLimit(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(false); // Equal, not exceeded
      expect(hasExceededLimit(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER)).toBe(false);
    });
  });

  describe("getUsagePercentage()", () => {
    // Property: 0 usage = 0%
    it("should return 0% for zero usage", () => {
      expect(getUsagePercentage(0, 100)).toBe(0);
      expect(getUsagePercentage(0, 1)).toBe(0);
      expect(getUsagePercentage(0, 1000000)).toBe(0);
    });

    // Property: usage = limit = 100%
    it("should return 100% when usage equals limit", () => {
      expect(getUsagePercentage(100, 100)).toBe(100);
      expect(getUsagePercentage(1, 1)).toBe(100);
      expect(getUsagePercentage(1000, 1000)).toBe(100);
    });

    // Property: unlimited = 0%
    it("should return 0% for unlimited", () => {
      expect(getUsagePercentage(0, -1)).toBe(0);
      expect(getUsagePercentage(1000000, -1)).toBe(0);
    });

    // Property: never exceed 100%
    it("should cap at 100% for over-limit usage", () => {
      expect(getUsagePercentage(200, 100)).toBe(100);
      expect(getUsagePercentage(1000000, 100)).toBe(100);
    });

    // BUG FINDER: Division by zero
    it("should handle zero limit without crashing", () => {
      // 0/0 = 0% (no usage means 0%)
      const result = getUsagePercentage(0, 0);
      expect(result).toBe(0);

      // Non-zero usage with zero limit = 100% (fully exceeded)
      const result2 = getUsagePercentage(50, 0);
      expect(result2).toBe(100);
    });

    // BUG FINDER: Negative values
    it("should handle negative values", () => {
      // Negative usage should return 0%
      const result = getUsagePercentage(-50, 100);
      expect(result).toBe(0);
    });

    // BUG FINDER: Floating point precision
    it("should handle floating point values", () => {
      const result = getUsagePercentage(1, 3);
      expect(result).toBe(33); // Rounded

      const result2 = getUsagePercentage(2, 3);
      expect(result2).toBe(67); // Rounded
    });
  });

  describe("formatLimit()", () => {
    it("should format unlimited correctly", () => {
      expect(formatLimit(-1)).toBe("Unlimited");
    });

    it("should format millions correctly", () => {
      expect(formatLimit(1000000)).toBe("1M");
      expect(formatLimit(5000000)).toBe("5M");
    });

    it("should format thousands correctly", () => {
      expect(formatLimit(1000)).toBe("1K");
      expect(formatLimit(100000)).toBe("100K");
    });

    it("should format small numbers correctly", () => {
      expect(formatLimit(0)).toBe("0");
      expect(formatLimit(1)).toBe("1");
      expect(formatLimit(999)).toBe("999");
    });

    // Edge case: Boundary values
    it("should handle boundary values", () => {
      expect(formatLimit(999)).toBe("999");
      expect(formatLimit(1000)).toBe("1K");
      expect(formatLimit(999999)).toBe("1000K");
      expect(formatLimit(1000000)).toBe("1M");
    });

    // BUG FINDER: Negative values (other than -1)
    it("should handle other negative values", () => {
      // Only -1 should be "Unlimited", what about -2?
      const result = formatLimit(-2);
      // This is a bug - -2 will be formatted as a number, not "Unlimited"
      expect(result).not.toBe("Unlimited");
    });
  });

  describe("formatBytes()", () => {
    it("should format gigabytes correctly", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
    });

    it("should format megabytes correctly", () => {
      expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
      expect(formatBytes(512 * 1024 * 1024)).toBe("512.0 MB");
    });

    it("should format kilobytes correctly", () => {
      expect(formatBytes(1024)).toBe("1.0 KB");
      expect(formatBytes(500 * 1024)).toBe("500.0 KB");
    });

    it("should format bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1)).toBe("1 B");
      expect(formatBytes(1023)).toBe("1023 B");
    });

    // BUG FINDER: Negative bytes
    it("should handle negative values", () => {
      // Negative bytes are invalid, should return "0 B"
      const result = formatBytes(-1024);
      expect(result).toBe("0 B");
    });

    // BUG FINDER: Very large values
    it("should handle very large values", () => {
      const result = formatBytes(1024 * 1024 * 1024 * 1024); // 1 TB
      expect(result).toBe("1024.0 GB"); // No TB formatting
    });
  });

  describe("calculateOverage()", () => {
    // Property: No overage if under limit
    it("should return 0 for usage under limit", () => {
      expect(calculateOverage(50, 100, 0.02)).toBe(0);
      expect(calculateOverage(99, 100, 0.02)).toBe(0);
      expect(calculateOverage(0, 100, 0.02)).toBe(0);
    });

    // Property: No overage for unlimited
    it("should return 0 for unlimited", () => {
      expect(calculateOverage(1000000, -1, 0.02)).toBe(0);
    });

    // Property: Correct overage calculation
    it("should calculate correct overage", () => {
      expect(calculateOverage(150, 100, 0.02)).toBe(1.0); // 50 * 0.02
      expect(calculateOverage(200, 100, 0.02)).toBe(2.0); // 100 * 0.02
    });

    // Edge case: Exactly at limit
    it("should return 0 when exactly at limit", () => {
      expect(calculateOverage(100, 100, 0.02)).toBe(0);
    });

    // BUG FINDER: Floating point precision
    it("should handle floating point calculations", () => {
      const result = calculateOverage(100.5, 100, 0.02);
      expect(result).toBeCloseTo(0.01, 10);
    });

    // BUG FINDER: Zero limit
    it("should handle zero limit", () => {
      // If limit is 0, everything is overage
      const result = calculateOverage(50, 0, 0.02);
      expect(result).toBe(1.0); // 50 * 0.02
    });

    // BUG FINDER: Negative usage
    it("should handle negative usage", () => {
      const result = calculateOverage(-10, 100, 0.02);
      expect(result).toBe(0); // max(0, -10 - 100) = 0
    });
  });

  describe("getPlan() and getPlanLimits()", () => {
    it("should return correct plans", () => {
      expect(getPlan("free").name).toBe("Hobby");
      expect(getPlan("pro").name).toBe("Pro");
      expect(getPlan("team").name).toBe("Team");
      expect(getPlan("enterprise").name).toBe("Enterprise");
    });

    // BUG FINDER: Invalid plan type
    it("should handle invalid plan type", () => {
      // What happens with an invalid plan?
      const result = getPlan("invalid" as any);
      expect(result.name).toBe("Hobby"); // Falls back to free
    });

    it("should return correct limits", () => {
      const limits = getPlanLimits("free");
      expect(limits.deploymentsPerMonth).toBe(100);
      expect(limits.buildMinutesPerMonth).toBe(100);
    });
  });

  describe("Plan Configuration Invariants", () => {
    // Property: Pro should always be better than Free
    it("should have Pro limits >= Free limits", () => {
      const free = PLANS.free.limits;
      const pro = PLANS.pro.limits;

      expect(pro.deploymentsPerMonth).toBeGreaterThanOrEqual(free.deploymentsPerMonth);
      expect(pro.buildMinutesPerMonth).toBeGreaterThanOrEqual(free.buildMinutesPerMonth);
      expect(pro.bandwidthGB).toBeGreaterThanOrEqual(free.bandwidthGB);
      expect(pro.projects).toBeGreaterThanOrEqual(free.projects);
    });

    // Property: Team should always be better than Pro
    it("should have Team limits >= Pro limits", () => {
      const pro = PLANS.pro.limits;
      const team = PLANS.team.limits;

      expect(team.deploymentsPerMonth).toBeGreaterThanOrEqual(pro.deploymentsPerMonth);
      expect(team.buildMinutesPerMonth).toBeGreaterThanOrEqual(pro.buildMinutesPerMonth);
      expect(team.bandwidthGB).toBeGreaterThanOrEqual(pro.bandwidthGB);
      expect(team.projects).toBeGreaterThanOrEqual(pro.projects);
    });

    // Property: Enterprise should be unlimited or highest
    it("should have Enterprise with unlimited or highest limits", () => {
      const enterprise = PLANS.enterprise.limits;

      expect(enterprise.deploymentsPerMonth).toBe(-1); // Unlimited
      expect(enterprise.buildMinutesPerMonth).toBe(-1);
      expect(enterprise.bandwidthGB).toBe(-1);
    });

    // Property: Yearly price should be less than 12 * monthly
    it("should have yearly discount", () => {
      const pro = PLANS.pro;
      expect(pro.priceYearly).toBeLessThan(pro.priceMonthly * 12);

      const team = PLANS.team;
      expect(team.priceYearly).toBeLessThan(team.priceMonthly * 12);
    });

    // Property: All overage prices should be positive
    it("should have positive overage prices", () => {
      expect(OVERAGE_PRICING.buildMinutes).toBeGreaterThan(0);
      expect(OVERAGE_PRICING.bandwidthGB).toBeGreaterThan(0);
      expect(OVERAGE_PRICING.functionInvocations).toBeGreaterThan(0);
      expect(OVERAGE_PRICING.blobStorageGB).toBeGreaterThan(0);
    });
  });
});
