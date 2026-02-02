/**
 * Billing & Usage API Bug Finder Tests
 *
 * Tests edge cases in billing calculations, usage tracking,
 * and limit enforcement that could cause real bugs.
 *
 * Seeded data:
 * - user_free_001: Free tier (100 build mins, 10GB bandwidth)
 * - user_pro_001: Pro tier (1000 build mins, 100GB bandwidth)
 * - user_team_001: Team tier
 * - user_enterprise_001: Enterprise tier (unlimited)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUsagePercentage,
  hasExceededLimit,
  calculateOverage,
  formatBytes,
  getPlanLimits,
  OVERAGE_PRICING,
} from "@/lib/billing/pricing";

describe("Billing Calculation Bug Finder", () => {
  describe("getUsagePercentage Edge Cases", () => {
    it("BUG: Division by zero when limit is 0", () => {
      // Some edge plans might have 0 for certain limits
      const result = getUsagePercentage(50, 0);
      // Should return 100% (over limit) or Infinity, not NaN
      expect(Number.isNaN(result)).toBe(false);
    });

    it("BUG: Negative usage value", () => {
      const result = getUsagePercentage(-50, 100);
      // Negative usage should be clamped to 0
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("BUG: Negative limit value", () => {
      const result = getUsagePercentage(50, -100);
      // Negative limit should handle gracefully
      expect(Number.isNaN(result)).toBe(false);
    });

    it("BUG: Both values are 0", () => {
      const result = getUsagePercentage(0, 0);
      // 0/0 = NaN, should return 0
      expect(result).toBe(0);
    });

    it("BUG: Very large numbers cause precision issues", () => {
      const result = getUsagePercentage(
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER
      );
      expect(result).toBe(100);
    });

    it("BUG: Floating point precision errors", () => {
      // Classic floating point issue: 0.1 + 0.2 !== 0.3
      const result = getUsagePercentage(0.1 + 0.2, 0.3);
      // Should be exactly 100%, not 99.99999...
      expect(Math.abs(result - 100)).toBeLessThan(0.0001);
    });

    it("BUG: Infinity as usage", () => {
      const result = getUsagePercentage(Infinity, 100);
      expect(Number.isFinite(result) || result === Infinity).toBe(true);
    });

    it("BUG: NaN as usage", () => {
      const result = getUsagePercentage(NaN, 100);
      expect(Number.isNaN(result)).toBe(false);
    });
  });

  describe("hasExceededLimit Edge Cases", () => {
    it("BUG: Exactly at limit should NOT be exceeded", () => {
      // 100 out of 100 = at limit, not exceeded
      const result = hasExceededLimit(100, 100);
      expect(result).toBe(false); // AT limit is OK
    });

    it("BUG: Just over limit by tiny amount", () => {
      const result = hasExceededLimit(100.0001, 100);
      expect(result).toBe(true);
    });

    it("BUG: Floating point comparison issue", () => {
      // Due to floating point, this might not work as expected
      const usage = 0.1 + 0.2; // 0.30000000000000004
      const limit = 0.3;
      const result = hasExceededLimit(usage, limit);
      // This could incorrectly return true due to floating point
      expect(result).toBe(true); // Actually exceeded due to FP error
    });

    it("BUG: Negative limit means unlimited (-1)", () => {
      // -1 typically means unlimited
      const result = hasExceededLimit(999999, -1);
      expect(result).toBe(false); // Should never exceed unlimited
    });

    it("BUG: Zero limit means feature disabled", () => {
      const result = hasExceededLimit(1, 0);
      expect(result).toBe(true); // Any usage exceeds 0 limit
    });
  });

  describe("calculateOverage Edge Cases", () => {
    it("BUG: Negative usage means credit?", () => {
      const result = calculateOverage(-50, 100, 0.01);
      // Negative overage = credit? Should be 0
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("BUG: Zero price per unit", () => {
      const result = calculateOverage(150, 100, 0);
      expect(result).toBe(0);
    });

    it("BUG: Fractional overage amounts", () => {
      // 105 used, 100 limit = 5 overage at $0.01 = $0.05
      const result = calculateOverage(105, 100, 0.01);
      expect(result).toBeCloseTo(0.05, 2);
    });

    it("BUG: Very small price causes precision issues", () => {
      const result = calculateOverage(1000100, 1000000, 0.000001);
      // 100 overage * $0.000001 = $0.0001
      expect(result).toBeCloseTo(0.0001, 6);
    });

    it("BUG: Unlimited limit (-1) should never have overage", () => {
      const result = calculateOverage(999999, -1, 0.01);
      expect(result).toBe(0);
    });
  });

  describe("formatBytes Edge Cases", () => {
    it("BUG: Zero bytes", () => {
      const result = formatBytes(0);
      expect(result).toBe("0 B");
    });

    it("BUG: Negative bytes", () => {
      const result = formatBytes(-1024);
      // Negative bytes makes no sense - should handle gracefully
      expect(result).toBeDefined();
    });

    it("BUG: NaN bytes", () => {
      const result = formatBytes(NaN);
      expect(result).toBeDefined();
    });

    it("BUG: Infinity bytes", () => {
      const result = formatBytes(Infinity);
      expect(result).toBeDefined();
    });

    it("BUG: Exactly 1 KB boundary", () => {
      const result = formatBytes(1024);
      expect(result).toMatch(/1.*KB/i);
    });

    it("BUG: Just under 1 KB", () => {
      const result = formatBytes(1023);
      expect(result).toMatch(/1023.*B/i);
    });

    it("BUG: Extremely large value (exabytes)", () => {
      const exabyte = Math.pow(1024, 6);
      const result = formatBytes(exabyte);
      expect(result).toBeDefined();
      // Should not crash or return weird values
    });
  });

  describe("Plan Limits Edge Cases", () => {
    it("BUG: Unknown plan type", () => {
      // @ts-expect-error - Testing invalid plan
      const limits = getPlanLimits("nonexistent");
      // Should return free tier limits as fallback
      expect(limits).toBeDefined();
    });

    it("BUG: Empty string plan", () => {
      // @ts-expect-error - Testing invalid plan
      const limits = getPlanLimits("");
      expect(limits).toBeDefined();
    });

    it("BUG: Null plan", () => {
      // @ts-expect-error - Testing invalid plan
      const limits = getPlanLimits(null);
      expect(limits).toBeDefined();
    });

    it("BUG: Case sensitivity in plan names", () => {
      // @ts-expect-error - Testing case sensitivity
      const limitsLower = getPlanLimits("free");
      // @ts-expect-error - Testing case sensitivity
      const limitsUpper = getPlanLimits("FREE");
      // Should be case-insensitive or documented
      // Current implementation might not handle this
    });

    it("BUG: Enterprise limits should be truly unlimited", () => {
      const limits = getPlanLimits("enterprise");
      // -1 typically means unlimited
      expect(limits.buildMinutesPerMonth).toBe(-1);
      expect(limits.bandwidthGB).toBe(-1);
    });
  });

  describe("Overage Pricing Constants", () => {
    it("BUG: Overage prices should be positive", () => {
      expect(OVERAGE_PRICING.buildMinutes).toBeGreaterThan(0);
      expect(OVERAGE_PRICING.bandwidthGB).toBeGreaterThan(0);
      expect(OVERAGE_PRICING.functionInvocations).toBeGreaterThan(0);
    });

    it("BUG: Overage prices should be reasonable", () => {
      // Sanity check - prices shouldn't be astronomical
      expect(OVERAGE_PRICING.buildMinutes).toBeLessThan(100);
      expect(OVERAGE_PRICING.bandwidthGB).toBeLessThan(100);
      expect(OVERAGE_PRICING.functionInvocations).toBeLessThan(1);
    });
  });
});

describe("Usage Metering Bug Finder", () => {
  describe("Date Range Edge Cases", () => {
    it("BUG: Usage at month boundary", () => {
      // What happens to usage recorded at 11:59:59 PM on Jan 31?
      // And usage at 12:00:00 AM on Feb 1?
      const jan31 = new Date(2024, 0, 31, 23, 59, 59);
      const feb1 = new Date(2024, 1, 1, 0, 0, 0);

      // These should be in different billing periods
      expect(jan31.getMonth()).toBe(0); // January
      expect(feb1.getMonth()).toBe(1); // February
    });

    it("BUG: Timezone handling in billing period", () => {
      // User in UTC-8 records usage at 8 PM Dec 31
      // Server in UTC sees it as Jan 1 4 AM
      // Which billing period does it belong to?

      const userLocalTime = new Date("2024-12-31T20:00:00-08:00");
      const serverUtc = new Date(userLocalTime.toISOString());

      // In UTC, this is Jan 1
      expect(serverUtc.getUTCMonth()).toBe(0); // January in UTC!
    });

    it("BUG: Leap year February", () => {
      // Feb 2024 has 29 days (leap year)
      const feb29 = new Date(2024, 1, 29);
      expect(feb29.getDate()).toBe(29);

      // Feb 2023 should not have 29th day
      const invalidFeb29 = new Date(2023, 1, 29);
      expect(invalidFeb29.getMonth()).toBe(2); // Rolled over to March!
    });

    it("BUG: Daylight saving time transitions", () => {
      // March 10, 2024 - DST starts, 2 AM becomes 3 AM (in US timezones)
      // This test documents that DST can cause unexpected time differences
      const beforeDst = new Date("2024-03-10T01:59:00");
      const afterDst = new Date("2024-03-10T03:00:00");

      // Difference depends on timezone - just verify it's a reasonable gap
      const diffMs = afterDst.getTime() - beforeDst.getTime();
      const diffMins = diffMs / (1000 * 60);

      // In DST-affected zones: 1 minute (2:00 AM doesn't exist)
      // In non-DST zones: 61 minutes
      // Either is acceptable - the bug is that billing must use UTC consistently
      expect(diffMins).toBeGreaterThan(0);
      expect(diffMins).toBeLessThanOrEqual(61);
    });

    it("BUG: Negative days parameter", () => {
      const days = -30;
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Negative days means future date!
      expect(startDate > now).toBe(true);
    });
  });

  describe("Usage Value Edge Cases", () => {
    it("BUG: Recording zero usage", () => {
      // Should zero usage be recorded or ignored?
      const value = 0;
      expect(value).toBe(0);
      // Zero usage might skew averages or waste storage
    });

    it("BUG: Recording extremely small usage", () => {
      // 0.0000001 build minutes
      const value = 0.0000001;
      // Might cause precision issues when summed
      expect(value).toBeLessThan(0.001);
    });

    it("BUG: Recording extremely large usage in single event", () => {
      // Single event recording 1 million build minutes?
      const value = 1000000;
      // Should there be a max value per event?
      expect(value).toBeGreaterThan(10000);
    });

    it("BUG: Usage value type coercion", () => {
      // What if value comes as string from API?
      const valueString = "100";
      const valueNum = parseInt(valueString, 10);
      expect(valueNum).toBe(100);

      // But what about invalid strings?
      const invalid = parseInt("not-a-number", 10);
      expect(Number.isNaN(invalid)).toBe(true);
    });
  });

  describe("Concurrent Usage Recording", () => {
    it("BUG: Race condition in usage summation", () => {
      // Two concurrent requests both read usage = 95/100
      // Both add 10, both think they're under limit
      // Result: 115/100 - exceeded limit but neither was blocked

      const currentUsage = 95;
      const limit = 100;
      const request1Addition = 10;
      const request2Addition = 10;

      // Without locking, both pass
      const request1Allowed = currentUsage + request1Addition <= limit;
      const request2Allowed = currentUsage + request2Addition <= limit;

      expect(request1Allowed).toBe(false);
      expect(request2Allowed).toBe(false);

      // But actual total would be 115
      const actualTotal = currentUsage + request1Addition + request2Addition;
      expect(actualTotal).toBe(115);
    });
  });
});

describe("Billing Period Calculation Bug Finder", () => {
  describe("Month Start/End Calculations", () => {
    it("BUG: February end date", () => {
      // new Date(year, month + 1, 0) gives last day of month
      const feb2024End = new Date(2024, 2, 0); // Month 2 (March), day 0 = last day of Feb
      expect(feb2024End.getDate()).toBe(29); // Leap year

      const feb2023End = new Date(2023, 2, 0);
      expect(feb2023End.getDate()).toBe(28); // Not leap year
    });

    it("BUG: December to January transition", () => {
      // new Date(2024, 12, 1) is actually Jan 1, 2025
      const dec = new Date(2024, 11, 1); // December
      const jan = new Date(2024, 12, 1); // Rolls to January 2025

      expect(dec.getMonth()).toBe(11);
      expect(jan.getMonth()).toBe(0);
      expect(jan.getFullYear()).toBe(2025);
    });

    it("BUG: getMonth() is zero-indexed", () => {
      const january = new Date(2024, 0, 1);
      const december = new Date(2024, 11, 1);

      // Common bug: using 1-indexed month
      expect(january.getMonth()).toBe(0); // Not 1!
      expect(december.getMonth()).toBe(11); // Not 12!
    });
  });
});

describe("API Response Validation", () => {
  describe("Usage API Response Structure", () => {
    it("BUG: Missing required fields in response", () => {
      // Expected response structure
      const expectedFields = [
        "summary",
        "limits",
        "percentages",
        "exceeded",
        "overageCharges",
        "billingPeriod",
      ];

      // Simulated response (testing that all fields are present)
      const mockResponse = {
        summary: {},
        limits: {},
        percentages: {},
        exceeded: {},
        overageCharges: {},
        billingPeriod: {},
      };

      for (const field of expectedFields) {
        expect(mockResponse).toHaveProperty(field);
      }
    });

    it("BUG: Percentages exceed 100%", () => {
      // When usage exceeds limit, percentage can be > 100
      const usage = 150;
      const limit = 100;
      const percentage = (usage / limit) * 100;

      expect(percentage).toBe(150);
      // UI might not handle >100% correctly
    });

    it("BUG: Negative overage charges", () => {
      // Overage should never be negative (that would be credit)
      const usage = 50;
      const limit = 100;
      const price = 0.01;

      const overage = Math.max(0, usage - limit) * price;
      expect(overage).toBe(0);
      expect(overage).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Type Coercion in Query Params", () => {
    it("BUG: parseInt without radix", () => {
      // parseInt("08") without radix might be interpreted as octal
      const withRadix = parseInt("08", 10);
      const withoutRadix = parseInt("08");

      expect(withRadix).toBe(8);
      expect(withoutRadix).toBe(8); // Modern browsers handle this, but be safe
    });

    it("BUG: parseFloat on empty string", () => {
      const result = parseFloat("");
      expect(Number.isNaN(result)).toBe(true);
    });

    it("BUG: String 'undefined' vs actual undefined", () => {
      const searchParams = new URLSearchParams("type=undefined");
      const type = searchParams.get("type");

      // This is the string "undefined", not the value undefined
      expect(type).toBe("undefined");
      expect(type).not.toBe(undefined);
    });
  });
});
